"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTr } from "@/lib/i18n-provider";
import { updateProductProfile } from "./settings-actions";
import { NZ_RTOS } from "@/lib/rto";

export interface ProductProfileData {
  slug: string;
  name: string;
  display_name: string | null;
  intro: string | null;
  website: string | null;
  country: string;
  nzbn: string | null;
  category: string | null;
  region: string | null;
  primary_lang: string;
  timezone: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  poc_name: string | null;
  poc_title: string | null;
  poc_email: string | null;
  poc_phone: string | null;
  links_json: string | null;
}

interface LinkRow {
  label: string;
  url: string;
}

const input =
  "w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-small text-slate-900 outline-none focus:border-emerald-400/60";
const labelCls = "block text-caption font-medium text-slate-600 mb-1";

const CATEGORIES = [
  "attractions",
  "adventure",
  "culture",
  "water",
  "land",
  "air",
  "accommodation",
  "tour",
  "rto",
];
const REGIONS = NZ_RTOS;
const LANGS = ["en", "zh-CN", "zh-TW", "ja", "ko", "es", "fr", "de", "pt"];

export function ProductProfile({ p }: { p: ProductProfileData }) {
  const tr = useTr();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, fd: FormData) => {
      const res = await updateProductProfile(fd);
      if (res.ok) router.refresh();
      return res;
    },
    null,
  );

  const [links, setLinks] = useState<LinkRow[]>(() => {
    try {
      const arr = JSON.parse(p.links_json ?? "[]");
      return Array.isArray(arr)
        ? arr.map((e) => ({ label: String(e?.label ?? ""), url: String(e?.url ?? "") }))
        : [];
    } catch {
      return [];
    }
  });

  const catLabel = (c: string) =>
    ({
      attractions: tr.cat_attractions, adventure: tr.cat_adventure, culture: tr.cat_culture,
      water: tr.cat_water, land: tr.cat_land, air: tr.cat_air,
      accommodation: tr.cat_accommodation, tour: tr.cat_tour, rto: tr.cat_rto,
    })[c] ?? c;
  const regLabel = (r: string) => r;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <form action={formAction} className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-7">
        <input type="hidden" name="operator_slug" value={p.slug} />
        <input type="hidden" name="links_json" value={JSON.stringify(links)} />

        {/* Left column */}
        <div className="space-y-6">
          <Section title={tr.pp_sec_identity}>
            <Field label={tr.pp_name} required>
              <input name="name" defaultValue={p.name} required maxLength={200} className={input} />
            </Field>
            <Field label={tr.pp_display_name} hint={tr.pp_display_hint}>
              <input name="display_name" defaultValue={p.display_name ?? ""} maxLength={200} className={input} />
            </Field>
            <Field label={tr.pp_intro}>
              <textarea name="intro" defaultValue={p.intro ?? ""} rows={4} maxLength={2000} className={input + " resize-y"} />
            </Field>
            <Field label={tr.pp_website}>
              <input name="website" type="url" defaultValue={p.website ?? ""} placeholder="https://" maxLength={400} className={input} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.pp_country}>
                <input name="country" defaultValue={p.country} maxLength={60} className={input} />
              </Field>
              <Field label={tr.pp_nzbn}>
                <input name="nzbn" defaultValue={p.nzbn ?? ""} maxLength={40} className={input} />
              </Field>
            </div>
          </Section>

          <Section title={tr.pp_sec_links}>
            <div className="space-y-2">
              {links.map((ln, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    value={ln.label}
                    onChange={(e) => setLinks((pr) => pr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    placeholder={tr.pp_link_label}
                    className={input + " w-24 shrink-0"}
                  />
                  <input
                    value={ln.url}
                    onChange={(e) => setLinks((pr) => pr.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                    placeholder="https://"
                    className={input + " flex-1 min-w-0"}
                  />
                  <button
                    type="button"
                    onClick={() => setLinks((pr) => pr.filter((_, j) => j !== i))}
                    className="px-1.5 py-1 rounded text-rose-600 hover:bg-rose-400/10 text-caption shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLinks((pr) => [...pr, { label: "", url: "" }])}
                className="text-caption text-slate-900 hover:underline"
              >
                + {tr.pp_link_add}
              </button>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title={tr.pp_sec_taxonomy}>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.pp_category}>
                <select name="category" defaultValue={p.category ?? ""} className={input}>
                  <option value="">—</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
                </select>
              </Field>
              <Field label={tr.pp_region}>
                <select name="region" defaultValue={p.region ?? ""} className={input}>
                  <option value="">—</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{regLabel(r)}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.pp_primary_lang}>
                <select name="primary_lang" defaultValue={p.primary_lang} className={input}>
                  {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label={tr.pp_timezone}>
                <input name="timezone" defaultValue={p.timezone ?? ""} placeholder="Pacific/Auckland" maxLength={60} className={input} />
              </Field>
            </div>
          </Section>

          <Section title={tr.pp_sec_contact}>
            <Field label={tr.pp_email}>
              <input name="contact_email" type="email" defaultValue={p.contact_email ?? ""} maxLength={200} className={input} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.pp_phone}>
                <input name="phone" defaultValue={p.phone ?? ""} maxLength={60} className={input} />
              </Field>
              <Field label={tr.pp_address}>
                <input name="address" defaultValue={p.address ?? ""} maxLength={400} className={input} />
              </Field>
            </div>
          </Section>

          <Section title={tr.pp_sec_poc}>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.pp_poc_name}>
                <input name="poc_name" defaultValue={p.poc_name ?? ""} maxLength={120} className={input} />
              </Field>
              <Field label={tr.pp_poc_title}>
                <input name="poc_title" defaultValue={p.poc_title ?? ""} maxLength={120} className={input} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.pp_poc_email}>
                <input name="poc_email" type="email" defaultValue={p.poc_email ?? ""} maxLength={200} className={input} />
              </Field>
              <Field label={tr.pp_poc_phone}>
                <input name="poc_phone" defaultValue={p.poc_phone ?? ""} maxLength={60} className={input} />
              </Field>
            </div>
          </Section>
        </div>

        <div className="lg:col-span-2 flex items-center gap-2 border-t border-slate-200 pt-4">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold text-small hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? tr.sp_p_saving : tr.sp_p_save}
          </button>
          {state?.ok ? <span className="text-caption text-slate-900">{tr.sp_p_saved}</span> : null}
          {state && !state.ok ? (
            <span className="text-caption text-rose-600">{state.error ?? tr.sp_p_save_failed}</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="text-micro font-mono uppercase tracking-widest text-slate-700">{title}</div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelCls}>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-micro text-slate-400 mt-1">{hint}</span> : null}
    </label>
  );
}
