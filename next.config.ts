import type { NextConfig } from "next";

function mediaHostnames(): string[] {
  const hosts = new Set<string>();
  for (const key of ["BLOG_OG_IMAGE_URL", "R2_PUBLIC_BASE_URL"] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      hosts.add(new URL(raw).hostname);
    } catch {
      /* ignore */
    }
  }
  return [...hosts];
}

const r2Hosts = mediaHostnames();

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
    remotePatterns: [
      ...r2Hosts.map((hostname) => ({ protocol: "https" as const, hostname, pathname: "/**" })),
      { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
    ],
  },
};

export default nextConfig;
