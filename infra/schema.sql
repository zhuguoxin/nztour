-- TourTrain — D1 schema v0.1
-- SQLite dialect. Apply with: wrangler d1 execute tourtrain-db --file=infra/schema.sql

PRAGMA foreign_keys = ON;

-- =========================================================
-- TENANTS / IDENTITY
-- =========================================================

-- Operators (sellers). Each is a tenant; their courses are isolated.
CREATE TABLE IF NOT EXISTS operators (
  id              TEXT PRIMARY KEY,                -- 'op_nzski'
  slug            TEXT NOT NULL UNIQUE,            -- 'nzski'
  name            TEXT NOT NULL,                   -- 'NZSki'
  display_name    TEXT,                            -- 'NZSki — Queenstown / Methven'
  country         TEXT NOT NULL DEFAULT 'NZ',
  nzbn            TEXT,                            -- NZ Business Number (verification)
  primary_lang    TEXT NOT NULL DEFAULT 'en',      -- ISO 639-1
  status          TEXT NOT NULL DEFAULT 'active',  -- 'pending' | 'active' | 'suspended'
  cover_color     TEXT,                            -- hex / gradient seed
  logo_r2_key     TEXT,
  contact_email   TEXT,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Users (learners AND operator admins; role per membership).
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,                -- mirrors Clerk user id
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  preferred_lang  TEXT NOT NULL DEFAULT 'en',
  agency_name     TEXT,                            -- optional; for learners
  agency_country  TEXT,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Operator memberships (who can admin which operator).
CREATE TABLE IF NOT EXISTS operator_memberships (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_id   TEXT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'admin',     -- 'admin' | 'editor'
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, operator_id)
);

-- Platform super-admins (we three).
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- =========================================================
-- CONTENT
-- =========================================================

CREATE TABLE IF NOT EXISTS courses (
  id              TEXT PRIMARY KEY,                -- 'c_coronet_peak_2026'
  operator_id     TEXT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  summary         TEXT,
  cover_color     TEXT,
  emoji           TEXT,                            -- demo cover until real images
  cover_r2_key    TEXT,
  primary_lang    TEXT NOT NULL DEFAULT 'en',
  status          TEXT NOT NULL DEFAULT 'draft',   -- 'draft' | 'published'
  est_minutes     INTEGER,
  position        INTEGER NOT NULL DEFAULT 0,
  ai_examples_json TEXT,                            -- JSON-encoded string[] of suggested prompts
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (operator_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_courses_operator ON courses(operator_id, status);

CREATE TABLE IF NOT EXISTS modules (
  id              TEXT PRIMARY KEY,                -- 'm_lessons_coaching'
  course_id       TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  summary         TEXT,
  est_minutes     INTEGER,
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (course_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, position);

-- Content blocks: smallest unit. Order = position. Type discriminates payload.
CREATE TABLE IF NOT EXISTS content_blocks (
  id            TEXT PRIMARY KEY,
  module_id     TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL DEFAULT 0,
  kind          TEXT NOT NULL,                     -- 'text' | 'image' | 'video' | 'pdf' | 'callout'
  -- Polymorphic fields:
  text_md       TEXT,                              -- markdown
  image_r2_key  TEXT,
  video_uid     TEXT,                              -- Cloudflare Stream UID
  pdf_r2_key    TEXT,
  caption       TEXT,
  lang          TEXT NOT NULL DEFAULT 'en',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_blocks_module ON content_blocks(module_id, position);

-- Source files an operator uploaded. Course content is derived from these.
CREATE TABLE IF NOT EXISTS source_files (
  id            TEXT PRIMARY KEY,
  operator_id   TEXT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  course_id     TEXT REFERENCES courses(id) ON DELETE SET NULL,
  filename      TEXT NOT NULL,
  r2_key        TEXT NOT NULL,
  mime          TEXT NOT NULL,
  bytes         INTEGER NOT NULL,
  parse_status  TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'parsing' | 'done' | 'failed' | 'stubbed'
  parse_notes   TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_source_operator ON source_files(operator_id, parse_status);

-- =========================================================
-- LEARNING
-- =========================================================

CREATE TABLE IF NOT EXISTS enrollments (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  started_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  completed_at INTEGER,
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS module_progress (
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id      TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  dwell_seconds  INTEGER NOT NULL DEFAULT 0,
  completed_at   INTEGER,
  PRIMARY KEY (user_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_module_progress_user ON module_progress(user_id);

-- =========================================================
-- BADGES
-- =========================================================

CREATE TABLE IF NOT EXISTS badges (
  id             TEXT PRIMARY KEY,                 -- 'b_<verify_code>'; verify_code is short ULID
  verify_code    TEXT NOT NULL UNIQUE,             -- shown on public URL /verify/<code>
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id      TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  operator_id    TEXT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  awarded_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  png_r2_key     TEXT
);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_operator ON badges(operator_id);

-- =========================================================
-- AI Q&A
-- =========================================================

-- Chunks fed into Vectorize. We mirror metadata here for joins/audit.
CREATE TABLE IF NOT EXISTS rag_chunks (
  id              TEXT PRIMARY KEY,                -- also used as Vectorize id
  operator_id     TEXT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  course_id       TEXT REFERENCES courses(id) ON DELETE SET NULL,
  module_id       TEXT REFERENCES modules(id) ON DELETE SET NULL,
  source_file_id  TEXT REFERENCES source_files(id) ON DELETE SET NULL,
  lang            TEXT NOT NULL DEFAULT 'en',
  text            TEXT NOT NULL,                   -- the chunk text (for display in citations)
  token_count     INTEGER,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_rag_operator ON rag_chunks(operator_id);

-- Q&A logs: drives the operator-side "top questions" insight panel.
CREATE TABLE IF NOT EXISTS qa_logs (
  id              TEXT PRIMARY KEY,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  course_id       TEXT REFERENCES courses(id) ON DELETE SET NULL,
  operator_id     TEXT REFERENCES operators(id) ON DELETE SET NULL,
  question        TEXT NOT NULL,
  question_lang   TEXT,
  answer          TEXT NOT NULL,
  answer_lang     TEXT,
  source_kind     TEXT NOT NULL,                   -- 'rag' | 'web' | 'mixed' | 'no_answer'
  citations_json  TEXT,                            -- JSON: [{chunk_id|url, snippet}]
  helpful         INTEGER,                         -- -1, 0, +1
  latency_ms      INTEGER,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_qa_operator_time ON qa_logs(operator_id, created_at);
CREATE INDEX IF NOT EXISTS idx_qa_user_time     ON qa_logs(user_id, created_at);

-- =========================================================
-- i18n CACHE
-- =========================================================

-- Generic translation cache. owner_kind = 'block' | 'course' | 'module' | 'chunk' | 'string'.
CREATE TABLE IF NOT EXISTS translations (
  owner_kind   TEXT NOT NULL,
  owner_id     TEXT NOT NULL,
  lang         TEXT NOT NULL,
  field        TEXT NOT NULL,                      -- e.g. 'title', 'summary', 'text_md'
  text         TEXT NOT NULL,
  model        TEXT,                               -- 'claude-haiku-4.5' etc
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (owner_kind, owner_id, lang, field)
);
