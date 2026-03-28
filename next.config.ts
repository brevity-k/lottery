import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    {
      source: '/index.html',
      destination: '/',
      permanent: true,
    },
    {
      source: '/tools/ticket-checker',
      destination: '/simulator',
      permanent: true,
    },
    {
      source: '/tools/number-generator',
      destination: '/powerball/numbers',
      permanent: true,
    },
    {
      source: '/my-numbers',
      destination: '/simulator',
      permanent: true,
    },
  ],
};

export default nextConfig;
