import type { NextConfig } from "next";
import { PRODUCT_IMAGE_HOSTNAME, PRODUCT_IMAGE_PATH_PREFIX } from "./src/lib/images";

const isDev = process.env.NODE_ENV === "development";

// Static CSP: nonces need per-request rendering, which defeats Cache Components.
// 'unsafe-inline' is needed for the inline scripts Next.js emits.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${PRODUCT_IMAGE_HOSTNAME}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Off so unknown product slugs get a real 404 instead of a 200 shell.
  partialPrefetching: false,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: PRODUCT_IMAGE_HOSTNAME,
        pathname: `${PRODUCT_IMAGE_PATH_PREFIX}**`,
      },
    ],
  },
  headers() {
    return Promise.resolve([{ source: "/:path*", headers: securityHeaders }]);
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
