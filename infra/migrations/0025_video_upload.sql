-- =========================================================================
-- 0025 — Video blocks: support uploaded files alongside YouTube links
-- =========================================================================
--   content_blocks.video_r2_key: R2 key of an uploaded video file. A video
--   block now has two independent sources:
--     - video_uid       → a YouTube share link (parsed to an embed at render)
--     - video_r2_key     → an uploaded file streamed from R2 via /api/video
--   The uploaded file takes priority when both are set. The old Cloudflare
--   Stream path (32-hex UID in video_uid) is retired.
--
-- Apply remotely with:
--   wrangler d1 execute tourtrain-db --remote \
--     --file infra/migrations/0025_video_upload.sql
-- =========================================================================

ALTER TABLE content_blocks ADD COLUMN video_r2_key TEXT;
