# Cómo conectar punto. con la API y la base de datos

La consigna original se puede hacer con **Python + FastAPI + SQLAlchemy + SQLite/PostgreSQL**. Este frontend hoy usa `localStorage` para que se pueda probar de inmediato. **No hay conexión real a una API todavía.**

## Entidades originales

Conservar las tablas de la consigna: `Usuario`, `Comunidad`, `Post`, `Comentario`, `Reporte`, `Ban`, `miembros_comunidad`, `votos_post`, `votos_comentario` y `posts_guardados`.

A `Post`, agregar:

- `es_pregunta: bool` (por defecto `False`).
- `respuesta_previa_obligatoria: bool` (por defecto `False`, solo aplicable a preguntas).

Las funciones de `app.js` que actualmente leen `db.posts`, `db.comments`, `db.users` y `db.communities` deberán recibir los objetos del backend (podés mantener el mismo formato del JSON o hacer un mapeo).

## Dos entidades nuevas para el diferencial anónimo

`PreguntaAnonima(id, titulo, contenido, fecha, respuesta_previa_obligatoria)`

`RespuestaAnonima(id, pregunta_id, texto, fecha)`

**No agregar `autor_id` a estas tablas** ni devolver un nombre de usuario desde estos endpoints. El frontend usa `anonymousQuestions` y `anonymousAnswers` y nunca las agrega a `Usuario.posts` o a los listados del perfil. Evitar incluir datos personales en el texto de las preguntas y respuestas.

Para habilitar respuestas ocultas sin vincular identidades, el servidor puede emitir un **token aleatorio de acceso por pregunta** cuando se envía una respuesta anónima. El cliente guarda temporalmente el token y lo envía al pedir las respuestas. Un token distinto, emitido al crear la pregunta, puede permitir al creador leer respuestas sin vincular la pregunta con una cuenta. No reutilizar IDs de sesión autenticados para demostrar autoría anónima.

> Importante: esto protege la identidad dentro de la aplicación, pero el anonimato total requiere también políticas apropiadas para logs, IP, retención y metadatos del servidor. No afirmar anonimato absoluto sin implementarlas.

## Endpoints nuevos propuestos

| Método | Ruta | Función |
|---|---|---|
| GET | `/preguntas-anonimas` | Lista de preguntas, título, contenido y cantidad de respuestas |
| POST | `/preguntas-anonimas` | Crear pregunta sin `autor_id`; responder con token de propietario si se implementa |
| GET | `/preguntas-anonimas/{id}` | Obtener la pregunta sin respuestas |
| POST | `/preguntas-anonimas/{id}/respuestas` | Crear respuesta anónima, devolver token de desbloqueo |
| GET | `/preguntas-anonimas/{id}/respuestas` | Obtener respuestas solo si la pregunta no requiere respuesta previa o si se presenta un token válido |

**Importante para HU6 y el segundo diferencial:** modificar `GET /posts/{id}/comentarios` en la API original. Cuando `respuesta_previa_obligatoria = True`, comprobar si el usuario autenticado ya escribió un comentario en ese post o es el creador. Si ninguna condición se cumple, devolver por ejemplo `403` con `{"bloqueado": true}` y no incluir textos ni autores de comentarios en la respuesta de red. Mostrar la cantidad de comentarios sigue siendo posible.

## Ejemplo del POST para crear una pregunta común

```json
{
  "comunidad_id": 4,
  "titulo": "¿Nos estamos volviendo menos creativos?",
  "contenido": "¿Qué opinan?",
  "es_pregunta": true,
  "respuesta_previa_obligatoria": true
}
```

## Ejemplo del POST para crear una pregunta anónima

```json
{
  "titulo": "¿Está mal cambiar de carrera?",
  "contenido": "Siento que elegí por presión familiar.",
  "respuesta_previa_obligatoria": true
}
```

No incluir `usuario_id`, `autor_id`, `username` ni `email` en el objeto anónimo enviado al backend.

## Reglas que deben validarse en el backend

1. Registro: username y email únicos; karma inicial 0.
2. Crear comunidad: nombre único, 3–21 caracteres sin espacios, 10 karma mínimo, creador moderador.
3. Membresía: sin duplicados, baneados no pueden unirse, último moderador no puede abandonar si hay otros miembros, promoción solo por moderador.
4. Posts/comentarios: solo miembros no baneados, título obligatorio de máximo 300 caracteres, comentario padre del mismo post, máximo 10 niveles.
5. Votos: un voto por usuario/contenido, invertir/quitar en el segundo clic, prohibido votarse a sí mismo; recalcular karma.
6. Feed: `hot = puntaje / (horas_desde_publicacion + 2)`, `nuevo` y `top semanal`, excluir posts ocultos.
7. Reportes: uno por usuario y post, ocultar automáticamente con 5; moderador puede restaurar.
8. Baneos: solo mods, nunca otro mod; fecha opcional, expulsar de comunidad.
9. Guardados: sin duplicados, devolver ordenados por fecha.
10. Anónimo: no asociar publicación/respuesta anónima a perfiles en BD ni en API.
11. Modo «Opiná primero»: **servidor no entrega respuestas antes de que el visitante haya contestado** (o sea autor de la pregunta).

## Sugerencia para la integración

Una vez tengan los endpoints funcionando, reemplazar los accesos al objeto `db` en `app.js` por peticiones `fetch` que traigan información de FastAPI, y las funciones que hacen `db.*.push(...)` por peticiones `POST`. Para votar, guardar, comentar, reportar y moderar usar los endpoints correspondientes. Manejar las respuestas HTTP `401`, `403`, `404` y `409` mostrando un mensaje al usuario.

Para desarrollo local con frontend en puerto 5500 y FastAPI en 8000, habilitar CORS en FastAPI solo para `http://localhost:5500`. No abrir `allow_origins=["*"]` junto con credenciales en producción.
