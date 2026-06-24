/**
 * POST /api/publish-course — translate + narrate every selected language ×
 * module, then publish, in the BACKGROUND. Generating all the TTS can take a
 * while, so we authorize, hand the work to ctx.waitUntil, and return at once.
 * `courses.publish_at` is stamped on completion; the editor polls GET to show a
 * "published" toast without blocking.
 *
 * Body: { operatorSlug, courseSlug, langs: [{lang, voiceId}], overwrite }
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { publishCourseCore } from "@/app/product/[slug]/courses/actions";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    operatorSlug?: string;
    courseSlug?: string;
    langs?: { lang?: string; voiceId?: string }[];
    overwrite?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("invalid body", { status: 400 });
  }
  const operatorSlug = String(body.operatorSlug ?? "");
  const courseSlug = String(body.courseSlug ?? "");
  const langs = (Array.isArray(body.langs) ? body.langs : [])
    .map((l) => ({ lang: String(l?.lang ?? ""), voiceId: String(l?.voiceId ?? "") }))
    .filter((l) => l.lang);
  const overwrite = body.overwrite === true;
  if (!operatorSlug || !courseSlug || langs.length === 0) {
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
        await publishCourseCore({ operatorSlug, courseSlug, langs, overwrite });
      } catch {
        // Even on partial failure, stamp publish_at so polling terminates.
        try {
          await db()
            .prepare(
              `UPDATE courses SET publish_at = unixepoch()
               WHERE slug = ? AND operator_id = (SELECT id FROM operators WHERE slug = ?)`,
            )
            .bind(courseSlug, operatorSlug)
            .run();
        } catch {
          /* ignore */
        }
      }
    })(),
  );

  return Response.json({ ok: true, started: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const operatorSlug = url.searchParams.get("operatorSlug") ?? "";
  const courseSlug = url.searchParams.get("courseSlug") ?? "";
  if (!operatorSlug || !courseSlug) return new Response("missing params", { status: 400 });
  const row = await db()
    .prepare(
      `SELECT c.status, c.publish_at, c.publish_total, c.publish_done FROM courses c
       JOIN operators o ON o.id = c.operator_id
       WHERE o.slug = ? AND c.slug = ?`,
    )
    .bind(operatorSlug, courseSlug)
    .first<{ status: string; publish_at: number | null; publish_total: number | null; publish_done: number | null }>();
  return Response.json({
    status: row?.status ?? null,
    publish_at: row?.publish_at ?? 0,
    total: row?.publish_total ?? 0,
    done: row?.publish_done ?? 0,
  });
}
