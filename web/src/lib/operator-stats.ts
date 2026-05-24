/**
 * Operator-side analytics queries. All scoped by operator_id.
 * Used by /operator/[slug] dashboard.
 */
import { db } from "./db";

export interface OperatorKPIs {
  total_learners: number;
  learners_this_week: number;
  courses_published: number;
  courses_draft: number;
  badges_awarded: number;
  completion_rate_pct: number;     // 0-100, rounded
  ai_questions_total: number;
  ai_questions_30d: number;
}

export async function getOperatorKPIs(operatorId: string): Promise<OperatorKPIs> {
  const NOW = Math.floor(Date.now() / 1000);
  const WEEK = NOW - 7 * 24 * 3600;
  const MONTH = NOW - 30 * 24 * 3600;

  // Single round trip via batch.
  const stmts = [
    db().prepare(
      `SELECT COUNT(DISTINCT e.user_id) AS n
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE c.operator_id = ?`,
    ).bind(operatorId),
    db().prepare(
      `SELECT COUNT(DISTINCT e.user_id) AS n
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE c.operator_id = ? AND e.started_at >= ?`,
    ).bind(operatorId, WEEK),
    db().prepare(
      `SELECT
         SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS pub,
         SUM(CASE WHEN status='draft'     THEN 1 ELSE 0 END) AS draft
       FROM courses WHERE operator_id = ?`,
    ).bind(operatorId),
    db().prepare(
      `SELECT COUNT(*) AS n FROM badges WHERE operator_id = ?`,
    ).bind(operatorId),
    db().prepare(
      `SELECT
         COUNT(DISTINCT e.user_id) AS enrolled,
         COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.user_id END) AS completed
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE c.operator_id = ?`,
    ).bind(operatorId),
    db().prepare(
      `SELECT COUNT(*) AS n FROM qa_logs WHERE operator_id = ?`,
    ).bind(operatorId),
    db().prepare(
      `SELECT COUNT(*) AS n FROM qa_logs WHERE operator_id = ? AND created_at >= ?`,
    ).bind(operatorId, MONTH),
  ];
  const rows = await db().batch(stmts);

  const enrCounts = rows[4].results?.[0] as { enrolled: number; completed: number } | undefined;
  const completion =
    enrCounts && enrCounts.enrolled > 0
      ? Math.round((enrCounts.completed / enrCounts.enrolled) * 100)
      : 0;

  return {
    total_learners: ((rows[0].results?.[0] as { n: number } | undefined)?.n ?? 0),
    learners_this_week: ((rows[1].results?.[0] as { n: number } | undefined)?.n ?? 0),
    courses_published: ((rows[2].results?.[0] as { pub: number } | undefined)?.pub ?? 0),
    courses_draft: ((rows[2].results?.[0] as { draft: number } | undefined)?.draft ?? 0),
    badges_awarded: ((rows[3].results?.[0] as { n: number } | undefined)?.n ?? 0),
    completion_rate_pct: completion,
    ai_questions_total: ((rows[5].results?.[0] as { n: number } | undefined)?.n ?? 0),
    ai_questions_30d: ((rows[6].results?.[0] as { n: number } | undefined)?.n ?? 0),
  };
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  module_completions: number;
  new_learners: number;
}

/**
 * Daily learning activity for the last `days` days (inclusive of today),
 * scoped to one operator. Returns exactly `days` points with zero-fill so the
 * chart has no gaps. Counts module completions and new enrollments per day.
 */
export async function getDailyActivity(operatorId: string, days = 7): Promise<DailyPoint[]> {
  const since = Math.floor(Date.now() / 1000) - (days - 1) * 86400;
  // Truncate `since` to local midnight-ish (UTC day boundary is fine for MVP).
  const sinceMidnight = Math.floor(since / 86400) * 86400;

  const [completions, enrolls] = await db().batch([
    db()
      .prepare(
        `SELECT date(mp.completed_at, 'unixepoch') AS day, COUNT(*) AS n
         FROM module_progress mp
         JOIN modules m ON m.id = mp.module_id
         JOIN courses c ON c.id = m.course_id
         WHERE c.operator_id = ? AND mp.completed_at IS NOT NULL AND mp.completed_at >= ?
         GROUP BY day`,
      )
      .bind(operatorId, sinceMidnight),
    db()
      .prepare(
        `SELECT date(e.started_at, 'unixepoch') AS day, COUNT(*) AS n
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE c.operator_id = ? AND e.started_at >= ?
         GROUP BY day`,
      )
      .bind(operatorId, sinceMidnight),
  ]);

  const compByDay = new Map<string, number>();
  for (const r of (completions.results ?? []) as { day: string; n: number }[]) {
    compByDay.set(r.day, r.n);
  }
  const enrByDay = new Map<string, number>();
  for (const r of (enrolls.results ?? []) as { day: string; n: number }[]) {
    enrByDay.set(r.day, r.n);
  }

  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date((Math.floor(Date.now() / 1000) - i * 86400) * 1000);
    const key = d.toISOString().slice(0, 10);
    points.push({
      date: key,
      module_completions: compByDay.get(key) ?? 0,
      new_learners: enrByDay.get(key) ?? 0,
    });
  }
  return points;
}

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  cover_color: string | null;
  status: string;
  modules: number;
  learners: number;
  updated_at: number;
}

