-- Sphynx launch list. One row per address; email is the unique key (case-insensitive).
CREATE TABLE IF NOT EXISTS subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL COLLATE NOCASE UNIQUE,
  created_at  TEXT NOT NULL,
  country     TEXT,
  referer     TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscribers_created ON subscribers (created_at);
