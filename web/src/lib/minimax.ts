/**
 * MiniMax TTS integration (T2A v2, international endpoint).
 *
 * MiniMax produces top-tier native Chinese (and other-language) speech. The
 * API returns the audio as a HEX-encoded string inside a JSON envelope, which
 * we decode to raw mp3 bytes.
 *
 * Endpoint: POST https://api.minimaxi.chat/v1/t2a_v2
 *   Authorization: Bearer <MINIMAX_API_KEY>   (sk-… key; no GroupId needed
 *                                              for the international platform)
 *   Body: { model, text, voice_setting, audio_setting }
 *   Response: { base_resp: { status_code, status_msg }, data: { audio: <hex> } }
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

const API_URL = "https://api.minimaxi.chat/v1/t2a_v2";
// speech-02-hd: highest-fidelity multilingual model.
const MODEL = "speech-02-hd";

export function hasMiniMaxKey(): boolean {
  try {
    const { env } = getCloudflareContext();
    return !!(env as unknown as { MINIMAX_API_KEY?: string }).MINIMAX_API_KEY;
  } catch {
    return false;
  }
}

interface MiniMaxResponse {
  base_resp?: { status_code?: number; status_msg?: string };
  data?: { audio?: string };
}

/** Map a BCP-47 code to a MiniMax language_boost value (improves pronunciation
 *  when a voice narrates a non-Chinese language). */
function languageBoost(lang?: string): string {
  if (!lang) return "auto";
  if (lang.startsWith("zh")) return "Chinese";
  if (lang.startsWith("en")) return "English";
  if (lang.startsWith("ja")) return "Japanese";
  if (lang.startsWith("ko")) return "Korean";
  if (lang.startsWith("es")) return "Spanish";
  if (lang.startsWith("fr")) return "French";
  if (lang.startsWith("de")) return "German";
  if (lang.startsWith("pt")) return "Portuguese";
  return "auto";
}

/** Synthesize text with a MiniMax voice. Returns raw mp3 bytes. */
export async function synthesizeMiniMax(opts: {
  text: string;
  voiceId: string;
  lang?: string;
}): Promise<{ bytes: Uint8Array }> {
  const { env } = getCloudflareContext();
  const key = (env as unknown as { MINIMAX_API_KEY?: string }).MINIMAX_API_KEY;
  if (!key) {
    throw new Error(
      "MINIMAX_API_KEY not configured — set it via `wrangler secret put MINIMAX_API_KEY`.",
    );
  }

  const r = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      text: opts.text,
      stream: false,
      language_boost: languageBoost(opts.lang),
      voice_setting: { voice_id: opts.voiceId, speed: 1, vol: 1, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
    }),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`MiniMax TTS failed (${r.status}): ${detail.slice(0, 200)}`);
  }
  const json = (await r.json()) as MiniMaxResponse;
  const status = json.base_resp?.status_code;
  if (status !== 0) {
    throw new Error(
      `MiniMax TTS error ${status}: ${json.base_resp?.status_msg ?? "unknown"}`,
    );
  }
  const hex = json.data?.audio;
  if (!hex) throw new Error("MiniMax returned no audio");
  return { bytes: hexToBytes(hex) };
}

// ===========================================================================
//  VOICE CLONING
// ===========================================================================

const FILES_URL = "https://api.minimaxi.chat/v1/files/upload";
const CLONE_URL = "https://api.minimaxi.chat/v1/voice_clone";

function getKey(): string {
  const { env } = getCloudflareContext();
  const key = (env as unknown as { MINIMAX_API_KEY?: string }).MINIMAX_API_KEY;
  if (!key) {
    throw new Error(
      "MINIMAX_API_KEY not configured — set it via `wrangler secret put MINIMAX_API_KEY`.",
    );
  }
  return key;
}

/**
 * Generate a MiniMax-compliant custom voice id: must be ≥ 8 chars, start with a
 * letter, and contain at least one letter and one digit. We prefix with "lt"
 * (Libretour) so cloned ids are identifiable in the MiniMax dashboard.
 */
export function newMiniMaxVoiceId(seed: string): string {
  const cleaned = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  const rand = Math.abs(hashString(seed + cleaned)).toString(36).slice(0, 6);
  return `lt${cleaned}${rand}9`.slice(0, 24);
}
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

/**
 * Upload a voice sample to MiniMax for cloning. Returns the file_id used by
 * the clone step. Sample requirements: 10 s–5 min of clean single-speaker
 * audio, mp3/wav/m4a, ≤ 20 MB.
 */
export async function uploadCloneSample(opts: {
  bytes: Uint8Array;
  filename: string;
  mime: string;
}): Promise<{ fileId: number }> {
  const key = getKey();
  const fd = new FormData();
  fd.append("purpose", "voice_clone");
  const ab = opts.bytes.buffer.slice(
    opts.bytes.byteOffset,
    opts.bytes.byteOffset + opts.bytes.byteLength,
  );
  fd.append("file", new File([ab as ArrayBuffer], opts.filename, { type: opts.mime }));

  const r = await fetch(FILES_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: fd,
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`MiniMax file upload failed (${r.status}): ${detail.slice(0, 200)}`);
  }
  const json = (await r.json()) as {
    file?: { file_id?: number };
    base_resp?: { status_code?: number; status_msg?: string };
  };
  if (json.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax upload error: ${json.base_resp?.status_msg ?? "unknown"}`);
  }
  const fileId = json.file?.file_id;
  if (!fileId) throw new Error("MiniMax upload returned no file_id");
  return { fileId };
}

/**
 * Clone a voice from an uploaded sample. `voiceId` is the custom id (see
 * newMiniMaxVoiceId) that subsequent t2a calls will reference. Idempotent on
 * the MiniMax side for a given (file_id, voice_id).
 */
export async function cloneVoice(opts: { fileId: number; voiceId: string }): Promise<void> {
  const key = getKey();
  const r = await fetch(CLONE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: opts.fileId, voice_id: opts.voiceId }),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`MiniMax voice_clone failed (${r.status}): ${detail.slice(0, 200)}`);
  }
  const json = (await r.json()) as { base_resp?: { status_code?: number; status_msg?: string } };
  if (json.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax clone error: ${json.base_resp?.status_msg ?? "unknown"}`);
  }
}

/** Decode a hex string ("a1b2…") into a byte array. */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const len = clean.length >> 1;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}
