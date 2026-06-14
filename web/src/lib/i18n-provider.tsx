"use client";

/**
 * Client-side i18n. Server components read strings with `await t()`; client
 * components can't (t() touches cookies), so the root layout passes the current
 * locale's dictionary into this provider and client components read it via
 * `useTr()`.
 *
 * The whole locale dict (~one language's worth of keys) is serialized into the
 * page once — cheap for our flat dictionary, and it keeps a single source of
 * truth in i18n.ts instead of a separate client dict to maintain.
 *
 * Adding a string: add the key to BOTH `en` and `zhCN` in i18n.ts. It's then
 * available to server (`(await t()).key`) and client (`useTr().key`) alike.
 */
import { createContext, useContext } from "react";
import type { Dict } from "./i18n";
import { fmt } from "./i18n-shared";

const TrContext = createContext<Dict | null>(null);

export function I18nProvider({ tr, children }: { tr: Dict; children: React.ReactNode }) {
  return <TrContext.Provider value={tr}>{children}</TrContext.Provider>;
}

/** Current locale's dictionary. Throws if used outside the provider. */
export function useTr(): Dict {
  const tr = useContext(TrContext);
  if (!tr) throw new Error("useTr must be used inside <I18nProvider>");
  return tr;
}

/** Convenience: useTr() + fmt() for a single interpolated key. */
export function useFmt(): (template: string, vars: Record<string, string | number>) => string {
  return fmt;
}
