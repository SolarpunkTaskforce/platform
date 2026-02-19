/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "djfptkcnbanbagrgntuz.supabase.co",
      },
    ],
  },
  experimental: {
    // keep existing experimental flags here (currently empty)
  },
};

export default nextConfig;
