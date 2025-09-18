/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy API routes to the backend during development
    if (process.env.NODE_ENV !== 'production') {
      return [
        { source: '/auth/:path*', destination: 'http://localhost:3000/auth/:path*' },
        { source: '/zora/:path*', destination: 'http://localhost:3000/zora/:path*' },
        { source: '/casts/:path*', destination: 'http://localhost:3000/casts/:path*' },
        { source: '/uploads/:path*', destination: 'http://localhost:3000/uploads/:path*' },
        { source: '/config', destination: 'http://localhost:3000/config' },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
