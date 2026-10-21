-- Galleries: an image belongs to a title, one of its episodes, or a character.
ALTER TABLE images ADD COLUMN character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE;
CREATE INDEX idx_images_media ON images(media_id);
CREATE INDEX idx_images_episode ON images(episode_id);
CREATE INDEX idx_images_character ON images(character_id);

-- Your own written reviews. A title can have several, e.g. one per re-read.
CREATE TABLE reviews (
                         id         INTEGER PRIMARY KEY,
                         media_id   INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                         headline   TEXT,
                         body       TEXT NOT NULL,
                         rating     REAL CHECK (rating BETWEEN 1 AND 10),
                         spoilers   INTEGER NOT NULL DEFAULT 0 CHECK (spoilers IN (0, 1)),
                         written_on TEXT NOT NULL DEFAULT (date('now')),
                         updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reviews_media ON reviews(media_id);
