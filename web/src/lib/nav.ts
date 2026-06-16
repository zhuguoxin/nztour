/**
 * Cross-context navigation helpers.
 *
 * Shared management pages (voices, glossary, billing, …) are reachable from
 * several places. Each entry link passes the originating URL as `?from=…`, and
 * the page's "back" control returns there via safeReturnTo() — falling back to
 * the page's natural parent when `from` is absent or unsafe.
 */

/** Return `from` only if it's a safe in-app path; otherwise the fallback.
 *  Guards against open redirects (must start with a single "/"). */
export function safeReturnTo(from: string | string[] | undefined, fallback: string): string {
  const v = Array.isArray(from) ? from[0] : from;
  if (typeof v === "string" && v.startsWith("/") && !v.startsWith("//")) return v;
  return fallback;
}

/** Append a `from` return-URL param to a target href. */
export function withReturnTo(href: string, from: string): string {
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}from=${encodeURIComponent(from)}`;
}
