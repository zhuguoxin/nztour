/**
 * Text-to-speech via Cloudflare Workers AI (melotts), stored in R2.
 *
 * Why Workers AI + melotts:
 *   - Already included in our Workers Paid Plan ($5/mo). No extra key, no
 *     extra billing surface.
 *   - Supports English / 中文 / Español / Français / 日本語 / 한국어 — the
 *     six languages we already advertise in the UI.
 *   - Auto-detects language from input text; the operator can override.
 *   - Quality is "demo-acceptable" — noticeably less natural than OpenAI
 *     TTS-1 but conveys the script clearly. Swap to OpenAI if a pilot
 *     operator's brand demands premium voice quality (a one-file change
 *     here; the rest of the pipeline is provider-agnostic).
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const TTS_LANGS = [
  { id: "auto", label: "Auto-detect from text", short: "auto" },
  { id: "en", label: "English", short: "en" },
  { id: "zh", label: "Chinese", short: "zh" },
  { id: "es", label: "Spanish", short: "es" },
  { id: "fr", label: "French", short: "fr" },
  { id: "ja", label: "Japanese", short: "ja" },
  { id: "ko", label: "Korean", short: "ko" },
] as const;

export type TTSLang = (typeof TTS_LANGS)[number]["id"];

export function isValidLang(v: unknown): v is TTSLang {
  return typeof v === "string" && TTS_LANGS.some((l) => l.id === v);
}

/** Cheap language guess. Same heuristic used elsewhere; lives here so the TTS
 *  module is self-contained. */
function guessLang(s: string): "en" | "zh" | "ja" | "ko" {
  if (/[가-힯]/.test(s)) return "ko";
  if (/[぀-ゟ゠-ヿ]/.test(s)) return "ja";
  if (/[一-鿿]/.test(s)) return "zh";
  return "en";
}

/** Strip markdown to plain text for cleaner narration. */
export function plainTextFromMarkdown(md: string): string {
  return md
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/`([^`]+)`/g, "$1") // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/^[#>\-*]\s+/gm, "") // headers / blockquotes / list markers
    .replace(/\n{2,}/g, ". ") // paragraph breaks → pause
    .replace(/\s+/g, " ")
    .trim();
}

export interface TTSResult {
  r2Key: string;
  bytes: number;
  langUsed: string;
  durationSeconds: number;
}

interface WorkersAITTSResponse {
  audio?: string; // base64-encoded audio
}

interface WorkersAIBinding {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Synthesize `text` and store the audio file in R2. Returns the R2 key + meta.
 * Throws on any failure (caller handles UX).
 */
export async function synthesizeAndStore(
  blockId: string,
  text: string,
  langPref: TTSLang,
): Promise<TTSResult> {
  const { env } = getCloudflareContext();
  if (!env.AI) throw new Error("Workers AI binding missing");
  if (!env.ASSETS_BUCKET) throw new Error("R2 ASSETS_BUCKET binding missing");

  const cleanText = plainTextFromMarkdown(text).slice(0, 1500);
  if (!cleanText) throw new Error("empty text");

  const langUsed = langPref === "auto" ? guessLang(cleanText) : langPref;

  // Workers AI melotts: { prompt, lang } -> { audio: base64 }
  const ai = env.AI as unknown as WorkersAIBinding;
  const result = (await ai.run("@cf/myshell-ai/melotts", {
    prompt: cleanText,
    lang: langUsed,
  })) as WorkersAITTSResponse;
  if (!result?.audio) throw new Error("tts: empty audio response");

  // Decode base64 → bytes
  const audioBytes = base64ToBytes(result.audio);

  // melotts outputs MP3.
  const r2Key = `audio/${blockId}-${langUsed}.mp3`;
  await env.ASSETS_BUCKET.put(r2Key, audioBytes, {
    httpMetadata: { contentType: "audio/mpeg" },
  });

  // Rough duration estimate (~150 wpm ~ 5 chars/word for Latin; CJK is denser
  // but melotts plays roughly the same total length).
  const estimatedSeconds = Math.max(2, Math.round((cleanText.length / 5 / 150) * 60));

  return { r2Key, bytes: audioBytes.byteLength, langUsed, durationSeconds: estimatedSeconds };
}

function base64ToBytes(b64: string): Uint8Array {
  // atob is available in Workers; decode 1 byte per char.
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
