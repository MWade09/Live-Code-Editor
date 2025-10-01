import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure headers for static editor assets
  async headers() {
    return [
      {
        source: '/editor/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Ensure editor static files are served correctly
  async rewrites() {
    return [
      {
        source: '/editor',
        destination: '/editor/index.html',
      },
    ];
  },
};

export default nextConfig;
