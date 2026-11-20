import type { NextConfig } from "next";

const backend = process.env.PUNTO_BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:collection(foro|usuario|comunidad|post|comentario|votos-post)",
        destination: backend.replace(/\/$/, "") + "/api/:collection/",
      },
      {
        source: "/api/:path*",
        destination: backend.replace(/\/$/, "") + "/api/:path*",
      },
    ];
  },
};

export default nextConfig;
