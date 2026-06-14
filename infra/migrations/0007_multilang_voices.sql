-- 0007: multi-language content + voice profiles
--
-- DATA MODEL DECISION:
--   We don't fork courses by language. One course = one (modules + blocks)
--   tree shared across all languages. Translated text + audio live in
--   JSON map columns keyed by ISO 639-1 lang codes. This means:
--     • Operators build structure once, then "AI translate" populates
--       every other language without forking.
--     • Learners pick a language at course entry; render reads the map,
--       falling back to primary_lang then to the legacy text_md column.
--     • Audio is per-(block, lang) — different voices per language allowed.
--
-- The legacy single-lang columns (text_md, caption, audio_r2_key etc.)
-- stay as the source of truth for the course's primary_lang and as a
-- last-resort fallback. New writes go to the *_i18n maps; reads check
-- map first, then primary, then legacy.

-- Languages the course has at least some published content in. JSON array
-- of ISO codes, e.g. ["en","zh-CN","ja"]. UI uses this to render the
-- language picker.
ALTER TABLE courses ADD COLUMN available_langs TEXT NOT NULL DEFAULT '["en"]';

-- JSON object: {"zh-CN": "翻译标题", "ja": "..."} — does NOT include the
-- primary_lang (that lives in the regular title/summary columns).
ALTER TABLE courses ADD COLUMN title_i18n     TEXT NOT NULL DEFAULT '{}';
ALTER TABLE courses ADD COLUMN summary_i18n   TEXT NOT NULL DEFAULT '{}';

ALTER TABLE modules ADD COLUMN title_i18n     TEXT NOT NULL DEFAULT '{}';
ALTER TABLE modules ADD COLUMN summary_i18n   TEXT NOT NULL DEFAULT '{}';

ALTER TABLE content_blocks ADD COLUMN text_md_i18n   TEXT NOT NULL DEFAULT '{}';
ALTER TABLE content_blocks ADD COLUMN caption_i18n   TEXT NOT NULL DEFAULT '{}';

-- audio_i18n: {"zh-CN": {"r2_key": "...", "voice_id": "...", "duration_s": 47,
--                       "generated_at": 1717890123},
--              "ja": {...}}
-- The primary lang still uses audio_r2_key / audio_voice / audio_duration_s /
-- audio_generated_at columns for backwards compatibility with /api/audio.
ALTER TABLE content_blocks ADD COLUMN audio_i18n     TEXT NOT NULL DEFAULT '{}';

-- =========================================================================
-- VOICE PROFILES
-- =========================================================================
-- Each supplier (or platform) can own voices. Three "stock" voices are
-- platform-owned and free to all customers (supplier_id = NULL). Cloned
-- voices are supplier-owned and counted against their ElevenLabs quota.

CREATE TABLE IF NOT EXISTS voice_profiles (
  id              TEXT PRIMARY KEY,                  -- 'voice_xxx'
  supplier_id     TEXT REFERENCES suppliers(id) ON DELETE CASCADE,
  -- NULL = platform-owned stock voice available to everyone
  name            TEXT NOT NULL,                     -- 'James (male, EN-AU)'
  provider        TEXT NOT NULL,                     -- 'elevenlabs' | 'workers_ai_melotts'
  external_id     TEXT,                              -- ElevenLabs voice_id; NULL for melotts (provider implies it)
  kind            TEXT NOT NULL DEFAULT 'stock',     -- 'stock' | 'cloned'
  gender          TEXT,                              -- 'male' | 'female' | 'neutral' (display hint)
  preview_r2_key  TEXT,                              -- 10s sample stored in R2 for the picker
  sample_r2_key   TEXT,                              -- the original upload (clones only); kept for re-cloning
  status          TEXT NOT NULL DEFAULT 'active',    -- 'pending' | 'active' | 'failed'
  status_detail   TEXT,                              -- error message if status='failed'
  created_by      TEXT REFERENCES users(id),
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_voice_supplier ON voice_profiles(supplier_id, status);

-- =========================================================================
-- STOCK VOICES — platform-owned, free to use.
-- Three ElevenLabs preset voices (their built-in ones, no quota cost) +
-- the existing melotts language presets remain reachable as a free fallback.
-- =========================================================================
INSERT OR IGNORE INTO voice_profiles
  (id, supplier_id, name, provider, external_id, kind, gender, status)
VALUES
  ('voice_stock_male',    NULL, 'Adam (stock male)',    'elevenlabs', 'pNInz6obpgDQGcFmaJgB', 'stock', 'male',    'active'),
  ('voice_stock_female',  NULL, 'Bella (stock female)', 'elevenlabs', 'EXAVITQu4vr4xnSDxMaL', 'stock', 'female',  'active'),
  ('voice_stock_neutral', NULL, 'Antoni (stock neutral)','elevenlabs','ErXwobaYiN019PkySvjV', 'stock', 'neutral', 'active'),
  -- Workers AI melotts fallback (free, lower quality, hard-coded language presets)
  ('voice_melotts_auto',  NULL, 'Melotts (auto)', 'workers_ai_melotts', NULL,           'stock', 'neutral', 'active');
