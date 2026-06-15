-- 0020: make Products (operators) a manageable entity with a profile, mirroring
-- the supplier profile (0018). Until now operators only had name/display_name/
-- country/nzbn/category/region/contact_email and theme/cover columns — no
-- description, website, phone, address, or point-of-contact, so "product detail
-- management" had nothing to edit.

ALTER TABLE operators ADD COLUMN intro        TEXT;            -- product description / blurb
ALTER TABLE operators ADD COLUMN website      TEXT;
ALTER TABLE operators ADD COLUMN phone        TEXT;
ALTER TABLE operators ADD COLUMN address      TEXT;
ALTER TABLE operators ADD COLUMN timezone     TEXT;
ALTER TABLE operators ADD COLUMN links_json   TEXT NOT NULL DEFAULT '[]';  -- social/booking [{label,url}]
ALTER TABLE operators ADD COLUMN poc_name     TEXT;
ALTER TABLE operators ADD COLUMN poc_title    TEXT;
ALTER TABLE operators ADD COLUMN poc_email    TEXT;
ALTER TABLE operators ADD COLUMN poc_phone    TEXT;
