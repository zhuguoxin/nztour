/**
 * AI translation via Claude.
 *
 * Translates short tourism/training copy fragments while preserving:
 *   • Markdown structure (**bold**, *italic*, lists, links)
 *   • Proper nouns (place names, brand names)
 *   • Numbers, prices, times, codes
 *
 * Batched per call: the editor sends a whole module's text in one request
 * so Claude can share context across blocks (terminology consistency) and
 * we share prompt-cache savings.
 *
 * Returns translations in the same order as inputs. Empty/whitespace inputs
 * are passed through (returns "" without an API call).
 */
import Anthropic from "@anthropic-ai/sdk";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const MODEL = "claude-sonnet-4-5-20250929";

export interface TranslateInput {
  /** Stable id to round-trip with the caller (e.g. block_id) */
  id: string;
  text: string;
}

export interface TranslateResult {
  id: string;
  translation: string;
}

/** Languages we ship a translation prompt for. Display label is for the
 *  language picker UI; the BCP-47 code is what we store in i18n maps. */
export const TRANSLATE_LANGS: Array<{ code: string; label: string; nativeLabel: string }> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh-CN", label: "Chinese (Simplified)", nativeLabel: "简体中文" },
  { code: "zh-TW", label: "Chinese (Traditional)", nativeLabel: "繁體中文" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
];

export function langLabel(code: string): string {
  return TRANSLATE_LANGS.find((l) => l.code === code)?.nativeLabel ?? code;
}
export function isSupportedLang(code: string): boolean {
  return TRANSLATE_LANGS.some((l) => l.code === code);
}

const SYSTEM_PROMPT = `You are a professional translator for the New Zealand tourism industry. You translate B2B training content used by travel agents.

Rules:
- Preserve all Markdown syntax exactly (**bold**, *italic*, lists, links).
- Do not translate proper nouns: place names (Queenstown, Aoraki/Mt Cook), brand names (NZSki, SkyCity), product names, and trail/lift names. Keep them in their original form.
- Numbers, prices, times, dates, and product codes stay unchanged.
- Use natural, professional travel-trade register — the audience is travel agents selling experiences to their customers.
- Translate the meaning, not word-for-word. Idiomatic phrasing in the target language is preferred.
- Output ONLY the translation — no preamble, no explanation, no quotes.`;

/**
 * Translate a batch of text fragments to a single target language. Inputs and
 * outputs are 1:1 in order. The whole batch is sent in one Claude call so
 * terminology stays consistent across fragments.
 */
export async function translateBatch(
  fromLang: string,
  toLang: string,
  inputs: TranslateInput[],
): Promise<TranslateResult[]> {
  if (fromLang === toLang) return inputs.map((i) => ({ id: i.id, translation: i.text }));

  // Filter empty inputs (no API call needed).
  const nonEmpty = inputs.filter((i) => i.text.trim().length > 0);
  const results = new Map<string, string>(
    inputs.filter((i) => i.text.trim().length === 0).map((i) => [i.id, ""]),
  );
  if (nonEmpty.length === 0) {
    return inputs.map((i) => ({ id: i.id, translation: results.get(i.id) ?? "" }));
  }

  const { env } = getCloudflareContext();
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY not configured — translation unavailable until the secret is set.",
    );
  }
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const fromName = TRANSLATE_LANGS.find((l) => l.code === fromLang)?.label ?? fromLang;
  const toName = TRANSLATE_LANGS.find((l) => l.code === toLang)?.label ?? toLang;

  // We use a structured JSON-mode prompt for batch translation: input is a
  // numbered list, output must be the same number of items in order.
  const userMessage = [
    `Translate the following ${nonEmpty.length} fragment(s) from ${fromName} to ${toName}.`,
    `Reply with a JSON array of ${nonEmpty.length} strings, in the same order. No other text.`,
    "",
    "FRAGMENTS:",
    ...nonEmpty.map((i, idx) => `[${idx + 1}] ${i.text}`),
  ].join("\n");

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Be tolerant about the JSON — sometimes models wrap in ```json fences.
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Translator returned non-JSON output");
  }
  if (!Array.isArray(parsed) || parsed.length !== nonEmpty.length) {
    throw new Error(
      `Translator returned ${Array.isArray(parsed) ? parsed.length : "non-array"} items, expected ${nonEmpty.length}`,
    );
  }
  for (let i = 0; i < nonEmpty.length; i++) {
    results.set(nonEmpty[i].id, String(parsed[i] ?? ""));
  }

  return inputs.map((i) => ({ id: i.id, translation: results.get(i.id) ?? "" }));
}

/** Convenience: translate a single string. */
export async function translateOne(
  fromLang: string,
  toLang: string,
  text: string,
): Promise<string> {
  const [r] = await translateBatch(fromLang, toLang, [{ id: "0", text }]);
  return r?.translation ?? "";
}

/** Helpers for i18n JSON map columns. Map columns hold non-primary languages
 *  only; the primary lang's text lives in the legacy `title` / `text_md` etc. */
export function readI18nMap(json: string | null | undefined): Record<string, string> {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" && !Array.isArray(v)
      ? (Object.fromEntries(
          Object.entries(v).filter(([, val]) => typeof val === "string"),
        ) as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

export function writeI18nMap(map: Record<string, string>): string {
  return JSON.stringify(map);
}

/** Sibling languages to try before falling back to the primary/legacy text.
 *  Simplified and Traditional Chinese are mutually intelligible in writing for
 *  most readers and identical in spoken Mandarin, so a missing one falls back
 *  to the other before falling back to English. */
const SIBLING_LANGS: Record<string, string[]> = {
  "zh-TW": ["zh-CN"],
  "zh-CN": ["zh-TW"],
};

/** Resolve a localized string: chosenLang → sibling lang → primary/legacy. */
export function pickLocalized(
  legacy: string | null,
  i18nJson: string | null,
  primaryLang: string,
  chosenLang: string,
): string {
  if (chosenLang === primaryLang) return legacy ?? "";
  const map = readI18nMap(i18nJson);
  if (map[chosenLang]) return map[chosenLang];
  for (const sib of SIBLING_LANGS[chosenLang] ?? []) {
    if (sib === primaryLang) return legacy ?? "";
    if (map[sib]) return map[sib];
  }
  return legacy || "";
}
