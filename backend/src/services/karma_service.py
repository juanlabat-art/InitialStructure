from bisect import bisect_right
from itertools import accumulate

from sqlalchemy import func, select

from src.db.models.comentario_model import Comentario
from src.db.models.foro_model import comment_votes
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.db.models.voto_post_model import VotoPost


_COSTO_MAXIMO = 1000
_COSTOS = list(range(1, 16))
while _COSTOS[-1] < _COSTO_MAXIMO:
    _COSTOS.append(min(_COSTO_MAXIMO, (_COSTOS[-1] * 5 + 3) // 4))
_UMBRALES = tuple(accumulate(_COSTOS))


def karma_por_votos(votos: int) -> int:
    if votos >= _UMBRALES[-1]:
        return len(_UMBRALES) + (votos - _UMBRALES[-1]) // _COSTO_MAXIMO
    return bisect_right(_UMBRALES, votos)


def votos_para_proximo_karma(votos: int) -> int:
    karma = karma_por_votos(votos)
    if karma < len(_UMBRALES):
        return _UMBRALES[karma] - votos
    return _COSTO_MAXIMO - (votos - _UMBRALES[-1]) % _COSTO_MAXIMO


def votos_positivos_por_autor(modelo, votos, clave):
    return (
        select(modelo.autor_id.label("autor_id"), func.count().label("total"))
        .join(votos, clave == modelo.id)
        .where(votos.c.usuario_id != modelo.autor_id, votos.c.valor == 1)
        .group_by(modelo.autor_id)
    )


def desglose_votos(db, usuario_id):
    posts = votos_positivos_por_autor(Post, VotoPost.__table__, VotoPost.post_id).subquery()
    comentarios = votos_positivos_por_autor(Comentario, comment_votes, comment_votes.c.comentario_id).subquery()
    return (
        db.scalar(select(posts.c.total).where(posts.c.autor_id == usuario_id)) or 0,
        db.scalar(select(comentarios.c.total).where(comentarios.c.autor_id == usuario_id)) or 0,
    )


def actualizar_karma(db, autor):
    posts, comentarios = desglose_votos(db, autor.id)
    autor.karma = karma_por_votos(posts + comentarios) + Usuario.karma_por_nombramientos


def reconciliar_karma(db):
    usuarios = db.scalars(select(Usuario).order_by(Usuario.id).with_for_update()).all()
    posts = dict(db.execute(votos_positivos_por_autor(Post, VotoPost.__table__, VotoPost.post_id)).all())
    comentarios = dict(db.execute(votos_positivos_por_autor(Comentario, comment_votes, comment_votes.c.comentario_id)).all())
    for usuario in usuarios:
        votos = posts.get(usuario.id, 0) + comentarios.get(usuario.id, 0)
        usuario.karma = karma_por_votos(votos) + Usuario.karma_por_nombramientos
