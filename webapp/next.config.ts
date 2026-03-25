import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    localPatterns: [
      {
        pathname: '/api/placeholder/**',
      },
      {
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
