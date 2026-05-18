-- 0002: per-course AI assistant configuration.
-- The course-detail AI sidebar (and a future per-course /ask page) reads
-- this column to seed example questions specific to the course. Stored as
-- JSON-encoded string[] for forward-compat with future ai_* settings.

ALTER TABLE courses ADD COLUMN ai_examples_json TEXT;
