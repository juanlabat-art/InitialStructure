from datetime import datetime, timezone
from hashlib import sha256

from fastapi import HTTPException
from sqlalchemy import delete, exists, func, or_, select, update

from src.db.models.comentario_model import Comentario
from src.db.models.comunidad_model import Comunidad
from src.db.models.foro_model import answers, bans, comment_votes, memberships, questions, reports, saved, unlocks
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.services.karma_service import actualizar_karma


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def anonymous_session(value: str | None):
    return sha256(value.encode()).hexdigest() if value else None


class ForumService:
    def __init__(self, db):
        self.db = db

    def role(self, community_id, user_id):
        return self.db.scalar(select(memberships.c.rol).where(
            memberships.c.comunidad_id == community_id,
            memberships.c.usuario_id == user_id,
        ))

    def require_member(self, community_id, user_id):
        self.db.get(Comunidad, community_id, with_for_update=True)
        if self.banned(community_id, user_id) or not self.role(community_id, user_id):
            raise HTTPException(403, "Debés unirte a la comunidad para participar")

    def banned(self, community_id, user_id):
        return self.db.scalar(select(bans.c.id).where(
            bans.c.comunidad_id == community_id, bans.c.usuario_id == user_id,
            or_(bans.c.fecha_hasta.is_(None), bans.c.fecha_hasta > utc_now()),
        ).limit(1)) is not None

    def require_visible_comments(self, post_id, user_id):
        visible = self.db.scalar(select(Post.id).where(
            Post.id == post_id, self.comment_visibility(user_id),
        ))
        if not visible:
            raise HTTPException(403, "Publicá tu opinión para ver las respuestas")

    def extra_data(self, user_id, session):
        db = self.db
        session_hash = anonymous_session(session)
        unlocked = db.scalars(select(unlocks.c.pregunta_id).where(
            unlocks.c.sesion_hash == session_hash,
        )).all() if session_hash else []
        visible_answers = select(answers).join(questions).where(
            or_(questions.c.opinar_primero.is_(False), questions.c.id.in_(unlocked)),
        )
        moderated = select(memberships.c.comunidad_id).where(
            memberships.c.usuario_id == user_id, memberships.c.rol == "moderador",
        )
        visible_reports = select(reports).join(Post).where(or_(
            reports.c.usuario_id == user_id, Post.comunidad_id.in_(moderated),
        ))
        return {
            "membresias": db.execute(select(memberships)).mappings().all(),
            "guardados": db.execute(select(saved).where(saved.c.usuario_id == user_id)).mappings().all(),
            "reportes": db.execute(visible_reports).mappings().all(),
            "baneos": db.execute(select(bans).where(or_(
                bans.c.usuario_id == user_id, bans.c.comunidad_id.in_(moderated),
            ))).mappings().all(),
            "votos_comentarios": db.execute(select(comment_votes).join(Comentario, Comentario.id == comment_votes.c.comentario_id).where(
                comment_votes.c.usuario_id == user_id, comment_votes.c.usuario_id != Comentario.autor_id,
            )).mappings().all(),
            "puntajes_comentarios": dict(db.execute(select(
                comment_votes.c.comentario_id, func.sum(comment_votes.c.valor),
            ).join(Comentario, Comentario.id == comment_votes.c.comentario_id).where(
                comment_votes.c.usuario_id != Comentario.autor_id,
            ).group_by(comment_votes.c.comentario_id)).tuples().all()),
            "preguntas": db.execute(select(questions)).mappings().all(),
            "respuestas": db.execute(visible_answers).mappings().all(),
            "preguntas_desbloqueadas": unlocked,
        }

    def post_visibility(self, user_id):
        return or_(Post.oculto.is_(False), exists(select(1).where(
            memberships.c.comunidad_id == Post.comunidad_id,
            memberships.c.usuario_id == user_id, memberships.c.rol == "moderador",
        )))

    def comment_visibility(self, user_id):
        mine = Comentario.__table__.alias()
        return or_(Post.opinar_primero.is_(False), Post.autor_id == user_id, exists(
            select(1).where(mine.c.post_id == Post.id, mine.c.autor_id == user_id, mine.c.eliminado.is_(False)),
        ))

    def _actor(self, user_id):
        if not self.db.get(Usuario, user_id):
            raise HTTPException(404, "El usuario no existe")

    def _change_relation(self, table, keys, values=None):
        where = [table.c[key] == value for key, value in keys.items()]
        existing = self.db.execute(select(table).where(*where)).first()
        if values is None:
            self.db.execute(delete(table).where(*where))
        elif not existing:
            self.db.execute(table.insert().values(**keys, **values))
        elif values:
            self.db.execute(update(table).where(*where).values(**values))

    def membership_action(self, community_id, payload):
        db = self.db
        community = db.get(Comunidad, community_id, with_for_update=True)
        if not community:
            raise HTTPException(404, "La comunidad no existe")
        self._actor(payload.usuario_id)
        role = self.role(community_id, payload.usuario_id)
        keys = {"comunidad_id": community_id, "usuario_id": payload.usuario_id}
        if payload.accion == "unir":
            if self.banned(community_id, payload.usuario_id):
                raise HTTPException(403, "Existe un ban vigente")
            if role is None:
                self._change_relation(memberships, keys, {"rol": "miembro"})
        elif payload.accion == "salir":
            if role == "moderador":
                otros_roles = db.scalars(select(memberships.c.rol).where(
                    memberships.c.comunidad_id == community_id,
                    memberships.c.usuario_id != payload.usuario_id,
                ).distinct()).all()
                if otros_roles and "moderador" not in otros_roles:
                    raise HTTPException(409, "El último moderador no puede salir si quedan miembros")
            self._change_relation(memberships, keys)
        else:
            if role != "moderador":
                raise HTTPException(403, "Acción solo para moderadores")
            if self.role(community_id, payload.miembro_id) != "miembro":
                raise HTTPException(409, "El usuario debe ser miembro de esta comunidad")
            keys["usuario_id"] = payload.miembro_id
            if payload.accion == "promover":
                self._change_relation(memberships, keys, {"rol": "moderador"})
            else:
                until = payload.hasta
                if until and until.tzinfo:
                    until = until.astimezone(timezone.utc).replace(tzinfo=None)
                if not payload.motivo.strip() or (until and until <= utc_now()):
                    raise HTTPException(422, "Indicá un motivo y, si corresponde, una fecha futura")
                db.execute(bans.insert().values(
                    **keys, moderador_id=payload.usuario_id, motivo=payload.motivo, fecha_hasta=until,
                ))
                self._change_relation(memberships, keys)
        db.commit()

    def post_action(self, post_id, payload):
        db = self.db
        post = db.get(Post, post_id, with_for_update=True)
        if not post:
            raise HTTPException(404, "La publicación no existe")
        self._actor(payload.usuario_id)
        moderator = self.role(post.comunidad_id, payload.usuario_id) == "moderador"
        action = payload.accion
        keys = {"post_id": post_id, "usuario_id": payload.usuario_id}
        if action in {"ocultar", "mostrar"}:
            if not moderator:
                raise HTTPException(403, "Acción solo para moderadores")
            post.oculto = action == "ocultar"
        elif action == "quitar":
            self._change_relation(saved, keys)
        elif post.oculto and not moderator:
            raise HTTPException(404, "La publicación no está disponible")
        elif action == "guardar":
            self._change_relation(saved, keys, {})
        else:
            if not payload.motivo.strip():
                raise HTTPException(422, "Indicá el motivo del reporte")
            if db.scalar(select(reports.c.id).where(
                reports.c.post_id == post_id, reports.c.usuario_id == payload.usuario_id,
            ).limit(1)):
                raise HTTPException(409, "Ya reportaste esta publicación")
            db.execute(reports.insert().values(**keys, motivo=payload.motivo))
            if db.scalar(select(func.count()).select_from(reports).where(reports.c.post_id == post_id)) >= 5:
                post.oculto = True
        db.commit()

    def vote_comment(self, comment_id, usuario_id, valor):
        db = self.db
        comment = db.get(Comentario, comment_id, with_for_update=True)
        if not comment or comment.eliminado or db.get(Post, comment.post_id).oculto:
            raise HTTPException(404, "El comentario no está disponible")
        self._actor(usuario_id)
        self.require_visible_comments(comment.post_id, usuario_id)
        if comment.autor_id == usuario_id:
            raise HTTPException(403, "No podés votar tu propio comentario")
        old = db.scalar(select(comment_votes.c.valor).where(
            comment_votes.c.usuario_id == usuario_id, comment_votes.c.comentario_id == comment_id,
        )) or 0
        autor = db.get(Usuario, comment.autor_id, with_for_update=True)
        nuevo = 0 if old == valor else valor
        self._change_relation(comment_votes, {"usuario_id": usuario_id, "comentario_id": comment_id},
                              {"valor": nuevo} if nuevo else None)
        actualizar_karma(db, autor)
        db.commit()

    def create_question(self, payload):
        question_id = self.db.execute(questions.insert().values(**payload.model_dump())).inserted_primary_key[0]
        self.db.commit()
        return {"id": question_id}

    def create_answer(self, question_id, session, payload):
        db = self.db
        question = db.execute(select(questions).where(questions.c.id == question_id).with_for_update()).first()
        if not question:
            raise HTTPException(404, "La pregunta no existe")
        db.execute(answers.insert().values(pregunta_id=question_id, texto=payload.texto))
        self._change_relation(unlocks, {"pregunta_id": question_id, "sesion_hash": anonymous_session(session)}, {})
        db.commit()
