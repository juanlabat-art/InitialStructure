# Backend de VoZero

El backend implementa la API del foro con FastAPI, valida datos con Pydantic, usa SQLAlchemy para manejar la persistencia y procesa imágenes con Pillow. PostgreSQL es la opción para trabajar con pgAdmin. SQLite permite probar el proyecto localmente con un archivo.

## Arranque manual

Ejecutá estos comandos desde la raíz del repositorio en PowerShell.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m src.main
```

En macOS o Linux, usá `python3 -m venv .venv` y luego `./.venv/bin/python` en los comandos de instalación y arranque. Ejecutá los comandos desde `backend/` para mantener la base SQLite en esa carpeta. El servidor escucha en `127.0.0.1`. Con el puerto por defecto, podés abrir [Swagger](http://127.0.0.1:8000/docs) y consultar el [estado del servicio](http://127.0.0.1:8000/health).

### Configuración y base de datos

| Variable de entorno | Comportamiento |
| --- | --- |
| `DATABASE_URL` | Por defecto usa `sqlite:///./punto-local.db`. Para PostgreSQL, creá una base vacía y completá la conexión en `.env` a partir de `.env.example`. |
| `PORT` | Puerto HTTP. El valor por defecto es `8000`. |
| `VOZERO_JWT_SECRET` | Clave privada para firmar sesiones. Configurá un valor estable para conservar las sesiones entre reinicios. Si falta, se genera una clave temporal al arrancar. |
| `VOZERO_WEB_DELETE_SECRET` | Clave privada compartida con Next.js para operaciones internas de borrado y voto. Debe tener al menos 32 caracteres. `INICIAR.bat` la genera para ambos servicios. |

Para generar una clave privada, podés ejecutar `python -c "from secrets import token_urlsafe; print(token_urlsafe(48))"`. Conservá los valores en archivos de entorno locales.

Al arrancar, la aplicación crea las tablas faltantes, aplica ajustes compatibles al esquema existente y prepara las comunidades iniciales. La opción SQLite por defecto carga publicaciones de ejemplo al iniciar una base nueva. En PostgreSQL, podés aplicar [tables.sql](src/db/tables.sql) y luego [inserts.sql](src/db/inserts.sql) en una base vacía si querés cargar los ejemplos manualmente antes de arrancar.

## Cómo procesa una solicitud

1. `src/main.py` inicia Uvicorn. `src/app.py` registra los routers y ejecuta la preparación de la base.
2. El router valida parámetros y cuerpo con los esquemas de `src/schemas/`. Cuando la ruta requiere sesión, obtiene el usuario autenticado.
3. Los servicios de `src/services/` aplican las reglas de negocio. Usan los repositorios de `src/repositories/` o consultas SQLAlchemy para las operaciones que combinan varias relaciones.
4. `src/db/connection.py` entrega una sesión de base por solicitud. `src/db/models/` define las entidades y relaciones.
5. Los mappers convierten resultados a DTOs cuando corresponde. Los DTOs de `src/dtos/` definen la forma que esperan los consumidores de la API.

## Datos y relaciones

| Área | Tablas y relaciones |
| --- | --- |
| Cuentas y sesiones | `usuario` guarda el perfil, el hash de contraseña y el rol del sitio. `sesiones_usuario` guarda el hash del token, su vencimiento y el usuario asociado. |
| Comunidades | `comunidad` referencia a su creador. `miembros_comunidad` une cada cuenta con una comunidad y guarda su rol. `ban` registra sanciones, su motivo y su vencimiento. |
| Publicaciones y discusiones | `post` referencia a su autor y comunidad. `comentario` referencia al post y al autor y puede señalar un comentario padre. |
| Votos y guardados | `votos_post` y `votos_comentario` relacionan votantes con el contenido. `posts_guardados` relaciona usuarios y publicaciones guardadas. |
| Reportes y avisos | `reporte` y `reporte_comentario` registran los motivos por contenido. `notificacion_foro` guarda avisos de comentarios y `notificacion_reportes_post` los avisos por reportes. |
| Espacio anónimo | `pregunta_anonima` guarda la consigna y su categoría. `respuesta_anonima` referencia a la pregunta. `acceso_pregunta_anonima` registra qué preguntas desbloqueó cada cuenta mediante un identificador derivado. |
| Fotos | `foto_usuario` y `foto_comunidad` guardan la imagen procesada y una versión para servirla y actualizar su caché. |

