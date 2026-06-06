"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Toggle a course in the current user's favorites. Idempotent — caller can
 * just send the desired final state via `favorite`.
 *
 * Used by the heart button on course cards and inside the reader header.
 * No auth check on courseId — favoriting a non-existent course just no-ops
 * (FK constraint would throw otherwise but ON DELETE CASCADE means we'd
 * harmlessly insert and then it'd be wiped if the course were deleted).
 */
export async function toggleFavoriteAction(input: {
  courseId: string;
  favorite: boolean;
}): Promise<{ favorite: boolean }> {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthenticated");
  if (input.favorite) {
    await db()
      .prepare(`INSERT OR IGNORE INTO user_favorites (user_id, course_id) VALUES (?, ?)`)
      .bind(userId, input.courseId)
      .run();
  } else {
    await db()
      .prepare(`DELETE FROM user_favorites WHERE user_id = ? AND course_id = ?`)
      .bind(userId, input.courseId)
      .run();
  }
  revalidatePath("/learn");
  return { favorite: input.favorite };
}

/**
 * Bump the learner's last_seen_version for a course to the course's current
 * published_version. Called on every reader visit. After this call the
 * "Updated" chip disappears until the operator publishes again.
 */
export async function markCourseSeenAction(input: { courseId: string }): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;
  await db()
    .prepare(
      `UPDATE enrollments
         SET last_seen_version = (SELECT published_version FROM courses WHERE id = ?)
       WHERE user_id = ? AND course_id = ?`,
    )
    .bind(input.courseId, userId, input.courseId)
    .run();
}

/**
 * Quiz attempt — record what was answered and grade it. If the score meets
 * the pass threshold (2 of 3 by default), mark the module complete as a
 * side effect (so the learner doesn't need a separate "complete module"
 * click after passing).
 *
 * `questionIds` and `answerIdx` must be the same length. The server
 * re-derives correctness from quiz_questions so the client cannot lie.
 */
export async function submitQuizAttemptAction(input: {
  moduleId: string;
  courseId: string;
  questionIds: string[];
  answerIdx: number[];
}): Promise<{ score: number; total: number; passed: boolean; results: boolean[] }> {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthenticated");
  if (input.questionIds.length !== input.answerIdx.length || input.questionIds.length === 0) {
    throw new Error("malformed attempt");
  }

  const ph = input.questionIds.map(() => "?").join(",");
  const { results } = await db()
    .prepare(`SELECT id, correct_idx FROM quiz_questions WHERE module_id = ? AND id IN (${ph})`)
    .bind(input.moduleId, ...input.questionIds)
    .all<{ id: string; correct_idx: number }>();
  const correctMap = new Map((results ?? []).map((r) => [r.id, r.correct_idx]));

  const perQ: boolean[] = input.questionIds.map((qid, i) => {
    const c = correctMap.get(qid);
    return typeof c === "number" && c === input.answerIdx[i];
  });
  const score = perQ.filter(Boolean).length;
  const total = input.questionIds.length;
  const PASS_THRESHOLD = Math.ceil((2 * total) / 3); // ≥ 2/3 round-up
  const passed = score >= PASS_THRESHOLD;

  const id = `qa_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await db()
    .prepare(
      `INSERT INTO quiz_attempts
         (id, user_id, module_id, question_ids, answers_json, score, total, passed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      userId,
      input.moduleId,
      JSON.stringify(input.questionIds),
      JSON.stringify(input.answerIdx),
      score,
      total,
      passed ? 1 : 0,
    )
    .run();

  // On pass: mark module complete. If this was the last module, badge issue
  // happens via completeModuleAction's existing flow — but we duplicate that
  // logic minimally here so the quiz pass IS the trigger.
  if (passed) {
    const { markModuleComplete, maybeAwardBadge } = await import("@/lib/progress");
    await markModuleComplete(userId, input.moduleId, 30);
    await maybeAwardBadge(userId, input.courseId);
  }

  revalidatePath(`/learn/[operator]/[course]`, "page");
  return { score, total, passed, results: perQ };
}

/**
 * Submit course feedback (1-5 star + optional text). One row per submission;
 * users can submit multiple times — the latest dominates for "satisfaction"
 * aggregate on the operator dashboard.
 */
export async function submitFeedbackAction(input: {
  courseId: string;
  moduleId?: string;
  rating: number;
  text?: string;
}): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthenticated");
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const id = `fb_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await db()
    .prepare(
      `INSERT INTO course_feedback (id, user_id, course_id, module_id, rating, text)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      userId,
      input.courseId,
      input.moduleId ?? null,
      rating,
      (input.text ?? "").trim().slice(0, 2000) || null,
    )
    .run();
}
