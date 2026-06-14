-- 0013: MiniMax native voices for every translation language.
--
-- MiniMax has dedicated native-speaker voices for all the languages we
-- translate to (English, Japanese, Korean, Spanish, French, German,
-- Portuguese — Chinese was seeded in 0012). Seeding them means each
-- language's voice-over row offers a native MiniMax voice instead of the
-- free MeloTTS fallback or a paid ElevenLabs library voice.
--
-- All platform-owned (supplier_id NULL), provider 'minimax', external_id =
-- the MiniMax system voice_id.

INSERT OR IGNORE INTO voice_profiles
  (id, supplier_id, name, provider, external_id, kind, gender, langs, status)
VALUES
  -- English
  ('voice_mmx_en_narrator', NULL, 'MiniMax · Narrator (EN, m)',  'minimax', 'English_expressive_narrator', 'stock', 'male',   '["en"]', 'active'),
  ('voice_mmx_en_calm',     NULL, 'MiniMax · Calm Woman (EN, f)', 'minimax', 'English_CalmWoman',          'stock', 'female', '["en"]', 'active'),
  -- Japanese
  ('voice_mmx_ja_senior',   NULL, 'MiniMax · 知的シニア (JA, m)', 'minimax', 'Japanese_IntellectualSenior', 'stock', 'male',   '["ja"]', 'active'),
  ('voice_mmx_ja_princess', NULL, 'MiniMax · 凛々しい女性 (JA, f)', 'minimax', 'Japanese_DecisivePrincess', 'stock', 'female', '["ja"]', 'active'),
  -- Korean
  ('voice_mmx_ko_athletic', NULL, 'MiniMax · 활기찬 여성 (KO, f)', 'minimax', 'Korean_AthleticGirl',       'stock', 'female', '["ko"]', 'active'),
  ('voice_mmx_ko_air',      NULL, 'MiniMax · 밝은 여성 (KO, f)',   'minimax', 'Korean_AirheadedGirl',      'stock', 'female', '["ko"]', 'active'),
  -- Spanish
  ('voice_mmx_es_mature',   NULL, 'MiniMax · Hombre maduro (ES, m)', 'minimax', 'Spanish_MaturePartner',  'stock', 'male',   '["es"]', 'active'),
  ('voice_mmx_es_serene',   NULL, 'MiniMax · Mujer serena (ES, f)',  'minimax', 'Spanish_SereneWoman',    'stock', 'female', '["es"]', 'active'),
  -- French
  ('voice_mmx_fr_man',      NULL, 'MiniMax · Homme posé (FR, m)',  'minimax', 'French_Male_Speech_New',    'stock', 'male',   '["fr"]', 'active'),
  -- German
  ('voice_mmx_de_man',      NULL, 'MiniMax · Freundlicher Mann (DE, m)', 'minimax', 'German_FriendlyMan',  'stock', 'male',   '["de"]', 'active'),
  ('voice_mmx_de_lady',     NULL, 'MiniMax · Sanfte Dame (DE, f)', 'minimax', 'German_SweetLady',          'stock', 'female', '["de"]', 'active'),
  -- Portuguese
  ('voice_mmx_pt_leader',   NULL, 'MiniMax · Líder (PT, m)',       'minimax', 'Portuguese_BossyLeader',    'stock', 'male',   '["pt"]', 'active'),
  ('voice_mmx_pt_lady',     NULL, 'MiniMax · Voz sentimental (PT, f)', 'minimax', 'Portuguese_SentimentalLady', 'stock', 'female', '["pt"]', 'active');

-- Retire the ElevenLabs library (Starter+) native voices: MiniMax now provides
-- native voices for every language, and the ElevenLabs library voices are
-- unusable on the Free tier anyway. The ElevenLabs PREMADE English voices
-- (Adam/Bella/Antoni) stay active.
UPDATE voice_profiles SET status = 'inactive'
  WHERE id IN ('voice_zh_chen','voice_zh_macy','voice_ja_ren','voice_ko_hana',
               'voice_es_brian','voice_fr_ocean','voice_de_emily','voice_pt_mari');
