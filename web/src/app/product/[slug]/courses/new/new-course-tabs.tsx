"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCourse } from "../actions";
import { useTr } from "@/lib/i18n-provider";

/**
 * New-course screen with two modes:
 *   • "Generate from a document" — upload a PDF/text file; /api/course/generate
 *     uses Claude to draft a structured course, then we open its editor.
 *   • "Create manually" — the classic title/summary form (createCourse action).
 */
export function NewCourseTabs({ operatorSlug }: { operatorSlug: string }) {
  const tr = useTr();
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  return (
    <div className="mt-8">
      {/* Tabs */}
      <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={`px-4 py-2 rounded-md text-small font-medium transition ${
            mode === "ai" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          ✨ {tr.nc_tab_ai}
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded-md text-small font-medium transition ${
            mode === "manual" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {tr.nc_tab_manual}
        </button>
      </div>

      {mode === "ai" ? (
        <GenerateForm operatorSlug={operatorSlug} />
      ) : (
        <ManualForm operatorSlug={operatorSlug} />
      )}
    </div>
  );
}

function GenerateForm({ operatorSlug }: { operatorSlug: string }) {
  const tr = useTr();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  function submit() {
    if (!file) {
      setErr(tr.gen_need_file);
      return;
    }
    setErr(null);
    const fd = new FormData();
    fd.append("operator_slug", operatorSlug);
    fd.append("file", file);
    if (title.trim()) fd.append("title", title.trim());
    if (notes.trim()) fd.append("notes", notes.trim());
    startTransition(async () => {
      const r = await fetch("/api/course/generate", { method: "POST", body: fd });
      if (r.ok) {
        const d = (await r.json()) as { slug: string };
        router.push(`/product/${operatorSlug}/courses/${d.slug}/edit`);
      } else {
        const msg = await r.text().catch(() => tr.gen_failed);
        setErr(msg.slice(0, 400));
      }
    });
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <p className="text-small text-slate-600 leading-relaxed">{tr.gen_sub}</p>

      {/* File picker */}
      <div>
        <div className="text-small font-semibold text-slate-700 mb-1.5">{tr.gen_file}</div>
        <label
          className={`flex items-center gap-3 rounded-md border border-dashed px-4 py-3.5 cursor-pointer transition ${
            pending
              ? "opacity-50 cursor-not-allowed border-slate-300"
              : "border-emerald-400/40 hover:border-emerald-400/70 bg-white"
          }`}
        >
          <span className="text-h3">📄</span>
          <span className="flex-1 min-w-0">
            <span className="block text-small text-slate-900 truncate">
              {file ? file.name : tr.gen_file_pick}
            </span>
            <span className="block text-caption text-slate-500">{tr.gen_file_hint}</span>
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
            disabled={pending}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setErr(null);
            }}
            className="hidden"
          />
        </label>
      </div>

      <Field label={tr.gen_title_label} hint={tr.gen_title_hint}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          disabled={pending}
          placeholder={tr.gen_title_ph}
          className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-small text-slate-900 outline-none focus:border-emerald-400/60 disabled:opacity-50"
        />
      </Field>

      <Field label={tr.gen_notes_label} hint={tr.gen_notes_hint}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          disabled={pending}
          placeholder={tr.gen_notes_ph}
          className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-small text-slate-900 outline-none focus:border-emerald-400/60 resize-y disabled:opacity-50"
        />
      </Field>

      {err ? (
        <div className="text-caption text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2 break-words">
          {err}
        </div>
      ) : null}

      {pending ? (
        <div className="text-caption text-slate-900 flex items-center gap-2">
          <span className="inline-block w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
          {tr.gen_generating}
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !file}
          className={`px-5 py-2.5 rounded-md font-semibold text-small ${
            pending || !file
              ? "bg-slate-500/50 text-slate-900/60 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {pending ? tr.gen_generating.split("…")[0] + "…" : tr.gen_button}
        </button>
        <Link
          href={`/product/${operatorSlug}`}
          className="px-4 py-2.5 rounded-md border border-slate-300 text-slate-700 text-small hover:bg-slate-50"
        >
          {tr.nc_cancel}
        </Link>
      </div>
    </div>
  );
}

function ManualForm({ operatorSlug }: { operatorSlug: string }) {
  const tr = useTr();
  return (
    <div className="max-w-2xl">
      <p className="text-small text-slate-600 mb-6">{tr.nc_manual_sub}</p>
      <form action={createCourse} className="space-y-5">
        <input type="hidden" name="operator_slug" value={operatorSlug} />

        <Field label={tr.nc_f_title} hint={tr.nc_f_title_hint}>
          <input
            name="title"
            required
            maxLength={200}
            placeholder="e.g. Coronet Peak 2026"
            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-small text-slate-900 outline-none focus:border-emerald-400/60"
          />
        </Field>

        <Field label={tr.nc_f_summary} hint={tr.nc_f_summary_hint}>
          <textarea
            name="summary"
            rows={3}
            maxLength={1000}
            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-small text-slate-900 outline-none focus:border-emerald-400/60 resize-y"
          />
        </Field>

        <Field label={tr.nc_f_est} hint={tr.nc_f_est_hint}>
          <input
            name="est_minutes"
            type="number"
            min={1}
            max={600}
            placeholder="25"
            className="w-full max-w-[200px] bg-white border border-slate-300 rounded-md px-3 py-2.5 text-small text-slate-900 outline-none focus:border-emerald-400/60"
          />
        </Field>

        <Field label={tr.nc_f_lang} hint={tr.nc_f_lang_hint}>
          <select
            name="primary_lang"
            defaultValue="en"
            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-small text-slate-900 outline-none focus:border-emerald-400/60"
          >
            <option value="en">English</option>
            <option value="zh-CN">Chinese (Simplified)</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
          </select>
        </Field>

        <div className="flex items-center gap-3 pt-3">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-md bg-emerald-600 text-white font-semibold text-small hover:bg-emerald-700"
          >
            {tr.nc_create}
          </button>
          <Link
            href={`/product/${operatorSlug}`}
            className="px-4 py-2.5 rounded-md border border-slate-300 text-slate-700 text-small hover:bg-slate-50"
          >
            {tr.nc_cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-small font-semibold text-slate-700">{label}</span>
        {hint ? <span className="text-caption text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
