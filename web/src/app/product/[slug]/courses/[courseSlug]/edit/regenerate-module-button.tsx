"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateModule } from "../../actions";
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
}: {
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
  narration: { lang: string; t: number }[];
}) {
  const tr = useTr();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

  function run() {
    setErr(null);
    setDone(false);
    start(async () => {
      const res = await regenerateModule({ operatorSlug, courseSlug, moduleId });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else setErr(res.error ?? tr.err_load_failed);
    });
  }

  const playingEntry = narration.find((n) => n.lang === playing);

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-900">{tr.ed_regen_heading}</div>
          <div className="text-[11.5px] text-slate-500 mt-0.5">{tr.ed_regen_sub}</div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="px-3.5 py-2 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold text-[12.5px] hover:bg-emerald-100 disabled:opacity-50 shrink-0"
        >
          {pending ? tr.ed_regenerating : tr.ed_regen_module}
        </button>
      </div>

      {err ? <div className="text-[11.5px] text-rose-600">{err}</div> : null}
      {done && !pending ? <div className="text-[11.5px] text-emerald-700">{tr.ed_regen_done}</div> : null}

      {/* Narration preview — 🎧 chip per language, plays inline. */}
      {narration.length > 0 ? (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-[11px] text-slate-500">{tr.ed_regen_listen}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {narration.map((n) => (
              <button
                key={n.lang}
                type="button"
                onClick={() => setPlaying(playing === n.lang ? null : n.lang)}
                className={`px-2 py-1 rounded-full border text-[11px] font-medium ${
                  playing === n.lang
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                🎧 {langLabel(n.lang)}
              </button>
            ))}
          </div>
          {playingEntry ? (
            <div className="flex items-center gap-2">
              <audio
                key={`${playingEntry.lang}-${playingEntry.t}`}
                controls
                autoPlay
                preload="none"
                src={`/api/module-audio?id=${moduleId}&lang=${encodeURIComponent(playingEntry.lang)}&t=${playingEntry.t}`}
                className="flex-1 h-9"
              />
              <button
                type="button"
                onClick={() => setPlaying(null)}
                aria-label={tr.mp_close}
                title={tr.mp_close}
                className="w-7 h-7 shrink-0 rounded text-slate-500 hover:bg-slate-100 flex items-center justify-center text-[13px]"
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
