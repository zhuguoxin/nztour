-- 0014: real cover images for products (operators).
--
-- Until now product cards used a cover_color gradient + an emoji. We now store
-- a real photo URL (sourced from Pexels) plus an attribution string
-- ("<photographer> / Pexels" + the photo page URL) so the home page, /products
-- and /explore can show a proper image instead of an emoji.
--
-- cover_image_url    — hotlinked Pexels image (large2x)
-- cover_image_credit — JSON: {"by":"<photographer>","url":"<pexels photo url>"}

ALTER TABLE operators ADD COLUMN cover_image_url    TEXT;
ALTER TABLE operators ADD COLUMN cover_image_credit TEXT;
