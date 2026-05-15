-- Placeholder operator rows so the marketplace homepage has 6 cards.
-- Real course content for each is seeded in D5.

INSERT OR IGNORE INTO operators (id, slug, name, display_name, country, primary_lang, cover_color, contact_email, status) VALUES
  ('op_hermitage',  'hermitage',          'The Hermitage Hotel',      'Hermitage Hotel · Aoraki / Mt Cook',           'NZ', 'en', 'linear-gradient(135deg,#0f3a2c 0%,#1e5b3a 50%,#3a8050 100%)',  'trade@hermitage.co.nz',     'active'),
  ('op_kjet',       'kjet',               'KJet',                     'KJet · Queenstown',                            'NZ', 'en', 'linear-gradient(135deg,#3d2f1f 0%,#6b4423 60%,#8b5a2b 100%)',  'trade@kjet.co.nz',          'active'),
  ('op_ultimate',   'ultimate-hikes',     'Ultimate Hikes',           'Ultimate Hikes · Fiordland',                   'NZ', 'en', 'linear-gradient(135deg,#1e293b 0%,#334155 100%)',              'trade@ultimatehikes.co.nz', 'active'),
  ('op_southern',   'southern-discoveries','Southern Discoveries',    'Southern Discoveries · Milford Sound',         'NZ', 'en', 'linear-gradient(135deg,#3b1f3a 0%,#6d2c5e 100%)',              'trade@southerndiscoveries.co.nz', 'active'),
  ('op_canopy',     'canopy-tours',       'Canopy Tours',             'Canopy Tours · Rotorua',                       'NZ', 'en', 'linear-gradient(135deg,#1a3a5c 0%,#2c5282 100%)',              'trade@canopytours.co.nz',   'active');

-- A single "Coming soon" placeholder course per operator so cards show emoji + cover.
-- These are status='draft' so they don't pollute /learn yet.
INSERT OR IGNORE INTO courses (id, operator_id, slug, title, summary, cover_color, emoji, primary_lang, status, est_minutes, position) VALUES
  ('c_hermitage_placeholder', 'op_hermitage',  'mt-cook-portfolio-coming',     'Mt Cook accommodation portfolio',           'Curriculum being prepared from the Hermitage product directory.', 'linear-gradient(135deg,#0f3a2c 0%,#1e5b3a 50%,#3a8050 100%)',  '🏔️', 'en', 'draft', 32, 1),
  ('c_kjet_placeholder',      'op_kjet',       'kjet-bilingual-coming',        'Queenstown Jet · bilingual product training','EN / 中 dual-language launch in progress.',                   'linear-gradient(135deg,#3d2f1f 0%,#6b4423 60%,#8b5a2b 100%)',  '🚤', 'en', 'draft', 20, 1),
  ('c_ultimate_placeholder',  'op_ultimate',   'milford-routeburn-coming',     'Milford & Routeburn guided walks',          'Curriculum being prepared from the 25-26 product directory.',  'linear-gradient(135deg,#1e293b 0%,#334155 100%)',              '🥾', 'en', 'draft', 25, 1),
  ('c_southern_placeholder',  'op_southern',   'milford-cruises-coming',       'Milford Sound nature cruises',              'Curriculum being prepared.',                                  'linear-gradient(135deg,#3b1f3a 0%,#6d2c5e 100%)',              '⛴️', 'en', 'draft', 28, 1),
  ('c_canopy_placeholder',    'op_canopy',     'rotorua-zipline-coming',       'Rotorua native forest zipline',             'Curriculum being prepared.',                                  'linear-gradient(135deg,#1a3a5c 0%,#2c5282 100%)',              '🌳', 'en', 'draft', 18, 1);
