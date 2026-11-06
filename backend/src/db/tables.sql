-- =====================================================
-- Clon de Reddit - Solo tablas (PostgreSQL)
-- =====================================================
 
-- ---------- ENTIDADES ----------
 
CREATE TABLE usuario (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(30)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    karma           INTEGER      NOT NULL DEFAULT 0,
    fecha_registro  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE comunidad (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(21)  NOT NULL UNIQUE,
    descripcion     TEXT,
    creador_id      INTEGER      NOT NULL REFERENCES usuario(id),
    es_nsfw         BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_creacion  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE post (
    id            SERIAL PRIMARY KEY,
    comunidad_id  INTEGER      NOT NULL REFERENCES comunidad(id),
    autor_id      INTEGER      NOT NULL REFERENCES usuario(id),
    titulo        VARCHAR(300) NOT NULL,
    contenido     TEXT,
    fecha         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    oculto        BOOLEAN      NOT NULL DEFAULT FALSE
);
 
CREATE TABLE comentario (
    id                   SERIAL PRIMARY KEY,
    post_id              INTEGER   NOT NULL REFERENCES post(id),
    autor_id             INTEGER   NOT NULL REFERENCES usuario(id),
    comentario_padre_id  INTEGER   REFERENCES comentario(id),  -- NULL = comentario raíz
    texto                TEXT      NOT NULL,
    fecha                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado            BOOLEAN   NOT NULL DEFAULT FALSE
);
 
CREATE TABLE reporte (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER      NOT NULL REFERENCES usuario(id),
    post_id     INTEGER      NOT NULL REFERENCES post(id),
    motivo      VARCHAR(255) NOT NULL,
    fecha       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
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
    fecha_union   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, comunidad_id)
);
 
CREATE TABLE votos_post (
    usuario_id  INTEGER   NOT NULL REFERENCES usuario(id),
    post_id     INTEGER   NOT NULL REFERENCES post(id),
    valor       SMALLINT  NOT NULL,                          -- 1 o -1
    fecha       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, post_id)
);
 
CREATE TABLE votos_comentario (
    usuario_id     INTEGER   NOT NULL REFERENCES usuario(id),
    comentario_id  INTEGER   NOT NULL REFERENCES comentario(id),
    valor          SMALLINT  NOT NULL,                       -- 1 o -1
    fecha          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, comentario_id)
);
 
CREATE TABLE posts_guardados (
    usuario_id  INTEGER   NOT NULL REFERENCES usuario(id),
    post_id     INTEGER   NOT NULL REFERENCES post(id),
    fecha       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, post_id)
);