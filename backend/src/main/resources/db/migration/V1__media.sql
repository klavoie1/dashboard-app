CREATE TABLE series (
                        id     INTEGER PRIMARY KEY,
                        title  TEXT NOT NULL,
                        kind   TEXT NOT NULL,
                        status TEXT
);
CREATE TABLE media (
                       id        INTEGER PRIMARY KEY,
                       kind      TEXT NOT NULL,
                       title     TEXT NOT NULL,
                       series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
                       number    REAL,
                       status    TEXT NOT NULL DEFAULT 'to read',
                       rating    INTEGER,
                       details   TEXT
);
