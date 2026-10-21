-- Everything the title, episode and edit pages show. All additions, no rebuilds:
-- rebuilding media or episodes would cascade-delete their episodes, images and links.

-- What you see on a title page. details stays free-form JSON for type-specific facts.
ALTER TABLE media ADD COLUMN subtitle TEXT;
ALTER TABLE media ADD COLUMN original_title TEXT;
ALTER TABLE media ADD COLUMN creator TEXT;
ALTER TABLE media ADD COLUMN release_year INTEGER;
ALTER TABLE media ADD COLUMN end_year INTEGER;
ALTER TABLE media ADD COLUMN format TEXT;
ALTER TABLE media ADD COLUMN age_rating TEXT;
ALTER TABLE media ADD COLUMN synopsis TEXT;
-- Paths under MEDIA_ROOT; provider artwork is downloaded there, never hotlinked.
ALTER TABLE media ADD COLUMN cover TEXT;
ALTER TABLE media ADD COLUMN backdrop TEXT;
ALTER TABLE media ADD COLUMN backdrop_position TEXT;

-- Your progress, counted in progress_unit (episodes, pages, volumes, minutes, percent).
-- For tv, episodes count across every season.
ALTER TABLE media ADD COLUMN progress REAL NOT NULL DEFAULT 0;
ALTER TABLE media ADD COLUMN total REAL;
ALTER TABLE media ADD COLUMN progress_unit TEXT
    CHECK (progress_unit IN ('episodes', 'pages', 'volumes', 'chapters', 'minutes', 'percent'));
ALTER TABLE media ADD COLUMN unit_minutes INTEGER;
ALTER TABLE media ADD COLUMN hours_played REAL;
ALTER TABLE media ADD COLUMN started_on TEXT;
ALTER TABLE media ADD COLUMN last_activity_on TEXT;
ALTER TABLE media ADD COLUMN revisits INTEGER NOT NULL DEFAULT 0;

-- Ratings move from whole numbers to one decimal (8.8 / 10).
ALTER TABLE media ADD COLUMN score REAL CHECK (score BETWEEN 0 AND 10);
UPDATE media SET score = rating;
ALTER TABLE media DROP COLUMN rating;
ALTER TABLE media RENAME COLUMN score TO rating;

-- Episodes: number stays the position across the whole show (unique per media),
-- season and season_number say where it sits for tv.
ALTER TABLE episodes ADD COLUMN season INTEGER;
ALTER TABLE episodes ADD COLUMN season_number REAL;
ALTER TABLE episodes ADD COLUMN minutes INTEGER;
ALTER TABLE episodes ADD COLUMN headline TEXT;
-- Full recap with spoilers; summary stays spoiler-free.
ALTER TABLE episodes ADD COLUMN recap TEXT;
ALTER TABLE episodes ADD COLUMN watched_on TEXT;
ALTER TABLE episodes ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1));
ALTER TABLE episodes ADD COLUMN community_score REAL;
ALTER TABLE episodes ADD COLUMN community_votes INTEGER;
ALTER TABLE episodes ADD COLUMN score REAL CHECK (score BETWEEN 0 AND 10);
UPDATE episodes SET score = rating;
ALTER TABLE episodes DROP COLUMN rating;
ALTER TABLE episodes RENAME COLUMN score TO rating;

CREATE TABLE media_tags (
                            media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                            tag      TEXT NOT NULL,
                            PRIMARY KEY (media_id, tag)
);

-- This title's id on each provider, so metadata and ratings match without guessing by name.
CREATE TABLE media_links (
                             media_id    INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                             provider    TEXT NOT NULL
                                 CHECK (provider IN ('myanimelist', 'anilist', 'mangabaka', 'tmdb', 'igdb')),
                             external_id TEXT NOT NULL,
                             PRIMARY KEY (media_id, provider)
);

-- Cached community scores, refreshed by the server rather than fetched by the browser.
CREATE TABLE provider_ratings (
                                  media_id   INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                                  provider   TEXT NOT NULL
                                      CHECK (provider IN ('myanimelist', 'anilist', 'mangabaka', 'tmdb', 'igdb')),
                                  score      REAL NOT NULL,
                                  scale      INTEGER NOT NULL CHECK (scale IN (10, 100)),
                                  votes      INTEGER NOT NULL DEFAULT 0,
                                  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
                                  PRIMARY KEY (media_id, provider)
);

-- Game milestones, kept in order.
CREATE TABLE media_milestones (
                                  media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                                  position INTEGER NOT NULL,
                                  label    TEXT NOT NULL,
                                  done     INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
                                  PRIMARY KEY (media_id, position)
);

-- Private notes on a title, optionally tied to one episode.
CREATE TABLE journal_entries (
                                 id         INTEGER PRIMARY KEY,
                                 media_id   INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
                                 episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
                                 quote      TEXT NOT NULL,
                                 reflection TEXT,
                                 written_on TEXT NOT NULL DEFAULT (date('now')),
                                 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_journal_media ON journal_entries(media_id);
