import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return process.env.VERCEL_ENV === "preview"
      ? [{ source: "/:path*", headers: noindex }]
      : [
          { source: "/admin/:path*", headers: noindex },
          { source: "/api/:path*", headers: noindex },
        ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
