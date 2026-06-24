"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { langLabel } from "@/lib/translate";
import { useTr } from "@/lib/i18n-provider";

/**
 * Per-module language & narration panel (centre column).
 *
 * "Regenerate" re-translates THIS module's text into every enabled language and
 * regenerates ONLY this module's narration (reusing each language's voice).
 * Below it, 🎧 chips let the editor preview the generated narration per language
 * inline — no need to open the learner preview.
 */
export function RegenerateModuleButton({
  operatorSlug,
  courseSlug,
  moduleId,
  narration,
  regenAt,
}: {
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
  narration: { lang: string; t: number }[];
  /** modules.regen_at at render — the baseline a finished background job beats. */
  regenAt: number;
}) {
  const tr = useTr();
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const baselineRef = useRef(regenAt);

  // Switching modules in the 3-column editor is a soft navigation that reuses
  // this component instance — reset transient UI so we never carry a previous
  // module's selected language (which would otherwise pop open a player here).
  useEffect(() => {
    setPlaying(null);
    setDone(false);
    setErr(null);
    setRunning(false);
  }, [moduleId]);

  // Start playback when the editor picks a language (not on module switch — that
  // path only ever sets `playing` to null, so this effect won't auto-play).
  useEffect(() => {
    if (playing) audioRef.current?.play().catch(() => {});
  }, [playing]);

  // While a background regenerate runs, poll for completion (regen_at climbs
  // past the baseline captured at click). The rest of the editor stays usable.
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let tries = 0;
    const iv = setInterval(async () => {
      tries += 1;
      try {
        const r = await fetch(`/api/regenerate-module?moduleId=${encodeURIComponent(moduleId)}`);
        const j = (await r.json()) as { regen_at?: number };
        if ((j.regen_at ?? 0) > baselineRef.current) {
          clearInterval(iv);
          if (!cancelled) {
            setRunning(false);
            setDone(true);
            router.refresh();
          }
        }
      } catch {
        /* keep polling */
      }
      if (tries > 40) {
        clearInterval(iv);
        if (!cancelled) setRunning(false);
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [running, moduleId, router]);

  function run() {
    setErr(null);
    setDone(false);
    baselineRef.current = regenAt;
    setRunning(true);
    fetch("/api/regenerate-module", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorSlug, courseSlug, moduleId }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
      })
      .catch(() => {
        setRunning(false);
        setErr(tr.err_load_failed);
      });
  }

  const playingEntry = narration.find((n) => n.lang === playing);

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-small font-semibold text-slate-900">{tr.ed_regen_heading}</div>
          <div className="text-caption text-slate-500 mt-0.5">{tr.ed_regen_sub}</div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="px-3.5 py-2 rounded-md border border-emerald-300 bg-emerald-50 text-slate-900 font-semibold text-caption hover:bg-emerald-100 disabled:opacity-50 shrink-0"
        >
          {running ? tr.ed_regenerating : tr.ed_regen_module}
        </button>
      </div>

      {running ? <div className="text-caption text-slate-900">{tr.ed_regen_bg}</div> : null}
      {err ? <div className="text-caption text-rose-600">{err}</div> : null}
      {done && !running ? <div className="text-caption text-slate-900">{tr.ed_regen_done}</div> : null}

      {/* Narration preview — 🎧 chip per language, plays inline. */}
      {narration.length > 0 ? (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-micro text-slate-500">{tr.ed_regen_listen}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {narration.map((n) => (
              <button
                key={n.lang}
                type="button"
                onClick={() => setPlaying(playing === n.lang ? null : n.lang)}
                className={`px-2 py-1 rounded-full border text-micro font-medium ${
                  playing === n.lang
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-emerald-50 border-emerald-200 text-slate-900 hover:bg-emerald-100"
                }`}
              >
                🎧 {langLabel(n.lang)}
              </button>
            ))}
          </div>
          {playingEntry ? (
            <div className="flex items-center gap-2">
              <audio
                ref={audioRef}
                key={`${playingEntry.lang}-${playingEntry.t}`}
                controls
                preload="none"
                src={`/api/module-audio?id=${moduleId}&lang=${encodeURIComponent(playingEntry.lang)}&t=${playingEntry.t}`}
                className="flex-1 h-9"
              />
              <button
                type="button"
                onClick={() => setPlaying(null)}
                aria-label={tr.mp_close}
                title={tr.mp_close}
                className="w-7 h-7 shrink-0 rounded text-slate-500 hover:bg-slate-100 flex items-center justify-center text-small"
              >
                ✕
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
