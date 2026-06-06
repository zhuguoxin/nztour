-- 0005: introduce the Supplier → Product (= existing `operators` row) layer.
--
-- A "Supplier" is the legal/commercial holding entity (e.g. SkyCity
-- Entertainment Group, NZSki Limited). It owns one or more "Products" —
-- the brands / venues / experiences end-learners actually train on.
--
-- We KEEP the existing `operators` table name on disk to avoid a churny
-- rename across ~200 file references and FK constraints; in the UI and
-- new code the user-facing word is "Product". Treat `operators` table = product.
--
-- The single-product case (e.g. Hermitage, where supplier == brand)
-- still gets a supplier row 1:1 so role/billing semantics are uniform —
-- the UI just folds the supplier layer away when supplier has exactly
-- one product.

CREATE TABLE IF NOT EXISTS suppliers (
  id              TEXT PRIMARY KEY,                    -- 'sup_skycity'
  slug            TEXT NOT NULL UNIQUE,                -- 'skycity'
  name            TEXT NOT NULL,                       -- 'SkyCity Entertainment Group'
  legal_name      TEXT,                                -- 'SkyCity Entertainment Group Limited'
  country         TEXT NOT NULL DEFAULT 'NZ',
  hq_city         TEXT,
  website         TEXT,
  intro           TEXT,                                -- short company blurb shown on /supplier/<slug>
  logo_r2_key     TEXT,
  -- Supplier-level theme; products without their own theme inherit these.
  theme_bg        TEXT,
  theme_accent    TEXT,
  theme_ink       TEXT,
  -- Billing / plan (Phase 6 wires Stripe; column added now to keep schema stable).
  plan_tier       TEXT NOT NULL DEFAULT 'free',        -- 'free' | 'starter' | 'pro' | 'enterprise'
  status          TEXT NOT NULL DEFAULT 'active',      -- 'pending' | 'active' | 'suspended'
  contact_email   TEXT,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- Bind every operator (= product) to a supplier. NULL during migration
-- backfill; the seed below populates it for the demo set.
ALTER TABLE operators ADD COLUMN supplier_id TEXT REFERENCES suppliers(id);
CREATE INDEX IF NOT EXISTS idx_operators_supplier ON operators(supplier_id);

-- Supplier-level memberships: the SkyCity manager grants ONE row here and
-- gets aggregated read access across all 6 SkyCity products. Product-level
-- operator_memberships still exist for single-product editors who shouldn't
-- see siblings.
CREATE TABLE IF NOT EXISTS supplier_memberships (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id   TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'manager',       -- 'owner' | 'manager' | 'viewer'
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, supplier_id)
);
CREATE INDEX IF NOT EXISTS idx_supplier_memberships_user ON supplier_memberships(user_id);
