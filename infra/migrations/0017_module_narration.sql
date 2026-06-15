-- 0017: module-level voice-over (narration).
--
-- Voice-over moves from per-text-block to per-MODULE: each module has one
-- narration script (which the editor can seed by importing the module's text
-- blocks), and one generated audio per language. The script is authored in the
-- course's primary language and auto-translated for other languages (and the
-- supplier glossary is applied), matching the course-translation flow.
--
-- narration_md_i18n    — JSON {lang: "script text"}
-- narration_audio_i18n — JSON {lang: {r2_key, voice_id, duration_s, generated_at}}

ALTER TABLE modules ADD COLUMN narration_md_i18n    TEXT NOT NULL DEFAULT '{}';
ALTER TABLE modules ADD COLUMN narration_audio_i18n TEXT NOT NULL DEFAULT '{}';
