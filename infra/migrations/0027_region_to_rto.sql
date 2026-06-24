-- =========================================================================
-- 0027 — Map operators.region from the old 8 region codes to NZ RTO names
-- =========================================================================
-- The product "Region" filter now lists the NZ Regional Tourism Organisations
-- (RTOs). Existing operators carried short region codes; map them to the
-- closest RTO name (verbatim, matching src/lib/rto.ts). 'australia' has no NZ
-- RTO, so it's cleared.
--
-- Apply remotely with:
--   wrangler d1 execute tourtrain-db --remote \
--     --file infra/migrations/0027_region_to_rto.sql
-- =========================================================================

UPDATE operators SET region = 'Destination Queenstown'      WHERE region = 'queenstown';
UPDATE operators SET region = 'Great South'                 WHERE region = 'fiordland';
UPDATE operators SET region = 'Mackenzie Tourism'           WHERE region = 'aoraki';
UPDATE operators SET region = 'RotoruaNZ'                    WHERE region = 'rotorua';
UPDATE operators SET region = 'Tātaki Auckland Unlimited'   WHERE region = 'auckland';
UPDATE operators SET region = 'Hamilton & Waikato Tourism'  WHERE region = 'waikato';
UPDATE operators SET region = 'ChristchurchNZ'              WHERE region = 'canterbury';
UPDATE operators SET region = NULL                          WHERE region = 'australia';

-- Orbit 360° Dining (slug 'canopy-tours') is the Sky Tower restaurant in
-- Auckland, not Rotorua — correct it explicitly.
UPDATE operators SET region = 'Tātaki Auckland Unlimited'   WHERE slug = 'canopy-tours';
