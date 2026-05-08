import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.letterboxd.com" },
      { protocol: "https", hostname: "a.ltrbxd.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "resizer.letterboxd.com" },
    ],
  },
};

export default nextConfig;
