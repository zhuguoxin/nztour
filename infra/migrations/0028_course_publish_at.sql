-- =========================================================================
-- 0028 — courses.publish_at
-- =========================================================================
-- Timestamp stamped when a background "publish" job finishes (translate +
-- narrate every selected language × module, then go live). The editor polls
-- it to show a completion toast without blocking while TTS runs.
--
-- Apply remotely with:
--   wrangler d1 execute tourtrain-db --remote \
--     --file infra/migrations/0028_course_publish_at.sql
-- =========================================================================

ALTER TABLE courses ADD COLUMN publish_at INTEGER;
