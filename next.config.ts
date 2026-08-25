import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow Arena/E2B live-preview hosts to load Next.js dev assets.
  allowedDevOrigins: ["*.e2b.app"],
  // Pages that change with the daily price refresh are revalidated hourly;
  // the cron endpoint bumps freshness once a day.
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
