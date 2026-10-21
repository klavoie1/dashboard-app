-- Characters: a native name, favorites, fields locked from fetching, and where they came from.
ALTER TABLE characters ADD COLUMN native_name TEXT;
ALTER TABLE characters ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1));
ALTER TABLE characters ADD COLUMN locked_fields TEXT;

-- A character's part in one title: main or supporting, who voices or plays them, and cast order.
ALTER TABLE character_media ADD COLUMN role TEXT;
ALTER TABLE character_media ADD COLUMN actor TEXT;
ALTER TABLE character_media ADD COLUMN actor_language TEXT;
ALTER TABLE character_media ADD COLUMN position INTEGER;

CREATE TABLE character_links (
                                 character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
                                 provider     TEXT NOT NULL,
                                 external_id  TEXT NOT NULL,
                                 PRIMARY KEY (character_id, provider)
);
CREATE INDEX idx_character_links_external ON character_links(provider, external_id);

-- Episodes can lock fields from fetching too.
ALTER TABLE episodes ADD COLUMN locked_fields TEXT;

-- Two new sources, TVmaze and Open Library. SQLite can't change a CHECK in place, and nothing
-- references these tables, so they're rebuilt with the wider list.
CREATE TABLE media_links_new (
                                 media_id    INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                                 provider    TEXT NOT NULL
                                     CHECK (provider IN ('myanimelist', 'anilist', 'mangabaka', 'tmdb', 'igdb', 'tvmaze', 'openlibrary')),
                                 external_id TEXT NOT NULL,
                                 PRIMARY KEY (media_id, provider)
);
INSERT INTO media_links_new (media_id, provider, external_id) SELECT media_id, provider, external_id FROM media_links;
DROP TABLE media_links;
ALTER TABLE media_links_new RENAME TO media_links;
CREATE INDEX idx_media_links_external ON media_links(provider, external_id);

CREATE TABLE provider_ratings_new (
                                      media_id   INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                                      provider   TEXT NOT NULL
                                          CHECK (provider IN ('myanimelist', 'anilist', 'mangabaka', 'tmdb', 'igdb', 'tvmaze', 'openlibrary')),
                                      score      REAL NOT NULL,
                                      scale      INTEGER NOT NULL CHECK (scale IN (10, 100)),
                                      votes      INTEGER NOT NULL DEFAULT 0,
                                      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
                                      PRIMARY KEY (media_id, provider)
);
INSERT INTO provider_ratings_new (media_id, provider, score, scale, votes, fetched_at)
SELECT media_id, provider, score, scale, votes, fetched_at FROM provider_ratings;
DROP TABLE provider_ratings;
ALTER TABLE provider_ratings_new RENAME TO provider_ratings;
