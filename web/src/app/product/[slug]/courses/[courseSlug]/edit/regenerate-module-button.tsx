"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateModule } from "../../actions";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";

/**
 * Per-module "Regenerate" — re-translates THIS module's text into every enabled
 * language and regenerates THIS module's narration audio (reusing each
 * language's existing voice). Use after editing a module's text so its
 * translations + narration catch up without re-running the whole course.
 */
export function RegenerateModuleButton({
  operatorSlug,
  courseSlug,
  moduleId,
  moduleTitle,
}: {
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
  moduleTitle: string;
}) {
  const tr = useTr();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold text-slate-900 truncate">
          {fmt(tr.ed_regen_heading, { title: moduleTitle })}
        </div>
        <div className="text-[11.5px] text-slate-500 mt-0.5">{tr.ed_regen_sub}</div>
        {err ? <div className="text-[11.5px] text-rose-600 mt-1">{err}</div> : null}
        {done && !pending ? (
          <div className="text-[11.5px] text-emerald-700 mt-1">{tr.ed_regen_done}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="px-3.5 py-2 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold text-[12.5px] hover:bg-emerald-100 disabled:opacity-50 shrink-0"
      >
        {pending ? tr.ed_regenerating : tr.ed_regen_module}
      </button>
    </section>
  );
}
