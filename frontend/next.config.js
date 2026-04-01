/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NETLIFY ? "standalone" : undefined,
  images: {
    unoptimized: !!process.env.NETLIFY,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
