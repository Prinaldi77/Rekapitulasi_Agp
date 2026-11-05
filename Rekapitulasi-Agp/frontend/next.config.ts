import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Batasi alokasi worker agar build stabil
  experimental: {
    cpus: 2,
  },

  // Konfigurasi Security Headers HTTP Standar OWASP
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Mencegah serangan Clickjacking (tidak bisa di-embed di iframe)
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Mencegah browser melakukan MIME-type sniffing
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // Menjaga privasi referrer URL
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()", // Membatasi akses sensor browser yang tidak diperlukan
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload", // Memaksa browser menggunakan HTTPS
          },
        ],
      },
    ];
  },
};

export default nextConfig;