[Ver el esquema de PostgreSQL](src/db/tables.sql)

## Reglas del foro

### Sesión y permisos

El registro guarda un hash de contraseña. Al iniciar sesión, FastAPI emite una cookie `HttpOnly` con un JWT firmado que vence a los siete días. En cada solicitud protegida verifica la firma y que la sesión siga vigente en la base. Cerrar sesión revoca el token.

Para probar la API en Swagger, iniciá sesión con `POST /api/usuario/sesion` desde el mismo host que estás usando para abrir Swagger. El navegador envía la cookie en las siguientes solicitudes. Algunas operaciones internas de borrado y voto se prueban desde el frontend, que agrega la clave del servidor web.

### Comunidades, opiniones y karma

Publicar y comentar requiere pertenecer a la comunidad. Para crear una comunidad se necesitan al menos 10 puntos de karma y el creador se convierte en moderador. Ese rol puede gestionar miembros y publicaciones de su comunidad. El rol del sitio se controla por separado.

En las publicaciones con **Opiná primero**, la API filtra los comentarios hasta que la cuenta escribe su propia opinión. El autor de la publicación puede ver su conversación. En el espacio anónimo, las preguntas y respuestas requieren sesión, se presentan sin nombre de usuario y usan un identificador derivado para reconocer las propias y registrar el desbloqueo.

El karma toma los votos positivos de otras cuentas sobre publicaciones y comentarios. El servicio acumula umbrales por nivel y usa una búsqueda binaria para determinar cuántos se alcanzaron. Una vez que el costo adicional llega a 1.000 votos, cada bloque de 1.000 suma un nivel. Los premios por nombramiento se agregan al resultado. El total se actualiza con los votos y se reconcilia al arrancar. [Código del algoritmo](src/services/karma_service.py)

### Reportes, notificaciones y fotos

Una cuenta puede reportar una publicación ajena una vez. Con cinco reportes de cuentas distintas, la API oculta la publicación y crea un aviso para el administrador general si hay uno asignado. Los reportes de comentarios se registran por separado. Un nuevo comentario avisa al autor del post y, cuando es una respuesta, también puede avisar al autor del comentario padre.

La API valida que quien cambia una foto tenga permiso. Al guardar un JPG, PNG o WebP, verifica el tamaño, la resolución y el formato, corrige la orientación y recorta la imagen al centro. El resultado se guarda como WebP de 256 × 256 píxeles.

## Rutas principales

| Ruta | Operación |
| --- | --- |
| `POST /api/usuario/` y `POST /api/usuario/sesion` | Crear una cuenta e iniciar sesión. |
| `GET /api/foro/` | Cargar los datos del foro visibles para la cuenta. |
| `POST /api/comunidad/` y `PUT /api/foro/comunidades/{id}/miembros` | Crear comunidades y gestionar membresías. |
| `POST /api/post/` y `POST /api/comentario/` | Publicar y comentar. |
| `PUT /api/foro/posts/{id}` | Guardar, quitar de guardados, reportar y moderar una publicación según los permisos. |
| `GET /api/usuarios/{id}/karma` | Consultar el total y el desglose de karma. |
| `POST /api/foro/anonimo` y `POST /api/foro/anonimo/{id}/respuestas` | Crear preguntas y responder en el espacio anónimo. |
| `GET /api/foro/notificaciones` y `PUT /api/foro/notificaciones` | Consultar avisos y marcarlos como leídos. |
| `GET /api/admin/entradas` | Consultar el listado del panel de administración según el rol. |
| `GET /api/fotos/{tipo}/{id}` y `PUT /api/fotos/{tipo}/{id}` | Descargar y guardar fotos de perfil o comunidad. |

## Administración

Registrá la cuenta desde el frontend. Con la base inicializada, ejecutá este comando desde `backend/` con el mismo entorno de Python que usa la API.

```powershell
.\.venv\Scripts\python.exe -m src.asignar_admin nombre_de_usuario
```

Hay un administrador general. Puede nombrar o quitar subadmins y gestionar cuentas. Cada nombramiento suma 10 puntos de karma que quedan en la cuenta. El administrador y los subadmins pueden moderar publicaciones, comentarios y contenido anónimo desde el panel. Al eliminar una publicación allí, el backend borra su contenido y conserva los comentarios para mantener el hilo. La herramienta `python -m src.asignar_clave nombre_de_usuario` permite habilitar una cuenta anterior o de ejemplo que requiere contraseña.

[Volver al README principal](../README.md)
