# Frontend de VoZero

La interfaz está hecha con Next.js 16, React 19 y TypeScript. Usa el App Router para organizar las páginas, CSS global para el diseño y una API FastAPI para persistir el contenido.

## Ejecutar en desarrollo

Iniciá el [backend](../backend/README.md) y ejecutá estos comandos desde la raíz del repositorio en PowerShell.

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

Abrí [VoZero](http://127.0.0.1:3000). Si usás `INICIAR.bat`, el script ya hace el arranque conjunto. Para configurar el frontend manualmente, podés usar `frontend/.env.local`.

| Variable | Uso |
| --- | --- |
| `PUNTO_BACKEND_URL` | Origen de FastAPI. Por defecto es `http://127.0.0.1:8000`. Cambialo si la API escucha en otro puerto. |
| `VOZERO_WEB_DELETE_SECRET` | Clave privada del servidor web para los borrados y votos que pasan por `/api/eliminar`. Al iniciar por separado, usá el mismo valor que en FastAPI. |

## Cómo se organiza el código

| Archivo o carpeta | Responsabilidad |
| --- | --- |
| `app/layout.tsx` y `app/globals.css` | Estructura común, estilos, diseño adaptable y estados visuales. |
| `app/**/page.tsx` | Rutas y lectura de parámetros de la URL. |
| `app/**/screen.tsx` | Formularios y contenido de las pantallas. |
| `app/punto-screen.tsx` | Componente cliente que monta la pantalla y conecta la navegación con Next.js. |
| `app/demo.ts` | Maneja eventos de la interfaz, envíos de formularios, navegación y actualización de notificaciones. |
| `app/shared/state.ts` | Crea el contexto de pantalla y las reglas de presentación que comparten las vistas. |
| `app/shared/api.ts` | Hace las solicitudes HTTP y adapta las respuestas de FastAPI al formato que usa la interfaz. |
| `app/shared/chrome.ts` | Barra superior, menú de cuenta, campanita y navegación. |
| `app/shared/posts.ts`, `people.ts` y `presentation.ts` | Generan tarjetas, listas, enlaces, iconos y otros fragmentos reutilizables. |
| `app/shared/photos.ts` | Renderiza el editor de fotos y prepara la vista previa local del perfil. |

Al entrar al foro, el cliente consulta `GET /api/foro` y carga los datos visibles para la sesión. Las acciones guardan los cambios en el backend y actualizan la pantalla según el resultado. El almacenamiento local se usa para preferencias de interfaz y datos auxiliares. La sesión autenticada se maneja con la cookie `HttpOnly` de la API.

[next.config.ts](next.config.ts) reenvía las rutas de `/api` al backend. La [ruta `/api/eliminar`](app/api/eliminar/route.ts) maneja operaciones internas desde el servidor de Next.js. Valida las rutas permitidas y agrega la clave compartida antes de reenviar la operación a FastAPI.

## Pantallas y flujos

En esta tabla, los valores entre corchetes representan parámetros que la aplicación completa con datos reales.

| Ruta | Qué permite hacer |
| --- | --- |
| `/login` y `/register` | Iniciar sesión o registrarte. |
| `/` | Consultar el feed y ordenar publicaciones. |
| `/communities` y `/communities/new` | Explorar comunidades y crear una al alcanzar el karma requerido. |
| `/communities/[id]` | Ver publicaciones, unirte a la comunidad y acceder a sus pestañas. |
| `/communities/[id]/ranking` | Consultar el ranking de participantes de la comunidad. |
| `/communities/[id]/moderation` | Ver publicaciones reportadas y gestionar miembros con permisos de moderación. |
| `/post/new`, `/post/[id]` y `/post/[id]/edit` | Publicar, participar en una conversación y editar tus publicaciones disponibles. |
| `/post/[id]/report` | Elegir el motivo y reportar una publicación de otra cuenta. |
| `/anonymous`, `/anonymous/new` y `/anonymous/[id]` | Explorar categorías y publicar o responder preguntas anónimas. |
| `/users` y `/users/[username]` | Buscar usuarios y abrir sus perfiles visibles. |
| `/myprofile` y `/myprofile/edit` | Ver tu actividad y karma, y editar tu descripción o foto. |
| `/saved` | Volver a tus publicaciones guardadas. |
| `/search?q=texto` | Buscar publicaciones, comunidades y usuarios. |
| `/admin` | Consultar reportes y moderar contenido. El administrador general también administra cuentas y subadmins. |

### Opiná primero y búsqueda

El formulario de publicación permite activar **Opiná primero** al crear una pregunta. La vista de detalle muestra el editor de respuesta y la explicación del bloqueo. Una vez enviada la opinión, vuelve a cargar los datos visibles para esa cuenta. En la búsqueda general aparecen hasta cinco usuarios por consulta y un enlace al directorio cuando hay más resultados. El directorio tiene su propio filtro y pagina los resultados.

### Fotos y avisos

Al elegir un JPG, PNG o WebP de hasta 5 MB en **Editar perfil**, el navegador prepara una vista previa cuadrada con el recorte centrado. Podés tocarla para ampliarla y cerrarla con **Esc** o tocando fuera. La subida empieza al tocar **Guardar foto**.

La campanita consulta la API al cargar el foro y se actualiza periódicamente mientras la página está visible. El punto ámbar indica avisos sin leer. Al abrir el menú, la interfaz carga los avisos y marca los nuevos como leídos. Los avisos de comentarios llevan a la conversación y los de reportes al panel de publicaciones.

## Verificaciones

```powershell
npm.cmd run lint
npm.cmd run build
```

Con una sesión iniciada, probá la navegación hacia el perfil de otra cuenta, el desbloqueo de **Opiná primero** y la vista previa de una foto horizontal. Probá también cambiar de imagen antes de guardarla para ver que el recorte se actualiza.

[Volver al README principal](../README.md)
