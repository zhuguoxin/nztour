/**
 * POST /api/regenerate-module — kick off a module regenerate in the BACKGROUND.
 *
 * Re-translating a module + re-synthesizing its narration takes 10–30s. Doing
 * it inside a server action froze the editor (every other action queued behind
 * it). Here we authorize, hand the work to `ctx.waitUntil()` so the request
 * returns immediately, and stamp `modules.regen_at` when it finishes. The
 * editor polls GET ?moduleId= to show a completion toast without blocking.
 *
 * Body: { operatorSlug, courseSlug, moduleId }
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { previewModuleNarration } from "@/app/product/[slug]/courses/actions";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { operatorSlug?: string; courseSlug?: string; moduleId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("invalid body", { status: 400 });
  }
  const operatorSlug = String(body.operatorSlug ?? "");
  const courseSlug = String(body.courseSlug ?? "");
  const moduleId = String(body.moduleId ?? "");
  if (!operatorSlug || !courseSlug || !moduleId) {
    return new Response("missing fields", { status: 400 });
  }

  try {
    await requireOperatorMembership(operatorSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const { ctx } = getCloudflareContext();
  ctx.waitUntil(
    (async () => {
      try {
        // Preview: generate ONLY the primary-language narration for this module
        // (quick debug listen). Full multi-language generation happens at publish.
        await previewModuleNarration({ operatorSlug, courseSlug, moduleId });
      } catch {
        // Swallow — the editor surfaces failure via the unchanged narration
        // state; we still stamp regen_at below so polling terminates.
      }
      try {
        await db()
          .prepare(`UPDATE modules SET regen_at = unixepoch() WHERE id = ?`)
          .bind(moduleId)
          .run();
      } catch {
        /* ignore */
      }
    })(),
  );

  return Response.json({ ok: true, started: true });
}

export async function GET(req: Request) {
  const moduleId = new URL(req.url).searchParams.get("moduleId") ?? "";
  if (!moduleId) return new Response("missing moduleId", { status: 400 });
  const row = await db()
    .prepare(`SELECT regen_at FROM modules WHERE id = ?`)
    .bind(moduleId)
    .first<{ regen_at: number | null }>();
  return Response.json({ regen_at: row?.regen_at ?? 0 });
}
