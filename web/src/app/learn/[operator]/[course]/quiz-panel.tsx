"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitQuizAttemptAction } from "../../actions";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
}

/**
 * Course-level final exam. Rendered on the "Final exam" entry after all
 * chapters. Passing it awards the course badge (server-side) and refreshes
 * the page.
 *
 * Behavior:
 *   - Questions are pre-randomized server-side (page sends N each visit).
 *   - User picks one radio per question.
 *   - Submit posts answer indices. Server grades, returns score + per-q
 *     correctness. UI shows per-question result on fail.
 *   - On pass: router.refresh() → page re-fetches with badge earned.
 *   - On fail: user can re-try with a fresh set by clicking "Try a new set".
 */
export function QuizPanel({
  courseId,
  questions,
  isCompleted,
}: {
  courseId: string;
  questions: QuizQuestion[];
  isCompleted: boolean;
}) {
  const router = useRouter();
  const tr = useTr();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    passed: boolean;
    perQ: boolean[];
  } | null>(null);
  const [pending, startTransition] = useTransition();

  if (questions.length === 0) return null;
  if (isCompleted) {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[.05] px-4 py-3 text-small text-[#e6f5ec] mb-4">
        {tr.lr_quiz_passed_chip}
      </div>
    );
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  function submit() {
    if (!allAnswered) return;
    const qids = questions.map((q) => q.id);
    const ans = qids.map((id) => answers[id]);
    startTransition(async () => {
      try {
        const r = await submitQuizAttemptAction({
          courseId,
          questionIds: qids,
          answerIdx: ans,
        });
        setResult({ score: r.score, total: r.total, passed: r.passed, perQ: r.results });
        if (r.passed) {
          // Server already awarded the badge; refresh so the exam shows as
          // passed and the badge surfaces.
          router.refresh();
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : tr.lr_quiz_submit_failed);
      }
    });
  }

  return (
    <section className="rounded-xl border border-amber-400/30 bg-amber-400/[.05] p-4 mb-4">
      <div className="text-micro font-mono uppercase tracking-widest text-[#e6f5ec] mb-1">
        {tr.lr_quiz_heading}
      </div>
      <div className="text-small text-white font-semibold mb-3">
        {fmt(tr.lr_quiz_instructions, { n: questions.length, pass: Math.ceil((2 * questions.length) / 3) })}
      </div>

      <ol className="space-y-4">
        {questions.map((q, qi) => {
          const correct = result?.perQ[qi];
          return (
            <li key={q.id}>
              <div className="text-small text-[#e6f5ec] mb-2">
                <span className="text-[#e6f5ec] font-mono mr-2">{fmt(tr.lr_quiz_q_prefix, { n: qi + 1 })}</span>
                {q.prompt}
              </div>
              <div className="space-y-1.5">
                {q.choices.map((c, ci) => {
                  const checked = answers[q.id] === ci;
                  const showResultMarker = result && checked;
                  return (
                    <label
                      key={ci}
                      className={`flex items-start gap-2 px-3 py-2 rounded border cursor-pointer text-small ${
                        checked
                          ? showResultMarker
                            ? correct
                              ? "border-emerald-400/50 bg-emerald-400/10 text-[#e6f5ec]"
                              : "border-rose-400/50 bg-rose-400/10 text-rose-200"
                            : "border-emerald-400/50 bg-emerald-400/10 text-white"
                          : "border-white/[.10] text-[#d8f0e1] hover:bg-white/[.04]"
                      } ${result ? "cursor-default" : ""}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={checked}
                        onChange={() => !result && setAnswers({ ...answers, [q.id]: ci })}
                        disabled={!!result || pending}
                        className="mt-1 accent-emerald-400"
                      />
                      <span>{c}</span>
                    </label>
                  );
                })}
              </div>
              {result && !correct ? (
                <div className="text-caption text-rose-300/90 mt-2">
                  {tr.lr_quiz_incorrect}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-small text-[#a7d4b6]">
          {result ? (
            result.passed ? (
              <span className="text-[#e6f5ec] font-semibold">
                {fmt(tr.lr_quiz_passed_result, { score: result.score, total: result.total })}
              </span>
            ) : (
              <span className="text-rose-300">
                {fmt(tr.lr_quiz_failed_result, { score: result.score, total: result.total })}
              </span>
            )
          ) : !allAnswered ? (
            fmt(tr.lr_quiz_answered, { answered: Object.keys(answers).length, total: questions.length })
          ) : (
            tr.lr_quiz_ready
          )}
        </div>
        {result ? (
          result.passed ? null : (
            <button
              type="button"
              onClick={() => router.refresh()}
              className="px-4 py-2 rounded-md border border-white/[.10] text-[#d8f0e1] hover:bg-white/[.06] text-small"
            >
              {tr.lr_quiz_try_new}
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered || pending}
            className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-small hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? tr.lr_quiz_grading : tr.lr_quiz_submit}
          </button>
        )}
      </div>
    </section>
  );
}
