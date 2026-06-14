/**
 * ElevenLabs integration — Instant Voice Cloning + TTS.
 *
 * Why ElevenLabs:
 *   • Best-in-class voice quality for sales narration.
 *   • Instant Voice Cloning (IVC) needs only 30 seconds of a clean sample.
 *   • Multilingual model speaks the same cloned voice in 30+ languages.
 *   • Per-character pricing — predictable cost.
 *
 * This file deliberately does NOT throw if the env key is missing — the
 * editor falls back to Workers AI melotts (free, baked-in) so the
 * application is usable without any external setup. The voice picker UI
 * disables the "clone your voice" + premium stock voices when the key
 * isn't set and shows a "configure XI_API_KEY" hint.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

const API_BASE = "https://api.elevenlabs.io/v1";
// Multilingual v2 is the model that supports both cloned and stock voices
// in every supported target language. Worth the slightly higher cost vs the
// English-only Turbo model since our market is multi-language by default.
const MODEL_ID = "eleven_multilingual_v2";

export interface XISynthResult {
  /** mp3 bytes ready to be PUT into R2 */
  bytes: Uint8Array;
}

export function hasElevenLabsKey(): boolean {
  try {
    const { env } = getCloudflareContext();
    return !!(env as unknown as { XI_API_KEY?: string }).XI_API_KEY;
  } catch {
    return false;
  }
}

function requireKey(): string {
  const { env } = getCloudflareContext();
  const key = (env as unknown as { XI_API_KEY?: string }).XI_API_KEY;
  if (!key) {
    throw new Error(
      "XI_API_KEY not configured — set it via `wrangler secret put XI_API_KEY` to enable ElevenLabs.",
    );
  }
  return key;
}

/**
 * Synthesize one fragment with a specific ElevenLabs voice. Returns mp3 bytes.
 * The voiceId is either a stock id (`pNInz6obpgDQGcFmaJgB` = Adam) or one
 * returned from createVoiceFromSample.
 *
 * `lang` is the BCP-47 language code — multilingual_v2 handles it implicitly
 * from the text content. NOTE: eleven_multilingual_v2 auto-detects the
 * language from the text and does NOT accept a `language_code` parameter
 * (only the turbo/flash models do) — passing one makes the API reject the
 * request, so `lang` is accepted for signature compatibility but not sent.
 */
export async function synthesizeWithVoice(opts: {
  text: string;
  voiceId: string;
  lang?: string;
}): Promise<XISynthResult> {
  const key = requireKey();
  const url = `${API_BASE}/text-to-speech/${encodeURIComponent(opts.voiceId)}?output_format=mp3_44100_128`;
  const body: Record<string, unknown> = {
    text: opts.text,
    model_id: MODEL_ID,
    voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true },
  };
  // language_code intentionally omitted — multilingual_v2 auto-detects.

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    // Friendly message for the common Free-tier limitations: library (native-
    // language) voices and certain premium voices require a paid plan.
    if (
      r.status === 402 ||
      /library voices|free_users_not_allowed|creator tier/i.test(detail)
    ) {
      throw new Error(
        "This native voice needs a paid ElevenLabs plan. Pick a MiniMax or Melotts voice for this language instead, or upgrade ElevenLabs.",
      );
    }
    throw new Error(`ElevenLabs TTS failed (${r.status}): ${detail.slice(0, 200)}`);
  }
  const buf = new Uint8Array(await r.arrayBuffer());
  return { bytes: buf };
}

/**
 * Create an Instant Voice Clone from one or more audio samples. Returns the
 * new voice_id which we store in voice_profiles.external_id.
 *
 * ElevenLabs requires:
 *   • At least one sample, ideally one 30–90s clean recording.
 *   • Sample limit: ~10 MB per file.
 *   • Name + description are stored on their side too (shown in their dashboard).
 *
 * The labels object can hold gender / use_case / accent — UI hints only.
 */
export async function createVoiceFromSample(opts: {
  name: string;
  description?: string;
  samples: Array<{ filename: string; bytes: Uint8Array; mime: string }>;
  labels?: Record<string, string>;
}): Promise<{ voiceId: string }> {
  const key = requireKey();
  const fd = new FormData();
  fd.append("name", opts.name.slice(0, 80));
  if (opts.description) fd.append("description", opts.description.slice(0, 500));
  if (opts.labels) fd.append("labels", JSON.stringify(opts.labels));
  for (const s of opts.samples) {
    // Build a Blob then a File so multipart upload includes the filename.
    // Copy into a fresh ArrayBuffer so TS narrows away SharedArrayBuffer.
    const ab = s.bytes.buffer.slice(s.bytes.byteOffset, s.bytes.byteOffset + s.bytes.byteLength);
    const blob = new Blob([ab as ArrayBuffer], { type: s.mime });
    fd.append("files", new File([blob], s.filename, { type: s.mime }));
  }
  const r = await fetch(`${API_BASE}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": key },
    body: fd,
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`ElevenLabs voice add failed (${r.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await r.json()) as { voice_id?: string };
  if (!json.voice_id) throw new Error("ElevenLabs response missing voice_id");
  return { voiceId: json.voice_id };
}

/**
 * Delete a cloned voice from ElevenLabs (does NOT delete the R2 sample).
 * Best-effort — failures are swallowed by the caller.
 */
export async function deleteVoice(voiceId: string): Promise<void> {
  const key = requireKey();
  await fetch(`${API_BASE}/voices/${encodeURIComponent(voiceId)}`, {
    method: "DELETE",
    headers: { "xi-api-key": key },
  });
}
