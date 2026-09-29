import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Demo reliability over warm-start speed: a stale on-disk Turbopack cache
    // (e.g. after `next build` or an interrupted session) can abort `next dev`.
    turbopackFileSystemCacheForDev: false,
  },
  // earlier prototype pages are now steps of the Policy Casefile
  async redirects() {
    return [
      { source: "/lab", destination: "/case?step=simulate", permanent: false },
      { source: "/copilot", destination: "/case", permanent: false },
      { source: "/graph", destination: "/case?step=simulate", permanent: false },
    ];
  },
};

export default nextConfig;
