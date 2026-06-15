-- 0018: make Suppliers a manageable entity (was MVP-seed-only).
--
-- Adds a cover image plus contact / point-of-contact / business fields so a
-- supplier can be edited from the supplier panel (/supplier/<slug>), mirroring
-- how products and courses are already editable.
--
-- Existing columns kept: name, legal_name, country, hq_city, website, intro,
-- logo_r2_key, theme_*, plan_tier, status, contact_email.

ALTER TABLE suppliers ADD COLUMN cover_r2_key   TEXT;            -- hero/cover image (covers/supplier-<id>.<ext>)
ALTER TABLE suppliers ADD COLUMN phone          TEXT;            -- company phone
ALTER TABLE suppliers ADD COLUMN address        TEXT;            -- physical address
ALTER TABLE suppliers ADD COLUMN billing_email  TEXT;            -- billing contact (separate from contact_email)
ALTER TABLE suppliers ADD COLUMN links_json     TEXT NOT NULL DEFAULT '[]';  -- social/booking links [{label,url}]
ALTER TABLE suppliers ADD COLUMN default_lang   TEXT;            -- BCP-47; prefills new course primary lang
ALTER TABLE suppliers ADD COLUMN timezone       TEXT;            -- e.g. 'Pacific/Auckland'
-- Primary point of contact (a person).
ALTER TABLE suppliers ADD COLUMN poc_name       TEXT;
ALTER TABLE suppliers ADD COLUMN poc_title      TEXT;
ALTER TABLE suppliers ADD COLUMN poc_email      TEXT;
ALTER TABLE suppliers ADD COLUMN poc_phone      TEXT;
