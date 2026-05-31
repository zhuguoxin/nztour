/**
 * Text-to-speech via OpenAI TTS-1, stored in R2.
 *
 * Why OpenAI TTS:
 *   - 6 distinct voices (alloy/echo/fable/onyx/nova/shimmer) with consistent
 *     quality across English / 中文 / 日本語 / Spanish / German / French
 *   - Auto language detection from input text — operator picks voice, not lang
 *   - ~$15 per 1M chars (a typical course module is ~500 chars → $0.0075)
 *   - Single REST call, mp3 returned inline — no streaming dance needed
 *
 * Workers AI does have @cf/myshell-ai/melotts but it's English+Chinese only
 * and quality is lower. Revisit if cost becomes an issue.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const TTS_VOICES = [
  { id: "nova", label: "Nova", description: "Warm female · default" },
  { id: "shimmer", label: "Shimmer", description: "Bright female" },
  { id: "alloy", label: "Alloy", description: "Neutral" },
  { id: "echo", label: "Echo", description: "Calm male" },
  { id: "onyx", label: "Onyx", description: "Deep male" },
  { id: "fable", label: "Fable", description: "Expressive · storytelling" },
] as const;

export type TTSVoice = (typeof TTS_VOICES)[number]["id"];

export function isValidVoice(v: unknown): v is TTSVoice {
  return typeof v === "string" && TTS_VOICES.some((vv) => vv.id === v);
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
  voice: TTSVoice;
  durationSeconds: number;
}

/**
 * Synthesize `text` with the chosen `voice` and store the mp3 in R2.
 * Returns the R2 key + metadata. Throws on any failure (caller handles UX).
 */
export async function synthesizeAndStore(
  blockId: string,
  text: string,
  voice: TTSVoice,
): Promise<TTSResult> {
  const { env } = getCloudflareContext();
  const apiKey = (env as { OPENAI_API_KEY?: string }).OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const cleanText = plainTextFromMarkdown(text).slice(0, 4000);
  if (!cleanText) throw new Error("empty text");

  // Call OpenAI TTS — returns mp3 binary directly.
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: cleanText,
      voice,
      response_format: "mp3",
    }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`tts http ${r.status}: ${err.slice(0, 200)}`);
  }
  const mp3 = await r.arrayBuffer();

  const r2Key = `audio/${blockId}-${voice}.mp3`;
  if (!env.ASSETS_BUCKET) throw new Error("R2 ASSETS_BUCKET binding missing");
  await env.ASSETS_BUCKET.put(r2Key, mp3, {
    httpMetadata: { contentType: "audio/mpeg" },
  });

  // Rough duration estimate: OpenAI's tts-1 is ~150 wpm, ~5 chars/word.
  // Good enough for a UI bar; the real duration shows up when the player loads.
  const estimatedSeconds = Math.max(2, Math.round((cleanText.length / 5 / 150) * 60));

  return { r2Key, bytes: mp3.byteLength, voice, durationSeconds: estimatedSeconds };
}
