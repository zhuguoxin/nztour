-- Demo theme presets. Operators can override these any time from the
-- branding form in their dashboard. Tokens chosen to match each operator's
-- product feel (alpine cool, lakeside warm, etc.).

UPDATE operators SET
  theme_bg     = '#0c1a2b',
  theme_accent = '#7dd3fc',
  theme_ink    = '#e0f2fe'
WHERE slug = 'nzski';

UPDATE operators SET
  theme_bg     = '#1c1410',
  theme_accent = '#fbbf24',
  theme_ink    = '#fef3c7'
WHERE slug = 'hermitage';

UPDATE operators SET
  theme_bg     = '#082f3a',
  theme_accent = '#22d3ee',
  theme_ink    = '#cffafe'
WHERE slug = 'kjet';

UPDATE operators SET
  theme_bg     = '#1c2a1f',
  theme_accent = '#a3e635',
  theme_ink    = '#ecfccb'
WHERE slug = 'ultimate-hikes';

UPDATE operators SET
  theme_bg     = '#0e1f3a',
  theme_accent = '#60a5fa',
  theme_ink    = '#dbeafe'
WHERE slug = 'southern-discoveries';

UPDATE operators SET
  theme_bg     = '#172116',
  theme_accent = '#86efac',
  theme_ink    = '#dcfce7'
WHERE slug = 'canopy-tours';
