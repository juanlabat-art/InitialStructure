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

## Backend de Punto

En Windows, `INICIAR.bat` (en la raíz) levanta FastAPI y el frontend juntos. Para arrancar solo FastAPI desde `backend/`, instalá `requirements.txt` y corré `python -m src.main`. Sin un archivo `.env`, se crea una base local SQLite con datos iniciales. Para usar PostgreSQL, seguí la configuración de la sección siguiente y creá la base antes de iniciar el servidor.

El frontend consulta `GET /api/foro/` y usa los endpoints de usuarios, comunidades, publicaciones, comentarios, votos y acciones del foro para las escrituras. La selección de identidad es de demostración local.

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
