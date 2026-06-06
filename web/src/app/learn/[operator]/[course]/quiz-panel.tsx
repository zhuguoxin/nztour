"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitQuizAttemptAction } from "../../actions";

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
}

/**
 * Inline end-of-chapter quiz. Rendered above the reader's nav buttons
 * when the active module has questions in its pool. Passing marks the
 * module complete (server-side) and refreshes the page so the next module
 * unlocks and the progress bar advances.
 *
 * Behavior:
 *   - Questions are pre-randomized server-side (page sends 3 each visit).
 *   - User picks one radio per question.
 *   - Submit posts answer indices. Server grades, returns score + per-q
 *     correctness. UI shows per-question result + explanation on fail.
 *   - On pass: router.refresh() → page re-fetches with module completed.
 *   - On fail: keeps the same questions visible with results; user can
 *     re-try with a fresh set by clicking "Try a new set".
 */
export function QuizPanel({
  moduleId,
  courseId,
  questions,
  isCompleted,
}: {
  moduleId: string;
  courseId: string;
  questions: QuizQuestion[];
  isCompleted: boolean;
}) {
  const router = useRouter();
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
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[.05] px-4 py-3 text-[13px] text-emerald-300 mb-4">
        ✓ You&apos;ve passed this chapter&apos;s quiz.
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
          moduleId,
          courseId,
          questionIds: qids,
          answerIdx: ans,
        });
        setResult({ score: r.score, total: r.total, passed: r.passed, perQ: r.results });
        if (r.passed) {
          // Server already marked the module complete; refresh so nav
          // unlocks the next module + the complete CTA flips.
          router.refresh();
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to submit");
      }
    });
  }

  return (
    <section className="rounded-xl border border-amber-400/30 bg-amber-400/[.05] p-4 mb-4">
      <div className="text-[11px] font-mono uppercase tracking-widest text-amber-300 mb-1">
        End-of-chapter quiz
      </div>
      <div className="text-[14px] text-white font-semibold mb-3">
        Answer {questions.length} questions to continue — pass {Math.ceil((2 * questions.length) / 3)} of {questions.length}.
      </div>

      <ol className="space-y-4">
        {questions.map((q, qi) => {
          const correct = result?.perQ[qi];
          return (
            <li key={q.id}>
              <div className="text-[14px] text-[#e6f5ec] mb-2">
                <span className="text-amber-300 font-mono mr-2">Q{qi + 1}.</span>
                {q.prompt}
              </div>
              <div className="space-y-1.5">
                {q.choices.map((c, ci) => {
                  const checked = answers[q.id] === ci;
                  const showResultMarker = result && checked;
                  return (
                    <label
                      key={ci}
                      className={`flex items-start gap-2 px-3 py-2 rounded border cursor-pointer text-[13.5px] ${
                        checked
                          ? showResultMarker
                            ? correct
                              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
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
                <div className="text-[12px] text-rose-300/90 mt-2">
                  ✗ Incorrect.
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-[13px] text-[#a7d4b6]">
          {result ? (
            result.passed ? (
              <span className="text-emerald-300 font-semibold">
                ✓ Passed {result.score}/{result.total} — next chapter unlocked
              </span>
            ) : (
              <span className="text-rose-300">
                Scored {result.score}/{result.total}. Review and try a new set.
              </span>
            )
          ) : !allAnswered ? (
            `Answered ${Object.keys(answers).length}/${questions.length}`
          ) : (
            "Ready to submit"
          )}
        </div>
        {result ? (
          result.passed ? null : (
            <button
              type="button"
              onClick={() => router.refresh()}
              className="px-4 py-2 rounded-md border border-white/[.10] text-[#d8f0e1] hover:bg-white/[.06] text-[13px]"
            >
              Try a new set
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered || pending}
            className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[13px] hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Grading…" : "Submit answers"}
          </button>
        )}
      </div>
    </section>
  );
}
