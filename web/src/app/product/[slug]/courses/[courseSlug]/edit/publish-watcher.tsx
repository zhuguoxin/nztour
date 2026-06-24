"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTr } from "@/lib/i18n-provider";

/**
 * Persistent publish-progress watcher. The publish dialog fires off the
 * background narration job and dispatches a `libretour:publish-start` window
 * event; this component (mounted once on the editor page, outside the modal)
 * tracks every in-flight job, shows a bottom-right toast with a live progress
 * bar, and pops a "done" toast when the job finishes — even after the dialog is
 * closed. Jobs are mirrored to localStorage so a full page reload resumes them.
 */
const LS_KEY = "libretour:publishJobs";

type Persisted = {
  id: string;
  operatorSlug: string;
  courseSlug: string;
  label: string;
  baseline: number;
};
type Job = Persisted & { total: number; done: number; finished: boolean };

function loadPersisted(): Persisted[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}
function savePersisted(jobs: Job[]) {
  try {
    const keep: Persisted[] = jobs
      .filter((j) => !j.finished)
      .map(({ id, operatorSlug, courseSlug, label, baseline }) => ({
        id,
        operatorSlug,
        courseSlug,
        label,
        baseline,
      }));
    localStorage.setItem(LS_KEY, JSON.stringify(keep));
  } catch {
    /* ignore */
  }
}

export function PublishWatcher() {
  const tr = useTr();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const jobsRef = useRef<Job[]>([]);
  jobsRef.current = jobs;

  // Hydrate from localStorage + listen for new publish starts.
  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted.length) {
      setJobs(persisted.map((p) => ({ ...p, total: 0, done: 0, finished: false })));
    }
    const onStart = (e: Event) => {
      const d = (e as CustomEvent).detail as Persisted;
      if (!d?.operatorSlug || !d?.courseSlug) return;
      setJobs((prev) => {
        const next = prev.filter((j) => j.id !== d.id);
        next.push({ ...d, total: 0, done: 0, finished: false });
        savePersisted(next);
        return next;
      });
    };
    window.addEventListener("libretour:publish-start", onStart as EventListener);
    return () => window.removeEventListener("libretour:publish-start", onStart as EventListener);
  }, []);

  // Poll every active job.
  useEffect(() => {
    const iv = setInterval(async () => {
      const active = jobsRef.current.filter((j) => !j.finished);
      if (active.length === 0) return;
      for (const job of active) {
        try {
          const r = await fetch(
            `/api/publish-course?operatorSlug=${encodeURIComponent(job.operatorSlug)}&courseSlug=${encodeURIComponent(job.courseSlug)}`,
          );
          const j = (await r.json()) as { publish_at?: number; total?: number; done?: number };
          const finished = (j.publish_at ?? 0) > job.baseline;
          setJobs((prev) => {
            const next = prev.map((p) =>
              p.id === job.id
                ? { ...p, total: j.total ?? p.total, done: j.done ?? p.done, finished }
                : p,
            );
            savePersisted(next);
            return next;
          });
          if (finished) {
            router.refresh();
            // auto-dismiss the "done" toast after a few seconds
            setTimeout(() => {
              setJobs((prev) => prev.filter((p) => p.id !== job.id));
            }, 6000);
          }
        } catch {
          /* keep polling */
        }
      }
    }, 2500);
    return () => clearInterval(iv);
  }, [router]);

  if (jobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[300px] max-w-[calc(100vw-2rem)]">
      {jobs.map((job) => {
        const pct = job.total > 0 ? Math.min(100, Math.round((job.done / job.total) * 100)) : null;
        return (
          <div
            key={job.id}
            className="rounded-xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.12)] p-3.5"
          >
            <div className="flex items-start gap-2">
              {job.finished ? (
                <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0">
                  ✓
                </span>
              ) : (
                <span className="mt-0.5 inline-block w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-caption font-semibold text-slate-900">
                  {job.finished ? tr.pub_toast_done : tr.pub_toast_running}
                </div>
                <div className="text-micro text-slate-500 truncate">{job.label}</div>
              </div>
              {job.finished ? (
                <button
                  onClick={() => setJobs((prev) => prev.filter((p) => p.id !== job.id))}
                  className="text-slate-400 hover:text-slate-700 text-caption shrink-0"
                  aria-label="dismiss"
                >
                  ✕
                </button>
              ) : null}
            </div>
            {!job.finished ? (
              <div className="mt-2.5">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all"
                    style={{ width: pct !== null ? `${pct}%` : "30%" }}
                  />
                </div>
                <div className="mt-1 text-micro text-slate-500 tabular-nums">
                  {job.total > 0 ? `${job.done} / ${job.total}` : ""}
                  {pct !== null ? ` · ${pct}%` : ""}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
