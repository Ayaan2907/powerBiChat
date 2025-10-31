/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable standalone output for Docker
  output: 'standalone',
  
  // External packages for server components
  serverExternalPackages: ['@azure/msal-node'],
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: false, // Disable this to avoid critters dependency issue
  },
  
  // Allow all origins in development mode
  allowedDevOrigins: ['*'],
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
    generateEtags: false,
  }),
}

export default nextConfig
