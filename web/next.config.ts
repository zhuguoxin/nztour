import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
//
// Note: `remoteBindings` defaults to true at the wrangler level, so resources
// without a local mode (Vectorize, Workers AI) are automatically proxied to
// real CF resources. D1 / R2 still use local mode by default — we apply the
// same schema + seed to both via `wrangler d1 execute --local` (see
// infra/seed.sql, generated in batched form so wrangler accepts it).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
