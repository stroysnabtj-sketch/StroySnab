import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/procurement/*/pdf": ["./assets/fonts/CourierNew*.ttf"],
    "/orders/*/pdf": ["./assets/fonts/CourierNew*.ttf"],
  },
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite", "pg", "pdfkit"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};
export default nextConfig;
