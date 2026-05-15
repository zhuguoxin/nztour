import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
//
// experimental.remoteBindings=true makes `next dev` talk to our REAL Cloudflare
// resources (D1 in OC, R2, Vectorize, Workers AI). Avoids the overhead of
// keeping a separate local SQLite in sync — and Vectorize has no local mode
// anyway. The OpenNext docs flag this as experimental; revisit if dev becomes
// flaky.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev({
  experimental: { remoteBindings: true },
});
