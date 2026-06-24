"use client";

import Link from "next/link";
import { createModule } from "../../actions";
import { useTr } from "@/lib/i18n-provider";

/** Left-rail module list. Click a module → centre editor switches to it
 *  (via ?m=<id>). Plus an inline "add module" form. */
export function ModuleNav({
  operatorSlug,
  courseSlug,
  modules,
  activeId,
}: {
  operatorSlug: string;
  courseSlug: string;
  modules: Array<{ id: string; title: string; position: number }>;
  activeId: string | null;
}) {
  const tr = useTr();
  return (
    <div>
      <div className="text-micro tracking-widest font-mono text-slate-700 mb-2">
        {tr.ed_modules}
      </div>
      <div className="space-y-1">
        {modules.map((m, i) => (
          <Link
            key={m.id}
            href={`/product/${operatorSlug}/courses/${courseSlug}/edit?m=${m.id}`}
            className={`block px-3 py-2 rounded-md text-small truncate border-l-2 ${
              m.id === activeId
                ? "bg-emerald-600/15 text-slate-900 border-emerald-400"
                : "text-slate-600 hover:bg-slate-100 border-transparent"
            }`}
          >
            <span className="text-slate-700 font-mono mr-1.5">{i + 1}.</span>
            {m.title}
          </Link>
        ))}
        {modules.length === 0 ? (
          <div className="text-caption text-slate-500 px-1 py-2">{tr.em_no_modules}</div>
        ) : null}
      </div>

      <form action={createModule} className="mt-3 flex gap-2">
        <input type="hidden" name="operator_slug" value={operatorSlug} />
        <input type="hidden" name="course_slug" value={courseSlug} />
        <input
          name="title"
          required
          maxLength={200}
          placeholder={tr.ed_new_module_ph}
          className="flex-1 min-w-0 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-caption text-slate-900 outline-none focus:border-emerald-400/60"
        />
        <button
          type="submit"
          title={tr.ed_add_module}
          className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-body leading-none hover:bg-emerald-700 shrink-0"
        >
          +
        </button>
      </form>
    </div>
  );
}
