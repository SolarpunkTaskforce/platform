const nextConfig = {
  experimental: {
    // Disable built-in font optimization that fetches external Geist fonts
    optimizePackageImports: [],
    fontLoaders: [],
  },
};
module.exports = nextConfig;
