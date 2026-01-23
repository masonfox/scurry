/** @type {import('next').NextConfig} */
const nextConfig = {
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
