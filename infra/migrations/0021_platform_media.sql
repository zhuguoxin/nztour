-- 0021: platform-owned public asset library.
--
-- media_assets is supplier-scoped (every row belongs to a supplier). This adds
-- a separate pool of PLATFORM assets that belong to no supplier and can be
-- picked by ANY supplier/product (shared stock imagery managed by admins).
-- Stored in R2 under media/platform/<id>.<ext>; entities still store the chosen
-- asset's R2 key in their existing column, so the serve routes are unchanged.

CREATE TABLE IF NOT EXISTS platform_media (
  id          TEXT PRIMARY KEY,                  -- 'pmedia_<rand>'
  r2_key      TEXT NOT NULL,                     -- 'media/platform/<id>.<ext>'
  filename    TEXT,
  mime        TEXT NOT NULL,
  size_bytes  INTEGER,
  created_by  TEXT REFERENCES users(id),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_platform_media_created ON platform_media(created_at DESC);
