"use client";

import Link from "next/link";
import { useTr } from "@/lib/i18n-provider";
import { COUNTRIES, BUSINESS_PROFILES } from "@/lib/options";
import { completeLearnerOnboarding } from "./actions";

const field =
  "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-small text-slate-900 outline-none focus:border-emerald-500";
const label = "block text-caption font-semibold text-slate-700 mb-1.5";

export function LearnerForm({
  email,
  defaultFirst,
  defaultLast,
}: {
  email: string;
  defaultFirst: string;
  defaultLast: string;
}) {
  const tr = useTr();
  return (
    <form action={completeLearnerOnboarding} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div>
        <h1 className="text-h2 font-semibold tracking-tight">{tr.ob_l_title}</h1>
        <p className="text-small text-slate-600 mt-1">{tr.ob_l_blurb}</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label}>{tr.ob_l_company}</label>
          <input name="company_name" maxLength={200} className={field} />
        </div>
        <div>
          <label className={label}>{tr.ob_l_job_title}</label>
          <input name="job_title" maxLength={120} className={field} />
        </div>
        <div>
          <label className={label}>{tr.ob_l_city}</label>
          <input name="city" maxLength={120} className={field} />
        </div>
        <div>
          <label className={label}>{tr.ob_l_country}</label>
          <select name="country" defaultValue="" className={field}>
            <option value="" disabled>
              {tr.ob_select_ph}
            </option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{tr.ob_l_business_profile}</label>
          <select name="business_profile" defaultValue="" className={field}>
            <option value="" disabled>
              {tr.ob_select_ph}
            </option>
            {BUSINESS_PROFILES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-2 text-caption text-slate-600">
        <input type="checkbox" name="marketing_opt_in" className="mt-0.5 accent-emerald-600" />
        <span>{tr.ob_l_marketing}</span>
      </label>

      <label className="flex items-start gap-2 text-caption text-slate-600">
        <input type="checkbox" name="terms_accepted" required className="mt-0.5 accent-emerald-600" />
        <span>{tr.ob_l_terms} *</span>
      </label>
      <div className="text-micro text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
        <Link href="/legal/privacy" target="_blank" className="hover:underline">
          {tr.ob_link_privacy}
        </Link>
        <Link href="/legal/terms" target="_blank" className="hover:underline">
          {tr.ob_link_terms}
        </Link>
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
