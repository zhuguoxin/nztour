-- 0019: supplier-level media library.
--
-- Suppliers get a shared image library. Cover images (supplier, product,
-- course) and courseware image blocks are PICKED from this library; uploading
-- a new image adds it to the library and selects it. Library is supplier-scoped
-- so all of a supplier's products can reuse the same assets.
--
-- Entities keep storing the chosen image's R2 key in their existing column
-- (suppliers.cover_r2_key, operators.cover_r2_key, courses.cover_r2_key,
-- content_blocks.image_r2_key) — the library is the source of truth for "what
-- images exist", the columns are "which one is selected". The serve routes read
-- those columns directly, so any media/ key just works.

CREATE TABLE IF NOT EXISTS media_assets (
  id           TEXT PRIMARY KEY,                       -- 'media_<rand>'
  supplier_id  TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  r2_key       TEXT NOT NULL,                          -- 'media/<supplier_id>/<media_id>.<ext>'
  filename     TEXT,                                   -- original upload name
  mime         TEXT NOT NULL,
  size_bytes   INTEGER,
  source       TEXT NOT NULL DEFAULT 'upload',         -- 'upload' | 'pexels'
  credit_json  TEXT,                                   -- attribution for non-owned (pexels) images
  created_by   TEXT REFERENCES users(id),
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_media_supplier ON media_assets(supplier_id, created_at DESC);

-- Product (operator) cover image — picked from the library; takes precedence
-- over the hotlinked Pexels cover_image_url and the cover_color gradient.
ALTER TABLE operators ADD COLUMN cover_r2_key TEXT;
