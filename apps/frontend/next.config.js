/** @type {import('next').NextConfig} */
const nextConfig = {
  // Support for monorepo transpilation
  transpilePackages: ['@daawa/shared', '@daawa/ui', '@daawa/types', '@daawa/config'],
  // Enable React strict mode
  reactStrictMode: true,
  // Optimize images
  images: {
    domains: [],
  },
  // Output configuration for production
  output: 'standalone',
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
