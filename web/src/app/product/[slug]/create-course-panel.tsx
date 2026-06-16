"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTr } from "@/lib/i18n-provider";

/**
 * Real "upload content → generate course" panel on the product dashboard.
 * Replaces the former demo stub: picks a PDF/text file and POSTs it to
 * /api/course/generate (Claude drafts a structured course), then opens the
 * new course's editor. "More options" links to the full new-course screen
 * (title/notes hints + manual mode).
 */
export function CreateCoursePanel({ operatorSlug }: { operatorSlug: string }) {
  const tr = useTr();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  function generate() {
    if (!file) {
      setErr(tr.gen_need_file);
      return;
    }
    setErr(null);
    const fd = new FormData();
    fd.append("operator_slug", operatorSlug);
    fd.append("file", file);
    start(async () => {
      const r = await fetch("/api/course/generate", { method: "POST", body: fd });
      if (r.ok) {
        const d = (await r.json()) as { slug: string };
        router.push(`/product/${operatorSlug}/courses/${d.slug}/edit`);
      } else {
        setErr((await r.text().catch(() => tr.gen_failed)).slice(0, 400) || tr.gen_failed);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="px-5 py-4 border-b border-slate-200">
        <div className="font-semibold text-[14px] text-slate-900">{tr.op_d_upload_title}</div>
        <div className="text-[12px] text-slate-500 mt-0.5">{tr.op_d_upload_sub}</div>
      </header>
      <div className="p-5 space-y-3.5">
        <label
          className={`flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition ${
            pending
              ? "opacity-50 cursor-not-allowed border-slate-300"
              : "border-emerald-400/40 hover:border-emerald-400/70 bg-emerald-600/[.03]"
          }`}
        >
          <span className="text-[28px] leading-none">📤</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13.5px] text-slate-900 truncate">
              {file ? file.name : tr.gen_file_pick}
            </span>
            <span className="block text-[11.5px] text-slate-500">{tr.gen_file_hint}</span>
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

        {err ? (
          <div className="text-[12px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2 break-words">
            {err}
          </div>
        ) : null}

        {pending ? (
          <div className="text-[12.5px] text-amber-600 flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
            {tr.gen_generating}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={pending || !file}
            className={`px-4 py-2 rounded-md font-semibold text-[13px] ${
              pending || !file
                ? "bg-slate-500/40 text-slate-900/50 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {tr.gen_button}
          </button>
          <Link
            href={`/product/${operatorSlug}/courses/new`}
            className="text-[12.5px] text-slate-600 hover:text-slate-900 hover:underline"
          >
            {tr.op_d_upload_more}
          </Link>
        </div>
      </div>
    </section>
  );
}
