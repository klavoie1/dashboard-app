INSERT INTO series (id, title, kind, status) VALUES
                                                 (1, 'Starfall Chronicles', 'manga', 'ongoing'),
                                                 (2, 'The Quiet Orbit',     'anime', 'complete');

INSERT INTO media (kind, title, series_id, number, status, rating, details) VALUES
                                                                                ('manga', 'Starfall Chronicles Vol. 1', 1, 1,   'finished',    8, '{"pages": 192}'),
                                                                                ('manga', 'Starfall Chronicles Vol. 2', 1, 2,   'in-progress', NULL, '{"pages": 200, "percent": 45}'),
                                                                                ('anime', 'The Quiet Orbit',            2, 1,   'finished',    9, '{"studio": "Test Studio", "episodes": 12}'),
                                                                                ('anime', 'The Quiet Orbit: Movie',     2, 1.5, 'want',        NULL, '{"format": "Movie"}'),
                                                                                ('book',  'Letters on Calm',            NULL, NULL, 'want',    NULL, '{"author": "A. Sample"}');