"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTr } from "@/lib/i18n-provider";
import { updateSupplierProfile } from "./actions";
import { MediaPicker } from "../../_components/media-picker";

export interface SupplierProfileData {
  slug: string;
  name: string;
  legal_name: string | null;
  intro: string | null;
  website: string | null;
  country: string;
  hq_city: string | null;
  address: string | null;
  contact_email: string | null;
  phone: string | null;
  billing_email: string | null;
  poc_name: string | null;
  poc_title: string | null;
  poc_email: string | null;
  poc_phone: string | null;
  links_json: string | null;
  default_lang: string | null;
  timezone: string | null;
  hasCover: boolean;
}

interface LinkRow {
  label: string;
  url: string;
}

const input =
  "w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-[13px] text-slate-900 outline-none focus:border-emerald-500";
const labelCls = "block text-[11.5px] font-medium text-slate-600 mb-1";

const LANGS = ["en", "zh-CN", "zh-TW", "ja", "ko", "es", "fr", "de", "pt"];

export function SupplierProfile({ s }: { s: SupplierProfileData }) {
  const tr = useTr();
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, fd: FormData) => {
      const res = await updateSupplierProfile(fd);
      if (res.ok) router.refresh();
      return res;
    },
    null,
  );

  // Social/booking links — controlled, serialized into a hidden input on submit.
  const [links, setLinks] = useState<LinkRow[]>(() => {
    try {
      const arr = JSON.parse(s.links_json ?? "[]");
      return Array.isArray(arr)
        ? arr.map((e) => ({ label: String(e?.label ?? ""), url: String(e?.url ?? "") }))
        : [];
    } catch {
      return [];
    }
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      {/* Cover */}
      <div className="mb-6 max-w-xs">
        <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-700/70 mb-1.5">
          {tr.sp_p_cover}
        </div>
        <MediaPicker
          supplierSlug={s.slug}
          target={{ target: "supplier", supplierSlug: s.slug }}
          currentUrl={s.hasCover ? `/api/supplier-cover?slug=${encodeURIComponent(s.slug)}` : null}
          aspect="wide"
          theme="light"
        />
      </div>

      {/* Two-column field layout */}
      <form action={formAction} className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-7">
        <input type="hidden" name="supplier_slug" value={s.slug} />
        <input type="hidden" name="links_json" value={JSON.stringify(links)} />

        {/* Left column */}
        <div className="space-y-6">
          <Section title={tr.sp_p_sec_identity}>
            <Field label={tr.sp_p_name} required>
              <input name="name" defaultValue={s.name} required maxLength={200} className={input} />
            </Field>
            <Field label={tr.sp_p_legal}>
              <input name="legal_name" defaultValue={s.legal_name ?? ""} maxLength={200} className={input} />
            </Field>
            <Field label={tr.sp_p_intro}>
              <textarea name="intro" defaultValue={s.intro ?? ""} rows={3} maxLength={2000} className={input + " resize-y"} />
            </Field>
            <Field label={tr.sp_p_website}>
              <input name="website" type="url" defaultValue={s.website ?? ""} placeholder="https://" maxLength={400} className={input} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.sp_p_country}>
                <input name="country" defaultValue={s.country} maxLength={60} className={input} />
              </Field>
              <Field label={tr.sp_p_city}>
                <input name="hq_city" defaultValue={s.hq_city ?? ""} maxLength={120} className={input} />
              </Field>
            </div>
            <Field label={tr.sp_p_address}>
              <input name="address" defaultValue={s.address ?? ""} maxLength={400} className={input} />
            </Field>
          </Section>

          <Section title={tr.sp_p_sec_links}>
            <div className="space-y-2">
              {links.map((ln, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    value={ln.label}
                    onChange={(e) =>
                      setLinks((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                    }
                    placeholder={tr.sp_p_link_label}
                    className={input + " w-24 shrink-0"}
                  />
                  <input
                    value={ln.url}
                    onChange={(e) =>
                      setLinks((p) => p.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                    }
                    placeholder="https://"
                    className={input + " flex-1 min-w-0"}
                  />
                  <button
                    type="button"
                    onClick={() => setLinks((p) => p.filter((_, j) => j !== i))}
                    className="px-1.5 py-1 rounded text-rose-600 hover:bg-rose-50 text-[12px] shrink-0"
                    title={tr.sp_p_link_remove}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLinks((p) => [...p, { label: "", url: "" }])}
                className="text-[12px] text-emerald-700 hover:underline"
              >
                + {tr.sp_p_link_add}
              </button>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title={tr.sp_p_sec_contact}>
            <Field label={tr.sp_p_email}>
              <input name="contact_email" type="email" defaultValue={s.contact_email ?? ""} maxLength={200} className={input} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.sp_p_phone}>
                <input name="phone" defaultValue={s.phone ?? ""} maxLength={60} className={input} />
              </Field>
              <Field label={tr.sp_p_billing}>
                <input name="billing_email" type="email" defaultValue={s.billing_email ?? ""} maxLength={200} className={input} />
              </Field>
            </div>
          </Section>

          <Section title={tr.sp_p_sec_poc}>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.sp_p_poc_name}>
                <input name="poc_name" defaultValue={s.poc_name ?? ""} maxLength={120} className={input} />
              </Field>
              <Field label={tr.sp_p_poc_title}>
                <input name="poc_title" defaultValue={s.poc_title ?? ""} maxLength={120} className={input} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.sp_p_poc_email}>
                <input name="poc_email" type="email" defaultValue={s.poc_email ?? ""} maxLength={200} className={input} />
              </Field>
              <Field label={tr.sp_p_poc_phone}>
                <input name="poc_phone" defaultValue={s.poc_phone ?? ""} maxLength={60} className={input} />
              </Field>
            </div>
          </Section>

          <Section title={tr.sp_p_sec_defaults}>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tr.sp_p_default_lang}>
                <select name="default_lang" defaultValue={s.default_lang ?? ""} className={input}>
                  <option value="">—</option>
                  {LANGS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label={tr.sp_p_timezone}>
                <input name="timezone" defaultValue={s.timezone ?? ""} placeholder="Pacific/Auckland" maxLength={60} className={input} />
              </Field>
            </div>
          </Section>
        </div>

        {/* Save row spans both columns */}
        <div className="lg:col-span-2 flex items-center gap-2 border-t border-slate-200 pt-4">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold text-[13.5px] hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? tr.sp_p_saving : tr.sp_p_save}
          </button>
          {state?.ok ? <span className="text-[12px] text-emerald-700">{tr.sp_p_saved}</span> : null}
          {state && !state.ok ? (
            <span className="text-[12px] text-rose-600">{state.error ?? tr.sp_p_save_failed}</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-700/70">{title}</div>
      {children}
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
