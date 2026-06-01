-- 0004: per-operator branding / theming.
-- Three colour tokens drive every themable surface — keep the UI simple so
-- operators don't have to art-direct a full palette. Logo override is optional;
-- when null we render the Libretour mark in the operator's accent colour.
--
-- Surfaces that pick up the theme:
--   /learn/<operator>/<course>   — the agent's full course chrome
--   /operator/<slug>             — the operator's own back-office
--   /verify/<code>               — public badge page (operator pride)
-- Surfaces that DO NOT theme (stay Libretour green):
--   /                            — Libretour marketplace
--   /learn                       — Libretour catalogue
--   /admin                       — platform admin
ALTER TABLE operators ADD COLUMN theme_bg TEXT;       -- page background
ALTER TABLE operators ADD COLUMN theme_accent TEXT;   -- primary CTA, links, highlights
ALTER TABLE operators ADD COLUMN theme_ink TEXT;      -- main text contrast layer
ALTER TABLE operators ADD COLUMN theme_logo_r2_key TEXT;  -- optional override; null = use Libretour mark tinted with accent
