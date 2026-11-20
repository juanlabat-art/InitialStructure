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


def votos_por_autor(modelo, votos, clave):
    return (
        select(modelo.autor_id.label("autor_id"), func.sum(votos.c.valor).label("total"))
        .join(votos, clave == modelo.id)
        .where(votos.c.usuario_id != modelo.autor_id)
        .group_by(modelo.autor_id)
    )


def desglose_votos(db, usuario_id):
    posts = votos_por_autor(Post, VotoPost.__table__, VotoPost.post_id)
    comentarios = votos_por_autor(Comentario, comment_votes, comment_votes.c.comentario_id)
    return tuple(db.scalar(consulta.where(modelo.autor_id == usuario_id).with_only_columns(func.sum(columna))) or 0
                 for consulta, modelo, columna in (
                     (posts, Post, VotoPost.valor), (comentarios, Comentario, comment_votes.c.valor)))


def actualizar_karma(db, autor):
    posts, comentarios = desglose_votos(db, autor.id)
    autor.karma = karma_por_votos(posts + comentarios)


def reconciliar_karma(db):
    posts = dict(db.execute(votos_por_autor(Post, VotoPost.__table__, VotoPost.post_id)).all())
    comentarios = dict(db.execute(votos_por_autor(Comentario, comment_votes, comment_votes.c.comentario_id)).all())
    for usuario in db.scalars(select(Usuario).order_by(Usuario.id).with_for_update()):
        usuario.karma = karma_por_votos(posts.get(usuario.id, 0) + comentarios.get(usuario.id, 0))
