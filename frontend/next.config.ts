import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dyzz4logwgput.cloudfront.net',
        pathname: '/cars/**',
      },
      {
        protocol: 'https',
        hostname: 'dyzz4logwgput.cloudfront.net',
        pathname: '/static/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
