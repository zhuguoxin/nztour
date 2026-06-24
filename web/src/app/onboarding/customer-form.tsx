"use client";

import { useState } from "react";
import { useTr } from "@/lib/i18n-provider";
import { NZ_RTOS } from "@/lib/rto";
import { completeCustomerOnboarding } from "./actions";

const field =
  "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-small text-slate-900 outline-none focus:border-emerald-500";
const label = "block text-caption font-semibold text-slate-700 mb-1.5";

export function CustomerForm({
  email,
  defaultFirst,
  defaultLast,
}: {
  email: string;
  defaultFirst: string;
  defaultLast: string;
}) {
  const tr = useTr();
  const [sel, setSel] = useState<Set<string>>(new Set());

  function toggle(rto: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(rto)) next.delete(rto);
      else next.add(rto);
      return next;
    });
  }

  return (
    <form action={completeCustomerOnboarding} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div>
        <h1 className="text-h2 font-semibold tracking-tight">{tr.ob_c_title}</h1>
        <p className="text-small text-slate-600 mt-1">{tr.ob_c_blurb}</p>
      </div>

      <div>
        <label className={label}>{tr.ob_c_company} *</label>
        <input name="company_name" required maxLength={200} className={field} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={label}>{tr.ob_l_first} *</label>
          <input name="first_name" defaultValue={defaultFirst} required maxLength={80} className={field} />
        </div>
        <div>
          <label className={label}>{tr.ob_l_middle}</label>
          <input name="middle_name" maxLength={80} className={field} />
        </div>
        <div>
          <label className={label}>{tr.ob_l_last} *</label>
          <input name="last_name" defaultValue={defaultLast} required maxLength={80} className={field} />
        </div>
      </div>

      <div>
        <label className={label}>{tr.ob_email}</label>
        <input value={email} readOnly className={field + " bg-slate-50 text-slate-500"} />
        <div className="text-micro text-slate-400 mt-1">{tr.ob_email_readonly_note}</div>
      </div>

      <fieldset>
        <div className="flex items-center justify-between mb-2">
          <legend className={label + " mb-0"}>{tr.ob_c_rto_legend}</legend>
          <div className="flex items-center gap-2 text-caption">
            <button
              type="button"
              onClick={() => setSel(new Set(NZ_RTOS))}
              className="text-slate-900 hover:underline"
            >
              {tr.ob_c_rto_select_all}
            </button>
            <span className="text-slate-300">·</span>
            <button type="button" onClick={() => setSel(new Set())} className="text-slate-500 hover:underline">
              {tr.ob_c_rto_clear}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 max-h-72 overflow-y-auto rounded-md border border-slate-200 p-3">
          {NZ_RTOS.map((rto) => (
            <label key={rto} className="flex items-center gap-2 text-caption text-slate-700">
              <input
                type="checkbox"
                name="rto"
                value={rto}
                checked={sel.has(rto)}
                onChange={() => toggle(rto)}
                className="accent-emerald-600"
              />
              <span>{rto}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-caption text-slate-900">
        {tr.ob_c_pending_note}
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2.5 rounded-md bg-emerald-600 text-white font-semibold text-small hover:bg-emerald-700"
      >
        {tr.ob_submit}
      </button>
    </form>
  );
}
