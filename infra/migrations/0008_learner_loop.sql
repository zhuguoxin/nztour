-- 0008: learner experience loop — favorites, version tracking, quizzes, feedback.
--
-- Per the partner PRD's user-side flow:
--   2. Users can view completed / in-progress / favorited products + see
--      "updated" alerts.
--   3. Users can leave training and return; on return they restart from
--      the CURRENT chapter (no skip-ahead).
--   4. AI Q&A box keeps prompting for feedback (rating + free text).
--   5. Random quiz at the end of each chapter must pass before unlocking
--      the next chapter.
--   6. Badge issued on full course completion (existing — no change).
--
-- All new state is per-user. No course content is mutated by these
-- additions; the existing publish/draft flow is unchanged.

-- =========================================================================
-- FAVORITES
-- =========================================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id, created_at DESC);

-- =========================================================================
-- "Updated since you last saw it" tracking.
-- enrollments.last_seen_version mirrors courses.published_version as of the
-- learner's last visit. When < courses.published_version we show an
-- "Updated" chip on the course card and inside the reader.
-- =========================================================================
ALTER TABLE enrollments ADD COLUMN last_seen_version INTEGER NOT NULL DEFAULT 1;

-- =========================================================================
-- QUIZ — end-of-chapter (module) gating.
-- Operators author a pool of questions per module; the learner UI picks
-- N at random per attempt. Required score is hard-coded in app (2/3) so
-- operators don't manage a separate setting yet.
-- =========================================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id            TEXT PRIMARY KEY,                       -- 'q_xxx'
  module_id     TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  prompt        TEXT NOT NULL,                          -- the question
  -- Multi-choice. JSON array of strings. Index of the correct one in correct_idx.
  choices_json  TEXT NOT NULL,                          -- e.g. '["Coronet Peak","Mt Hutt","The Remarkables"]'
  correct_idx   INTEGER NOT NULL,                       -- 0-based index into choices_json
  explanation   TEXT,                                   -- shown after answering, optional
  position      INTEGER NOT NULL DEFAULT 0,             -- editor ordering; quiz still picks random subset
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_module ON quiz_questions(module_id, position);

-- Each attempt is a single quiz session. We log it so the operator can see
-- pass-rate / difficulty metrics later.
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id            TEXT PRIMARY KEY,                       -- 'qa_xxx'
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id     TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  question_ids  TEXT NOT NULL,                          -- JSON array of q ids picked for this attempt
  answers_json  TEXT NOT NULL,                          -- JSON array of chosen indices (same order)
  score         INTEGER NOT NULL,                       -- count correct (0..N)
  total         INTEGER NOT NULL,                       -- N
  passed        INTEGER NOT NULL,                       -- 0/1
  taken_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, module_id, taken_at DESC);

-- =========================================================================
-- LEARNER FEEDBACK on a course (1-5 star + optional free text).
-- Operators see this on their dashboard later as the "satisfaction score".
-- =========================================================================
CREATE TABLE IF NOT EXISTS course_feedback (
  id            TEXT PRIMARY KEY,                       -- 'fb_xxx'
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id     TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id     TEXT REFERENCES modules(id),            -- NULL = course-level feedback
  rating        INTEGER NOT NULL,                       -- 1..5
  text          TEXT,                                   -- optional free text
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_feedback_course ON course_feedback(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user   ON course_feedback(user_id, created_at DESC);
