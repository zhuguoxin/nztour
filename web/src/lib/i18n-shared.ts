/**
 * Client-safe i18n constants and types.
 *
 * Anything that touches `next/headers` (server-only) lives in `i18n.ts`.
 * A client component can import from here without pulling server-only
 * APIs into the client bundle.
 */

export type Locale = "en" | "zh-CN";

export const SUPPORTED: Locale[] = ["en", "zh-CN"];

export const LANG_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
};

/**
 * Replace {placeholders} in a dict value with vars.
 *   fmt("Hello {name}", { name: "Sarah" }) -> "Hello Sarah"
 */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
