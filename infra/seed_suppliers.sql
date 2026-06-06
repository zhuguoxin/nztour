-- Demo supplier rows + backfill supplier_id on existing operators (= products).
--
-- After migration 0005. Idempotent: INSERT OR IGNORE + UPDATE-by-id.
--
-- Pattern shows both shapes:
--   • multi-product holding  → SkyCity Entertainment Group (6 products)
--   • single-product brand   → Hermitage / KJet / Ultimate / Southern / Canopy / NZSki etc. (1 product each)
-- Single-product suppliers exist so role + billing semantics stay uniform;
-- the UI auto-folds the supplier layer when supplier has exactly one product.

INSERT OR IGNORE INTO suppliers (id, slug, name, legal_name, country, hq_city, website, intro, plan_tier, status, contact_email) VALUES
  ('sup_skycity',   'skycity',              'SkyCity Entertainment Group', 'SkyCity Entertainment Group Limited', 'NZ', 'Auckland',    'https://www.skycityentertainmentgroup.com', 'Integrated entertainment & hospitality across Auckland, Hamilton, Queenstown and Adelaide.', 'pro',     'active', 'trade@skycity.co.nz'),
  ('sup_nzski',     'nzski',                'NZSki',                       'NZSki Limited',                        'NZ', 'Queenstown',  'https://www.nzski.com',                      'Three South Island ski areas: Coronet Peak, The Remarkables, Mt Hutt.',                       'starter', 'active', 'trade@nzski.com'),
  ('sup_hermitage', 'hermitage',            'The Hermitage Hotel',         'The Hermitage Mt Cook Limited',        'NZ', 'Aoraki',      'https://www.hermitage.co.nz',                'Iconic alpine hotel & activities at Aoraki / Mt Cook.',                                        'starter', 'active', 'trade@hermitage.co.nz'),
  ('sup_kjet',      'kjet',                 'KJet',                        'Kawarau Jet Services Holdings Ltd',    'NZ', 'Queenstown',  'https://www.kjet.co.nz',                     'Queenstown jet boat experience on three rivers.',                                              'starter', 'active', 'trade@kjet.co.nz'),
  ('sup_ultimate',  'ultimate-hikes',       'Ultimate Hikes',              'Ultimate Hikes (NZ) Limited',          'NZ', 'Queenstown',  'https://www.ultimatehikes.co.nz',            'Guided multi-day walks on the Milford and Routeburn tracks.',                                  'starter', 'active', 'trade@ultimatehikes.co.nz'),
  ('sup_southern',  'southern-discoveries', 'Southern Discoveries',        'Southern Discoveries Limited',         'NZ', 'Queenstown',  'https://www.southerndiscoveries.co.nz',      'Milford Sound nature cruises and underwater observatory.',                                     'starter', 'active', 'trade@southerndiscoveries.co.nz'),
  ('sup_canopy',    'canopy-tours',         'Canopy Tours',                'Rotorua Canopy Tours Limited',         'NZ', 'Rotorua',     'https://www.canopytours.co.nz',              'Native-forest zipline conservation experience.',                                               'starter', 'active', 'trade@canopytours.co.nz');

-- Backfill: link existing single-product operators to their 1:1 suppliers.
UPDATE operators SET supplier_id = 'sup_nzski'     WHERE id = 'op_nzski';
UPDATE operators SET supplier_id = 'sup_hermitage' WHERE id = 'op_hermitage';
UPDATE operators SET supplier_id = 'sup_kjet'      WHERE id = 'op_kjet';
UPDATE operators SET supplier_id = 'sup_ultimate'  WHERE id = 'op_ultimate';
UPDATE operators SET supplier_id = 'sup_southern'  WHERE id = 'op_southern';
UPDATE operators SET supplier_id = 'sup_canopy'    WHERE id = 'op_canopy';

-- SkyCity products (6). These mirror SkyCity's actual operating venues.
-- cover_color uses the SkyCity black/gold palette as a starting point — each
-- product can override its own theme later from /operator/<slug> branding.
INSERT OR IGNORE INTO operators (id, slug, name, display_name, country, primary_lang, cover_color, contact_email, status, supplier_id, theme_bg, theme_accent, theme_ink) VALUES
  ('op_sc_auckland',   'skycity-auckland',   'SkyCity Auckland',      'SkyCity Auckland · Casino, hotels, Sky Tower',   'NZ', 'en', 'linear-gradient(135deg,#0c0c0c 0%,#262626 60%,#3a3a3a 100%)', 'trade.auckland@skycity.co.nz',   'active', 'sup_skycity', '#0c0c0c', '#d4af37', '#f5f5f5'),
  ('op_sc_queenstown', 'skycity-queenstown', 'SkyCity Queenstown',    'SkyCity Queenstown · Wharf casino',              'NZ', 'en', 'linear-gradient(135deg,#0c0c0c 0%,#1f3a4d 100%)',            'trade.queenstown@skycity.co.nz', 'active', 'sup_skycity', '#0c0c0c', '#d4af37', '#f5f5f5'),
  ('op_sc_hamilton',   'skycity-hamilton',   'SkyCity Hamilton',      'SkyCity Hamilton · Casino & dining',             'NZ', 'en', 'linear-gradient(135deg,#0c0c0c 0%,#2a1f3a 100%)',            'trade.hamilton@skycity.co.nz',   'active', 'sup_skycity', '#0c0c0c', '#d4af37', '#f5f5f5'),
  ('op_sc_adelaide',   'skycity-adelaide',   'SkyCity Adelaide',      'SkyCity Adelaide · Casino, EOS hotel',           'AU', 'en', 'linear-gradient(135deg,#0c0c0c 0%,#3a1f1f 100%)',            'trade.adelaide@skycity.com.au',  'active', 'sup_skycity', '#0c0c0c', '#d4af37', '#f5f5f5'),
  ('op_sc_online',     'skycity-online',     'SkyCity Online Casino', 'SkyCity Online Casino · NZ',                     'NZ', 'en', 'linear-gradient(135deg,#0c0c0c 0%,#1a3a2a 100%)',            'trade.online@skycity.co.nz',     'active', 'sup_skycity', '#0c0c0c', '#d4af37', '#f5f5f5'),
  ('op_sc_hotels',     'skycity-hotels',     'SkyCity Hotels',        'SkyCity Hotels · Auckland & Hamilton portfolio', 'NZ', 'en', 'linear-gradient(135deg,#0c0c0c 0%,#3a2f1f 100%)',            'trade.hotels@skycity.co.nz',     'active', 'sup_skycity', '#0c0c0c', '#d4af37', '#f5f5f5');
