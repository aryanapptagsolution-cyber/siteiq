import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Empty turbopack config to signal we've opted into Turbopack intentionally
  turbopack: {},
};

export default nextConfig;
