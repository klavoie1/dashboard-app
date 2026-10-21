-- Settings changed from the app, e.g. provider API keys.
-- Values set here win over the matching environment variable.
CREATE TABLE settings (
                          key        TEXT PRIMARY KEY,
                          value      TEXT NOT NULL,
                          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
