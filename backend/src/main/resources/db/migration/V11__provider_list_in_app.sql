-- The list of sources now lives in the app (MediaService.PROVIDERS), so adding a source no longer
-- needs a table rebuild. Last rebuild: same tables without the provider CHECK. Nothing references them.
CREATE TABLE media_links_new (
                                 media_id    INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                                 provider    TEXT NOT NULL,
                                 external_id TEXT NOT NULL,
                                 PRIMARY KEY (media_id, provider)
);
INSERT INTO media_links_new (media_id, provider, external_id) SELECT media_id, provider, external_id FROM media_links;
DROP TABLE media_links;
ALTER TABLE media_links_new RENAME TO media_links;
CREATE INDEX idx_media_links_external ON media_links(provider, external_id);

CREATE TABLE provider_ratings_new (
                                      media_id   INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                                      provider   TEXT NOT NULL,
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
