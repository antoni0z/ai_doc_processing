/*
  Strict schema for document‑processing dashboard
  Requires SQLite ≥ 3.45 (JSON, JSONB & STRICT tables)
*/
PRAGMA journal_mode = WAL;
BEGIN;
         -- enforce FK rules
/* 1. Project: logical batch of docs or whatever info */
CREATE TABLE IF NOT EXISTS project (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    alias       TEXT NOT NULL,
    description TEXT,
    owner_id     INTEGER,                                -- placeholder for future FK
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
    stored_tags TEXT DEFAULT ('[]') CHECK (json_valid(stored_tags)),
    updated_at  TEXT,
    created_by  TEXT,
    updated_by  TEXT
) STRICT;

/* 2. Individual document */
CREATE TABLE IF NOT EXISTS doc (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    name               TEXT NOT NULL,
    tags               TEXT  DEFAULT ('[]') CHECK (json_valid(tags)),
    format             TEXT NOT NULL,                           -- jpg, png …
    status             TEXT NOT NULL CHECK (status IN ('unprocessed','in_progress','processed','error')),
    size               INTEGER,                                 -- bytes
    original_file_uri  TEXT,                                    -- path / S3 URI
    original_file      BLOB,                                    -- inline storage (optional)
    desired_values     TEXT  DEFAULT ('[]') CHECK (json_valid(desired_values)),
    results            TEXT DEFAULT ('{}') CHECK (json_valid(results)),
    metadata           TEXT  DEFAULT ('{}') CHECK (json_valid(metadata)),
    project_id       INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    created_at         TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at         TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_project_id ON doc(project_id);
CREATE INDEX IF NOT EXISTS idx_doc_status  ON doc(status);

/* Trigger: auto‑update updated_at */
CREATE TRIGGER IF NOT EXISTS trg_doc_update_timestamp
AFTER UPDATE ON doc
BEGIN
    UPDATE doc SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_project_update_timestamp
AFTER UPDATE ON project
BEGIN
    UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

COMMIT;

/*
Notes
-----
- STRICT tables enforce declared types (incl. JSON/JSONB).
- Key/value pairs extracted by AI are stored inside doc.results (JSONB).
- `user_id` incluido sin FK para facilitar futura migración.
*/
