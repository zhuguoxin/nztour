/**
 * Clerk auth middleware.
 *
 * Why this file (not proxy.ts):
 * Next.js 16 deprecates `middleware.ts` in favour of `proxy.ts`, but `proxy.ts`
 * is forced to Node runtime and disallows route segment config. OpenNext's
 * Cloudflare adapter currently can't run Node-runtime proxy, so we keep the
 * legacy `middleware.ts` name with explicit edge runtime. Revisit once
 * @opennextjs/cloudflare supports the Next 16 proxy contract.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "experimental-edge";

const isProtected = createRouteMatcher([
  "/learn(.*)",
  // NB: use "/product(/.*)?" not "/product(.*)" — the latter also matches the
  // PUBLIC "/products" directory pages, which would wrongly gate them behind
  // Clerk auth. This matches only "/product" and "/product/<slug>/...".
  "/product(/.*)?",
  "/operator(/.*)?", // legacy — redirected to /product, kept protected during the move
  "/supplier(/.*)?",
  "/admin(/.*)?",
  "/api/qa(.*)",
]);

// Canonical host = www.libretour.com. Apex requests get a 301 → www so we
// have a single canonical URL for SEO, Clerk allowed-origins and badge
// verify links.
const CANONICAL_HOST = "www.libretour.com";
const APEX_HOSTS = new Set(["libretour.com"]);

export default clerkMiddleware(async (auth, req) => {
  // Apex → www redirect, applied before any Clerk session work.
  const url = req.nextUrl;
  if (APEX_HOSTS.has(url.host)) {
    const target = new URL(url.toString());
    target.host = CANONICAL_HOST;
    return NextResponse.redirect(target, 301);
  }
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
