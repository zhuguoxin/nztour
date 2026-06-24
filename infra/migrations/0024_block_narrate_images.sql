-- =========================================================================
-- 0024 — Per-block narration toggle + multi-image (slides) + drop AI-only
-- =========================================================================
--   1. content_blocks.narrate: per-block "include in voiceover" flag. Default
--      1 (narrated). Narration is built only from blocks where narrate = 1.
--   2. content_blocks.images_json: optional JSON array of R2 keys for an image
--      block that holds multiple images (rendered as a slider). One image =
--      legacy image_r2_key still works; this column carries 2+.
--   3. Drop the "AI-only / assistant_only" visibility concept: every block is
--      now visible to learners. AI-only supplementary content lives in the
--      product-level supporting docs area instead. Flip any existing
--      assistant_only blocks to training so nothing stays hidden.
--
-- Apply remotely with:
--   wrangler d1 execute tourtrain-db --remote \
--     --file infra/migrations/0024_block_narrate_images.sql
-- =========================================================================

ALTER TABLE content_blocks ADD COLUMN narrate INTEGER NOT NULL DEFAULT 1;
ALTER TABLE content_blocks ADD COLUMN images_json TEXT;
UPDATE content_blocks SET visibility = 'training' WHERE visibility = 'assistant_only';

-- 4. modules.regen_at: unix timestamp set when a background "regenerate module"
--    job finishes. The editor polls it to surface a completion toast without
--    blocking the UI while translation + TTS run.
ALTER TABLE modules ADD COLUMN regen_at INTEGER;
