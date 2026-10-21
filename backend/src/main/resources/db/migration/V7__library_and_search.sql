-- When a title was finished, for yearly goals. Existing finished titles use their last activity.
ALTER TABLE media ADD COLUMN finished_on TEXT;
UPDATE media SET finished_on = last_activity_on WHERE status = 'finished';

-- Search results check whether a provider title is already in the library.
CREATE INDEX idx_media_links_external ON media_links(provider, external_id);

-- Upcoming episodes for the dashboard calendar.
CREATE INDEX idx_episodes_air_date ON episodes(air_date);
