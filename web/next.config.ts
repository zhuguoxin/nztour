import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
//
// Skip during `next build` — `initOpenNextCloudflareForDev` tries to spin up a
// remote-bindings preview Worker via the Cloudflare API, and an upstream
// outage on /workers/subdomain/edge-preview blocks the build. We don't need
// dev bindings during the production build path; OpenNext's own build step
// handles binding wiring at the final Worker stage.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.NODE_ENV !== "production") {
  initOpenNextCloudflareForDev();
}
