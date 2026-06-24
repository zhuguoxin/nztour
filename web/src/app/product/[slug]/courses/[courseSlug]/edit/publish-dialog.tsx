"use client";

import { useState } from "react";
import { Modal } from "@/app/_components/modal";
import { TRANSLATE_LANGS } from "@/lib/translate";
import { useTr } from "@/lib/i18n-provider";
import { voicesForLang, defaultVoiceFor, voiceDisplayName, type VoiceOption } from "./editor-modules";

/**
 * Publish dialog — the one place that generates narration in bulk. Pick which
 * languages to publish + a voice for each, optionally skip already-narrated
 * modules, then publish. Translation + TTS for every selected language × module
 * runs in the background (/api/publish-course); the course goes live when done.
 */
export function PublishDialog({
  operatorSlug,
  courseSlug,
  courseTitle,
  primaryLang,
  voices,
  enabledLangs,
  publishAt,
  triggerClassName,
  children,
}: {
  operatorSlug: string;
  courseSlug: string;
  courseTitle: string;
  primaryLang: string;
  voices: VoiceOption[];
  enabledLangs: string[];
  publishAt: number;
  triggerClassName?: string;
  children: React.ReactNode;
}) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Set<string>>(() => new Set([primaryLang, ...enabledLangs]));
  const [voiceByLang, setVoiceByLang] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const l of TRANSLATE_LANGS) o[l.code] = defaultVoiceFor(voicesForLang(voices, l.code), l.code);
    return o;
  });
  const [dontOverwrite, setDontOverwrite] = useState(true);
  const [running, setRunning] = useState(false);

  function publish() {
    const langs = TRANSLATE_LANGS.filter((l) => l.code === primaryLang || sel.has(l.code)).map((l) => ({
      lang: l.code,
      voiceId: voiceByLang[l.code] ?? "",
    }));
    if (!langs.length) return;
    setRunning(true);
    fetch("/api/publish-course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorSlug, courseSlug, langs, overwrite: !dontOverwrite }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        // Hand off to the persistent watcher (bottom-right toast + progress),
        // then close — generation continues in the background.
        window.dispatchEvent(
          new CustomEvent("libretour:publish-start", {
            detail: {
              id: `${operatorSlug}/${courseSlug}`,
              operatorSlug,
              courseSlug,
              label: courseTitle,
              baseline: publishAt,
            },
          }),
        );
        setRunning(false);
        setOpen(false);
      })
      .catch(() => {
        setRunning(false);
        alert(tr.err_load_failed);
      });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {children}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={tr.pub_title} maxWidth="max-w-lg">
        <p className="text-caption text-slate-500 mb-3">{tr.pub_sub}</p>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {TRANSLATE_LANGS.map((l) => {
            const code = l.code;
            const isPrimary = code === primaryLang;
            const on = isPrimary || sel.has(code);
            const applicable = voicesForLang(voices, code);
            return (
              <div
                key={code}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 flex-wrap"
              >
                <label className="flex items-center gap-2 min-w-[150px] text-small text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={isPrimary || running}
                    onChange={(e) =>
                      setSel((prev) => {
                        const n = new Set(prev);
                        if (e.target.checked) n.add(code);
                        else n.delete(code);
                        return n;
                      })
                    }
                    className="accent-emerald-600"
                  />
                  {l.label}
                  {isPrimary ? <span className="ml-1 text-micro text-slate-900 font-semibold">· {tr.tp_source}</span> : null}
                </label>
                <select
                  value={voiceByLang[code] ?? ""}
                  onChange={(e) => setVoiceByLang((p) => ({ ...p, [code]: e.target.value }))}
                  disabled={!on || running}
                  className="flex-1 min-w-[150px] bg-white border border-slate-300 rounded-md px-2 py-1.5 text-caption text-slate-900 outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  {applicable.map((v) => (
                    <option key={v.id} value={v.id}>
                      {voiceDisplayName(v.name)}
                      {v.kind === "cloned" ? " ★" : ""}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <label className="flex items-center gap-2 mt-4 text-small text-slate-700 select-none">
          <input
            type="checkbox"
            checked={dontOverwrite}
            disabled={running}
            onChange={(e) => setDontOverwrite(e.target.checked)}
            className="accent-emerald-600"
          />
          {tr.pub_no_overwrite}
        </label>

        <div className="mt-5 flex items-center justify-between gap-3">
          {running ? (
            <span className="text-caption text-slate-900 flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
              {tr.pub_running}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={publish}
            disabled={running}
            className="px-4 py-2 rounded-md bg-lime-600 text-white font-semibold text-small hover:bg-lime-700 disabled:opacity-50"
          >
            {running ? tr.pub_running : tr.pub_go}
          </button>
        </div>
      </Modal>
    </>
  );
}
