"use client";

import {
  createQuizQuestion,
  deleteQuizQuestion,
  generateCourseQuiz,
} from "../../actions";
import type { QuizQuestionData } from "./editor-modules";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";

/**
 * Course-level final-exam authoring.
 *
 * Quizzes are no longer per-module: a single question pool belongs to the
 * whole course. Learners sit one final exam after all chapters, and the
 * badge gate is passing that exam. This panel renders after the modules in
 * the editor's centre column.
 */
export function CourseQuizAuthor({
  questions,
  operatorSlug,
  courseSlug,
}: {
  questions: QuizQuestionData[];
  operatorSlug: string;
  courseSlug: string;
}) {
  const tr = useTr();
  return (
    <section className="rounded-2xl border border-amber-400/30 bg-amber-400/[.04] overflow-hidden">
      <header className="px-5 py-4 border-b border-amber-400/20 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-small text-slate-900">
            {tr.cq_title}
            <span className="ml-2 text-micro text-slate-500 font-normal">
              {fmt(questions.length === 1 ? tr.em_quiz_count_one : tr.em_quiz_count_many, {
                n: questions.length,
              })}
            </span>
          </div>
          <div className="text-caption text-slate-500 mt-0.5">{tr.cq_subtitle}</div>
        </div>
        <form action={generateCourseQuiz} className="inline-flex">
          <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
          <input type="hidden" name="count" value="5" />
          <button
            type="submit"
            className="px-2.5 py-1 rounded border border-amber-400/50 text-slate-900 hover:bg-amber-400/10 text-micro"
            title={tr.cq_generate_title}
          >
            {tr.em_quiz_gen5}
          </button>
        </form>
      </header>

      <div className="p-4">
        {questions.length === 0 ? (
          <div className="text-caption text-slate-500 mb-3">{tr.cq_empty}</div>
        ) : (
          <ol className="space-y-1.5 mb-3">
            {questions.map((q) => {
              let choices: string[] = [];
              try {
                choices = JSON.parse(q.choices_json);
              } catch {
                // skip
              }
              return (
                <li
                  key={q.id}
                  className="bg-white rounded border border-slate-200 px-2.5 py-1.5 flex items-start gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-caption text-slate-900">{q.prompt}</div>
                    <div className="text-micro text-slate-500">
                      {choices.map((c, i) => (
                        <span key={i} className={i === q.correct_idx ? "text-slate-900" : ""}>
                          {i === q.correct_idx ? "✓ " : ""}
                          {c}
                          {i < choices.length - 1 ? " · " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <form action={deleteQuizQuestion} className="inline-flex">
                    <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
                    <input type="hidden" name="question_id" value={q.id} />
                    <button
                      type="submit"
                      className="px-1.5 py-0.5 rounded text-rose-600/80 hover:bg-rose-400/10 text-micro"
                      title={tr.em_quiz_delete_q}
                    >
                      ✕
                    </button>
                  </form>
                </li>
              );
            })}
          </ol>
        )}

        <NewQuestionForm operatorSlug={operatorSlug} courseSlug={courseSlug} />
      </div>
    </section>
  );
}

function Hidden({ operatorSlug, courseSlug }: { operatorSlug: string; courseSlug: string }) {
  return (
    <>
      <input type="hidden" name="operator_slug" value={operatorSlug} />
      <input type="hidden" name="course_slug" value={courseSlug} />
    </>
  );
}

function NewQuestionForm({
  operatorSlug,
  courseSlug,
}: {
  operatorSlug: string;
  courseSlug: string;
}) {
  const tr = useTr();
  return (
    <form action={createQuizQuestion} className="grid grid-cols-1 gap-1.5 text-caption">
      <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
      <input
        type="text"
        name="prompt"
        required
        maxLength={500}
        placeholder={tr.em_quiz_q_ph}
        className={inputClass + " text-caption"}
      />
      <div className="grid grid-cols-[1fr_1fr] gap-1.5">
        <input type="text" name="c0" required placeholder={tr.em_quiz_choice_a} className={inputClass + " text-caption"} />
        <input type="text" name="c1" required placeholder={tr.em_quiz_choice_b} className={inputClass + " text-caption"} />
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-1.5">
        <input type="text" name="c2" placeholder={tr.em_quiz_choice_c} className={inputClass + " text-caption"} />
        <input type="text" name="c3" placeholder={tr.em_quiz_choice_d} className={inputClass + " text-caption"} />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-micro text-slate-600">{tr.em_quiz_correct}:</label>
        <select name="correct_idx" defaultValue="0" className={inputClass + " w-20 text-caption"}>
          <option value="0">A</option>
          <option value="1">B</option>
          <option value="2">C</option>
          <option value="3">D</option>
        </select>
        <input
          type="text"
          name="explanation"
          placeholder={tr.em_quiz_explanation_ph}
          maxLength={1000}
          className={inputClass + " flex-1 text-caption"}
        />
        <SubmitChoicesAsJson />
        <button
          type="submit"
          className="px-3 py-1.5 rounded bg-amber-400 text-slate-900 font-semibold text-caption hover:bg-amber-300 shrink-0"
        >
          {tr.em_quiz_add_short}
        </button>
      </div>
    </form>
  );
}

/** Bundle c0..c3 inputs into choices_json before form submit. */
function SubmitChoicesAsJson() {
  return (
    <input
      type="hidden"
      name="choices_json"
      defaultValue=""
      ref={(node) => {
        if (!node) return;
        const form = node.form;
        if (!form) return;
        form.addEventListener(
          "submit",
          () => {
            const choices = (["c0", "c1", "c2", "c3"] as const)
              .map((n) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value?.trim() ?? "")
              .filter((s) => s.length > 0);
            node.value = JSON.stringify(choices);
          },
          { once: true },
        );
      }}
    />
  );
}

const inputClass =
  "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-small text-slate-900 outline-none focus:border-emerald-400/60";
