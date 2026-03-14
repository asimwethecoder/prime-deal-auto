import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dyzz4logwgput.cloudfront.net',
        pathname: '/cars/**',
      },
    ],
  },
};

export default nextConfig;
