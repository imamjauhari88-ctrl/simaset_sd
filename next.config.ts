import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dibutuhkan supaya <ViewTransition> dari React beneran "nempel" ke
  // navigasi App Router (Link/router.push) — tanpa ini, transisinya bisa
  // gak konsisten kepasang pas pindah rute, kerasa patah-patah/gak halus.
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
