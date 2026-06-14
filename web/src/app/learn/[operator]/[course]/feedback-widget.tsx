"use client";

import { useState, useTransition } from "react";
import { submitFeedbackAction } from "../../actions";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";

/**
 * Persistent feedback widget that sits below the AI Q&A sidebar.
 *
 * Per the partner PRD, the learner is "continuously prompted" to give
 * feedback during training. Rather than burying this behind a tab we keep
 * a one-line collapsed prompt visible at all times; clicking expands a
 * compact 5-star + optional-text form. Submission is one row in
 * course_feedback; users can submit any number of times.
 *
 * Reuses the same dark-theme palette as the course chrome so it blends
 * with the operator-themed sidebar.
 */
export function FeedbackWidget({
  courseId,
  moduleId,
}: {
  courseId: string;
  moduleId?: string;
}) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (rating < 1) return;
    startTransition(async () => {
      try {
        await submitFeedbackAction({ courseId, moduleId, rating, text });
        setDone(true);
        setTimeout(() => {
          setOpen(false);
          setDone(false);
          setRating(0);
          setText("");
        }, 2200);
      } catch (err) {
        alert(err instanceof Error ? err.message : tr.lr_fb_submit_failed);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-3 py-2 border-t border-white/[.06] text-left bg-emerald-400/[.02] hover:bg-emerald-400/[.06] flex items-center justify-between"
      >
        <span className="text-[12.5px] text-[#a7d4b6]">
          <span className="text-emerald-300">💬</span> {tr.lr_fb_prompt}
        </span>
        <span className="text-[#5d9279] text-[11px]">{tr.lr_fb_click_to_rate}</span>
      </button>
    );
  }

  return (
    <div className="border-t border-white/[.06] bg-emerald-400/[.04] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] text-white font-semibold">{tr.lr_fb_rate_title}</div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setRating(0);
            setText("");
          }}
          className="text-[#a7d4b6] hover:text-white text-[11px]"
        >
          {tr.lr_fb_dismiss}
        </button>
      </div>

      <Stars value={rating} onChange={setRating} disabled={done || pending} />

      <textarea
        rows={2}
        maxLength={2000}
        placeholder={tr.lr_fb_placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={done || pending}
        className="w-full bg-[#04241e] border border-white/[.10] rounded-md px-2 py-1.5 text-[12.5px] text-white outline-none focus:border-emerald-400/60 resize-none"
      />

      <div className="flex items-center justify-between">
        <div className="text-[11px] text-[#86b69a]">
          {done ? (
            <span className="text-emerald-300">{tr.lr_fb_thanks}</span>
          ) : rating === 0 ? (
            tr.lr_fb_pick_star
          ) : null}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={rating < 1 || done || pending}
          className="px-3 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[12px] hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? tr.lr_fb_sending : done ? tr.lr_fb_sent : tr.lr_fb_send}
        </button>
      </div>
    </div>
  );
}

function Stars({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  const tr = useTr();
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`text-[22px] transition disabled:cursor-default ${
              on ? "text-amber-300" : "text-[#395a4a] hover:text-amber-300/60"
            }`}
            aria-label={fmt(n === 1 ? tr.lr_fb_star_one : tr.lr_fb_star_many, { n })}
            title={fmt(n === 1 ? tr.lr_fb_star_one : tr.lr_fb_star_many, { n })}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
