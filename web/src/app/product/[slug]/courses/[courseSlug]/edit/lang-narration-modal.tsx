"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/app/_components/modal";
import { generateCourseLanguage, setCourseLanguageEnabled } from "../../actions";
import { TRANSLATE_LANGS } from "@/lib/translate";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";
import { voicesForLang, defaultVoiceFor, type VoiceOption } from "./editor-modules";

/**
 * Languages & narration — one place to make a course multilingual. Each
 * language row picks ONE voice and a single "Generate" both translates the
 * course text into that language AND generates narration audio for every module
 * with the chosen voice. Text and audio always move together, so the spoken
 * narration tracks the on-screen text. The primary language has no translation
 * step (audio only). Translated languages can be shown/hidden from learners.
 */
export function LangNarrationModal({
  operatorSlug,
  courseSlug,
  primaryLang,
  voices,
  enabledLangs,
  translatedLangs,
  audioCountByLang,
  moduleCount,
  triggerClassName,
  children,
}: {
  operatorSlug: string;
  courseSlug: string;
  primaryLang: string;
  voices: VoiceOption[];
  enabledLangs: string[];
  translatedLangs: string[];
  audioCountByLang: Record<string, number>;
  moduleCount: number;
  triggerClassName?: string;
  children: React.ReactNode;
}) {
  const tr = useTr();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [busyLang, setBusyLang] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const enabled = new Set(enabledLangs);
  const translated = new Set(translatedLangs);

  // Per-language chosen voice, defaulted to the best voice for that language.
  const [voiceByLang, setVoiceByLang] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const l of TRANSLATE_LANGS) o[l.code] = defaultVoiceFor(voicesForLang(voices, l.code), l.code);
    return o;
  });

  function close() {
    setOpen(false);
    router.refresh();
  }

  function generate(lang: string) {
    setBusyLang(lang);
    setErr(null);
    start(async () => {
      try {
        const res = await generateCourseLanguage({
          operatorSlug,
          courseSlug,
          lang,
          voiceId: voiceByLang[lang] ?? "",
        });
        if (res.ok) router.refresh();
        else setErr(res.error ?? tr.err_load_failed);
      } catch (e) {
        setErr(e instanceof Error ? e.message : tr.err_load_failed);
      } finally {
        setBusyLang(null);
      }
    });
  }

  function toggleVisible(lang: string, visible: boolean) {
    setBusyLang(lang);
    setErr(null);
    const fd = new FormData();
    fd.set("operator_slug", operatorSlug);
    fd.set("course_slug", courseSlug);
    fd.set("lang", lang);
    fd.set("enabled", visible ? "1" : "0");
    start(async () => {
      try {
        const res = await setCourseLanguageEnabled(fd);
        if (res && !res.ok) setErr(res.error ?? tr.err_load_failed);
        else router.refresh();
      } finally {
        setBusyLang(null);
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {children}
      </button>

      <Modal open={open} onClose={close} title={tr.ln_title} maxWidth="max-w-2xl">
        <p className="text-[12.5px] text-slate-500 mb-3">{tr.ln_sub}</p>
        <div className="space-y-2">
          {TRANSLATE_LANGS.map((l) => {
            const code = l.code;
            const isPrimary = code === primaryLang;
            const isTranslated = isPrimary || translated.has(code);
            const isVisible = isPrimary || enabled.has(code);
            const applicable = voicesForLang(voices, code);
            const audioN = audioCountByLang[code] ?? 0;
            const hasAny = isTranslated || audioN > 0;
            const rowBusy = pending && busyLang === code;

            return (
              <div
                key={code}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 flex-wrap"
              >
                <div className="min-w-[112px]">
                  <div className="text-[13px] font-medium text-slate-900">
                    {l.nativeLabel}
                    {isPrimary ? (
                      <span className="ml-1.5 text-[10px] text-emerald-700 font-semibold">· {tr.tp_source}</span>
                    ) : null}
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    {isPrimary ? "" : (isTranslated ? tr.ln_text_done : tr.ln_text_none) + " · "}
                    {fmt(tr.ln_audio_count, { n: String(audioN), total: String(moduleCount) })}
                  </div>
                </div>

                <select
                  value={voiceByLang[code] ?? ""}
                  onChange={(e) => setVoiceByLang((p) => ({ ...p, [code]: e.target.value }))}
                  disabled={rowBusy}
                  className="flex-1 min-w-[150px] bg-white border border-slate-300 rounded-md px-2 py-1.5 text-[12px] text-slate-900 outline-none focus:border-emerald-500"
                >
                  {applicable.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.kind === "cloned" ? " ★" : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => generate(code)}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-[12px] hover:bg-emerald-700 disabled:opacity-50 shrink-0"
                >
                  {rowBusy ? tr.ln_generating : hasAny ? tr.ln_regenerate : tr.ln_generate}
                </button>

                {!isPrimary && isTranslated ? (
                  <label
                    className="flex items-center gap-1 text-[11px] text-slate-600 shrink-0"
                    title={tr.ln_visible_hint}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      disabled={rowBusy}
                      onChange={(e) => toggleVisible(code, e.target.checked)}
                    />
                    {tr.ln_visible}
                  </label>
                ) : null}

                {isVisible ? (
                  <a
                    href={`/learn/${operatorSlug}/${courseSlug}?preview=1&lang=${code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-slate-400 hover:text-emerald-700 shrink-0"
                    title={fmt(tr.tp_preview_title, { lang: l.label })}
                  >
                    ↗
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>

        {pending && busyLang ? (
          <div className="mt-3 text-[12px] text-amber-600 flex items-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
            {tr.ln_working}
          </div>
        ) : null}
        {err ? (
          <div className="mt-3 text-[12px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2 break-words">
            {err}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
