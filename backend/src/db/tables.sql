-- =====================================================
-- Clon de Reddit - Solo tablas (PostgreSQL)
-- =====================================================
 
-- ---------- ENTIDADES ----------
 
CREATE TABLE usuario (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(30)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    clave_hash      VARCHAR(161),
    clave_anonima   VARCHAR(32),
    descripcion     VARCHAR(300),
    rol_sitio       VARCHAR(12) NOT NULL DEFAULT 'usuario'
                    CHECK (rol_sitio IN ('usuario', 'subadmin', 'admin')),
    karma           INTEGER      NOT NULL DEFAULT 0,
    karma_por_nombramientos INTEGER NOT NULL DEFAULT 0 CHECK (karma_por_nombramientos >= 0),
    fecha_registro  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_usuario_admin_sitio ON usuario (rol_sitio) WHERE rol_sitio = 'admin';

CREATE TABLE foto_usuario (
    id INTEGER PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
    version VARCHAR(64) NOT NULL,
    contenido BYTEA NOT NULL
);
 
CREATE TABLE comunidad (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(21)  NOT NULL UNIQUE,
    descripcion     TEXT,
    creador_id      INTEGER      NOT NULL REFERENCES usuario(id),
    es_nsfw         BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_creacion  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE foto_comunidad (
    id INTEGER PRIMARY KEY REFERENCES comunidad(id) ON DELETE CASCADE,
    version VARCHAR(64) NOT NULL,
    contenido BYTEA NOT NULL
);
 
CREATE TABLE post (
    id            SERIAL PRIMARY KEY,
    comunidad_id  INTEGER      NOT NULL REFERENCES comunidad(id),
    autor_id      INTEGER      NOT NULL REFERENCES usuario(id),
    solicitud_id  VARCHAR(36),
    titulo        VARCHAR(300) NOT NULL,
    contenido     TEXT,
    fecha         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_edicion TIMESTAMP WITH TIME ZONE,
    oculto        BOOLEAN      NOT NULL DEFAULT FALSE,
    eliminado     BOOLEAN      NOT NULL DEFAULT FALSE,
    es_pregunta   BOOLEAN      NOT NULL DEFAULT FALSE,
    opinar_primero BOOLEAN     NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX uq_post_autor_solicitud ON post (autor_id, solicitud_id);
 
CREATE TABLE comentario (
    id                   SERIAL PRIMARY KEY,
    post_id              INTEGER   NOT NULL REFERENCES post(id),
    autor_id             INTEGER   NOT NULL REFERENCES usuario(id),
    comentario_padre_id  INTEGER   REFERENCES comentario(id),  -- NULL = comentario raíz
    texto                TEXT      NOT NULL,
    fecha                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_edicion        TIMESTAMP WITH TIME ZONE,                -- NULL = nunca se editó
    eliminado            BOOLEAN   NOT NULL DEFAULT FALSE
);

CREATE TABLE notificacion_foro (
    usuario_id     INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    comentario_id  INTEGER NOT NULL REFERENCES comentario(id) ON DELETE CASCADE,
    es_respuesta   BOOLEAN NOT NULL,
    leida          BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (usuario_id, comentario_id)
);

CREATE INDEX ix_notificacion_foro_comentario_id ON notificacion_foro (comentario_id);
 
CREATE TABLE reporte (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER      NOT NULL REFERENCES usuario(id),
    post_id     INTEGER      NOT NULL REFERENCES post(id),
    motivo      VARCHAR(255) NOT NULL,
    fecha       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reporte_comentario (
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    comentario_id INTEGER NOT NULL REFERENCES comentario(id) ON DELETE CASCADE,
    motivo VARCHAR(255) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, comentario_id)
);

CREATE INDEX ix_reporte_comentario_comentario_id ON reporte_comentario (comentario_id);

CREATE TABLE notificacion_reportes_post (
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, post_id)
);

CREATE INDEX ix_notificacion_reportes_post_post_id ON notificacion_reportes_post (post_id);
 
CREATE TABLE ban (
    id            SERIAL PRIMARY KEY,
    comunidad_id  INTEGER      NOT NULL REFERENCES comunidad(id),
    usuario_id    INTEGER      NOT NULL REFERENCES usuario(id),
    moderador_id  INTEGER      NOT NULL REFERENCES usuario(id),
    motivo        VARCHAR(255),
    fecha_hasta   TIMESTAMP    -- NULL = ban permanente
);
 
-- ---------- RELACIONES N A M ----------
 
CREATE TABLE miembros_comunidad (
    usuario_id    INTEGER     NOT NULL REFERENCES usuario(id),
    comunidad_id  INTEGER     NOT NULL REFERENCES comunidad(id),
    rol           VARCHAR(10) NOT NULL DEFAULT 'miembro',   -- 'miembro' o 'moderador'
    fecha_union   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fijada        BOOLEAN     NOT NULL DEFAULT FALSE,       -- hasta 3 por usuario
    PRIMARY KEY (usuario_id, comunidad_id)
);
 
CREATE TABLE votos_post (
    usuario_id  INTEGER   NOT NULL REFERENCES usuario(id),
    post_id     INTEGER   NOT NULL REFERENCES post(id),
    valor       SMALLINT  NOT NULL,                          -- 1 o -1
    fecha       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, post_id)
);
 
CREATE TABLE votos_comentario (
    usuario_id     INTEGER   NOT NULL REFERENCES usuario(id),
    comentario_id  INTEGER   NOT NULL REFERENCES comentario(id),
    valor          SMALLINT  NOT NULL,                       -- 1 o -1
    fecha          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, comentario_id)
);
 
CREATE TABLE posts_guardados (
    usuario_id  INTEGER   NOT NULL REFERENCES usuario(id),
    post_id     INTEGER   NOT NULL REFERENCES post(id),
    fecha       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, post_id)
);

-- ---------- PREGUNTAS ANÓNIMAS ----------

CREATE TABLE pregunta_anonima (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    contenido TEXT NOT NULL,
    categoria VARCHAR(16) NOT NULL DEFAULT 'general'
              CHECK (categoria IN ('general', 'peliculas', 'juegos', 'estudio', 'tecnologia', 'convivencia', 'otros')),
    es_adulta BOOLEAN NOT NULL DEFAULT FALSE,
    autor_hash VARCHAR(64),
    opinar_primero BOOLEAN NOT NULL DEFAULT FALSE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE respuesta_anonima (
    id SERIAL PRIMARY KEY,
    pregunta_id INTEGER NOT NULL REFERENCES pregunta_anonima(id),
    texto TEXT NOT NULL,
    autor_hash VARCHAR(64),
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE acceso_pregunta_anonima (
    pregunta_id INTEGER NOT NULL REFERENCES pregunta_anonima(id),
    sesion_hash VARCHAR(64) NOT NULL,
    PRIMARY KEY (pregunta_id, sesion_hash)
);

-- ---------- SESIONES DE CUENTAS ----------

CREATE TABLE sesiones_usuario (
    token_hash  VARCHAR(64) PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    vence       TIMESTAMP NOT NULL
);
