from io import BytesIO

from fastapi import HTTPException
from PIL import Image, ImageOps


MAX_BYTES = 5 * 1024 * 1024
MAX_PIXELES = 32_000_000
FORMATOS = ("JPEG", "PNG", "WEBP")


def preparar_imagen(contenido: bytes, *, banner: bool = False) -> bytes:
    try:
        with Image.open(BytesIO(contenido), formats=FORMATOS) as imagen:
            if imagen.width * imagen.height > MAX_PIXELES:
                raise HTTPException(422, "La foto supera los 32 megapíxeles")
            if getattr(imagen, "is_animated", False):
                raise HTTPException(422, "Elegí una foto sin animación")
            orientada = ImageOps.exif_transpose(imagen).convert("RGBA")
            if banner:
                orientada.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
                miniatura = orientada
            else:
                miniatura = ImageOps.fit(orientada, (256, 256), Image.Resampling.LANCZOS)
            miniatura.info.clear()
            resultado = BytesIO()
            miniatura.save(resultado, "WEBP", quality=85)
            return resultado.getvalue()
    except (Image.DecompressionBombError, OSError, ValueError) as error:
        raise HTTPException(422, "Elegí una foto válida en formato JPG, PNG o WebP") from error
