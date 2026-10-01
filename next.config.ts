import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leaner responses; no framework fingerprint header.
  poweredByHeader: false,
  reactStrictMode: true,

  // Tutor headshots and hero photography are served from Pexels.
  // (Pre-approved so components can switch to next/image without config changes.)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com" }],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
