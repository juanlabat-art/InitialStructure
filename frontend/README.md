# VoZero · Ideas sin eco

Frontend interactivo de un foro de comunidades, desarrollado en TypeScript con Next.js.

## Ejecutar

En Windows, abrí `INICIAR.bat` desde la raíz del repositorio. Requiere Python 3.12 o 3.13 y Node.js 20.9 o superior. El script instala las dependencias, levanta ambos servicios en ventanas separadas y deja el sitio en http://localhost:3000 y Swagger en http://127.0.0.1:8000/docs.

Sin `backend/.env`, FastAPI crea `backend/punto-local.db` con SQLite y carga cuentas, comunidades y publicaciones iniciales. Para usar PostgreSQL, configurá `backend/.env` a partir de `backend/.env.example` y creá la base en pgAdmin. FastAPI prepara las tablas al iniciar. Si cambiás el puerto de FastAPI, configurá `PUNTO_BACKEND_URL` en `frontend/.env.local` con el origen correspondiente.

Para iniciar los servicios por separado, seguí los comandos del README del backend y ejecutá `npm ci` y `npm run dev -- --hostname 127.0.0.1` en `frontend/`.

Para habilitar los borrados al iniciar los servicios por separado, configurá el mismo valor aleatorio de al menos 32 caracteres en `VOZERO_WEB_DELETE_SECRET` en `backend/.env` y `frontend/.env.local`. `INICIAR.bat` genera y comparte ese valor automáticamente.

## Pantallas y rutas

| Pantalla | URL |
| --- | --- |
| Inicio | `/` |
| Comunidades | `/communities` |
| Detalle de comunidad | `/communities/c2` |
| Publicación y comentarios | `/post/4` |
| Preguntas anónimas | `/anonymous` |
| Detalle de pregunta anónima | `/anonymous/a1` |
| Mi perfil | `/myprofile` |
| Guardados | `/saved` |
| Búsqueda | `/search?q=Python` |
| Ranking de una comunidad | `/communities/c2/ranking` |
| Moderación de una comunidad | `/communities/c2/moderation` |
| Crear publicación | `/post/new` |
| Crear pregunta anónima | `/anonymous/new` |
| Crear comunidad | `/communities/new` |
| Registro | `/register` |
| Reportar publicación | `/post/4/report` |
| Banear miembro | `/communities/c2/moderation/ban/u2` |

Las comunidades incluyen publicaciones, ranking y moderación para las cuentas con ese rol.

Desde el avatar podés elegir una cuenta de demostración o registrar una nueva. La selección de cuenta es para pruebas locales.

El frontend consulta FastAPI a través de `/api` en el mismo origen. Con `backend/.env` apuntando a PostgreSQL, VoZero guarda en esa base los usuarios, comunidades, publicaciones, comentarios, votos, membresías, guardados, reportes, acciones de moderación y preguntas y respuestas anónimas. El navegador solo conserva la cuenta seleccionada y la sesión del espacio anónimo.

Si la base está vacía, registrá una cuenta y creá la primera comunidad. Las publicaciones tendrán los IDs que asigne la base.
