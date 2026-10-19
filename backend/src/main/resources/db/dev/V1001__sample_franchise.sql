-- Made-up franchise: the existing Starfall Chronicles manga plus an anime of it.
INSERT INTO franchise (id, title, alt_title) VALUES
    (1, 'Starfall Chronicles', 'Hoshiochi Kiroku');

UPDATE series SET franchise_id = 1 WHERE title = 'Starfall Chronicles' AND kind = 'manga';

INSERT INTO series (title, kind, status, franchise_id) VALUES
    ('Starfall Chronicles', 'anime', 'ongoing', 1);

INSERT INTO media (kind, title, series_id, number, status, rating, details)
SELECT 'anime', 'Starfall Chronicles Season 1', id, 1, 'in-progress', NULL, '{"studio": "Sample Works", "episodes": 12}'
FROM series WHERE title = 'Starfall Chronicles' AND kind = 'anime';

INSERT INTO episodes (media_id, number, title, air_date, views, rating, notes)
SELECT m.id, e.number, e.title, e.air_date, e.views, e.rating, e.notes
FROM media m,
     (SELECT 1 AS number, 'The Falling Light' AS title, '2026-01-04' AS air_date, 2 AS views, 8 AS rating, 'Great opening.' AS notes
      UNION ALL SELECT 2, 'Orbit of Two', '2026-01-11', 1, 7, NULL
      UNION ALL SELECT 3, 'Quiet Harbor', '2026-01-18', 0, NULL, NULL) e
WHERE m.title = 'Starfall Chronicles Season 1';

INSERT INTO characters (id, name, role, about) VALUES
    (1, 'Kaito Venn',    'protagonist', 'A navigator who reads the falling stars.'),
    (2, 'Mira Solenne',  'main',        'A mechanic with a borrowed starship.');

INSERT INTO character_franchise (character_id, franchise_id) VALUES (1, 1), (2, 1);

-- Kaito is in manga vol. 1 and the anime; Mira only in the anime so far.
INSERT INTO character_media (character_id, media_id)
SELECT 1, id FROM media WHERE title IN ('Starfall Chronicles Vol. 1', 'Starfall Chronicles Season 1');
INSERT INTO character_media (character_id, media_id)
SELECT 2, id FROM media WHERE title = 'Starfall Chronicles Season 1';
