from datetime import datetime, timezone
from hashlib import sha256
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import delete, exists, func, or_, select, update

from src.db.models.comentario_model import Comentario
from src.db.models.comunidad_model import Comunidad
from src.db.models.foro_model import (
    CategoriaAnonima, answers, bans, comment_reports, comment_votes, memberships, notifications,
    post_report_alerts, questions, reports, saved, unlocks,
)
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.services.karma_service import actualizar_karma, desglose_votos, votos_para_proximo_karma
from src.utils.fechas import fecha_utc


MAX_COMUNIDADES_FIJADAS = 3


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
        author_hash = self._anonymous_author(user_id)
        access = [value for value in (author_hash, anonymous_session(session)) if value]
        unlocked = db.scalars(select(unlocks.c.pregunta_id).where(
            unlocks.c.sesion_hash.in_(access),
        ).distinct()).all()
        question_rows = db.execute(select(questions)).mappings()
        visible_answers = db.execute(
            select(answers).join(questions).where(
                or_(questions.c.opinar_primero.is_(False), questions.c.id.in_(unlocked)),
            ).order_by(answers.c.id)
        ).mappings()
        moderated = select(memberships.c.comunidad_id).where(
            memberships.c.usuario_id == user_id, memberships.c.rol == "moderador",
        )
        visible_reports = select(reports).join(Post).where(
            reports.c.usuario_id != Post.autor_id,
            or_(reports.c.usuario_id == user_id, Post.comunidad_id.in_(moderated)),
        )
        return {
            "votos_para_proximo_karma": (
                votos_para_proximo_karma(sum(desglose_votos(db, user_id))) if user_id else None
            ),
            "membresias": db.execute(select(memberships)).mappings().all(),
            "guardados": db.execute(select(saved).where(saved.c.usuario_id == user_id)).mappings().all(),
            "reportes": db.execute(visible_reports).mappings().all(),
            "comentarios_reportados": db.scalars(select(comment_reports.c.comentario_id).where(
                comment_reports.c.usuario_id == user_id,
            )).all(),
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
            "preguntas": [dict(
                id=row.id, titulo=row.titulo, contenido=row.contenido,
                categoria=CategoriaAnonima.MAYORES18 if row.es_adulta else row.categoria,
                opinar_primero=row.opinar_primero, fecha=row.fecha,
                propia=author_hash is not None and row.autor_hash == author_hash,
            ) for row in question_rows],
            "respuestas": [dict(
                id=row.id, pregunta_id=row.pregunta_id, texto=row.texto, fecha=row.fecha,
                propia=author_hash is not None and row.autor_hash == author_hash,
            ) for row in visible_answers],
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

    def list_notifications(self, user_id):
        query = (
            select(
                notifications.c.comentario_id, notifications.c.es_respuesta, notifications.c.leida,
                Post.id.label("post_id"), Post.titulo, Usuario.username.label("autor"), Comentario.fecha,
            )
            .select_from(notifications)
            .join(Comentario, notifications.c.comentario_id == Comentario.id)
            .join(Post, Comentario.post_id == Post.id)
            .join(Usuario, Comentario.autor_id == Usuario.id)
            .where(
                notifications.c.usuario_id == user_id,
                Post.oculto.is_(False),
                Comentario.eliminado.is_(False),
                self.comment_visibility(user_id),
            )
        )
        entries = [dict(row) for row in self.db.execute(query).mappings()]
        alerts = self.db.execute(
            select(
                post_report_alerts.c.post_id, Post.titulo,
                post_report_alerts.c.fecha, post_report_alerts.c.leida,
            ).join(Post, Post.id == post_report_alerts.c.post_id).where(
                post_report_alerts.c.usuario_id == user_id,
                Post.eliminado.is_(False),
            )
        ).mappings()
        entries.extend(dict(row, tipo="reportes") for row in alerts)
        entries.sort(key=lambda row: fecha_utc(row["fecha"]), reverse=True)
        entries.sort(key=lambda row: row["leida"])
        return entries

    def read_notifications(self, user_id, comment_ids, post_ids):
        self.db.execute(update(notifications).where(
            notifications.c.usuario_id == user_id,
            notifications.c.comentario_id.in_(comment_ids),
            notifications.c.leida.is_(False),
        ).values(leida=True))
        self.db.execute(update(post_report_alerts).where(
            post_report_alerts.c.usuario_id == user_id,
            post_report_alerts.c.post_id.in_(post_ids),
            post_report_alerts.c.leida.is_(False),
        ).values(leida=True))
        self.db.commit()

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
        elif payload.accion in ("fijar", "desfijar"):
            if role is None:
                raise HTTPException(403, "Unite a la comunidad para fijarla")
            fijar = payload.accion == "fijar"
            if fijar:
                # Bloquea al usuario para que dos pedidos simultáneos no superen el máximo.
                db.get(Usuario, payload.usuario_id, with_for_update=True, populate_existing=True)
                fijadas = db.scalar(select(func.count()).select_from(memberships).where(
                    memberships.c.usuario_id == payload.usuario_id,
                    memberships.c.fijada.is_(True),
                    memberships.c.comunidad_id != community_id,
                ))
                if fijadas >= MAX_COMUNIDADES_FIJADAS:
                    raise HTTPException(409, f"Podés fijar hasta {MAX_COMUNIDADES_FIJADAS} comunidades")
            self._change_relation(memberships, keys, {"fijada": fijar})
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
        if payload.accion == "reportar" and db.bind.dialect.name == "sqlite":
            # SQLite has no row-level SELECT FOR UPDATE. Serialize the report count with a write lock.
            db.execute(update(Post).where(Post.id == post_id).values(oculto=Post.oculto))
        post = db.get(Post, post_id, with_for_update=True)
        if not post:
            raise HTTPException(404, "La publicación no existe")
        self._actor(payload.usuario_id)
        moderator = self.role(post.comunidad_id, payload.usuario_id) == "moderador"
        action = payload.accion
        if post.eliminado:
            raise HTTPException(409, "La publicación está eliminada")
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
            if post.autor_id == payload.usuario_id:
                raise HTTPException(403, "No podés reportar tu propia publicación")
            if not payload.motivo.strip():
                raise HTTPException(422, "Indicá el motivo del reporte")
            if db.scalar(select(reports.c.id).where(
                reports.c.post_id == post_id, reports.c.usuario_id == payload.usuario_id,
            ).limit(1)):
                raise HTTPException(409, "Ya reportaste esta publicación")
            db.execute(reports.insert().values(**keys, motivo=payload.motivo))
            cantidad = db.scalar(select(func.count(func.distinct(reports.c.usuario_id))).where(
                reports.c.post_id == post_id, reports.c.usuario_id != post.autor_id,
            ))
            if cantidad >= 5:
                post.oculto = True
            if cantidad == 5:
                administrador = db.scalar(select(Usuario.id).where(Usuario.rol_sitio == "admin"))
                if administrador is not None:
                    self._change_relation(
                        post_report_alerts, {"post_id": post_id, "usuario_id": administrador},
                        {"fecha": datetime.now(timezone.utc)},
                    )
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

    def _anonymous_author(self, user_id, *, create=False):
        if create:
            self.db.execute(update(Usuario).where(
                Usuario.id == user_id, Usuario.clave_anonima.is_(None),
            ).values(clave_anonima=uuid4().hex))
        key = self.db.scalar(select(Usuario.clave_anonima).where(Usuario.id == user_id))
        return anonymous_session(key)

    def create_question(self, user_id, payload):
        es_adulta = payload.categoria == CategoriaAnonima.MAYORES18
        values = payload.model_dump(exclude={"categoria"})
        question_id = self.db.execute(questions.insert().values(
            **values, categoria=CategoriaAnonima.OTROS if es_adulta else payload.categoria,
            es_adulta=es_adulta, autor_hash=self._anonymous_author(user_id, create=True),
        )).inserted_primary_key[0]
        self.db.commit()
        return {"id": question_id}

    def create_answer(self, question_id, user_id, payload):
        db = self.db
        author_hash = self._anonymous_author(user_id, create=True)
        question = db.execute(select(questions).where(questions.c.id == question_id).with_for_update()).first()
        if not question:
            raise HTTPException(404, "La pregunta no existe")
        db.execute(answers.insert().values(pregunta_id=question_id, texto=payload.texto, autor_hash=author_hash))
        if question.opinar_primero:
            self._change_relation(unlocks, {"pregunta_id": question_id, "sesion_hash": author_hash}, {})
        db.commit()
