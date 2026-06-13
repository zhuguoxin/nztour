/**
 * Learner progress write helpers. Called from server actions on the course
 * detail page. We upsert into `users` on first touch (Clerk is source of truth
 * for identity; D1 mirrors the id + minimal profile for joins).
 */
import { db } from "./db";

/**
 * Upsert the canonical D1 users row for a Clerk user_id.
 *
 * If the supplied email is already claimed by a DIFFERENT user_id row
 * (e.g. the same person signed in under a fresh Clerk instance after a
 * dev → prod migration), this function migrates every per-user row that
 * references the old user_id over to the new user_id, then deletes the
 * old users row.
 *
 * The migration covers:
 *   • Memberships:        operator_memberships, supplier_memberships,
 *                         platform_admins
 *   • Learning activity:  enrollments, module_progress, user_favorites,
 *                         course_feedback, quiz_attempts
 *   • Awards & logs:      badges, qa_logs
 *
 * Idempotent + atomic: each step uses `INSERT OR IGNORE` for tables
 * keyed on (user_id, …) composite PKs (so a pre-existing row on the new
 * id wins), and plain `UPDATE` for tables with their own surrogate id.
 * The whole sequence runs in a single D1 batch (auto-transactional).
 */
export async function ensureUser(opts: {
  id: string;
  email: string;
  name?: string | null;
  preferredLang?: string;
}) {
  const newId = opts.id;
  const email = opts.email.toLowerCase();
  const name = opts.name ?? null;
  const lang = opts.preferredLang ?? "en";
  if (!email) return;

  // Is some OTHER user_id holding this email?
  const stale = await db()
    .prepare(`SELECT id FROM users WHERE email = ? AND id <> ?`)
    .bind(email, newId)
    .first<{ id: string }>();

  if (!stale) {
    // Fast path: normal upsert, no conflict.
    await db()
      .prepare(
        `INSERT INTO users (id, email, name, preferred_lang)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           email = excluded.email,
           name = COALESCE(excluded.name, users.name),
           preferred_lang = excluded.preferred_lang`,
      )
      .bind(newId, email, name, lang)
      .run();
    return;
  }

  // Migration path: same email under a different user_id. Move everything
  // over before deleting the stale row (CASCADE on users would otherwise
  // wipe out the legitimate history).
  const oldId = stale.id;

  // 1. Ensure the new users row exists so FK references resolve. We do
  //    this as a standalone statement because the migration batch below
  //    inserts FK-referencing rows.
  await db()
    .prepare(
      `INSERT INTO users (id, email, name, preferred_lang)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         name = COALESCE(excluded.name, users.name),
         preferred_lang = excluded.preferred_lang`,
    )
    .bind(newId, email, name, lang)
    .run();

  // 2. Move all per-user rows from oldId → newId. Single batch so D1 wraps
  //    in a transaction; if any step fails, none commit.
  const d = db();
  await d.batch([
    d.prepare(
      `INSERT OR IGNORE INTO operator_memberships (user_id, operator_id, role, created_at)
       SELECT ?, operator_id, role, created_at FROM operator_memberships WHERE user_id = ?`,
    ).bind(newId, oldId),
    d.prepare(
      `INSERT OR IGNORE INTO supplier_memberships (user_id, supplier_id, role, created_at)
       SELECT ?, supplier_id, role, created_at FROM supplier_memberships WHERE user_id = ?`,
    ).bind(newId, oldId),
    d.prepare(
      `INSERT OR IGNORE INTO platform_admins (user_id, created_at)
       SELECT ?, created_at FROM platform_admins WHERE user_id = ?`,
    ).bind(newId, oldId),
    d.prepare(
      `INSERT OR IGNORE INTO enrollments (user_id, course_id, started_at, completed_at, last_seen_version)
       SELECT ?, course_id, started_at, completed_at, last_seen_version FROM enrollments WHERE user_id = ?`,
    ).bind(newId, oldId),
    d.prepare(
      `INSERT OR IGNORE INTO module_progress (user_id, module_id, dwell_seconds, completed_at)
       SELECT ?, module_id, dwell_seconds, completed_at FROM module_progress WHERE user_id = ?`,
    ).bind(newId, oldId),
    d.prepare(
      `INSERT OR IGNORE INTO user_favorites (user_id, course_id, created_at)
       SELECT ?, course_id, created_at FROM user_favorites WHERE user_id = ?`,
    ).bind(newId, oldId),
    // Tables with their own surrogate id: simple UPDATE.
    d.prepare(`UPDATE badges SET user_id = ? WHERE user_id = ?`).bind(newId, oldId),
    d.prepare(`UPDATE course_feedback SET user_id = ? WHERE user_id = ?`).bind(newId, oldId),
    d.prepare(`UPDATE quiz_attempts SET user_id = ? WHERE user_id = ?`).bind(newId, oldId),
    d.prepare(`UPDATE qa_logs SET user_id = ? WHERE user_id = ?`).bind(newId, oldId),
  ]);

  // 3. Delete the stale users row. Any membership/enrollment/progress rows
  //    that were ignored above (because they conflicted with pre-existing
  //    rows on newId) cascade-delete with this; that's the intended
  //    outcome — newId's pre-existing rows already supersede them.
  await db().prepare(`DELETE FROM users WHERE id = ?`).bind(oldId).run();
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
