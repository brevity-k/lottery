import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  poweredByHeader: false,
  // Redirects and headers moved to vercel.json (not supported with output: 'export')
};

export default nextConfig;
