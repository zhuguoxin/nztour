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
  const fromName = TRANSLATE_LANGS.find((l) => l.code === fromLang)?.label ?? fromLang;
  const toName = TRANSLATE_LANGS.find((l) => l.code === toLang)?.label ?? toLang;
  const fragments = nonEmpty.map((i) => i.text);

  // Provider routing: Chinese (zh-CN / zh-TW) reads more naturally — and costs
  // far less — from DeepSeek, so use it whenever DEEPSEEK_API_KEY is set.
  // Every other language uses Claude. If the DeepSeek key is missing we fall
  // back to Claude so Chinese still works. Each provider builds its own prompt
  // and returns the parsed string array.
  const deepseekKey = (env as unknown as { DEEPSEEK_API_KEY?: string }).DEEPSEEK_API_KEY;
  const useDeepseek = toLang.startsWith("zh") && !!deepseekKey;

  let parsed: unknown[];
  if (useDeepseek) {
    parsed = await callDeepSeek(deepseekKey as string, fromName, toName, fragments);
  } else {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY not configured — translation unavailable until the secret is set.",
      );
    }
    parsed = await callClaude(env.ANTHROPIC_API_KEY, fromName, toName, fragments);
  }

  if (parsed.length !== nonEmpty.length) {
    throw new Error(`Translator returned ${parsed.length} items, expected ${nonEmpty.length}`);
  }
  for (let i = 0; i < nonEmpty.length; i++) {
    results.set(nonEmpty[i].id, String(parsed[i] ?? ""));
  }

  return inputs.map((i) => ({ id: i.id, translation: results.get(i.id) ?? "" }));
}

// ---- provider calls -------------------------------------------------------

function apiError(provider: string, e: unknown): Error {
  const status = (e as { status?: number })?.status;
  const msg = e instanceof Error ? e.message : String(e);
  return new Error(`${provider} API error${status ? ` (${status})` : ""}: ${msg}`);
}

const TRUNCATED =
  "Translation was truncated (too long) — split the course into smaller blocks.";

/** Shared user message. INPUT is itself a JSON array so the model never
 *  confuses our "[1]" numbering with the JSON-array output it should produce. */
function buildUserMessage(
  fromName: string,
  toName: string,
  fragments: string[],
  wantObject: boolean,
): string {
  const shape = wantObject
    ? `a JSON object of the form {"translations": [...]} whose "translations" is a JSON array of exactly ${fragments.length} translated strings, in the same order`
    : `a JSON array of exactly ${fragments.length} translated strings, in the same order`;
  return [
    `Translate each string in the INPUT JSON array from ${fromName} to ${toName}.`,
    `Reply with ${shape}. Output valid JSON only — no markdown fences, no commentary.`,
    `INPUT: ${JSON.stringify(fragments)}`,
  ].join("\n");
}

/** Pull the string array out of a model reply (array, {translations:[…]}, or
 *  the first array value of an object). */
function extractArray(obj: unknown): unknown[] | null {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    if (Array.isArray(o.translations)) return o.translations;
    const firstArr = Object.values(o).find((v) => Array.isArray(v));
    if (firstArr) return firstArr as unknown[];
  }
  return null;
}

/** Claude with an assistant "[" prefill so it must emit a bare JSON array. */
async function callClaude(
  apiKey: string,
  fromName: string,
  toName: string,
  fragments: string[],
): Promise<unknown[]> {
  const client = new Anthropic({ apiKey });
  let resp;
  try {
    resp = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildUserMessage(fromName, toName, fragments, false) },
        { role: "assistant", content: "[" },
      ],
    });
  } catch (e) {
    throw apiError("Claude", e);
  }
  if (resp.stop_reason === "max_tokens") throw new Error(TRUNCATED);
  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const arr = parseJsonArray("[" + text); // re-attach the prefill
  if (!arr) throw new Error(`Translator returned non-JSON output: ${text.slice(0, 160)}`);
  return arr;
}

/** DeepSeek V3 (deepseek-chat) using its JSON-output mode. We ask for an object
 *  ({"translations":[…]}) because json_object mode guarantees valid JSON and
 *  avoids the model echoing our "[n]" markers as a numbered list. */
async function callDeepSeek(
  apiKey: string,
  fromName: string,
  toName: string,
  fragments: string[],
): Promise<unknown[]> {
  let resp: Response;
  try {
    resp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 8192,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(fromName, toName, fragments, true) },
        ],
      }),
    });
  } catch (e) {
    throw apiError("DeepSeek", e);
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`DeepSeek API error (${resp.status}): ${body.slice(0, 160)}`);
  }
  const data = (await resp.json()) as {
    choices?: Array<{ finish_reason?: string; message?: { content?: string } }>;
  };
  const choice = data.choices?.[0];
  if (choice?.finish_reason === "length") throw new Error(TRUNCATED);
  const content = choice?.message?.content ?? "";
  let obj: unknown;
  try {
    obj = JSON.parse(content);
  } catch {
    throw new Error(`Translator returned non-JSON output: ${content.slice(0, 160)}`);
  }
  const arr = extractArray(obj);
  if (!arr) throw new Error(`Translator returned non-array output: ${content.slice(0, 160)}`);
  return arr;
}

/** Tolerant JSON-array extraction: direct parse, else a first-[-to-last-]
 *  slice (handles a stray code fence or trailing prose). */
function parseJsonArray(raw: string): unknown[] | null {
  const stripFences = (s: string) => s.replace(/```(?:json)?/gi, "").trim();
  const sliced = (() => {
    const t = stripFences(raw);
    const a = t.indexOf("[");
    const b = t.lastIndexOf("]");
    return a >= 0 && b > a ? t.slice(a, b + 1) : "";
  })();
  for (const cand of [raw, sliced]) {
    if (!cand) continue;
    try {
      const v = JSON.parse(stripFences(cand));
      if (Array.isArray(v)) return v;
    } catch {
      /* try next candidate */
    }
  }
  return null;
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
