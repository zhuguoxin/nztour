"use client";

import { useRef, useState, useTransition } from "react";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";

export interface VoiceRow {
  id: string;
  name: string;
  provider: string;
  external_id: string | null;
  kind: string; // 'stock' | 'cloned'
  gender: string | null;
  langs: string | null; // JSON array e.g. ["en"], or null = universal
  status: string; // 'pending' | 'active' | 'failed'
  status_detail: string | null;
  created_at: number;
}

/**
 * Voice profiles UI for a supplier.
 *
 * Two sections:
 *   1. "Cloned voices" — the supplier's already-recorded voices (e.g. Arthur).
 *      Each can be edited in place: rename, change the languages it applies to,
 *      and re-record a fresh sample.
 *   2. "Recording a new voice" — pick languages + name + gender, record a
 *      10s–3min sample in the browser; the WAV is POSTed to /api/voice/clone
 *      and MiniMax clones it.
 *
 * Cloning / re-recording is disabled if `hasXIKey=false`.
 */

// code → human label for the cloned-voice language chips. "zh" collapses both
// Chinese variants. Falls back to the raw code for anything unmapped.
const LANG_DISPLAY: Record<string, string> = {
  en: "English",
  zh: "中文",
  "zh-CN": "中文",
  "zh-TW": "中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
};

// Languages a cloned voice can be assigned to. "zh" covers both zh-CN and
// zh-TW (the editor matches on the base code), so one "中文" chip is enough.
const CLONE_LANGS: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
];

function langLabels(langs: string | null): string[] {
  if (!langs) return [];
  try {
    const arr = JSON.parse(langs) as string[];
    return [...new Set(arr.map((c) => LANG_DISPLAY[c] ?? c))];
  } catch {
    return [];
  }
}

function parseLangCodes(langs: string | null): string[] {
  if (!langs) return [];
  try {
    const arr = JSON.parse(langs) as string[];
    // collapse Chinese variants to "zh" so they round-trip with the chip set
    return [...new Set(arr.map((c) => (c.startsWith("zh") ? "zh" : c)))].filter((c) =>
      CLONE_LANGS.some((l) => l.code === c),
    );
  } catch {
    return [];
  }
}

// Hide the provider/model from the customer-facing label and drop any trailing
// "(EN, m)" parenthetical. "MiniMax · Calm Woman (EN, f)" → "Calm Woman".
function cleanName(name: string): string {
  return name
    .replace(/^[^·]*·\s*/, "") // strip "MiniMax · " / "ElevenLabs · " prefix
    .replace(/\s*\([^)]*\)\s*$/, "") // strip trailing "(EN, f)"
    .trim();
}

