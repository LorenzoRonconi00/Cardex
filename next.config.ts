import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.pokemontcg.io',
      'lh3.googleusercontent.com'
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/expansion/sv1',
        permanent: false,
      },
    ]
  }
};

export default nextConfig;
