from fastapi import HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from src.db.models.comentario_model import Comentario
from src.db.models.comunidad_model import Comunidad
from src.db.models.foro_model import answers, comment_reports, questions, reports, unlocks
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.dtos.admin_dto import SeccionAdmin, SeccionModerable
from src.repositories.post_repository import PostRepository
from src.services.comentario_service import ComentarioService
from src.services.usuario_service import UsuarioService


_POR_PAGINA = 20
_KARMA_POR_NOMBRAMIENTO = 10


class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def _verificar_rol(self, actor: int, *, solo_admin: bool = False) -> None:
        rol = self.db.scalar(select(Usuario.rol_sitio).where(Usuario.id == actor))
        if solo_admin:
            if rol != "admin":
                raise HTTPException(403, "Esta acción requiere permisos del administrador general")
        elif rol not in {"admin", "subadmin"}:
            raise HTTPException(403, "Esta acción requiere permisos de moderación del sitio")

    def listar(self, actor: int, seccion: SeccionAdmin, pagina: int, busqueda: str):
        self._verificar_rol(actor, solo_admin=seccion in {"subadmins", "usuarios"})
        if seccion in {"subadmins", "usuarios"}:
            texto = Usuario.username
            consulta = select(Usuario.id, texto.label("texto"), Usuario.rol_sitio).where(
                Usuario.clave_hash.is_not(None),
            ).order_by(Usuario.rol_sitio, Usuario.username)
        elif seccion == "posts":
            texto = Post.titulo
            cantidad = select(func.count(func.distinct(reports.c.usuario_id))).where(
                reports.c.post_id == Post.id, reports.c.usuario_id != Post.autor_id,
            ).scalar_subquery()
            consulta = select(
                Post.id, texto.label("texto"), Comunidad.nombre.label("detalle"),
                func.substr(Post.contenido, 1, 300).label("resumen"), Post.oculto,
                cantidad.label("reportes"),
            ).join(Comunidad, Post.comunidad_id == Comunidad.id).where(
                Post.eliminado.is_(False),
            ).order_by(cantidad.desc(), Post.id.desc())
        elif seccion == "comentarios":
            texto = Comentario.texto
            cantidad = select(func.count()).where(
                comment_reports.c.comentario_id == Comentario.id,
            ).scalar_subquery()
            consulta = select(
                Comentario.id, func.substr(texto, 1, 300).label("texto"), Post.titulo.label("detalle"),
                cantidad.label("reportes"),
            ).join(Post, Comentario.post_id == Post.id).where(
                Comentario.eliminado.is_(False),
            ).order_by(cantidad.desc(), Comentario.id.desc())
        elif seccion == "preguntas":
            texto = questions.c.titulo
            consulta = select(
                questions.c.id, texto.label("texto"), func.substr(questions.c.contenido, 1, 300).label("resumen"),
            ).order_by(questions.c.id.desc())
        else:
            texto = answers.c.texto
            consulta = select(
                answers.c.id, func.substr(texto, 1, 300).label("texto"), questions.c.titulo.label("detalle"),
            ).join(questions, answers.c.pregunta_id == questions.c.id).order_by(answers.c.id.desc())

        if busqueda.strip():
            consulta = consulta.where(func.lower(texto).contains(busqueda.strip().lower(), autoescape=True))
        filas = self.db.execute(
            consulta.offset((pagina - 1) * _POR_PAGINA).limit(_POR_PAGINA + 1),
        ).mappings().all()
        return {"entradas": filas[:_POR_PAGINA], "siguiente": len(filas) > _POR_PAGINA}

    def eliminar_usuario(self, actor: int, usuario_id: int) -> None:
        self._verificar_rol(actor, solo_admin=True)
        UsuarioService(self.db).eliminar_cuenta(usuario_id, preservar_conversaciones=True)

    def cambiar_rol(self, actor: int, usuario_id: int, rol: str) -> None:
        self._verificar_rol(actor, solo_admin=True)
        usuario = self.db.get(Usuario, usuario_id, with_for_update=True)
        if usuario is None:
            raise HTTPException(404, "La cuenta no existe")
        if usuario.rol_sitio == "admin":
            raise HTTPException(409, "El rol del administrador general se conserva")
        if rol == "subadmin" and not usuario.clave_hash:
            raise HTTPException(409, "La cuenta necesita una contraseña activa para ser subadmin")
        if rol == "subadmin":
            self.db.execute(
                update(Usuario)
                .where(Usuario.id == usuario_id, Usuario.rol_sitio == "usuario")
                .values(
                    rol_sitio="subadmin",
                    karma_por_nombramientos=Usuario.karma_por_nombramientos + _KARMA_POR_NOMBRAMIENTO,
                    karma=Usuario.karma + _KARMA_POR_NOMBRAMIENTO,
                ),
            )
        else:
            usuario.rol_sitio = rol
        self.db.commit()

    def cambiar_visibilidad(self, actor: int, post_id: int, oculto: bool) -> None:
        self._verificar_rol(actor)
        post = self.db.get(Post, post_id, with_for_update=True)
        if post is None or post.eliminado:
            raise HTTPException(404, "La publicación no existe")
        post.oculto = oculto
        self.db.commit()

    def eliminar(self, actor: int, seccion: SeccionModerable, item_id: int) -> None:
        self._verificar_rol(actor)
        if seccion == "comentarios":
            ComentarioService(self.db).delete(item_id, actor, moderacion_sitio=True)
            return
        if seccion == "posts":
            post = self.db.get(Post, item_id, with_for_update=True)
            if post is None:
                raise HTTPException(404, "La publicación no existe")
            PostRepository(self.db).mark_deleted(post)
        elif seccion == "preguntas":
            pregunta = self.db.scalar(select(questions.c.id).where(
                questions.c.id == item_id,
            ).with_for_update())
            if pregunta is None:
                raise HTTPException(404, "La pregunta no existe")
            self.db.execute(delete(unlocks).where(unlocks.c.pregunta_id == item_id))
            self.db.execute(delete(answers).where(answers.c.pregunta_id == item_id))
            self.db.execute(delete(questions).where(questions.c.id == item_id))
        else:
            borrado = self.db.execute(delete(answers).where(answers.c.id == item_id))
            if borrado.rowcount != 1:
                raise HTTPException(404, "La respuesta no existe")
        self.db.commit()
