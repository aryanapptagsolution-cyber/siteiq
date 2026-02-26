import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['mapbox-gl'],
  // Empty turbopack config to signal we've opted into Turbopack intentionally
  turbopack: {},
};

export default nextConfig;
