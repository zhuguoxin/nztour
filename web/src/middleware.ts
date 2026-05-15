import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that REQUIRE auth. Everything else is public.
// We intentionally leave `/`, `/sign-in`, `/sign-up`, `/verify/[code]` and any
// operator marketing pages public.
const isProtected = createRouteMatcher([
  "/learn(.*)",       // learner pages: course list, course detail, profile
  "/operator(.*)",    // operator dashboard
  "/admin(.*)",       // platform super-admin
  "/api/qa(.*)",      // AI Q&A endpoint (still rate-limited even when public, but auth gate first)
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
