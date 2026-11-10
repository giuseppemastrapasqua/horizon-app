import type { NextConfig } from "next";

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://anyzciwyxkfrheavqjpf.supabase.co https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self' https://anyzciwyxkfrheavqjpf.supabase.co",
  "frame-src 'none'",
].join("; ");
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anyzciwyxkfrheavqjpf.supabase.co",
        pathname: "/storage/v1/object/public/property-images/**",
      },
    ],
  },
  poweredByHeader: false,

  experimental: {
    serverActions: {
      bodySizeLimit: "210mb",
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/check-in/:token",
        has: [{ type: "query", key: "embedded", value: "1" }],
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly.replace("frame-ancestors 'none'", "frame-ancestors 'self'") },
        ],
      },
      {
        source: "/check-in/:token/guide",
        headers: [
          { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly.replace("frame-src 'none'", "frame-src 'self'") },
        ],
      },
    ];
  },
};

export default nextConfig;

