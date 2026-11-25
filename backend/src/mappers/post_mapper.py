from src.db.models.post_model import Post
from src.dtos.post_dto import PostResponseDTO


def to_post_response(post: Post) -> PostResponseDTO:
    response = PostResponseDTO.model_validate(post)
    if post.eliminado:
        return response.model_copy(update={"titulo": "Publicación eliminada", "contenido": None})
    return response
