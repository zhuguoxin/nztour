"use client";

import { useState, useEffect } from "react";

export interface UploadStubLabels {
  title: string;
  sub: string;
  dropzone_a: string;
  dropzone_b: string;
  dropzone_blurb: string;
  alert: string;
  state_pdf_done: string;
  state_pptx_done: string;
  state_video_done: string;
  state_pptx_progress: string; // {n}
  state_video_progress: string; // {t}
  state_pdf_progress: string;
  done_chip: string;
}

/**
 * Upload-content panel — STUBBED for MVP. See SETUP.md §2.
 */
export function UploadStub({ labels }: { labels: UploadStubLabels }) {
  return (
    <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
      <header className="px-5 py-4 border-b border-white/[.06]">
        <div className="font-semibold text-[14px] text-white">{labels.title}</div>
        <div className="text-[12px] text-[#86b69a] mt-0.5">{labels.sub}</div>
      </header>
      <div className="p-5 space-y-4">
        <FakeDropZone labels={labels} />
        <UploadFeed labels={labels} />
      </div>
    </section>
  );
}

function FakeDropZone({ labels }: { labels: UploadStubLabels }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={() => alert(labels.alert)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`block w-full border-2 border-dashed rounded-xl p-7 text-center transition cursor-pointer ${
        hovered ? "border-emerald-400/50 bg-emerald-400/[.04]" : "border-white/[.10]"
      }`}
    >
      <div className="text-[36px] leading-none mb-2">📤</div>
      <div className="text-[13.5px] text-white">
        {labels.dropzone_a}{" "}
        <span className="text-emerald-300 underline underline-offset-2">{labels.dropzone_b}</span>
      </div>
      <div className="text-[11.5px] text-[#86b69a] mt-1">{labels.dropzone_blurb}</div>
    </button>
  );
}

interface FakeUpload {
  id: string;
  filename: string;
  kind: "pdf" | "pptx" | "video";
  totalSecs: number;
  progress: number;
  done: boolean;
}

const SEED: FakeUpload[] = [
  { id: "u1", filename: "2026 Media Kit — Coronet Peak.pdf", kind: "pdf", totalSecs: 0, progress: 1, done: true },
  { id: "u2", filename: "NZSki 2026 升级指南.pptx", kind: "pptx", totalSecs: 22, progress: 0.64, done: false },
  { id: "u3", filename: "Coronet-aerial-2026.mp4", kind: "video", totalSecs: 12, progress: 0.4, done: false },
];

function UploadFeed({ labels }: { labels: UploadStubLabels }) {
  const [items, setItems] = useState<FakeUpload[]>(SEED);

  useEffect(() => {
    const i = setInterval(() => {
      setItems((curr) =>
        curr.map((it) => {
          if (it.done) return it;
          const next = Math.min(1, it.progress + 1 / Math.max(1, it.totalSecs));
          return next >= 1 ? { ...it, progress: 1, done: true } : { ...it, progress: next };
        }),
      );
    }, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setItems(SEED), 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-3 text-[12.5px]">
          <div className="w-8 h-8 rounded bg-white/[.04] border border-white/[.08] flex items-center justify-center shrink-0">
            {it.kind === "pdf" ? "📄" : it.kind === "pptx" ? "📊" : "📹"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-white">{it.filename}</div>
            <div className={`text-[11px] ${it.done ? "text-lime-300" : "text-emerald-300/80"}`}>
              {it.done
                ? subdescDone(it.kind, labels)
                : it.kind === "pptx"
                  ? labels.state_pptx_progress.replace("{n}", String(Math.round(it.progress * 22)))
                  : it.kind === "video"
                    ? labels.state_video_progress.replace("{t}", fmtSecs(it.progress * 210))
                    : labels.state_pdf_progress}
            </div>
          </div>
          {it.done ? (
            <span className="px-2 py-0.5 rounded-full bg-lime-300/10 border border-lime-300/30 text-lime-300 text-[10px] font-medium shrink-0">
              {labels.done_chip}
            </span>
          ) : (
            <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all"
                style={{ width: `${Math.round(it.progress * 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function subdescDone(kind: FakeUpload["kind"], labels: UploadStubLabels) {
  switch (kind) {
    case "pdf":
      return labels.state_pdf_done;
    case "pptx":
      return labels.state_pptx_done;
    case "video":
      return labels.state_video_done;
  }
}

function fmtSecs(n: number) {
  const s = Math.floor(n);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
