-- 0003: voice-over (TTS) audio attached to text/callout blocks.
-- audio_r2_key   — R2 object key under tourtrain-assets/audio/<id>.mp3
-- audio_voice    — OpenAI voice id (alloy / echo / fable / onyx / nova / shimmer)
-- audio_lang     — auto-detected by OpenAI TTS; we store it for analytics
-- audio_duration_s — seconds, for player UI
-- audio_generated_at — unix ts, for cache-busting & "regenerate" UX
ALTER TABLE content_blocks ADD COLUMN audio_r2_key TEXT;
ALTER TABLE content_blocks ADD COLUMN audio_voice TEXT;
ALTER TABLE content_blocks ADD COLUMN audio_lang TEXT;
ALTER TABLE content_blocks ADD COLUMN audio_duration_s INTEGER;
ALTER TABLE content_blocks ADD COLUMN audio_generated_at INTEGER;
