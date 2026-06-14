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

/** Synthesize text with a MiniMax voice. Returns raw mp3 bytes. */
export async function synthesizeMiniMax(opts: {
  text: string;
  voiceId: string;
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
