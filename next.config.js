/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // This is a backend-only Next.js deployment (API routes only)
  // The frontend is a separate Vite app in src/ directory
  // Next.js should ONLY process app/ directory (App Router)
  
  // Ensure environment variables are available during build
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // Skip linting during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configure webpack
  webpack: (config) => {
    // Make sure webpack can handle both CommonJS and ESM
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };
    return config;
  },
}

module.exports = nextConfig

