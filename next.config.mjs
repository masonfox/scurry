import pkg from './package.json' with { type: 'json' };

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  // Enable React Compiler for automatic memoization
  reactCompiler: true,
  experimental: {
    // Enable Turbopack filesystem caching for faster dev startup
    turbopackFileSystemCacheForDev: true,
    // Server Actions configuration (still experimental in 16.1.4)
    serverActions: {
      allowedOrigins: ['*']
    }
  }
};
export default nextConfig;
