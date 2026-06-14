"use client";

import { useState, useTransition } from "react";

export interface VoiceRow {
  id: string;
  name: string;
  provider: string;
  external_id: string | null;
  kind: string; // 'stock' | 'cloned'
  gender: string | null;
  status: string; // 'pending' | 'active' | 'failed'
  status_detail: string | null;
  created_at: number;
}

/**
 * Voice profiles UI for a supplier.
 *
 * Lists every voice the supplier can use in audio narration:
 *   • Platform stock voices (shared, free) — always visible, marked "stock"
 *   • Cloned voices (owned by this supplier) — pending/active/failed badges
 *
 * Upload flow:
 *   • Pick name + gender + audio sample (30–90 s recommended)
 *   • POST to /api/voice/clone — ElevenLabs IVC creates voice, we save voice_id
 *   • Row appears with status='pending' → 'active' on success, 'failed' on error
 *
 * The "Clone a voice" CTA is disabled if `hasXIKey=false`; we still let
 * existing cloned voices show their status, but new clones require the
 * platform admin to set XI_API_KEY.
 */
export function VoicesPanel({
  supplierSlug,
  voices,
  hasXIKey,
}: {
  supplierSlug: string;
  voices: VoiceRow[];
  hasXIKey: boolean;
}) {
  const stock = voices.filter((v) => v.kind === "stock");
  const cloned = voices.filter((v) => v.kind === "cloned");
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="font-semibold text-[14px] text-slate-900">Voices</div>
          <div className="text-[12.5px] text-slate-500 mt-0.5">
            Stock voices are free for everyone. Cloned voices are private to this supplier.
          </div>
        </div>
        {!hasXIKey ? (
          <span
            className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md"
            title="Set MINIMAX_API_KEY via `wrangler secret put MINIMAX_API_KEY` to enable voice cloning"
          >
            Cloning disabled — MiniMax key not set
          </span>
        ) : null}
      </header>

      {/* Stock voices (read-only) */}
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="text-[11px] tracking-widest font-mono text-slate-500 mb-2">STOCK</div>
        <div className="flex flex-wrap gap-2">
          {stock.map((v) => (
            <span
              key={v.id}
              className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-[12.5px] text-slate-700"
              title={`${v.provider}${v.external_id ? ` · ${v.external_id}` : ""}`}
            >
              {v.name}
              <span className="ml-1.5 text-[10px] text-slate-400 uppercase font-mono">
                {v.gender}
              </span>
            </span>
          ))}
          {stock.length === 0 ? (
            <span className="text-[12px] text-slate-500">No stock voices configured.</span>
          ) : null}
        </div>
      </div>

      {/* Cloned voices */}
      <div className="px-5 py-4">
        <div className="text-[11px] tracking-widest font-mono text-slate-500 mb-2">
          CLONED VOICES — {cloned.length}
        </div>
        {cloned.length === 0 ? (
          <div className="text-[12.5px] text-slate-500 py-2">
            No cloned voices yet — upload a 30-90 second sample below to clone a sales rep&apos;s
            voice.
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
                  <div className="text-[13.5px] text-slate-900 truncate">{v.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    {v.gender ? <span className="uppercase font-mono">{v.gender}</span> : null}
                    <StatusBadge status={v.status} detail={v.status_detail} />
                    {v.external_id ? (
                      <span className="font-mono text-slate-400 truncate">{v.external_id}</span>
                    ) : null}
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

function CloneForm({ supplierSlug, disabled }: { supplierSlug: string; disabled: boolean }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("neutral");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fileInput = e.currentTarget.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file || !name.trim()) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("supplier_slug", supplierSlug);
    fd.append("name", name.trim());
    fd.append("gender", gender);
    startTransition(async () => {
      const r = await fetch("/api/voice/clone", { method: "POST", body: fd });
      if (r.ok) {
        window.location.reload();
      } else {
        const msg = await r.text().catch(() => "Clone failed");
        alert(msg.slice(0, 400));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2">
      <input
        type="text"
        placeholder="Voice name e.g. Maya — sales lead"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        disabled={disabled || pending}
        className="px-3 py-2 rounded-md border border-slate-300 text-[13.5px] disabled:opacity-50"
      />
      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        disabled={disabled || pending}
        className="px-3 py-2 rounded-md border border-slate-300 text-[13.5px] disabled:opacity-50"
      >
        <option value="neutral">neutral</option>
        <option value="male">male</option>
        <option value="female">female</option>
      </select>
      <label
        className={`px-4 py-2 rounded-md font-semibold text-[13px] text-center cursor-pointer text-white ${
          disabled || pending ? "bg-slate-400 cursor-not-allowed" : "bg-[#04241e] hover:bg-[#0a3a2f]"
        }`}
      >
        {pending ? "Cloning…" : "Upload sample & clone"}
        <input
          name="file"
          type="file"
          accept="audio/wav,audio/mpeg,audio/mp3,audio/mp4,audio/m4a,audio/x-m4a"
          disabled={disabled || pending || !name.trim()}
          className="hidden"
        />
      </label>
      <div className="sm:col-span-3 text-[11px] text-slate-500">
        Cloned with MiniMax. Best results: <strong>10 seconds–5 minutes</strong>, single speaker,
        clear Mandarin or English, no music or background noise. WAV / MP3 / M4A ≤ 20 MB. A cloned
        voice can narrate any language.
      </div>
    </form>
  );
}
