import type { NextConfig } from "next";

const minioHostname = process.env.MINIO_PUBLIC_URL
  ? new URL(process.env.MINIO_PUBLIC_URL).hostname
  : "localhost";

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    // Optimisation Next.js activée pour les images MinIO
    remotePatterns: [
      {
        protocol: "https",
        hostname: minioHostname,
        pathname: "/**",
      },
      {
        // Pour le développement local (MinIO en HTTP)
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
    ],
    // Formats modernes supportés
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
