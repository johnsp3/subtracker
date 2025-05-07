/** @type {import('next').NextConfig} */
const nextConfig = {
  // Indicate React strict mode for development
  reactStrictMode: true,
  
  // We need to run with unoptimized images for development
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Skip SSG for dynamic routes that depend on client-side data
  // This helps avoid prerendering errors with Firebase
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Force all pages to be treated as client components
  // to avoid issues with authentication and Firebase
  compiler: {
    styledComponents: true,
  },
  
  // Enable type checking during all builds
  typescript: {
    // Always perform type checking (don't skip even in production)
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Always perform linting checks (don't skip even in production)
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig 