# punto. — Frontend del proyecto tipo Reddit

**Un foro con ideas sin eco.** Proyecto escolar para la consigna «Proyecto 10 — Reddit».

Este proyecto incluye un **frontend interactivo** en HTML, CSS y JavaScript. No necesita React, npm ni instalar paquetes: lo pueden abrir en el navegador o servir desde Python. El backend de Python y la base de datos **todavía no están conectados**. Para probarlo, se cargan datos de ejemplo y los cambios se guardan en `localStorage`.

## Cómo ejecutarlo (Windows)

1. Descomprimí el ZIP.
2. Abrí la carpeta `punto-frontend`.
3. Hacé doble clic en `INICIAR.bat`. Alternativamente, abrí una terminal dentro de esa carpeta y ejecutá:

   ```bash
   python -m http.server 5500
   ```

4. En tu navegador, entrá a **http://localhost:5500**.

También podés abrir `index.html` directamente, pero usar el pequeño servidor de Python hace que los datos se guarden mejor entre recargas.

## Qué se puede probar

| Pantalla / módulo | Funciones |
|---|---|
| Inicio | Feed de comunidades, filtros Hot / Nuevo / Top semanal |
| Comunidades | Explorar, crear (mínimo 10 de karma), unirse, abandonar, miembros y top de usuarios |
| Publicaciones | Crear posts y preguntas, votar, guardar, reportar |
| Preguntas «Opiná primero» | Creador activa el bloqueo; el lector **no ve respuestas** hasta que comenta |
| Comentarios | Árbol de comentarios anidados, respuestas, votación, borrado que conserva el hilo, límite de 10 niveles |
| Anónimo | Sección separada de preguntas y respuestas **sin autor en los registros del prototipo**, con modo «Opiná primero» opcional |
| Perfil | Publicaciones normales, comunidad, karma. **Nunca** aparecen las preguntas o respuestas anónimas |
| Moderación | Reportes (5 ocultan automáticamente), ocultar/restaurar, promover moderadores, banear temporal o permanentemente |
| Cuentas | Crear usuario con 0 karma, validar email y username únicos, cambiar entre usuarios demo |

## Probá los dos diferenciales

**1. Preguntas anónimas:** andá a **Anónimo → Hacer pregunta anónima**. No pide nombre de usuario y no aparece después en tu perfil. Todas las respuestas también se muestran como «Persona anónima».

**2. Opiná primero:** en el feed abrí «¿La inteligencia artificial nos está volviendo menos creativos?». No aparecen las respuestas hasta que enviás un comentario. También podés activar esa función al crear una pregunta, o en una pregunta anónima.

## Cuentas de demostración

En el menú del avatar, arriba a la derecha, podés entrar como `lucia.m`, `tomirios`, `sofidev`, `martu_22` o `nico.c`. `lucia.m` es moderadora de `r/vidauniversitaria` y tiene 32 puntos base de karma, así que podés probar la creación de comunidades. También podés crear una cuenta nueva (empieza con 0 karma).

Para borrar los datos de prueba, abrí el menú del avatar y elegí **Reiniciar demostración**.

## Estructura de archivos

- `index.html`: estructura de entrada.
- `styles.css`: diseño visual y adaptación a celulares.
- `app.js`: navegación, datos de ejemplo, pantallas y toda la interacción.
- `CONEXION_API.md`: endpoints y tablas que habría que implementar para conectarlo a la base de datos.
- `INICIAR.bat`: inicia un servidor de desarrollo con Python en Windows.

## Muy importante antes de entregar

El frontend **es una demo**, no una solución segura de backend. Las validaciones de votos, permisos, reportes, baneos, anonimato y desbloqueo de comentarios **deben repetirse del lado de la API de Python**. Nunca alcanza con ocultar una respuesta mediante CSS/JavaScript: la API no debe enviar el texto a usuarios que todavía no respondieron. Lo mismo vale para el anonimato: el servidor debe evitar asociar las preguntas o respuestas anónimas con un ID de usuario.
