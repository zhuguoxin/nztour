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
      <div className="text-[11px] tracking-widest font-mono text-emerald-300/70 mb-2">
        {tr.ed_modules}
      </div>
      <div className="space-y-1">
        {modules.map((m, i) => (
          <Link
            key={m.id}
            href={`/product/${operatorSlug}/courses/${courseSlug}/edit?m=${m.id}`}
            className={`block px-3 py-2 rounded-md text-[13px] truncate border-l-2 ${
              m.id === activeId
                ? "bg-emerald-400/15 text-white border-emerald-400"
                : "text-[#a7d4b6] hover:bg-white/[.05] border-transparent"
            }`}
          >
            <span className="text-[#86b69a] font-mono mr-1.5">{i + 1}.</span>
            {m.title}
          </Link>
        ))}
        {modules.length === 0 ? (
          <div className="text-[12px] text-[#86b69a] px-1 py-2">{tr.em_no_modules}</div>
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
          className="flex-1 min-w-0 bg-[#0a3a2f] border border-white/[.10] rounded-md px-2.5 py-1.5 text-[12.5px] text-white outline-none focus:border-emerald-400/60"
        />
        <button
          type="submit"
          title={tr.ed_add_module}
          className="px-2.5 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[15px] leading-none hover:bg-emerald-300 shrink-0"
        >
          +
        </button>
      </form>
    </div>
  );
}
