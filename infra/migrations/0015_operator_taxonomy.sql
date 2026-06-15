-- 0015: product taxonomy — experience category + region.
--
-- /products groups by `category` (what you do) and filters by `region`
-- (where it is). Both are short codes; human labels live in the i18n dict
-- (cat_* / reg_*). New suppliers will pick these when creating a product;
-- here we backfill the existing demo products.
--
-- category: snow | adventure | cruise | hiking | stay | entertainment
-- region  : queenstown | fiordland | aoraki | rotorua | auckland | waikato
--           | canterbury | australia  (extend as the catalogue grows)

ALTER TABLE operators ADD COLUMN category TEXT;
ALTER TABLE operators ADD COLUMN region   TEXT;

UPDATE operators SET category='snow',          region='queenstown' WHERE slug='nzski';
UPDATE operators SET category='adventure',     region='queenstown' WHERE slug='kjet';
UPDATE operators SET category='adventure',     region='rotorua'    WHERE slug='canopy-tours';
UPDATE operators SET category='cruise',        region='fiordland'  WHERE slug='southern-discoveries';
UPDATE operators SET category='hiking',        region='fiordland'  WHERE slug='ultimate-hikes';
UPDATE operators SET category='stay',          region='aoraki'     WHERE slug='hermitage';
UPDATE operators SET category='stay',          region='auckland'   WHERE slug='skycity-hotels';
UPDATE operators SET category='entertainment', region='auckland'   WHERE slug='skycity-auckland';
UPDATE operators SET category='entertainment', region='waikato'    WHERE slug='skycity-hamilton';
UPDATE operators SET category='entertainment', region='queenstown' WHERE slug='skycity-queenstown';
UPDATE operators SET category='entertainment', region='australia'  WHERE slug='skycity-adelaide';
