-- =========================================================================
-- 0023 — Course-level quiz (final exam) + product-level supporting docs
-- =========================================================================
-- Two model changes, both additive-by-recreate (SQLite can't drop a NOT NULL
-- or add a NOT NULL column with backfill in one ALTER, so we rebuild each
-- table, copy rows, and swap). These are leaf tables — nothing FK-references
-- them — so DROP is safe.
--
--   1. Quizzes move from PER-MODULE to PER-COURSE: a single final exam taken
--      after all chapters. We add a NOT NULL course_id, keep module_id as a
--      nullable historical column (ON DELETE SET NULL), and renumber position
--      per course. New questions/attempts carry course_id; module_id = NULL.
--
--   2. Supporting docs move from PER-COURSE to PER-PRODUCT (operator): one
--      shared doc set per product, feeding RAG across all its courses. We add
--      a NOT NULL operator_id, keep course_id nullable for history.
--
-- Apply remotely with:
--   wrangler d1 execute tourtrain-db --remote \
--     --file infra/migrations/0023_course_quiz_product_docs.sql
-- (we use execute --file, not `migrations apply`, because the tracking table
--  is empty and apply would re-run every prior migration.)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1a. quiz_questions → course-scoped
-- -------------------------------------------------------------------------
CREATE TABLE quiz_questions_new (
  id            TEXT PRIMARY KEY,
  course_id     TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id     TEXT REFERENCES modules(id) ON DELETE SET NULL,  -- historical only
  prompt        TEXT NOT NULL,
  choices_json  TEXT NOT NULL,
  correct_idx   INTEGER NOT NULL,
  explanation   TEXT,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT INTO quiz_questions_new
  (id, course_id, module_id, prompt, choices_json, correct_idx, explanation, position, created_at)
SELECT q.id, m.course_id, q.module_id, q.prompt, q.choices_json,
       q.correct_idx, q.explanation, q.position, q.created_at
FROM quiz_questions q
JOIN modules m ON m.id = q.module_id;
DROP TABLE quiz_questions;
ALTER TABLE quiz_questions_new RENAME TO quiz_questions;
CREATE INDEX idx_quiz_questions_course ON quiz_questions(course_id, position);

-- Renumber position to a stable 0-based sequence per course (old positions
-- were per-module and now collide). Order by created_at, then id.
UPDATE quiz_questions SET position = (
  SELECT COUNT(*) FROM quiz_questions q2
  WHERE q2.course_id = quiz_questions.course_id
    AND (q2.created_at < quiz_questions.created_at
         OR (q2.created_at = quiz_questions.created_at AND q2.id < quiz_questions.id))
);

-- -------------------------------------------------------------------------
-- 1b. quiz_attempts → course-scoped. Old per-module attempt history is NOT
--     carried over: those are per-chapter quiz logs under the old model and
--     would otherwise count as "passed the final exam" for in-flight
--     learners. The new exam is a fresh concept, so we start clean.
-- -------------------------------------------------------------------------
CREATE TABLE quiz_attempts_new (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id     TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id     TEXT REFERENCES modules(id) ON DELETE SET NULL,  -- historical only
  question_ids  TEXT NOT NULL,
  answers_json  TEXT NOT NULL,
  score         INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  passed        INTEGER NOT NULL,
  taken_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
DROP TABLE quiz_attempts;
ALTER TABLE quiz_attempts_new RENAME TO quiz_attempts;
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id, course_id, taken_at DESC);

-- -------------------------------------------------------------------------
-- 2. course_attachments → product (operator) scoped
-- -------------------------------------------------------------------------
CREATE TABLE course_attachments_new (
  id              TEXT PRIMARY KEY,
  operator_id     TEXT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  course_id       TEXT REFERENCES courses(id) ON DELETE SET NULL,  -- historical only
  filename        TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  r2_key          TEXT NOT NULL,
  uploaded_by     TEXT REFERENCES users(id),
  rag_status      TEXT NOT NULL DEFAULT 'pending',
  rag_error       TEXT,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT INTO course_attachments_new
  (id, operator_id, course_id, filename, mime_type, size_bytes, r2_key, uploaded_by, rag_status, rag_error, created_at)
SELECT a.id, c.operator_id, a.course_id, a.filename, a.mime_type, a.size_bytes,
       a.r2_key, a.uploaded_by, a.rag_status, a.rag_error, a.created_at
FROM course_attachments a
JOIN courses c ON c.id = a.course_id;
DROP TABLE course_attachments;
ALTER TABLE course_attachments_new RENAME TO course_attachments;
CREATE INDEX idx_attachments_operator ON course_attachments(operator_id, created_at DESC);
