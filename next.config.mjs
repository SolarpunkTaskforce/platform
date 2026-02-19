/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase project (avatars / storage)
      {
        protocol: "https",
        hostname: "djfptkcnbanbagrgntuz.supabase.co",
      },
      // If you ever switch projects, this covers any Supabase-hosted asset URLs
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    // keep this block if you need other valid flags only
  },
};

export default nextConfig;
