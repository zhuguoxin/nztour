-- 0006: editor upgrade — block visibility, duration estimates,
--       course versioning, supplementary materials.
--
-- Per the Phase-2 PRD:
--   • Blocks can be marked "assistant_only" — fed to RAG, hidden from learner UI.
--   • Per-block duration estimate so the editor can show "current 14:32 /
--     recommended ≤ 20:00" without re-computing on every render.
--   • Course version number lets us flag "updated" to enrolled learners
--     who last_seen an older version.
--   • course_attachments — supplementary materials (PDFs etc.) uploaded
--     OUT of the module tree; always RAG-only, never rendered in /learn.

ALTER TABLE content_blocks ADD COLUMN visibility TEXT NOT NULL DEFAULT 'training';
  -- 'training'        — shown in /learn AND fed to RAG  (default)
  -- 'assistant_only'  — hidden from /learn, fed to RAG only
CREATE INDEX IF NOT EXISTS idx_blocks_module_visibility
  ON content_blocks(module_id, visibility, position);

ALTER TABLE content_blocks ADD COLUMN duration_s INTEGER;
  -- Editor-side estimate, used to roll up course total. NULL = "not estimated".
  -- For audio blocks this is normally a copy of audio_duration_s.

ALTER TABLE courses ADD COLUMN published_version INTEGER NOT NULL DEFAULT 1;
  -- Bumped each time the operator hits "Publish". Learners whose last enrollment
  -- snapshot < published_version see an "updated" chip on the course.

CREATE TABLE IF NOT EXISTS course_attachments (
  id              TEXT PRIMARY KEY,                  -- 'att_xxx'
  course_id       TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  filename        TEXT NOT NULL,                     -- original upload name
  mime_type       TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  r2_key          TEXT NOT NULL,                     -- 'attachments/<course>/<id>'
  uploaded_by     TEXT REFERENCES users(id),
  -- Ingestion state for the RAG pipeline. Editor shows the badge.
  rag_status      TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'ready' | 'failed'
  rag_error       TEXT,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_attachments_course ON course_attachments(course_id, created_at DESC);
