"use client";

import { useState } from "react";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";
import type { GlossaryRow } from "@/lib/glossary";

export interface LangOption {
  code: string;
  label: string;
  nativeLabel: string;
}

interface Parsed {
  entries: Array<{ source_text: string; translations: Record<string, string> }>;
  langs: string[];
  unmatched: string[];
}

function matchLang(header: string, langs: LangOption[]): string | null {
  const h = header.trim().toLowerCase();
  for (const l of langs) {
    if (h === l.code.toLowerCase() || h === l.label.toLowerCase() || h === l.nativeLabel.toLowerCase()) {
      return l.code;
    }
  }
  if (h === "中文" || h === "chinese" || h === "简体中文") return "zh-CN";
  if (h === "繁體中文" || h === "traditional chinese") return "zh-TW";
  return null;
}

function parseTable(text: string, langs: LangOption[]): Parsed {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return { entries: [], langs: [], unmatched: [] };
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const header = lines[0].split(sep).map((s) => s.trim());
  const colLang = header.map((h, i) => (i === 0 ? null : matchLang(h, langs)));
  const unmatched = header.filter((h, i) => i > 0 && !colLang[i] && h);
  const entries: Parsed["entries"] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = lines[r].split(sep).map((s) => s.trim());
    const source = cells[0];
    if (!source) continue;
    const translations: Record<string, string> = {};
    for (let c = 1; c < cells.length; c++) {
      const code = colLang[c];
      if (code && cells[c]) translations[code] = cells[c];
    }
    entries.push({ source_text: source, translations });
  }
  const used = [...new Set(colLang.filter(Boolean) as string[])];
  return { entries, langs: used, unmatched };
}

export function GlossaryPanel({
  scope,
  slug,
  entries,
  languages,
  inheritedCount,
  onChanged,
}: {
  scope: "supplier" | "operator";
  slug: string;
  entries: GlossaryRow[];
  languages: LangOption[];
  inheritedCount?: number;
  /** Called after a mutation; defaults to a full reload (modal hosts re-fetch). */
  onChanged?: () => void;
}) {
  const tr = useTr();
  const refresh = onChanged ?? (() => window.location.reload());
  const [paste, setPaste] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => {
      setPaste(t);
      setParsed(parseTable(t, languages));
      setErr(null);
    });
  }

  async function save() {
    if (!parsed || parsed.entries.length === 0) return;
    setPending(true);
    setErr(null);
    const r = await fetch("/api/glossary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, slug, entries: parsed.entries }),
    });
    if (r.ok) refresh();
    else {
      setErr((await r.text().catch(() => tr.gl_failed)).slice(0, 300));
      setPending(false);
    }
  }

  async function del(id: string) {
    setPending(true);
    const r = await fetch("/api/glossary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, slug, action: "delete", id }),
    });
    if (r.ok) refresh();
    else setPending(false);
  }

  // languages that appear in the current entries → table columns
  const parsedEntries = entries.map((e) => {
    let t: Record<string, string> = {};
    try {
      t = JSON.parse(e.translations);
    } catch {}
    return { ...e, t };
  });
  const langCols = languages.filter((l) => parsedEntries.some((e) => e.t[l.code]));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="px-5 py-4 border-b border-slate-200">
        <div className="font-semibold text-[14px] text-slate-900">{tr.gl_title}</div>
        <div className="text-[12.5px] text-slate-500 mt-0.5">
          {scope === "supplier" ? tr.gl_sub_supplier : tr.gl_sub_operator}
        </div>
        {inheritedCount ? (
          <div className="text-[11.5px] text-emerald-700 mt-1">
            {fmt(tr.gl_inherited, { n: inheritedCount })}
          </div>
        ) : null}
      </header>

      {/* Import */}
      <div className="px-5 py-4 border-b border-slate-200 space-y-2.5">
        <div className="text-[12px] font-semibold text-slate-700">{tr.gl_import_heading}</div>
        <div className="text-[11.5px] text-slate-500 leading-relaxed">{tr.gl_import_hint}</div>
        <label className="inline-block px-3 py-1.5 rounded-md border border-slate-300 text-[12.5px] text-slate-700 hover:bg-slate-50 cursor-pointer">
          {tr.gl_choose_file}
          <input
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
            className="hidden"
            onChange={onFile}
          />
        </label>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          placeholder={tr.gl_paste_ph}
          className="w-full px-3 py-2 rounded-md border border-slate-300 text-[12.5px] font-mono resize-y"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setParsed(parseTable(paste, languages));
              setErr(null);
            }}
            disabled={!paste.trim()}
            className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-300 text-[12.5px] text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            {tr.gl_parse}
          </button>
          {parsed ? (
            parsed.entries.length ? (
              <>
                <span className="text-[12px] text-slate-600">
                  {fmt(tr.gl_parsed_count, { n: parsed.entries.length, langs: parsed.langs.length })}
                </span>
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className="px-4 py-1.5 rounded-md bg-[#04241e] text-white font-semibold text-[12.5px] hover:bg-[#0a3a2f] disabled:opacity-50"
                >
                  {pending ? tr.gl_saving : tr.gl_save_import}
                </button>
              </>
            ) : (
              <span className="text-[12px] text-amber-700">{tr.gl_parse_empty}</span>
            )
          ) : null}
        </div>
        {parsed && parsed.unmatched.length ? (
          <div className="text-[11px] text-amber-700">
            {fmt(tr.gl_unmatched_cols, { cols: parsed.unmatched.join(", ") })}
          </div>
        ) : null}
        <div className="text-[11px] text-slate-400">{tr.gl_import_note}</div>
        {err ? <div className="text-[11.5px] text-rose-700 break-words">{err}</div> : null}
      </div>

      {/* Current terms */}
      <div className="px-5 py-4">
        <div className="text-[11px] tracking-widest font-mono text-slate-500 mb-2">
          {fmt(tr.gl_current_heading, { n: entries.length })}
        </div>
        {entries.length === 0 ? (
          <div className="text-[12.5px] text-slate-500">{tr.gl_empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-1.5 pr-3 font-medium">{tr.gl_col_source}</th>
                  {langCols.map((l) => (
                    <th key={l.code} className="py-1.5 pr-3 font-medium">
                      {l.nativeLabel}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {parsedEntries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-900">{e.source_text}</td>
                    {langCols.map((l) => (
                      <td key={l.code} className="py-1.5 pr-3 text-slate-600">
                        {e.t[l.code] ?? ""}
                      </td>
                    ))}
                    <td className="py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => del(e.id)}
                        disabled={pending}
                        className="text-rose-600 hover:underline text-[11.5px] disabled:opacity-50"
                      >
                        {tr.gl_delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
