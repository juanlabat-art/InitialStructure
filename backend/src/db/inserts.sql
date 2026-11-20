-- =====================================================
-- INSERTS (ejecutar con las tablas vacías)
-- =====================================================

-- Si ya habías cargado datos, descomentá esto para limpiar y reiniciar los ids:
-- TRUNCATE usuario, comunidad, post, comentario, reporte, ban,
--          miembros_comunidad, votos_post, votos_comentario, posts_guardados
--          RESTART IDENTITY CASCADE;

-- ---------- USUARIOS (ids 1 a 6) ----------
INSERT INTO usuario (username, email) VALUES
('martina_dev',  'martina@mail.com'),
('lucas_gamer',  'lucas@mail.com'),
('sofia_cocina', 'sofia@mail.com'),
('diego_futbol', 'diego@mail.com'),
('vale_code',    'valentina@mail.com'),
('tomas_memes',  'tomas@mail.com');

-- ---------- COMUNIDADES (ids 1 a 5) ----------
INSERT INTO comunidad (nombre, descripcion, creador_id, es_nsfw) VALUES
('programacion',      'Todo sobre código, bases de datos y desarrollo web', 1, FALSE),
('memes_argentinos',  'Los mejores memes de acá',                           2, FALSE),
('futbol',            'Resultados, análisis y debates de fútbol',           4, FALSE),
('cocina',            'Recetas y consejos para cocinar',                    3, FALSE),
('humor_negro',       'Humor ácido, solo para mayores',                     6, TRUE);

-- ---------- POSTS (ids 1 a 8) ----------
INSERT INTO post (comunidad_id, autor_id, titulo, contenido, oculto) VALUES
(1, 1, '¿Cómo empiezo con FastAPI?',          'Estoy armando mi primer backend, ¿algún consejo?', FALSE),
(1, 2, 'Mejores extensiones de VS Code',      'Comparto las que uso todos los días.',             FALSE),
(1, 5, 'PostgreSQL vs MySQL',                 '¿Cuál prefieren para un proyecto chico?',          FALSE),
(2, 3, 'Cuando el profe dice "es fácil"',     'Y después el parcial tiene 12 ejercicios.',        FALSE),
(3, 4, 'Resumen de la fecha',                 'Partidazo el del domingo, qué nivel.',             FALSE),
(3, 2, '¿Mejor equipo del año?',              'Abro debate, voten.',                              FALSE),
(4, 3, 'Receta de empanadas tucumanas',       'Con cebolla de verdeo, comino y mucho cariño.',    FALSE),
(5, 6, 'Chiste del día',                      'Contenido de prueba para moderación.',             TRUE);

-- ---------- COMENTARIOS (ids 1 a 10) ----------
-- comentario_padre_id NULL = comentario raíz
INSERT INTO comentario (post_id, autor_id, comentario_padre_id, texto, eliminado) VALUES
(1, 2, NULL, 'Mirá la documentación oficial, está muy buena.',        FALSE),  -- 1
(1, 1, 1,    'Gracias, ya la estoy leyendo.',                         FALSE),  -- 2 (responde a 1)
(1, 5, NULL, 'Yo empecé con un tutorial de YouTube y me sirvió.',     FALSE),  -- 3
(2, 1, NULL, 'Yo uso Prettier y GitLens, son geniales.',              FALSE),  -- 4
(3, 1, NULL, 'Para algo chico, PostgreSQL sin dudar.',                FALSE),  -- 5
(3, 2, 5,    'Coincido, además tiene mejores tipos de datos.',        FALSE),  -- 6 (responde a 5)
(4, 4, NULL, 'Jajaja me pasó lo mismo la semana pasada.',             FALSE),  -- 7
(5, 6, NULL, 'Comentario eliminado por el autor.',                    TRUE),   -- 8
(7, 4, NULL, '¡Se ven increíbles! ¿Llevan papa?',                     FALSE),  -- 9
(7, 3, 9,    'No, la tucumana clásica no lleva papa.',                FALSE);  -- 10 (responde a 9)

-- ---------- REPORTES ----------
INSERT INTO reporte (usuario_id, post_id, motivo) VALUES
(4, 8, 'Contenido ofensivo'),
(2, 8, 'Spam'),
(5, 4, 'Off-topic');

-- ---------- BANES ----------
INSERT INTO ban (comunidad_id, usuario_id, moderador_id, motivo, fecha_hasta) VALUES
(3, 6, 4, 'Spam repetido en la comunidad', '2026-12-31 23:59:59'),
(1, 6, 1, 'Comportamiento abusivo',        NULL);  -- ban permanente

-- ---------- MIEMBROS DE COMUNIDAD ----------
INSERT INTO miembros_comunidad (usuario_id, comunidad_id, rol) VALUES
(1, 1, 'moderador'),
(2, 1, 'miembro'),
(5, 1, 'miembro'),
(2, 2, 'moderador'),
(3, 2, 'miembro'),
(6, 2, 'miembro'),
(4, 3, 'moderador'),
(2, 3, 'miembro'),
(6, 3, 'miembro'),
(3, 4, 'moderador'),
(4, 4, 'miembro'),
(6, 5, 'moderador');

-- ---------- VOTOS EN POSTS (valor 1 o -1) ----------
INSERT INTO votos_post (usuario_id, post_id, valor) VALUES
(2, 1,  1),
(5, 1,  1),
(3, 1,  1),
(1, 2,  1),
(4, 2, -1),
(1, 3,  1),
(2, 3,  1),
(1, 4,  1),
(4, 4,  1),
(2, 5,  1),
(6, 5, -1),
(1, 6,  1),
(4, 7,  1),
(1, 7,  1),
(2, 7,  1),
(1, 8, -1);

-- ---------- VOTOS EN COMENTARIOS (valor 1 o -1) ----------
INSERT INTO votos_comentario (usuario_id, comentario_id, valor) VALUES
(1, 1,  1),
(5, 1,  1),
(2, 2,  1),
(1, 3,  1),
(2, 4,  1),
(5, 5,  1),
(1, 6,  1),
(3, 7,  1),
(1, 8, -1),
(3, 9,  1),
(4, 10, 1);

-- ---------- POSTS GUARDADOS ----------
INSERT INTO posts_guardados (usuario_id, post_id) VALUES
(1, 3),
(1, 7),
(2, 1),
(3, 5),
(4, 7),
(5, 2);