export async function listOperatorCourses(operatorId: string): Promise<CourseSummary[]> {
  const { results } = await db()
    .prepare(
      `SELECT
         c.id, c.slug, c.title, c.emoji, c.cover_color, c.status, c.updated_at,
         (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) AS modules,
         (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e WHERE e.course_id = c.id) AS learners
       FROM courses c
       WHERE c.operator_id = ?
       ORDER BY c.status = 'draft', c.position, c.title`,
    )
    .bind(operatorId)
    .all<CourseSummary>();
  return results ?? [];
}

export interface LearnerRow {
  user_id: string;
  name: string | null;
  email: string;
  agency_name: string | null;
  course_title: string;
  course_id: string;
  completed_count: number;
  total_modules: number;
  progress_pct: number;
  badge_status: "issued" | "pending" | "not_yet";
}

export async function listRecentLearners(operatorId: string, limit = 12): Promise<LearnerRow[]> {
  const { results } = await db()
    .prepare(
      `SELECT
         e.user_id, e.course_id,
         u.name, u.email, u.agency_name,
         c.title AS course_title,
         (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) AS total_modules,
         (SELECT COUNT(*) FROM module_progress mp
            JOIN modules m ON m.id = mp.module_id
            WHERE m.course_id = c.id AND mp.user_id = e.user_id AND mp.completed_at IS NOT NULL
         ) AS completed_count,
         (SELECT verify_code FROM badges WHERE user_id = e.user_id AND course_id = e.course_id LIMIT 1) AS badge_code,
         e.started_at
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u   ON u.id = e.user_id
       WHERE c.operator_id = ?
       ORDER BY e.started_at DESC
       LIMIT ?`,
    )
    .bind(operatorId, limit)
    .all<{
      user_id: string;
      course_id: string;
      name: string | null;
      email: string;
      agency_name: string | null;
      course_title: string;
      total_modules: number;
      completed_count: number;
      badge_code: string | null;
      started_at: number;
    }>();
  return (results ?? []).map((r) => {
    const pct = r.total_modules > 0 ? Math.round((r.completed_count / r.total_modules) * 100) : 0;
    const status: LearnerRow["badge_status"] = r.badge_code
      ? "issued"
      : pct >= 50
        ? "pending"
        : "not_yet";
    return {
      user_id: r.user_id,
      name: r.name,
      email: r.email,
      agency_name: r.agency_name,
      course_id: r.course_id,
      course_title: r.course_title,
      completed_count: r.completed_count,
      total_modules: r.total_modules,
      progress_pct: pct,
      badge_status: status,
    };
  });
}

export interface TopQuestion {
  question: string;
  asks: number;
  source_kind: string; // dominant source for this question
  example_answer: string | null;
}

export async function listTopQuestions(operatorId: string, limit = 8): Promise<TopQuestion[]> {
  const { results } = await db()
    .prepare(
      `SELECT
         question,
         COUNT(*) AS asks,
         (SELECT source_kind FROM qa_logs q2
            WHERE q2.operator_id = ? AND q2.question = qa_logs.question
            ORDER BY q2.created_at DESC LIMIT 1) AS source_kind,
         (SELECT answer FROM qa_logs q3
            WHERE q3.operator_id = ? AND q3.question = qa_logs.question
            ORDER BY q3.created_at DESC LIMIT 1) AS example_answer
       FROM qa_logs
       WHERE operator_id = ?
       GROUP BY question
       ORDER BY asks DESC
       LIMIT ?`,
    )
    .bind(operatorId, operatorId, operatorId, limit)
    .all<TopQuestion>();
  return results ?? [];
}
