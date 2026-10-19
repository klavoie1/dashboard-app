-- A franchise groups every format of one story (manga, anime, light novel...).
-- Each series row stays one format; media rows are its volumes/seasons/films.
CREATE TABLE franchise (
                           id        INTEGER PRIMARY KEY,
                           title     TEXT NOT NULL,
                           alt_title TEXT,
                           notes     TEXT
);

ALTER TABLE series ADD COLUMN franchise_id INTEGER REFERENCES franchise(id) ON DELETE SET NULL;

-- Episodes of an anime or tv season (a media row).
CREATE TABLE episodes (
                          id       INTEGER PRIMARY KEY,
                          media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                          number   REAL NOT NULL,
                          title    TEXT,
                          air_date TEXT,
                          views    INTEGER NOT NULL DEFAULT 0,
                          rating   INTEGER CHECK (rating BETWEEN 1 AND 10),
                          summary  TEXT,
                          notes    TEXT,
                          UNIQUE (media_id, number)
);

CREATE TABLE characters (
                            id       INTEGER PRIMARY KEY,
                            name     TEXT NOT NULL,
                            role     TEXT,
                            portrait TEXT,
                            about    TEXT,
                            details  TEXT
);

-- A character can belong to more than one franchise (crossovers).
CREATE TABLE character_franchise (
                                     character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
                                     franchise_id INTEGER NOT NULL REFERENCES franchise(id) ON DELETE CASCADE,
                                     PRIMARY KEY (character_id, franchise_id)
);

-- Where a character appears (a volume, a season, a film).
CREATE TABLE character_media (
                                 character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
                                 media_id     INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                                 PRIMARY KEY (character_id, media_id)
);

-- Screenshots and pictures. path is relative to MEDIA_ROOT.
CREATE TABLE images (
                        id         INTEGER PRIMARY KEY,
                        path       TEXT NOT NULL,
                        caption    TEXT,
                        media_id   INTEGER REFERENCES media(id) ON DELETE CASCADE,
                        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
                        created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE image_characters (
                                  image_id     INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
                                  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
                                  PRIMARY KEY (image_id, character_id)
);

CREATE INDEX idx_series_franchise ON series(franchise_id);
CREATE INDEX idx_media_series ON media(series_id);
CREATE INDEX idx_episodes_media ON episodes(media_id);
CREATE INDEX idx_character_media_media ON character_media(media_id);
