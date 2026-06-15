/**
 * POST /api/glossary — manage a supplier's or product's translation glossary.
 *
 * Body (JSON):
 *   scope    : "supplier" | "operator"
 *   slug     : supplier slug or operator (product) slug — auth scope
 *   action   : "replace" (default) | "delete"
 *   entries  : (replace) Array<{ source_text, translations: {lang: value} }>
 *   id       : (delete) glossary entry id
 *
 * Auth: supplier membership / operator membership for `slug`.
 * Errors are returned as text/JSON, never an opaque 500.
 */
import { requireSupplierMembership, requireOperatorMembership } from "@/lib/roles";
import { replaceGlossary, deleteGlossaryEntry, type GlossaryScope } from "@/lib/glossary";

export const dynamic = "force-dynamic";

async function resolveScope(scope: string, slug: string): Promise<GlossaryScope> {
  if (scope === "supplier") {
    const a = await requireSupplierMembership(slug);
    return { supplierId: a.supplierId };
  }
  if (scope === "operator") {
    const a = await requireOperatorMembership(slug);
    return { operatorId: a.operatorId };
  }
  throw new Error("bad scope");
}

export async function POST(req: Request) {
  let body: {
    scope?: string;
    slug?: string;
    action?: string;
    id?: string;
    entries?: Array<{ source_text: string; translations: Record<string, string> }>;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("invalid JSON body", { status: 400 });
  }
  const scope = String(body.scope ?? "");
  const slug = String(body.slug ?? "");
  if (!scope || !slug) return new Response("missing scope/slug", { status: 400 });

  let s: GlossaryScope;
  try {
    s = await resolveScope(scope, slug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  try {
    if (body.action === "delete") {
      if (!body.id) return new Response("missing id", { status: 400 });
      await deleteGlossaryEntry(String(body.id), s);
      return Response.json({ ok: true });
    }
    const entries = Array.isArray(body.entries) ? body.entries : [];
    const count = await replaceGlossary(s, entries);
    return Response.json({ ok: true, count });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "glossary update failed";
    return new Response(msg.slice(0, 300), { status: 500 });
  }
}
