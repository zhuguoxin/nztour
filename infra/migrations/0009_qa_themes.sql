-- 0009: Q&A theme categorization.
--
-- Per the partner PRD's reporting flow:
--   "客户可以查看所有 ai 问答的内容。内容需要分类归纳。并且需要的情况下，
--    可以看到是哪个用户问的问题。"
--
-- We don't want to ask Claude to categorize every question on the read
-- path — too slow, too expensive. Instead, themes are materialized:
--   1. Operator clicks "Refresh themes" on the Q&A page (or a cron runs
--      nightly — same code path).
--   2. We pull every uncategorized qa_log row in the window, send the
--      question list to Claude, and ask it to either fit each question
--      into an EXISTING theme (operator's existing themes are passed in)
--      or propose a new one.
--   3. theme_id is written back per row. New themes are inserted into
--      qa_themes.
--
-- One question = one theme. Themes are operator-scoped (different operators
-- get different theme labels even for similar question patterns — keeps
-- their dashboard clean and on-brand).

CREATE TABLE IF NOT EXISTS qa_themes (
  id              TEXT PRIMARY KEY,                       -- 'thm_xxx'
  operator_id     TEXT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,                          -- e.g. "Refund policy"
  description     TEXT,                                   -- one-sentence summary for the operator
  question_count  INTEGER NOT NULL DEFAULT 0,             -- denormalized; updated when categorization runs
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_qa_themes_operator
  ON qa_themes(operator_id, question_count DESC);

-- Per-question theme assignment. NULL = uncategorized (not yet processed).
ALTER TABLE qa_logs ADD COLUMN theme_id TEXT REFERENCES qa_themes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_qa_logs_theme ON qa_logs(theme_id, created_at DESC);
