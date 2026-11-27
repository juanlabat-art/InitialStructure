# VoZero · Ideas sin eco

VoZero es un foro de comunidades donde podés publicar, conversar, votar y guardar contenido. El proyecto incluye una aplicación web en Next.js y una API en FastAPI que guarda los datos en PostgreSQL o SQLite.

## El diferencial de VoZero

**Opiná primero** permite plantear una pregunta sin que las respuestas existentes condicionen la primera opinión de quien participa. Al crear una pregunta, activá esta opción. Quien entra puede leer la consigna y escribir su respuesta. Después de publicarla, puede leer las demás.

La regla también se aplica en la API. En una publicación de comunidad, el autor puede seguir su propia conversación y el resto de las cuentas la desbloquea al comentar. En el espacio anónimo, el desbloqueo se registra por cuenta y por pregunta. Ahí, las respuestas se muestran sin nombre de usuario.

## Cómo iniciar el proyecto

En Windows, instalá Node.js 20.9 o superior y Python 3.12 o 3.13. Ejecutá `INICIAR.bat` desde la raíz. El script prepara el entorno virtual, instala las dependencias, levanta ambos servicios y abre el sitio cuando responden.

| Servicio | Dirección habitual |
| --- | --- |
| VoZero | [127.0.0.1:3000](http://127.0.0.1:3000) |
| Documentación interactiva de la API | [Swagger](http://127.0.0.1:8000/docs) |
| Estado de la API | [Health](http://127.0.0.1:8000/health) |

Sin `backend/.env`, podés empezar con SQLite y datos de ejemplo. Para trabajar con PostgreSQL, creá una base local y configurá `DATABASE_URL` antes de arrancar. Usá el mismo origen web durante la prueba, ya que el navegador guarda la sesión para el host que usaste al ingresar.

## Qué podés hacer

| Sección | Funciones |
| --- | --- |
| Inicio y búsqueda | Explorar publicaciones y buscar por texto, comunidad o nombre de usuario. |
| Comunidades | Unirte, publicar, ver el ranking, fijar hasta 3 comunidades en el menú lateral y, con 10 de karma, crear una comunidad. |
| Publicaciones | Leer, comentar, responder a otros comentarios, votar, guardar y reportar. Las publicaciones y los comentarios editados muestran "(editado)". |
| Anónimo | Hacer preguntas y responder sin mostrar tu nombre de usuario. |
| Usuarios y perfil | Buscar cuentas, visitar perfiles, consultar el karma y editar tu descripción o foto. |
| Notificaciones | Ver avisos de comentarios y respuestas. El administrador general también recibe avisos de publicaciones que alcanzan cinco reportes. |
| Moderación y administración | Gestionar miembros y publicaciones de una comunidad según el rol, o moderar el sitio desde el panel de administración. |

## Cómo se conectan las partes

El navegador carga las páginas de Next.js y consulta `/api` en el mismo origen. Next.js reenvía esas solicitudes a FastAPI. La API valida la sesión y los permisos, aplica las reglas del foro y usa SQLAlchemy para leer o guardar los datos. El frontend actualiza la pantalla con la respuesta.

- [Frontend](frontend/README.md) explica las pantallas, el estado, la integración con la API y la vista previa de fotos.
- [Backend](backend/README.md) explica el arranque manual, las capas de FastAPI, los datos y las reglas del foro.
- [Esquema de la base](backend/src/db/tables.sql) contiene las tablas y relaciones de PostgreSQL. Podés inspeccionar una base iniciada desde pgAdmin.

## Karma y recomendaciones para la demo

El karma se calcula a partir de los votos positivos de otras cuentas sobre tus publicaciones y comentarios. Del nivel 1 al 15, el costo adicional de cada nivel coincide con su número. Por ejemplo, llegar al nivel 3 requiere 1 + 2 + 3 = 6 votos, y llegar al nivel 10 requiere 55. A partir del nivel 16, el costo crece un 25 % por nivel, redondeado hacia arriba, hasta un máximo de 1.000 votos adicionales por nivel. Los puntos obtenidos por nombramientos como subadmin se suman por separado. [Implementación del cálculo](backend/src/services/karma_service.py)

1. Registrá dos cuentas de prueba y unilas a la misma comunidad.
2. Con una cuenta, publicá una pregunta con **Opiná primero** y agregá un comentario.
3. Abrí la pregunta con la segunda cuenta. Respondé y comprobá que aparecen los comentarios previos. Volvé a la primera cuenta para ver el aviso en la campanita.
4. Desde **Mi perfil → Editar perfil**, elegí una foto. Tocá la vista previa para ver el recorte ampliado y guardala cuando esté lista.
5. Para probar la moderación automática, usá una publicación de prueba. Reportala desde cinco cuentas distintas a la del autor y revisá el aviso del administrador general. [Asignar el administrador](backend/README.md#administración)

## Decisiones técnicas del proyecto

- Las opiniones bloqueadas se filtran en el backend. Así, la pantalla y las consultas de la API aplican la misma regla antes de devolver las respuestas.
- La vista previa de la foto se genera en el navegador para que puedas revisar el recorte antes de subir el archivo. El backend valida y procesa la imagen al guardarla.
- Al eliminar el contenido de una publicación desde el panel de administración, se conservan sus comentarios. Así, las respuestas de otras cuentas siguen enlazadas al hilo.
