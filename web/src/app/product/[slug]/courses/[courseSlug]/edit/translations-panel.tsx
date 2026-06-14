"use client";

import { useState, useTransition } from "react";
import { setCourseLanguageEnabled, translateCourse } from "../../actions";
import { TRANSLATE_LANGS } from "@/lib/translate";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";

/**
 * Language enable/disable for a course.
 *
 * Each non-source language is in one of three states:
 *   • Enabled  — translated AND shown to learners (green ✓). Click to disable.
 *   • Disabled — translated but hidden (dim ○). Click to enable instantly —
 *                the previous translation + audio are reused, no re-translation.
 *   • Off      — never translated (+ chip). Click to translate + enable.
 *
 * Disabling never deletes content, so toggling back on is free. "↻" re-runs the
 * translation (overwrites). The whole-course translation is driven by Claude.
 */
export function TranslationsPanel({
  operatorSlug,
  courseSlug,
  primaryLang,
  enabledLangs,
  translatedLangs,
}: {
  operatorSlug: string;
  courseSlug: string;
  primaryLang: string;
  enabledLangs: string[];
  translatedLangs: string[];
}) {
  const tr = useTr();
  const [pending, startTransition] = useTransition();
  const [busyLang, setBusyLang] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const enabled = new Set(enabledLangs);
  const translated = new Set(translatedLangs);

  function toggle(lang: string, enable: boolean, willTranslate: boolean) {
    setBusyLang(willTranslate ? lang : null);
    setError(null);
    const fd = new FormData();
    fd.append("operator_slug", operatorSlug);
    fd.append("course_slug", courseSlug);
    fd.append("lang", lang);
    fd.append("enabled", enable ? "1" : "0");
    startTransition(async () => {
      try {
        const res = await setCourseLanguageEnabled(fd);
        if (res && !res.ok) setError(res.error ?? "Failed");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      } finally {
        setBusyLang(null);
      }
    });
  }

  function retranslate(lang: string) {
    setBusyLang(lang);
    setError(null);
    const fd = new FormData();
    fd.append("operator_slug", operatorSlug);
    fd.append("course_slug", courseSlug);
    fd.append("to_lang", lang);
    startTransition(async () => {
      try {
        const res = await translateCourse(fd);
        if (res && !res.ok) setError(res.error ?? "Translation failed");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Translation failed");
      } finally {
        setBusyLang(null);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
      <header className="px-5 py-4 border-b border-white/[.06]">
        <div className="font-semibold text-[14px] text-white">{tr.tp_title}</div>
        <div className="text-[12px] text-[#86b69a] mt-0.5">
          {fmt(tr.tp_sub, { lang: primaryLang })}
        </div>
      </header>
      <div className="px-5 py-4 flex flex-wrap gap-2">
        {TRANSLATE_LANGS.map((lang) => {
          const isPrimary = lang.code === primaryLang;
          const isEnabled = enabled.has(lang.code);
          const isTranslated = translated.has(lang.code);

          if (isPrimary) {
            return (
              <span
                key={lang.code}
                className="px-3 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[12px]"
                title={tr.tp_source}
              >
                {lang.nativeLabel} · {tr.tp_source}
              </span>
            );
          }

          // Enabled: green, with disable + re-translate + preview.
          if (isEnabled) {
            return (
              <div key={lang.code} className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => toggle(lang.code, false, false)}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-md border border-emerald-400/50 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15 text-[12px] font-medium disabled:opacity-50"
                  title={tr.tp_enabled_title}
                >
                  {lang.nativeLabel} ✓
                </button>
                <a
                  href={`/learn/${operatorSlug}/${courseSlug}?preview=1&lang=${lang.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1.5 rounded-md border border-white/[.10] text-[#a7d4b6] hover:bg-white/[.06] text-[11px]"
                  title={fmt(tr.tp_preview_title, { lang: lang.label })}
                >
                  ↗
                </a>
                <button
                  type="button"
                  onClick={() => retranslate(lang.code)}
                  disabled={pending}
                  className="px-2 py-1.5 rounded-md border border-white/[.10] text-[#a7d4b6] hover:bg-white/[.06] text-[11px] disabled:opacity-40"
                  title={tr.tp_retranslate_title}
                >
                  ↻
                </button>
              </div>
            );
          }

          // Translated but disabled: dim, click to re-enable instantly.
          if (isTranslated) {
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => toggle(lang.code, true, false)}
                disabled={pending}
                className="px-3 py-1.5 rounded-md border border-white/[.12] text-[#86b69a] hover:bg-white/[.06] hover:text-[#d8f0e1] text-[12px] disabled:opacity-40"
                title={fmt(tr.tp_disabled_title, { lang: lang.label })}
              >
                {lang.nativeLabel} ○
              </button>
            );
          }

          // Never translated: enable = translate.
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => toggle(lang.code, true, true)}
              disabled={pending}
              className="px-3 py-1.5 rounded-md border border-white/[.10] text-[#a7d4b6] hover:bg-white/[.06] hover:text-white hover:border-emerald-400/40 text-[12px] disabled:opacity-40"
              title={fmt(tr.tp_translate_title, { lang: lang.label })}
            >
              + {lang.nativeLabel}
            </button>
          );
        })}
      </div>
      {pending && busyLang ? (
        <div className="px-5 pb-4 text-[12px] text-amber-300 flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
          {tr.tp_translating}
        </div>
      ) : null}
      {error ? (
        <div className="px-5 pb-4">
          <div className="text-[12px] text-rose-200 bg-rose-500/10 border border-rose-400/30 rounded-md px-3 py-2 break-words">
            {error}
          </div>
        </div>
      ) : null}
    </section>
  );
}
