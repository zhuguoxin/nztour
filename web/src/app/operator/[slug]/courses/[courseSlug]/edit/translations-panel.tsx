"use client";

import { useState, useTransition } from "react";
import { setCourseLanguageEnabled, translateCourse } from "../../actions";
import { TRANSLATE_LANGS } from "@/lib/translate";

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
  const [pending, startTransition] = useTransition();
  const [busyLang, setBusyLang] = useState<string | null>(null);
  const enabled = new Set(enabledLangs);
  const translated = new Set(translatedLangs);

  function toggle(lang: string, enable: boolean, willTranslate: boolean) {
    setBusyLang(willTranslate ? lang : null);
    const fd = new FormData();
    fd.append("operator_slug", operatorSlug);
    fd.append("course_slug", courseSlug);
    fd.append("lang", lang);
    fd.append("enabled", enable ? "1" : "0");
    startTransition(async () => {
      try {
        await setCourseLanguageEnabled(fd);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed");
      } finally {
        setBusyLang(null);
      }
    });
  }

  function retranslate(lang: string) {
    setBusyLang(lang);
    const fd = new FormData();
    fd.append("operator_slug", operatorSlug);
    fd.append("course_slug", courseSlug);
    fd.append("to_lang", lang);
    startTransition(async () => {
      try {
        await translateCourse(fd);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Translation failed");
      } finally {
        setBusyLang(null);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
      <header className="px-5 py-4 border-b border-white/[.06]">
        <div className="font-semibold text-[14px] text-white">Languages</div>
        <div className="text-[12px] text-[#86b69a] mt-0.5">
          Source language is <span className="font-mono text-emerald-300">{primaryLang}</span>.
          Enable a language to translate the whole course; disable it to hide it from learners
          without losing the translation or audio — re-enabling is instant.
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
                title="Source language — always on"
              >
                {lang.nativeLabel} · source
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
                  title="Enabled — click to disable (translation is kept)"
                >
                  {lang.nativeLabel} ✓
                </button>
                <a
                  href={`/learn/${operatorSlug}/${courseSlug}?preview=1&lang=${lang.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1.5 rounded-md border border-white/[.10] text-[#a7d4b6] hover:bg-white/[.06] text-[11px]"
                  title={`Preview in ${lang.label}`}
                >
                  ↗
                </a>
                <button
                  type="button"
                  onClick={() => retranslate(lang.code)}
                  disabled={pending}
                  className="px-2 py-1.5 rounded-md border border-white/[.10] text-[#a7d4b6] hover:bg-white/[.06] text-[11px] disabled:opacity-40"
                  title="Re-translate (overwrites the existing translation)"
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
                title={`Disabled — click to enable (reuses the existing ${lang.label} translation)`}
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
              title={`Translate the whole course to ${lang.label} and enable it`}
            >
              + {lang.nativeLabel}
            </button>
          );
        })}
      </div>
      {pending && busyLang ? (
        <div className="px-5 pb-4 text-[12px] text-amber-300 flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
          Translating with Claude — usually 10–30 seconds for a typical course.
        </div>
      ) : null}
    </section>
  );
}
