"use client";

import { useRef, useState, useTransition } from "react";

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
 * Lists every voice the supplier can use in audio narration:
 *   • Platform stock voices (shared, free) — grouped by language, model name
 *     hidden (customers shouldn't need to know "MiniMax")
 *   • Cloned voices (owned by this supplier) — pending/active/failed badges
 *
 * Clone flow:
 *   • Enter name + gender, record a 10s–3min sample in the browser (mic)
 *   • The recording is encoded to WAV client-side and POSTed to
 *     /api/voice/clone — MiniMax clones it, we save the voice_id
 *   • Row appears with status='pending' → 'active' on success, 'failed' on error
 *
 * The "Clone a voice" CTA is disabled if `hasXIKey=false`.
 */

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
  // Only cloned voices are listed — the model's stock voices are available
  // automatically when generating audio and don't need to crowd this panel.
  const cloned = voices.filter((v) => v.kind === "cloned");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="font-semibold text-[14px] text-slate-900">Cloned voices</div>
          <div className="text-[12.5px] text-slate-500 mt-0.5">
            Record a sample to clone a voice that&apos;s private to this supplier.
          </div>
        </div>
        {!hasXIKey ? (
          <span
            className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md"
            title="Set MINIMAX_API_KEY via `wrangler secret put MINIMAX_API_KEY` to enable voice cloning"
          >
            Cloning disabled — key not set
          </span>
        ) : null}
      </header>

      {/* Cloned voices */}
      <div className="px-5 py-4">
        {cloned.length === 0 ? (
          <div className="text-[12.5px] text-slate-500 py-2">
            No cloned voices yet — record a 10-second to 3-minute sample below to clone a sales
            rep&apos;s voice.
          </div>
        ) : (
          <ul className="space-y-2">
            {cloned.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2"
              >
                <span className="text-[18px]">🎤</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-slate-900 truncate">{cleanName(v.name)}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    {v.gender ? <span className="uppercase font-mono">{v.gender}</span> : null}
                    <StatusBadge status={v.status} detail={v.status_detail} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Clone form */}
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

function CloneForm({ supplierSlug, disabled }: { supplierSlug: string; disabled: boolean }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("neutral");
  const [pending, startTransition] = useTransition();

  const [recState, setRecState] = useState<RecState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // refs holding the live recording graph
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

  async function startRecording() {
    setErr(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    chunksRef.current = [];
    setSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
          if (next >= MAX_SECONDS) stopRecording();
          return next;
        });
      }, 1000);
    } catch {
      setErr("Microphone access was blocked. Allow mic permission and try again.");
      cleanupGraph();
      setRecState("idle");
    }
  }

  function stopRecording() {
    const from = rateRef.current;
    const total = chunksRef.current.reduce((n, c) => n + c.length, 0);
    cleanupGraph();
    if (total === 0) {
      setErr("Nothing was recorded. Try again.");
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

  function save() {
    if (!blob || !name.trim()) return;
    const fd = new FormData();
    fd.append("file", blob, "sample.wav");
    fd.append("supplier_slug", supplierSlug);
    fd.append("name", name.trim());
    fd.append("gender", gender);
    startTransition(async () => {
      const r = await fetch("/api/voice/clone", { method: "POST", body: fd });
      if (r.ok) {
        window.location.reload();
      } else {
        const msg = await r.text().catch(() => "Clone failed");
        setErr(msg.slice(0, 400));
      }
    });
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const tooShort = recState === "recorded" && seconds < 10;

  return (
    <div className="mt-4 space-y-2.5">
      {/* Name + gender + start recording on one row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="text"
          placeholder="Voice name e.g. Maya — sales lead"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          disabled={disabled || pending || recState !== "idle"}
          className="flex-1 min-w-0 px-3 py-2 rounded-md border border-slate-300 text-[13.5px] disabled:opacity-50"
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          disabled={disabled || pending || recState !== "idle"}
          className="sm:w-[120px] px-3 py-2 rounded-md border border-slate-300 text-[13.5px] disabled:opacity-50"
        >
          <option value="neutral">neutral</option>
          <option value="male">male</option>
          <option value="female">female</option>
        </select>
        {recState === "recording" ? (
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              {mmss}
            </span>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 rounded-md font-semibold text-[13px] text-white bg-[#04241e] hover:bg-[#0a3a2f]"
            >
              ■ Stop
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || pending || !name.trim() || recState === "recorded"}
            className={`shrink-0 px-4 py-2 rounded-md font-semibold text-[13px] text-white ${
              disabled || pending || !name.trim() || recState === "recorded"
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-rose-600 hover:bg-rose-500"
            }`}
            title={!name.trim() ? "Enter a voice name first" : undefined}
          >
            ● Start recording
          </button>
        )}
      </div>

      {/* Recorded preview */}
      {recState === "recorded" && previewUrl ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <audio controls src={previewUrl} className="h-9" />
              <span className="text-[12px] text-slate-500">{mmss} recorded</span>
              <button
                type="button"
                onClick={reset}
                disabled={pending}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-[12.5px] text-slate-700 hover:bg-white disabled:opacity-50"
              >
                Re-record
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending || tooShort}
                className={`px-4 py-1.5 rounded-md font-semibold text-[13px] text-white ${
                  pending || tooShort
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-[#04241e] hover:bg-[#0a3a2f]"
                }`}
              >
                {pending ? "Cloning…" : "Save & clone"}
              </button>
            </div>
            {tooShort ? (
              <div className="text-[11px] text-amber-700">
                Recording is under 10 seconds — record a bit more for a good clone.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {err ? <div className="text-[11px] text-rose-700">{err}</div> : null}

      <div className="text-[11px] text-slate-500">
        Record <strong>10 seconds–3 minutes</strong>, single speaker, clear Mandarin or English, no
        music or background noise. A cloned voice can narrate any language.
      </div>
    </div>
  );
}
