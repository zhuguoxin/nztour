-- 0022: self-serve onboarding — two registration paths (supplier customer / learner).
--
-- Adds profile + onboarding-gating columns to `users`, and `rto_json` to
-- `suppliers`. CRITICAL: backfills every EXISTING user as already-onboarded so
-- the new /onboarding gate does not lock out current accounts.
--
-- D1 note: ALTER TABLE ADD COLUMN cannot use a non-constant default, so the
-- timestamp columns default to NULL and are populated by the UPDATEs below.

-- ---- users: extra profile fields collected at onboarding ----
ALTER TABLE users ADD COLUMN first_name              TEXT;
ALTER TABLE users ADD COLUMN middle_name             TEXT;
ALTER TABLE users ADD COLUMN last_name               TEXT;
ALTER TABLE users ADD COLUMN company_name            TEXT;
ALTER TABLE users ADD COLUMN job_title               TEXT;
ALTER TABLE users ADD COLUMN city                    TEXT;
ALTER TABLE users ADD COLUMN country                 TEXT;   -- Country/Region (learner)
ALTER TABLE users ADD COLUMN business_profile        TEXT;
ALTER TABLE users ADD COLUMN marketing_opt_in        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN terms_accepted_at       INTEGER;   -- unixepoch when ticked
ALTER TABLE users ADD COLUMN user_type               TEXT;      -- 'learner' | 'supplier_manager'
ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;   -- NULL = must onboard

-- ---- suppliers: which RTOs the supplier serves (JSON array of names) ----
ALTER TABLE suppliers ADD COLUMN rto_json TEXT NOT NULL DEFAULT '[]';

-- ---- BACKFILL existing users: treat them as already onboarded ----
-- 1) everyone existing has finished onboarding (use their signup time).
UPDATE users SET onboarding_completed_at = created_at
WHERE onboarding_completed_at IS NULL;

-- 2) infer user_type: anyone with a supplier OR operator membership is a
--    supplier-side manager; everyone else is a learner.
UPDATE users SET user_type = 'supplier_manager'
WHERE user_type IS NULL
  AND (
    id IN (SELECT user_id FROM supplier_memberships)
    OR id IN (SELECT user_id FROM operator_memberships)
  );

UPDATE users SET user_type = 'learner'
WHERE user_type IS NULL;

-- 3) carry the legacy agency_name into company_name where present (best-effort).
UPDATE users SET company_name = agency_name
WHERE company_name IS NULL AND agency_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed_at);
