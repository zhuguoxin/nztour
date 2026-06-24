-- =========================================================================
-- 0026 — Replace the product "sector" taxonomy
-- =========================================================================
-- Old codes (snow/cruise/hiking/stay/entertainment/adventure) are replaced by
-- the new Operating-sectors taxonomy. Existing products are re-classified by
-- slug; any leftover old code is cleared to NULL (uncategorised).
--
--   New codes: attractions | adventure | culture | water | land | air |
--              accommodation | tour | rto
--
-- Apply remotely with:
--   wrangler d1 execute tourtrain-db --remote \
--     --file infra/migrations/0026_sector_taxonomy.sql
-- =========================================================================

UPDATE operators SET category = 'attractions'
  WHERE slug IN ('canopy-tours','skycity-adelaide','skycity-auckland',
                 'skycity-hamilton','skycity-queenstown','skyline-rotorua');

UPDATE operators SET category = 'adventure'
  WHERE slug IN ('nzski','ultimate-hikes');

UPDATE operators SET category = 'water'
  WHERE slug IN ('kjet','southern-discoveries');

UPDATE operators SET category = 'accommodation'
  WHERE slug IN ('skycity-hotels','hermitage');

-- Clear any stragglers still on an old code so nothing falls through with a
-- now-undefined category.
UPDATE operators SET category = NULL
  WHERE category IS NOT NULL
    AND category NOT IN ('attractions','adventure','culture','water','land','air','accommodation','tour','rto');
