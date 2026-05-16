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

export const runtime = "experimental-edge";

const isProtected = createRouteMatcher([
  "/learn(.*)",
  "/operator(.*)",
  "/admin(.*)",
  "/api/qa(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
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
