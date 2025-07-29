/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Disable static optimization temporarily to resolve Html import issues
  output: 'standalone',
  trailingSlash: false,
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Compression and bundling
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Bundle analysis
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer in development
    if (dev && !isServer && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      );
    }
    
    return config;
  },
  
  // Experimental features for performance - temporarily disabled for stable deployment
  experimental: {
    scrollRestoration: true,
  },
}

module.exports = nextConfig
