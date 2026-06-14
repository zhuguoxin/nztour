-- 0011: per-language native voices.
--
-- Each voice now declares which languages it's NATIVE for (voice_profiles.langs,
-- a JSON array of BCP-47 codes; NULL = universal/any). The editor's per-language
-- voice-over rows filter to voices native for that row's language, so Chinese
-- rows offer native Mandarin voices instead of an English voice speaking
-- accented Chinese.
--
-- Two tiers of native voice:
--   • MeloTTS (Workers AI, free) — dedicated per-language models for
--     en/zh/ja/ko/es/fr. Lower fidelity but free and native-language.
--   • ElevenLabs library voices (premium) — native speakers, high fidelity,
--     but require an ElevenLabs Starter ($5/mo) plan or above (Free tier is
--     blocked from library voices via the API). Labelled "Starter+".

ALTER TABLE voice_profiles ADD COLUMN langs TEXT;  -- JSON array of BCP-47 codes; NULL = universal

-- English premade ElevenLabs stock voices are English-native.
UPDATE voice_profiles SET langs = '["en"]'
  WHERE id IN ('voice_stock_male','voice_stock_female','voice_stock_neutral');

-- MeloTTS: free per-language models. Covers these languages natively.
UPDATE voice_profiles SET langs = '["en","zh-CN","zh-TW","ja","ko","es","fr"]'
  WHERE id = 'voice_melotts_auto';

-- Native ElevenLabs library voices (platform stock, supplier_id NULL).
-- external_id = the shared-library voice_id. Require Starter+ to use.
INSERT OR IGNORE INTO voice_profiles
  (id, supplier_id, name, provider, external_id, kind, gender, langs, status)
VALUES
  ('voice_zh_chen',  NULL, 'Mr. Chen · 中文男声 (Starter+)',   'elevenlabs', 'cwzmKSYMCC9Aym1ymCnt', 'stock', 'male',    '["zh-CN","zh-TW"]', 'active'),
  ('voice_zh_macy',  NULL, 'Macy · 中文女声 (Starter+)',       'elevenlabs', 'NchRhc5KPgHwZagz6MrZ', 'stock', 'female',  '["zh-CN","zh-TW"]', 'active'),
  ('voice_ja_ren',   NULL, 'Ren · 日本語 (Starter+)',          'elevenlabs', 'xQpTJhLkPZnRFTV4mc3k', 'stock', 'male',    '["ja"]', 'active'),
  ('voice_ko_hana',  NULL, 'Hanabad · 한국어 (Starter+)',      'elevenlabs', 'YDseIkMzKtO5bK1Ehnev', 'stock', 'neutral', '["ko"]', 'active'),
  ('voice_es_brian', NULL, 'Brian · Español (Starter+)',       'elevenlabs', 'mNeC4OvTsVHFLT8cOO4U', 'stock', 'male',    '["es"]', 'active'),
  ('voice_fr_ocean', NULL, 'Océane · Français (Starter+)',     'elevenlabs', 'CqTrL0ThT2GJVJEIiLcY', 'stock', 'female',  '["fr"]', 'active'),
  ('voice_de_emily', NULL, 'Emily · Deutsch (Starter+)',       'elevenlabs', '1oSs8Lk8Dj24ZVhmlsdW', 'stock', 'female',  '["de"]', 'active'),
  ('voice_pt_mari',  NULL, 'Marianne · Português (Starter+)',  'elevenlabs', 'BKv4Uz2HPF6TFlDgFBKN', 'stock', 'female',  '["pt"]', 'active');
