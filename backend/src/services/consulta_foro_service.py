from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func, select

from src.db.models.comentario_model import Comentario
from src.db.models.comunidad_model import Comunidad
from src.db.models.foro_model import comment_votes, memberships, reports, saved
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.db.models.voto_post_model import VotoPost
from src.dtos.foro_dto import UsuarioForoDTO
from src.mappers.comentario_mapper import to_comentario_response
from src.mappers.comunidad_mapper import to_comunidad_response
from src.mappers.post_mapper import to_post_response
from src.services.foro_service import ForumService
from src.services.karma_service import desglose_votos, karma_por_votos, votos_positivos_por_autor
from src.utils.fechas import fecha_utc


class ConsultaForoService:
    def __init__(self, db):
        self.db = db

    def entidad(self, modelo, id):
        entidad = self.db.get(modelo, id)
        if entidad is None:
            raise HTTPException(404, "El recurso no existe")
        return entidad

    def perfil(self, username):
        db = self.db
        usuario = db.scalar(select(Usuario).where(
            func.lower(Usuario.username) == username.lower(), Usuario.clave_hash.is_not(None),
        ))
        if usuario is None:
            raise HTTPException(404, "El usuario no existe")
        comunidades = db.scalars(select(Comunidad).join(memberships).where(
            memberships.c.usuario_id == usuario.id,
        ).order_by(Comunidad.nombre))
        return dict(
            UsuarioForoDTO.model_validate(usuario).model_dump(),
            cantidad_posts=db.scalar(select(func.count()).select_from(Post).where(
                Post.autor_id == usuario.id, Post.oculto.is_(False), Post.eliminado.is_(False),
            )),
            comunidades=[to_comunidad_response(c) for c in comunidades],
        )

    def karma(self, usuario_id):
        usuario = self.entidad(Usuario, usuario_id)
        posts, comentarios = desglose_votos(self.db, usuario_id)
        return {
            "karma": karma_por_votos(posts + comentarios) + usuario.karma_por_nombramientos,
            "karma_por_nombramientos": usuario.karma_por_nombramientos,
            "karma_posts": karma_por_votos(posts),
            "karma_comentarios": karma_por_votos(comentarios),
            "votos_positivos_posts": posts,
            "votos_positivos_comentarios": comentarios,
        }

    def comentarios(self, post_id, usuario_id):
        post = self.entidad(Post, post_id)
        if post.oculto:
            raise HTTPException(404, "El post no existe")
        ForumService(self.db).require_visible_comments(post_id, usuario_id)
        puntajes = select(comment_votes.c.comentario_id, func.sum(comment_votes.c.valor).label("puntaje")
                          ).join(Comentario, Comentario.id == comment_votes.c.comentario_id).where(
            comment_votes.c.usuario_id != Comentario.autor_id,
        ).group_by(comment_votes.c.comentario_id).subquery()
        puntaje = func.coalesce(puntajes.c.puntaje, 0)
        filas = self.db.execute(select(Comentario, Usuario, puntaje)
            .join(Usuario, Usuario.id == Comentario.autor_id)
            .outerjoin(puntajes, puntajes.c.comentario_id == Comentario.id)
            .where(Comentario.post_id == post_id)
            .order_by(puntaje.desc(), Comentario.fecha, Comentario.id))
        nodos = {}
        for comentario, autor, puntos in filas:
            nodos[comentario.id] = dict(
                to_comentario_response(comentario).model_dump(),
                autor=UsuarioForoDTO.model_validate(autor),
                puntaje=puntos,
                respuestas=[],
            )
        raices = []
        for nodo in nodos.values():
            padre = nodos.get(nodo["comentario_padre_id"])
            (padre["respuestas"] if padre else raices).append(nodo)
        return raices

    def posts(self, comunidades, orden, periodo=None):
        puntajes = select(VotoPost.post_id, func.sum(VotoPost.valor).label("puntaje")
                          ).join(Post, Post.id == VotoPost.post_id).where(
            VotoPost.usuario_id != Post.autor_id,
        ).group_by(VotoPost.post_id).subquery()
        consulta = select(Post, func.coalesce(puntajes.c.puntaje, 0)).outerjoin(
            puntajes, Post.id == puntajes.c.post_id,
        ).where(Post.comunidad_id.in_(comunidades), Post.oculto.is_(False))
        ahora = datetime.now(timezone.utc)
        if orden == "top" and periodo == "semana":
            consulta = consulta.where(Post.fecha >= ahora - timedelta(days=7))
        filas = self.db.execute(consulta.order_by(Post.fecha.desc(), Post.id.desc())).all()
        if orden == "hot":
            filas.sort(key=lambda fila: fila[1] / (
                max(0, (ahora - fecha_utc(fila[0].fecha)).total_seconds()) / 3600 + 2
            ),
                       reverse=True)
        elif orden == "top":
            filas.sort(key=lambda fila: fila[1], reverse=True)
        return [dict(to_post_response(post).model_dump(), puntaje=puntos) for post, puntos in filas]

    def feed(self, usuario_id):
        self.entidad(Usuario, usuario_id)
        comunidades = select(memberships.c.comunidad_id).where(memberships.c.usuario_id == usuario_id)
        return self.posts(comunidades, "hot")

    def reportes(self, comunidad_id, usuario_id):
        self.entidad(Comunidad, comunidad_id)
        if ForumService(self.db).role(comunidad_id, usuario_id) != "moderador":
            raise HTTPException(403, "Acción solo para moderadores")
        conteos = select(
            reports.c.post_id, func.count(func.distinct(reports.c.usuario_id)).label("cantidad"),
        ).join(Post, Post.id == reports.c.post_id).where(
            reports.c.usuario_id != Post.autor_id,
        ).group_by(reports.c.post_id).subquery()
        filas = self.db.execute(select(Post, conteos.c.cantidad).join(
            conteos, conteos.c.post_id == Post.id,
        ).where(Post.comunidad_id == comunidad_id, Post.eliminado.is_(False)).order_by(conteos.c.cantidad.desc(), Post.id))
        return [dict(to_post_response(post).model_dump(), cantidad_reportes=cantidad) for post, cantidad in filas]

    def guardados(self, usuario_id):
        self.entidad(Usuario, usuario_id)
        filas = self.db.execute(select(Post, saved.c.fecha).join(saved, saved.c.post_id == Post.id).where(
            saved.c.usuario_id == usuario_id, Post.oculto.is_(False),
        ).order_by(saved.c.fecha.desc(), Post.id.desc()))
        return [dict(to_post_response(post).model_dump(), fecha_guardado=fecha) for post, fecha in filas]

    def ranking(self, comunidad_id):
        self.entidad(Comunidad, comunidad_id)
        posts = votos_positivos_por_autor(Post, VotoPost.__table__, VotoPost.post_id).where(Post.comunidad_id == comunidad_id)
        comentarios = votos_positivos_por_autor(Comentario, comment_votes, comment_votes.c.comentario_id).join(
            Post, Post.id == Comentario.post_id,
        ).where(Post.comunidad_id == comunidad_id)
        aportes = defaultdict(int)
        for usuario_id in self.db.scalars(select(memberships.c.usuario_id).where(
            memberships.c.comunidad_id == comunidad_id,
        )):
            aportes[usuario_id] = 0
        for consulta in (posts, comentarios):
            for autor_id, puntos in self.db.execute(consulta):
                aportes[autor_id] += puntos
        ids = sorted(aportes, key=lambda id: (-aportes[id], id))[:10]
        usuarios = {u.id: u for u in self.db.scalars(select(Usuario).where(Usuario.id.in_(ids)))}
        return [{"id": id, "username": usuarios[id].username,
                 "karma": karma_por_votos(aportes[id]), "votos_positivos": aportes[id]} for id in ids]
