"use client";

import { useTransition } from "react";
import { translateCourse } from "../../actions";
import { TRANSLATE_LANGS } from "@/lib/translate";

/**
 * Translation status + actions for a course.
 *
 * Shows every supported language as a chip:
 *   • Primary lang  — solid emerald chip (locked / "source")
 *   • Available      — emerald outline + ✓ + (preview link)
 *   • Not translated — slate outline + "Translate →" button
 *
 * Clicking "Translate" calls translateCourse server action: Claude walks
 * the whole course module-by-module, batches each module's text into one
 * call for consistent terminology, and writes results into the *_i18n
 * JSON columns. The page revalidates and the chip flips to "available".
 *
 * Re-translation: clicking an already-available chip re-runs the action
 * for that language, overwriting prior translations.
 */
export function TranslationsPanel({
  operatorSlug,
  courseSlug,
  primaryLang,
  availableLangs,
}: {
  operatorSlug: string;
  courseSlug: string;
  primaryLang: string;
  availableLangs: string[];
}) {
  const [pending, startTransition] = useTransition();
  const availSet = new Set(availableLangs);

  function trigger(toLang: string) {
    const fd = new FormData();
    fd.append("operator_slug", operatorSlug);
    fd.append("course_slug", courseSlug);
    fd.append("to_lang", toLang);
    startTransition(async () => {
      try {
        await translateCourse(fd);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Translation failed");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
      <header className="px-5 py-4 border-b border-white/[.06]">
        <div className="font-semibold text-[14px] text-white">Languages</div>
        <div className="text-[12px] text-[#86b69a] mt-0.5">
          Source language is{" "}
          <span className="font-mono text-emerald-300">{primaryLang}</span>. AI translates the whole
          course (titles, summaries, every block, every caption) into the target language with
          consistent terminology.
        </div>
      </header>
      <div className="px-5 py-4 flex flex-wrap gap-2">
        {TRANSLATE_LANGS.map((lang) => {
          const isPrimary = lang.code === primaryLang;
          const isAvailable = availSet.has(lang.code);
          if (isPrimary) {
            return (
              <span
                key={lang.code}
                className="px-3 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[12px]"
                title="Source language"
              >
                {lang.nativeLabel} · source
              </span>
            );
          }
          if (isAvailable) {
            return (
              <div key={lang.code} className="flex items-stretch gap-1">
                <a
                  href={`/learn/${operatorSlug}/${courseSlug}?preview=1&lang=${lang.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-md border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10 text-[12px] font-medium"
                  title={`Preview the course in ${lang.label}`}
                >
                  {lang.nativeLabel} ✓
                </a>
                <button
                  type="button"
                  onClick={() => trigger(lang.code)}
                  disabled={pending}
                  className="px-2 py-1.5 rounded-md border border-white/[.10] text-[#a7d4b6] hover:bg-white/[.06] text-[11px] disabled:opacity-40"
                  title="Re-translate (overwrites the existing translation)"
                >
                  ↻
                </button>
              </div>
            );
          }
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => trigger(lang.code)}
              disabled={pending}
              className="px-3 py-1.5 rounded-md border border-white/[.10] text-[#a7d4b6] hover:bg-white/[.06] hover:text-white hover:border-emerald-400/40 text-[12px] disabled:opacity-40"
              title={`Translate the whole course to ${lang.label}`}
            >
              + {lang.nativeLabel}
            </button>
          );
        })}
      </div>
      {pending ? (
        <div className="px-5 pb-4 text-[12px] text-amber-300 flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
          Translating with Claude — usually 10–30 seconds for a typical course.
        </div>
      ) : null}
    </section>
  );
}
