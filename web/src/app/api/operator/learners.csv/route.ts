/**
 * GET /api/operator/learners.csv?slug=<operator-slug>&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Stream a CSV of every learner with an enrollment in the operator's catalog
 * during the window. Columns:
 *   - name, email, agency, agency_country
 *   - course_title
 *   - enrolled_at, last_activity_at
 *   - modules_completed / modules_total
 *   - badge_earned, badge_verify_code
 *   - feedback_rating (latest), satisfaction_text (latest)
 *
 * One row per (learner, course) pair so operators can pivot in Excel.
 *
 * Auth: requires operator membership for `slug` (or platform admin or
 * supplier-member). Same gate as the dashboard.
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";

export const dynamic = "force-dynamic";

function parseDate(s: string | null, endOfDay = false): number | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + (endOfDay ? "T23:59:59Z" : "T00:00:00Z"));
  const t = d.getTime();
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}

/** RFC 4180 CSV escape for a single cell. */
function cell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "";
  if (!slug) return new Response("missing slug", { status: 400 });

  let access;
  try {
    access = await requireOperatorMembership(slug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const now = Math.floor(Date.now() / 1000);
  const from = parseDate(url.searchParams.get("from")) ?? now - 30 * 86400;
  const to = parseDate(url.searchParams.get("to"), true) ?? now;

  const { results = [] } = await db()
    .prepare(
      `SELECT
         u.id AS user_id, u.name, u.email, u.agency_name, u.agency_country,
         c.id AS course_id, c.title AS course_title,
         e.started_at,
         (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) AS modules_total,
         (SELECT COUNT(*) FROM module_progress mp
            JOIN modules m ON m.id = mp.module_id
            WHERE m.course_id = c.id AND mp.user_id = u.id AND mp.completed_at IS NOT NULL
         ) AS modules_completed,
         (SELECT MAX(completed_at) FROM module_progress mp
            JOIN modules m ON m.id = mp.module_id
            WHERE m.course_id = c.id AND mp.user_id = u.id
         ) AS last_activity_at,
         (SELECT verify_code FROM badges b
            WHERE b.user_id = u.id AND b.course_id = c.id LIMIT 1
         ) AS badge_verify_code,
         (SELECT rating FROM course_feedback f
            WHERE f.user_id = u.id AND f.course_id = c.id
            ORDER BY f.created_at DESC LIMIT 1
         ) AS feedback_rating,
         (SELECT text FROM course_feedback f
            WHERE f.user_id = u.id AND f.course_id = c.id
            ORDER BY f.created_at DESC LIMIT 1
         ) AS feedback_text
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u   ON u.id = e.user_id
       WHERE c.operator_id = ? AND e.started_at >= ? AND e.started_at <= ?
       ORDER BY e.started_at DESC, c.title, u.email`,
    )
    .bind(access.operatorId, from, to)
    .all<{
      user_id: string;
      name: string | null;
      email: string;
      agency_name: string | null;
      agency_country: string | null;
      course_id: string;
      course_title: string;
      started_at: number;
      modules_total: number;
      modules_completed: number;
      last_activity_at: number | null;
      badge_verify_code: string | null;
      feedback_rating: number | null;
      feedback_text: string | null;
    }>();

  const header = [
    "name",
    "email",
    "agency",
    "agency_country",
    "course",
    "enrolled_at",
    "last_activity_at",
    "modules_completed",
    "modules_total",
    "completion_pct",
    "badge_earned",
    "badge_verify_code",
    "feedback_rating",
    "feedback_text",
  ];
  const lines: string[] = [header.join(",")];
  for (const r of results) {
    const pct =
      r.modules_total > 0 ? Math.round((r.modules_completed / r.modules_total) * 100) : 0;
    lines.push(
      [
        cell(r.name),
        cell(r.email),
        cell(r.agency_name),
        cell(r.agency_country),
        cell(r.course_title),
        cell(r.started_at ? new Date(r.started_at * 1000).toISOString() : ""),
        cell(r.last_activity_at ? new Date(r.last_activity_at * 1000).toISOString() : ""),
        cell(r.modules_completed),
        cell(r.modules_total),
        cell(pct),
        cell(r.badge_verify_code ? "yes" : "no"),
        cell(r.badge_verify_code ?? ""),
        cell(r.feedback_rating ?? ""),
        cell(r.feedback_text ?? ""),
      ].join(","),
    );
  }

  const csv = lines.join("\r\n") + "\r\n";
  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="learners-${slug}-${today}.csv"`,
      "cache-control": "no-store",
    },
  });
}
