"use client";

import { useTransition } from "react";
import { deleteCourseAttachment } from "../../actions";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";
import type { Dict } from "@/lib/i18n";

export interface AttachmentRow {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  rag_status: string;
  created_at: number;
}

/**
 * Course-level supplementary materials uploader.
 *
 * These files (PDF / TXT / Markdown / DOCX) are RAG-only — fed to the AI
 * assistant for Q&A but never rendered in /learn. Use for rate sheets,
 * internal SOPs, supplier docs the agent shouldn't be forced to read
 * linearly.
 *
 * Upload posts to /api/upload/attachment which:
 *   1. Writes the file to R2 under attachments/<course_id>/<id>.<ext>
 *   2. Inserts course_attachments row with rag_status='pending'
 *   3. Best-effort enqueues for the parse worker
 *
 * The rag_status badge reflects ingestion progress (pending → ready/failed).
 */
export function AttachmentsPanel({
  operatorSlug,
  courseSlug,
  attachments,
}: {
  operatorSlug: string;
  courseSlug: string;
  attachments: AttachmentRow[];
}) {
  const [pending, startTransition] = useTransition();
  const tr = useTr();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("operator_slug", operatorSlug);
    fd.append("course_slug", courseSlug);
    startTransition(async () => {
      const r = await fetch("/api/upload/attachment", { method: "POST", body: fd });
      if (r.ok) {
        window.location.reload();
      } else {
        const msg = await r.text().catch(() => tr.ui_upload_failed);
        alert(msg.slice(0, 300));
      }
    });
    e.target.value = "";
  }

  return (
    <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
      <header className="px-5 py-4 border-b border-white/[.06]">
        <div className="font-semibold text-[14px] text-white">
          {tr.at_title}
          <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] uppercase font-mono">
            {tr.at_ai_only}
          </span>
        </div>
        <div className="text-[12px] text-[#86b69a] mt-0.5">
          {tr.at_subtitle}
        </div>
      </header>

      <div className="divide-y divide-white/[.04]">
        {attachments.length === 0 ? (
          <div className="px-5 py-6 text-center text-[13px] text-[#86b69a]">
            {tr.at_empty}
          </div>
        ) : (
          attachments.map((a) => (
            <div key={a.id} className="px-5 py-3 flex items-center gap-3">
              <span className="text-[#86b69a] text-[18px] w-6 text-center" aria-hidden>
                {iconFor(a.mime_type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] text-white truncate">{a.filename}</div>
                <div className="text-[11px] text-[#86b69a] flex items-center gap-2">
                  <span>{fmtBytes(a.size_bytes)}</span>
                  <span className="text-[#395a4a]">·</span>
                  <RagBadge status={a.rag_status} />
                  <span className="text-[#395a4a]">·</span>
                  <span>{fmt(tr.at_uploaded_rel, { rel: fmtRelative(a.created_at, tr) })}</span>
                </div>
              </div>
              <form action={deleteCourseAttachment} className="inline-flex">
                <input type="hidden" name="operator_slug" value={operatorSlug} />
                <input type="hidden" name="course_slug" value={courseSlug} />
                <input type="hidden" name="attachment_id" value={a.id} />
                <button
                  type="submit"
                  className="px-2 py-1 rounded text-rose-300/80 hover:bg-rose-400/10 text-[11px]"
                  title={tr.at_delete}
                >
                  ✕
                </button>
              </form>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-4 border-t border-white/[.04]">
        <label className="flex items-center gap-3 text-[12px] text-[#d8f0e1] cursor-pointer">
          <span className="px-3 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[12px] hover:bg-emerald-300">
            {pending ? tr.at_uploading : tr.at_add_file}
          </span>
          <span className="text-[11px] text-[#86b69a]">
            {tr.at_add_hint}
          </span>
          <input
            type="file"
            accept="application/pdf,text/plain,text/markdown,.docx"
            disabled={pending}
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      </div>
    </section>
  );
}

function RagBadge({ status }: { status: string }) {
  const tr = useTr();
  const cfg =
    status === "ready"
      ? { cls: "border-emerald-400/30 text-emerald-300 bg-emerald-400/[.06]", label: tr.at_rag_ready }
      : status === "failed"
        ? { cls: "border-rose-400/30 text-rose-300 bg-rose-400/[.06]", label: tr.at_rag_failed }
        : { cls: "border-amber-400/30 text-amber-300 bg-amber-400/[.06]", label: tr.at_rag_pending };
  return (
    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono uppercase ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(mime: string): string {
  if (mime === "application/pdf") return "📄";
  if (mime.startsWith("text/")) return "📝";
  if (mime.includes("word")) return "📘";
  return "📎";
}

function fmtRelative(unix: number, tr: Dict): string {
  const diff = Date.now() / 1000 - unix;
  if (diff < 60) return tr.ui_just_now;
  if (diff < 3600) return fmt(tr.ui_m_ago, { n: Math.floor(diff / 60) });
  if (diff < 86400) return fmt(tr.ui_h_ago, { n: Math.floor(diff / 3600) });
  return fmt(tr.ui_d_ago, { n: Math.floor(diff / 86400) });
}
