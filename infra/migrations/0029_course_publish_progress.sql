-- Publish progress counters: total work units (languages × modules) and how many
-- have completed, so the editor can show a real progress bar while the
-- background narration/translation job runs, and pop a "done" toast on finish.
ALTER TABLE courses ADD COLUMN publish_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN publish_done INTEGER NOT NULL DEFAULT 0;
