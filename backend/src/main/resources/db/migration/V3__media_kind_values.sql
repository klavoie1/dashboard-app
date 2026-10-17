CREATE TABLE media_new (
                           id        INTEGER PRIMARY KEY,
                           kind      TEXT NOT NULL
                                CHECK (kind in ('manga', 'anime', 'tv', 'movie', 'book', 'light-novel', 'game', 'audiobook')),
                           title     TEXT NOT NULL,
                           series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
                           number    REAL,
                           status    TEXT NOT NULL DEFAULT 'want'
                               CHECK (status IN ('want', 'in-progress', 'finished', 'paused', 'dropped')),
                           rating    INTEGER,
                           details   TEXT
);
INSERT INTO media_new (id, kind, title, series_id, number, status, rating, details)
SELECT id,kind, title, series_id, number,
       CASE WHEN status IN ('want', 'in-progress', 'finished', 'paused', 'dropped') THEN status ELSE 'want' END,
       rating, details
FROM media;
DROP TABLE media;
ALTER TABLE media_new RENAME TO media;