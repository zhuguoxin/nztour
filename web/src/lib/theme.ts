/**
 * Per-operator theming. An operator can customise 3 colour tokens + an
 * optional logo. The tokens are written as CSS variables on a wrapper
 * element; themed surfaces use `style={{ background: 'var(--op-bg)' }}`
 * or shadcn-style classes that fall back to Libretour green when an
 * operator hasn't set anything.
 *
 * Why only 3 tokens (bg / accent / ink): full palette pickers paralyse
 * non-designers. Three colour fields with sensible derivations cover
 * 90% of brand differentiation. We auto-derive panel / muted-ink shades
 * inside <OperatorTheme>.
 */

import type { OperatorRow } from "./db";

// Libretour defaults — used whenever an operator hasn't picked colours yet.
export const DEFAULT_THEME = {
  bg: "#04241e",
  accent: "#34d399",
  ink: "#f0fdf4",
  panel: "#0a3a2f",
  inkMuted: "#a7d4b6",
  border: "rgba(255,255,255,0.08)",
} as const;

export interface ResolvedTheme {
  bg: string;
  accent: string;
  ink: string;
  panel: string;
  inkMuted: string;
  border: string;
  logoR2Key: string | null;
}

export interface ThemedOperator {
  theme_bg: string | null;
  theme_accent: string | null;
  theme_ink: string | null;
  theme_logo_r2_key?: string | null;
}

/**
 * Resolve an operator's stored tokens into a full theme. Panel and muted-ink
 * shades are auto-derived from bg / ink so the operator only has to pick
 * three colours. When tokens are null we fall back to the Libretour palette
 * end-to-end so partially configured operators still look polished.
 */
export function resolveTheme(op: ThemedOperator): ResolvedTheme {
  const bg = op.theme_bg ?? DEFAULT_THEME.bg;
  const accent = op.theme_accent ?? DEFAULT_THEME.accent;
  const ink = op.theme_ink ?? DEFAULT_THEME.ink;
  // Panel = bg lightened toward ink ~12%. Muted ink = ink darkened ~35%.
  // These derivations keep the surface relations intact across any palette.
  return {
    bg,
    accent,
    ink,
    panel: mix(bg, ink, 0.1),
    inkMuted: mix(ink, bg, 0.45),
    border: "rgba(255,255,255,0.08)",
    logoR2Key: op.theme_logo_r2_key ?? null,
  };
}

/** Convert a ResolvedTheme into the inline-style CSS-variable bag. */
export function themeCssVars(t: ResolvedTheme): React.CSSProperties {
  return {
    ["--op-bg" as string]: t.bg,
    ["--op-accent" as string]: t.accent,
    ["--op-ink" as string]: t.ink,
    ["--op-panel" as string]: t.panel,
    ["--op-ink-muted" as string]: t.inkMuted,
    ["--op-border" as string]: t.border,
    background: t.bg,
    color: t.ink,
  };
}

// Hex / shorthand parser → {r,g,b}. Handles "#abc" + "#aabbcc". rgba/hsla not
// supported (operators only enter solid colours via the picker).
function parseHex(c: string): { r: number; g: number; b: number } {
  let s = c.trim().replace(/^#/, "");
  if (s.length === 3) s = s.split("").map((ch) => ch + ch).join("");
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
function toHex(r: number, g: number, b: number): string {
  const h = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
/** Linear-interpolate between two hex colours. t=0 returns `a`, t=1 returns `b`. */
function mix(a: string, b: string, t: number): string {
  try {
    const A = parseHex(a);
    const B = parseHex(b);
    return toHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
  } catch {
    return a;
  }
}

/** When listing operators in queries, include theme fields. Returns the SELECT
 *  fragment so callers don't have to repeat it. */
export const OPERATOR_THEME_SELECT_FIELDS =
  "theme_bg, theme_accent, theme_ink, theme_logo_r2_key";

// Augment OperatorRow type-side. (db.ts itself imports this file lazily so we
// don't create a cycle — types only.)
export type OperatorWithTheme = OperatorRow & ThemedOperator;
