# Initial Structure — FastAPI + SQLAlchemy + Pydantic

Estructura base de un proyecto en capas (routers, services, repositories, models, schemas, dtos, mappers, middlewares).

## Importante: este repo es un TEMPLATE

**No clones este repo directamente ni intentes pushear.** El repo está protegido y solo el docente tiene permisos de escritura.

### Cómo trabajar con esta plantilla

1. Entrá al repo en GitHub.
2. Hacé click en el botón verde **"Use this template" → "Create a new repository"** (o, si no aparece, usá **"Fork"**).
3. Creá el nuevo repo en **tu cuenta personal** de GitHub.
4. Cloná **tu copia** (no la del docente):
   ```bash
   git clone https://github.com/<TU_USUARIO>/<TU_REPO>.git
   cd <TU_REPO>
   ```
5. A partir de ahí trabajás libremente sobre tu propio repo.

> Si intentás `git push` y te dice `permission denied`, es porque clonaste el repo del docente en lugar de tu fork/template. Volvé al paso 2.

---

## Backend de VoZero

En Windows, `INICIAR.bat` (en la raíz) levanta FastAPI y el frontend juntos. Para arrancar solo FastAPI desde `backend/`, instalá `requirements.txt` y corré `python -m src.main`. Sin un archivo `.env`, se crea una base local SQLite con datos iniciales. Para usar PostgreSQL, seguí la configuración de la sección siguiente y creá la base antes de iniciar el servidor.

El frontend consulta `GET /api/foro/` y usa los endpoints de usuarios, comunidades, publicaciones, comentarios, votos y acciones del foro para las escrituras. Las cuentas usan contraseña y una cookie de sesión `HttpOnly` con un JWT firmado que vence a los siete días. La API comprueba la vigencia de la sesión en la base de datos y la revoca al cerrar sesión. Usá el menú de cuenta para entrar o registrarte. En Swagger podés ingresar con `POST /api/usuario/sesion`. El navegador envía la cookie al probar operaciones que requieren sesión.

Las operaciones que cambian datos del foro requieren sesión. Las preguntas y respuestas anónimas siguen sin guardar el autor, pero requieren una cuenta para publicarse. Solo el autor puede borrar sus posts y comentarios, y solo el creador puede borrar su comunidad. Los moderadores pueden ocultar publicaciones y gestionar miembros según su rol.

Configurá `VOZERO_JWT_SECRET` en `backend/.env` o en el entorno del servidor para conservar las sesiones entre reinicios y compartirlas entre procesos. Generá un valor privado con `python -c "from secrets import token_urlsafe; print(token_urlsafe(48))"`. Sin esa variable, el servidor usa una clave aleatoria que cambia al reiniciar. Las sesiones emitidas antes de pasar a JWT requieren iniciar sesión de nuevo.

Las cuentas creadas antes de este cambio y las cuentas de ejemplo conservan sus datos. Para habilitar una de esas cuentas, iniciá la API una vez para actualizar el esquema y después ejecutá `python -m src.asignar_clave nombre_de_usuario` desde `backend/` con el mismo entorno que usa la API.

En una base PostgreSQL vacía, podés cargar los datos de ejemplo con `src/db/tables.sql` y luego `src/db/inserts.sql` antes de iniciar la API. Las comunidades iniciales permiten participar y ganar karma con una cuenta nueva. En SQLite local se crean automáticamente.

## Karma del foro

El karma parte de cero y se calcula con los votos positivos de otras cuentas. Del nivel 1 al 15, el costo adicional es el número del nivel. Desde el 16, se multiplica el costo anterior por 1,25, se redondea hacia arriba y se limita a 1.000 votos adicionales por nivel. Llegar a 10 requiere 55 votos positivos. La API recalcula el karma guardado al arrancar y lo sincroniza con cada cambio de voto.

`GET /api/usuarios/{id}/karma` devuelve el desglose de votos positivos y karma por tipo de contenido. El total aplica la escala a la suma de votos positivos en publicaciones y comentarios.

Con PostgreSQL, configurá `backend/.env` con tu `DATABASE_URL` y creá primero la base vacía en pgAdmin. FastAPI crea las tablas que falten y añade las columnas nuevas de publicaciones a las bases existentes. Aplicá `src/db/tables.sql` solo si querés crear las tablas manualmente en una base nueva.

## Setup

```bash
cd backend # Si no les deja deber ser porque es: cd .\backend\
python -m venv venv
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
source venv/bin/activate          # Linux/Mac
# venv\Scripts\Activate.ps1       # Windows

pip install -r requirements.txt
cp .env.example .env               # editá con tus credenciales

# Editar el .env en la parte de conexion con la base de datos. Tiene que quedarles algo asi:

# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{nombre de la base}

uvicorn src.app:app --reload #uvicorn src.main:main --reload #uvicorn src.main:app --reload

```

Abrir http://localhost:8000/docs para ver Swagger.

---

## Estructura de carpetas

```
src/
├── db/
│   ├── connection.py
│   ├── models/          # SQLAlchemy
│   ├── migrations/      # Alembic
│   └── seeders/
├── schemas/             # Pydantic (validación HTTP)
├── dtos/                # Pydantic (transporte entre capas)
├── mappers/             # Model ⇄ DTO
├── repositories/        # queries
├── services/            # lógica de negocio
├── routers/             # endpoints FastAPI
├── middlewares/
├── config/
├── utils/
├── app.py               # crea app FastAPI
└── main.py              # entry point
```

---

## Reglas de la arquitectura

1. `routers` no tocan la BD.
2. `services` no tocan `Request` / `Response`.
3. `repositories` no tienen lógica de negocio.
4. `models` no salen del repository / service.
5. `schemas` solo en routers.
6. Al cliente siempre va un DTO, nunca un Model.