export function VoicesPanel({
  supplierSlug,
  voices,
  hasXIKey,
}: {
  supplierSlug: string;
  voices: VoiceRow[];
  hasXIKey: boolean;
}) {
  const tr = useTr();
  // Only cloned voices are listed — the model's stock voices are available
  // automatically when generating audio and don't need to crowd this panel.
  const cloned = voices.filter((v) => v.kind === "cloned");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="font-semibold text-[14px] text-slate-900">{tr.voi_title}</div>
          <div className="text-[12.5px] text-slate-500 mt-0.5">{tr.voi_sub}</div>
        </div>
        {!hasXIKey ? (
          <span
            className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md"
            title="Set MINIMAX_API_KEY via `wrangler secret put MINIMAX_API_KEY` to enable voice cloning"
          >
            {tr.voi_disabled}
          </span>
        ) : null}
      </header>

      {/* Existing cloned voices (editable) */}
      <div className="px-5 py-4">
        {cloned.length === 0 ? (
          <div className="text-[12.5px] text-slate-500 py-1">{tr.voi_empty}</div>
        ) : (
          <ul className="space-y-2">
            {cloned.map((v) => (
              <ClonedVoiceItem
                key={v.id}
                voice={v}
                supplierSlug={supplierSlug}
                disabled={!hasXIKey}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Add a new voice */}
      <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
        <div className="font-semibold text-[13.5px] text-slate-900">{tr.voi_new_heading}</div>
        <CloneForm supplierSlug={supplierSlug} disabled={!hasXIKey} />
      </div>
    </section>
  );
}

function StatusBadge({ status, detail }: { status: string; detail: string | null }) {
  const cfg =
    status === "active"
      ? { cls: "border-emerald-300 text-emerald-700 bg-emerald-50", label: "active" }
      : status === "failed"
        ? { cls: "border-rose-300 text-rose-700 bg-rose-50", label: "failed" }
        : { cls: "border-amber-300 text-amber-700 bg-amber-50", label: "pending" };
  return (
    <span
      className={`px-1.5 py-0.5 rounded border text-[10px] font-mono uppercase ${cfg.cls}`}
      title={detail ?? undefined}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
//  In-browser recorder → WAV
//
//  MiniMax voice cloning accepts wav/mp3/m4a but NOT webm/opus (what
//  MediaRecorder emits). So we capture raw PCM via the Web Audio API and encode
//  a 16-bit mono WAV ourselves (downsampled to 24 kHz — plenty for speech, and
//  keeps a 3-min sample well under the 20 MB upload cap). No external library.
// ---------------------------------------------------------------------------

const TARGET_RATE = 24000;
const MAX_SECONDS = 180; // 3 min — stays under the 20 MB clone cap

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function downsample(input: Float32Array, from: number, to: number): Float32Array {
  if (to >= from) return input;
  const ratio = from / to;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    // simple average over the source window to avoid aliasing
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

type RecState = "idle" | "recording" | "recorded";

/** Mic → WAV recorder. Shared by the new-voice form and per-voice re-record. */
function useRecorder() {
  const tr = useTr();
  const [recState, setRecState] = useState<RecState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const rateRef = useRef<number>(48000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function cleanupGraph() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      nodeRef.current?.disconnect();
      srcRef.current?.disconnect();
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    nodeRef.current = null;
    srcRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
  }

  async function start() {
    setErr(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    chunksRef.current = [];
    setSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      rateRef.current = ctx.sampleRate;
      const src = ctx.createMediaStreamSource(stream);
      srcRef.current = src;
      const node = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;
      node.onaudioprocess = (e) => {
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      src.connect(node);
      node.connect(ctx.destination);
      setRecState("recording");
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= MAX_SECONDS) stop();
          return next;
        });
      }, 1000);
    } catch {
      setErr(tr.voi_mic_blocked);
      cleanupGraph();
      setRecState("idle");
    }
  }

  function stop() {
    const from = rateRef.current;
    const total = chunksRef.current.reduce((n, c) => n + c.length, 0);
    cleanupGraph();
    if (total === 0) {
      setErr(tr.voi_nothing);
      setRecState("idle");
      return;
    }
    const merged = new Float32Array(total);
    let off = 0;
    for (const c of chunksRef.current) {
      merged.set(c, off);
      off += c.length;
    }
    const down = downsample(merged, from, TARGET_RATE);
    const wav = encodeWav(down, TARGET_RATE);
    const url = URL.createObjectURL(wav);
    setBlob(wav);
    setPreviewUrl(url);
    setRecState("recorded");
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    setSeconds(0);
    setRecState("idle");
    setErr(null);
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const tooShort = recState === "recorded" && seconds < 10;

  return { recState, seconds, blob, previewUrl, err, setErr, start, stop, reset, mmss, tooShort };
}

type Recorder = ReturnType<typeof useRecorder>;

/** Language chip multi-select. */
function LangChips({
  selected,
  onToggle,
  disabled,
}: {
  selected: string[];
  onToggle: (code: string) => void;
  disabled: boolean;
}) {
  const tr = useTr();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[12px] text-slate-500 mr-1">{tr.voi_langs}</span>
      {CLONE_LANGS.map((l) => {
        const on = selected.includes(l.code);
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => onToggle(l.code)}
            disabled={disabled}
            className={`px-2.5 py-1 rounded-full border text-[12px] transition disabled:opacity-50 ${
              on
                ? "bg-[#04241e] border-[#04241e] text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

/** Recording indicator + Stop, or the recorded preview + re-take. The Start /
 *  Re-record trigger and the Save button live in the parent. */
function RecorderStrip({ rec }: { rec: Recorder }) {
  const tr = useTr();
  if (rec.recState === "recording") {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-rose-600">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
          {rec.mmss}
        </span>
        <button
          type="button"
          onClick={rec.stop}
          className="px-4 py-2 rounded-md font-semibold text-[13px] text-white bg-[#04241e] hover:bg-[#0a3a2f]"
        >
          {tr.voi_rec_stop}
        </button>
        <span className="text-[11px] text-slate-500">
          {fmt(tr.voi_rec_max, { n: MAX_SECONDS / 60 })}
        </span>
      </div>
    );
  }
  if (rec.recState === "recorded" && rec.previewUrl) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <audio controls src={rec.previewUrl} className="h-9" />
        <span className="text-[12px] text-slate-500">{fmt(tr.voi_recorded, { t: rec.mmss })}</span>
      </div>
    );
  }
  return null;
}

function RecordTip() {
  const tr = useTr();
  return <div className="text-[11px] text-slate-500">{tr.voi_tip}</div>;
}

// ---------------------------------------------------------------------------
//  Existing cloned voice — view + edit (rename, languages, gender, re-record)
// ---------------------------------------------------------------------------

function ClonedVoiceItem({
  voice,
  supplierSlug,
  disabled,
}: {
  voice: VoiceRow;
  supplierSlug: string;
  disabled: boolean;
}) {
  const tr = useTr();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cleanName(voice.name));
  const [gender, setGender] = useState(voice.gender ?? "neutral");
  const [langs, setLangs] = useState<string[]>(parseLangCodes(voice.langs));
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rec = useRecorder();

  function toggleLang(code: string) {
    setLangs((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));
  }

  function cancel() {
    rec.reset();
    setName(cleanName(voice.name));
    setGender(voice.gender ?? "neutral");
    setLangs(parseLangCodes(voice.langs));
    setErr(null);
    setEditing(false);
  }

  // Save metadata only (no new recording).
  function saveMeta() {
    if (!name.trim() || langs.length === 0) return;
    const fd = new FormData();
    fd.append("voice_id", voice.id);
    fd.append("supplier_slug", supplierSlug);
    fd.append("name", name.trim());
    fd.append("gender", gender);
    fd.append("langs", JSON.stringify(langs));
    startTransition(async () => {
      const r = await fetch("/api/voice/update", { method: "POST", body: fd });
      if (r.ok) window.location.reload();
      else setErr((await r.text().catch(() => "Save failed")).slice(0, 400));
    });
  }

  // Save the freshly recorded sample (re-clone in place) + metadata.
  function saveRecording() {
    if (!rec.blob || !name.trim() || langs.length === 0) return;
    const fd = new FormData();
    fd.append("voice_id", voice.id);
    fd.append("file", rec.blob, "sample.wav");
    fd.append("supplier_slug", supplierSlug);
    fd.append("name", name.trim());
    fd.append("gender", gender);
    fd.append("langs", JSON.stringify(langs));
    startTransition(async () => {
      const r = await fetch("/api/voice/clone", { method: "POST", body: fd });
      if (r.ok) window.location.reload();
      else setErr((await r.text().catch(() => "Re-record failed")).slice(0, 400));
    });
  }

  if (!editing) {
    return (
      <li className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2">
        <span className="text-[18px]">🎤</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] text-slate-900 truncate">{cleanName(voice.name)}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
            {voice.gender ? <span className="uppercase font-mono">{voice.gender}</span> : null}
            <StatusBadge status={voice.status} detail={voice.status_detail} />
            {langLabels(voice.langs).map((lbl) => (
              <span
                key={lbl}
                className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600"
              >
                {lbl}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={disabled}
          className="shrink-0 px-3 py-1.5 rounded-md border border-slate-300 text-[12.5px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {tr.voi_edit}
        </button>
      </li>
    );
  }

  const canSaveMeta = !pending && name.trim() !== "" && langs.length > 0;

  return (
    <li className="rounded-md border border-slate-300 bg-white px-3 py-3 space-y-2.5">
      <LangChips selected={langs} onToggle={toggleLang} disabled={pending} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          disabled={pending}
          className="flex-1 min-w-0 px-3 py-2 rounded-md border border-slate-300 text-[13.5px] disabled:opacity-50"
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          disabled={pending}
          className="sm:w-[120px] px-3 py-2 rounded-md border border-slate-300 text-[13.5px] disabled:opacity-50"
        >
          <option value="neutral">{tr.voi_g_neutral}</option>
          <option value="male">{tr.voi_g_male}</option>
          <option value="female">{tr.voi_g_female}</option>
        </select>
        {rec.recState === "idle" ? (
          <button
            type="button"
            onClick={rec.start}
            disabled={pending}
            className="shrink-0 px-4 py-2 rounded-md font-semibold text-[13px] text-rose-600 border border-rose-300 hover:bg-rose-50 disabled:opacity-50"
          >
            {tr.voi_rec_rerecord}
          </button>
        ) : null}
      </div>

      <RecorderStrip rec={rec} />
      {rec.recState !== "idle" ? <RecordTip /> : null}
      {rec.tooShort ? (
        <div className="text-[11px] text-amber-700">{tr.voi_too_short}</div>
      ) : null}

      {(err || rec.err) ? (
        <div className="text-[11px] text-rose-700">{err ?? rec.err}</div>
      ) : null}

      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        {rec.recState === "recorded" ? (
          <>
            <button
              type="button"
              onClick={saveRecording}
              disabled={pending || rec.tooShort}
              className={`px-4 py-1.5 rounded-md font-semibold text-[13px] text-white ${
                pending || rec.tooShort
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[#04241e] hover:bg-[#0a3a2f]"
              }`}
            >
              {pending ? tr.voi_saving : tr.voi_save_new_rec}
            </button>
            <button
              type="button"
              onClick={rec.reset}
              disabled={pending}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-[12.5px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {tr.voi_discard}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={saveMeta}
            disabled={!canSaveMeta || rec.recState === "recording"}
            className={`px-4 py-1.5 rounded-md font-semibold text-[13px] text-white ${
              !canSaveMeta || rec.recState === "recording"
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-[#04241e] hover:bg-[#0a3a2f]"
            }`}
          >
            {pending ? tr.voi_saving : tr.voi_save_changes}
          </button>
        )}
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="px-3 py-1.5 rounded-md border border-slate-300 text-[12.5px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {tr.voi_cancel}
        </button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
//  New voice — languages + name + gender + record
// ---------------------------------------------------------------------------

function CloneForm({ supplierSlug, disabled }: { supplierSlug: string; disabled: boolean }) {
  const tr = useTr();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("neutral");
  const [langs, setLangs] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rec = useRecorder();

  function toggleLang(code: string) {
    setLangs((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));
  }

  function save() {
    if (!rec.blob || !name.trim() || langs.length === 0) return;
    const fd = new FormData();
    fd.append("file", rec.blob, "sample.wav");
    fd.append("supplier_slug", supplierSlug);
    fd.append("name", name.trim());
    fd.append("gender", gender);
    fd.append("langs", JSON.stringify(langs));
    startTransition(async () => {
      const r = await fetch("/api/voice/clone", { method: "POST", body: fd });
      if (r.ok) window.location.reload();
      else setErr((await r.text().catch(() => "Clone failed")).slice(0, 400));
    });
  }

  const canRecord = !disabled && !pending && name.trim() !== "" && langs.length > 0;

  return (
    <div className="mt-3 space-y-2.5">
      <LangChips selected={langs} onToggle={toggleLang} disabled={disabled || pending || rec.recState !== "idle"} />

      {/* Name + gender + start recording on one row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="text"
          placeholder={tr.voi_name_ph}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          disabled={disabled || pending || rec.recState !== "idle"}
          className="flex-1 min-w-0 px-3 py-2 rounded-md border border-slate-300 text-[13.5px] disabled:opacity-50"
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          disabled={disabled || pending || rec.recState !== "idle"}
          className="sm:w-[120px] px-3 py-2 rounded-md border border-slate-300 text-[13.5px] disabled:opacity-50"
        >
          <option value="neutral">{tr.voi_g_neutral}</option>
          <option value="male">{tr.voi_g_male}</option>
          <option value="female">{tr.voi_g_female}</option>
        </select>
        {rec.recState === "idle" ? (
          <button
            type="button"
            onClick={rec.start}
            disabled={!canRecord}
            className={`shrink-0 px-4 py-2 rounded-md font-semibold text-[13px] text-white ${
              !canRecord ? "bg-slate-400 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-500"
            }`}
            title={
              !name.trim()
                ? tr.voi_enter_name_first
                : langs.length === 0
                  ? tr.voi_pick_lang_first
                  : undefined
            }
          >
            {tr.voi_rec_start}
          </button>
        ) : null}
      </div>

      <RecorderStrip rec={rec} />

      {rec.recState === "recorded" ? (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={save}
            disabled={pending || rec.tooShort}
            className={`px-4 py-1.5 rounded-md font-semibold text-[13px] text-white ${
              pending || rec.tooShort
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-[#04241e] hover:bg-[#0a3a2f]"
            }`}
          >
            {pending ? tr.voi_cloning : tr.voi_save_clone}
          </button>
          <button
            type="button"
            onClick={rec.reset}
            disabled={pending}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-[12.5px] text-slate-700 hover:bg-white disabled:opacity-50"
          >
            {tr.voi_rerecord_btn}
          </button>
        </div>
      ) : null}

      {rec.tooShort ? (
        <div className="text-[11px] text-amber-700">{tr.voi_too_short}</div>
      ) : null}

      {(err || rec.err) ? <div className="text-[11px] text-rose-700">{err ?? rec.err}</div> : null}

      <RecordTip />
    </div>
  );
}
