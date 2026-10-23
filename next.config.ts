import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  images: {
    // Cloudflare R2 ya sirve las imágenes optimizadas por su cuenta y el
    // Image Optimization API de Vercel es un servicio facturable aparte que
    // devuelve 402 al agotar la cuota. Servimos los originales directamente.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
};

export default nextConfig;
