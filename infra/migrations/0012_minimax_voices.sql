-- 0012: MiniMax native Chinese voices.
--
-- MiniMax (provider 'minimax') produces top-tier native Mandarin speech via the
-- T2A v2 API. These are platform-owned stock voices (supplier_id NULL). The
-- external_id is the MiniMax system voice_id. Available wherever the platform
-- MINIMAX_API_KEY is configured.
--
-- Tagged for zh-CN / zh-TW so they appear on the Chinese voice-over rows and
-- become the default Chinese voice (preferred over the free MeloTTS fallback).

INSERT OR IGNORE INTO voice_profiles
  (id, supplier_id, name, provider, external_id, kind, gender, langs, status)
VALUES
  ('voice_mmx_jingying', NULL, 'MiniMax · 精英青年 (男)', 'minimax', 'male-qn-jingying', 'stock', 'male',   '["zh-CN","zh-TW"]', 'active'),
  ('voice_mmx_qingse',   NULL, 'MiniMax · 青涩青年 (男)', 'minimax', 'male-qn-qingse',   'stock', 'male',   '["zh-CN","zh-TW"]', 'active'),
  ('voice_mmx_tianmei',  NULL, 'MiniMax · 甜美女声 (女)', 'minimax', 'female-tianmei',   'stock', 'female', '["zh-CN","zh-TW"]', 'active'),
  ('voice_mmx_yujie',    NULL, 'MiniMax · 御姐音色 (女)', 'minimax', 'female-yujie',     'stock', 'female', '["zh-CN","zh-TW"]', 'active'),
  ('voice_mmx_presenter',NULL, 'MiniMax · 女主播 (女)',   'minimax', 'presenter_female', 'stock', 'female', '["zh-CN","zh-TW"]', 'active');
