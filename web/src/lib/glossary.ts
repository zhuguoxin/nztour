import { db } from "./db";

/**
 * Per-supplier / per-product translation glossary. See migration 0016.
 *
 * An entry is scoped to either a supplier (shared) or a single operator. At
 * translation time the two are merged, product-level winning over supplier-
 * level for the same source term.
 */

export interface GlossaryRow {
  id: string;
  source_text: string;
  /** JSON: {"zh-CN":"…","ja":"…"} */
  translations: string;
}

export interface GlossaryScope {
  supplierId?: string;
  operatorId?: string;
}

function glId(): string {
  return `gl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function parseTrans(json: string): Record<string, string> {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** List entries for one scope (for the management UI). */
export async function listGlossaryEntries(scope: GlossaryScope): Promise<GlossaryRow[]> {
  const col = scope.supplierId ? "supplier_id" : scope.operatorId ? "operator_id" : null;
  const val = scope.supplierId ?? scope.operatorId;
  if (!col || !val) return [];
  const { results } = await db()
    .prepare(`SELECT id, source_text, translations FROM glossary_entries WHERE ${col} = ? ORDER BY source_text`)
    .bind(val)
    .all<GlossaryRow>();
  return results ?? [];
}

/** Replace ALL entries for a scope with the given set (used by import). */
export async function replaceGlossary(
  scope: GlossaryScope,
  entries: Array<{ source_text: string; translations: Record<string, string> }>,
): Promise<number> {
  const col = scope.supplierId ? "supplier_id" : scope.operatorId ? "operator_id" : null;
  const val = scope.supplierId ?? scope.operatorId;
  if (!col || !val) throw new Error("glossary scope required");

  const d = db();
  const stmts = [d.prepare(`DELETE FROM glossary_entries WHERE ${col} = ?`).bind(val)];
  let n = 0;
  for (const e of entries) {
    const src = (e.source_text ?? "").trim();
    if (!src) continue;
    // keep only non-empty translation values
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(e.translations ?? {})) {
      if (v && String(v).trim()) clean[k] = String(v).trim();
    }
    stmts.push(
      d
        .prepare(
          `INSERT INTO glossary_entries (id, supplier_id, operator_id, source_text, translations)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(glId(), scope.supplierId ?? null, scope.operatorId ?? null, src, JSON.stringify(clean)),
    );
    n++;
  }
  // D1 batch caps generously; chunk to stay safe on very large imports.
  const CHUNK = 80;
  for (let i = 0; i < stmts.length; i += CHUNK) {
    await d.batch(stmts.slice(i, i + CHUNK));
  }
  return n;
}

export async function deleteGlossaryEntry(id: string, scope: GlossaryScope): Promise<void> {
  const col = scope.supplierId ? "supplier_id" : scope.operatorId ? "operator_id" : null;
  const val = scope.supplierId ?? scope.operatorId;
  if (!col || !val) return;
  await db()
    .prepare(`DELETE FROM glossary_entries WHERE id = ? AND ${col} = ?`)
    .bind(id, val)
    .run();
}

/**
 * Merged source→target pairs for translating an operator's content into
 * `toLang`. Supplier-level + operator-level, operator wins on duplicate source.
 * Only entries that actually have a translation for `toLang` are returned.
 */
export async function glossaryForTranslation(
  operatorId: string,
  toLang: string,
): Promise<Array<{ source: string; target: string }>> {
  const op = await db()
    .prepare(`SELECT supplier_id FROM operators WHERE id = ?`)
    .bind(operatorId)
    .first<{ supplier_id: string | null }>();
  const supplierId = op?.supplier_id ?? null;

  const supplierRows = supplierId
    ? (
        await db()
          .prepare(`SELECT id, source_text, translations FROM glossary_entries WHERE supplier_id = ?`)
          .bind(supplierId)
          .all<GlossaryRow>()
      ).results ?? []
    : [];
  const opRows =
    (
      await db()
        .prepare(`SELECT id, source_text, translations FROM glossary_entries WHERE operator_id = ?`)
        .bind(operatorId)
        .all<GlossaryRow>()
    ).results ?? [];

  // operator rows after supplier rows → override by lowercased source
  const map = new Map<string, { source: string; target: string }>();
  for (const r of [...supplierRows, ...opRows]) {
    const src = r.source_text.trim();
    if (!src) continue;
    const target = parseTrans(r.translations)[toLang];
    if (target) map.set(src.toLowerCase(), { source: src, target });
  }
  return [...map.values()];
}
