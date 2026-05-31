-- Seed a polished demo badge so the verify URL + OG image have a guaranteed
-- example to show. Idempotent — safe to re-apply.

INSERT OR REPLACE INTO users (id, email, name, agency_name, agency_country, preferred_lang) VALUES
  ('u_demo_sarah', 'sarah@blueskytravel.example', 'Sarah W.', 'Blue Sky Travel', 'AU', 'en');

INSERT OR IGNORE INTO enrollments (user_id, course_id, started_at, completed_at) VALUES
  ('u_demo_sarah', 'c_coronet_peak_2026', unixepoch() - 86400 * 3, unixepoch() - 3600);

-- Verify code "DEMO0SARAHW" — 11 chars, Crockford base32 style.
INSERT OR REPLACE INTO badges (id, verify_code, user_id, course_id, operator_id, awarded_at)
VALUES ('b_DEMO0SARAHW', 'DEMO0SARAHW', 'u_demo_sarah', 'c_coronet_peak_2026', 'op_nzski', unixepoch() - 3600);
