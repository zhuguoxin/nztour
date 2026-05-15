/**
 * Learner progress write helpers. Called from server actions on the course
 * detail page. We upsert into `users` on first touch (Clerk is source of truth
 * for identity; D1 mirrors the id + minimal profile for joins).
 */
import { db } from "./db";

export async function ensureUser(opts: {
  id: string;
  email: string;
  name?: string | null;
  preferredLang?: string;
}) {
  await db()
    .prepare(
      `INSERT INTO users (id, email, name, preferred_lang)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         name = COALESCE(excluded.name, users.name),
         preferred_lang = excluded.preferred_lang`,
    )
    .bind(opts.id, opts.email, opts.name ?? null, opts.preferredLang ?? "en")
    .run();
}

export async function ensureEnrollment(userId: string, courseId: string) {
  await db()
    .prepare(
      `INSERT INTO enrollments (user_id, course_id)
       VALUES (?, ?)
       ON CONFLICT(user_id, course_id) DO NOTHING`,
    )
    .bind(userId, courseId)
    .run();
}

export async function markModuleComplete(
  userId: string,
  moduleId: string,
  dwellSeconds: number,
) {
  await db()
    .prepare(
      `INSERT INTO module_progress (user_id, module_id, dwell_seconds, completed_at)
       VALUES (?, ?, ?, unixepoch())
       ON CONFLICT(user_id, module_id) DO UPDATE SET
         dwell_seconds = MAX(module_progress.dwell_seconds, excluded.dwell_seconds),
         completed_at  = COALESCE(module_progress.completed_at, excluded.completed_at)`,
    )
    .bind(userId, moduleId, Math.max(0, Math.floor(dwellSeconds)))
    .run();
}

export interface ModuleProgress {
  module_id: string;
  dwell_seconds: number;
  completed_at: number | null;
}

export async function getModuleProgress(
  userId: string,
  courseId: string,
): Promise<Map<string, ModuleProgress>> {
  const { results } = await db()
    .prepare(
      `SELECT mp.module_id, mp.dwell_seconds, mp.completed_at
       FROM module_progress mp
       JOIN modules m ON m.id = mp.module_id
       WHERE mp.user_id = ? AND m.course_id = ?`,
    )
    .bind(userId, courseId)
    .all<ModuleProgress>();
  const map = new Map<string, ModuleProgress>();
  for (const r of results ?? []) map.set(r.module_id, r);
  return map;
}

/** Award a badge when all modules are completed. Idempotent. */
export async function maybeAwardBadge(
  userId: string,
  courseId: string,
): Promise<{ awarded: boolean; verifyCode?: string }> {
  // Count modules and completions
  const counts = await db()
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM modules WHERE course_id = ?) AS total,
         (SELECT COUNT(*) FROM module_progress mp
            JOIN modules m ON m.id = mp.module_id
            WHERE m.course_id = ? AND mp.user_id = ? AND mp.completed_at IS NOT NULL) AS done`,
    )
    .bind(courseId, courseId, userId)
    .first<{ total: number; done: number }>();
  if (!counts || counts.total === 0 || counts.done < counts.total) {
    return { awarded: false };
  }

  // Check existing
  const existing = await db()
    .prepare(`SELECT verify_code FROM badges WHERE user_id = ? AND course_id = ?`)
    .bind(userId, courseId)
    .first<{ verify_code: string }>();
  if (existing) return { awarded: false, verifyCode: existing.verify_code };

  // Get operator
  const op = await db()
    .prepare(`SELECT operator_id FROM courses WHERE id = ?`)
    .bind(courseId)
    .first<{ operator_id: string }>();
  if (!op) return { awarded: false };

  // Mark enrollment complete
  await db()
    .prepare(
      `UPDATE enrollments SET completed_at = unixepoch() WHERE user_id = ? AND course_id = ?`,
    )
    .bind(userId, courseId)
    .run();

  // Issue badge with short verify code
  const code = generateVerifyCode();
  const badgeId = `b_${code}`;
  await db()
    .prepare(
      `INSERT INTO badges (id, verify_code, user_id, course_id, operator_id) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(badgeId, code, userId, courseId, op.operator_id)
    .run();

  return { awarded: true, verifyCode: code };
}

// ULID-ish short code: 10 chars, Crockford base32, time-prefixed
function generateVerifyCode(): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const now = Date.now();
  const timePart = now.toString(32).slice(-6).toUpperCase();
  const rand = new Uint8Array(4);
  crypto.getRandomValues(rand);
  let r = "";
  for (const b of rand) r += alphabet[b % alphabet.length];
  return `${timePart}${r}`;
}
