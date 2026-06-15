-- 0016: per-supplier / per-product translation glossary.
--
-- Suppliers usually have translation-agency term lists (product names, facility
-- names, proper nouns) with established translations in several languages.
-- Importing them lets the AI translator reuse those EXACT terms for
-- consistency, instead of re-inventing a translation each time.
--
-- An entry is scoped to EITHER a supplier (shared across all its products) OR a
-- single operator/product (a product-specific addition or override). At
-- translation time we merge supplier-level + product-level entries, with the
-- product-level translation winning when the same source_text appears in both.

CREATE TABLE IF NOT EXISTS glossary_entries (
  id           TEXT PRIMARY KEY,
  supplier_id  TEXT REFERENCES suppliers(id) ON DELETE CASCADE,
  operator_id  TEXT REFERENCES operators(id) ON DELETE CASCADE,
  source_text  TEXT NOT NULL,
  translations TEXT NOT NULL DEFAULT '{}',   -- JSON {"zh-CN":"…","ja":"…"}
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_glossary_supplier ON glossary_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_glossary_operator ON glossary_entries(operator_id);
