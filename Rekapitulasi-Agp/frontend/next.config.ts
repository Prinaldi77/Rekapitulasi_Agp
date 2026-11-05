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
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https://yicrnndbulqahzwzdofw.supabase.co https://rekapitulasi-agp.onrender.com https://*.vercel.app https:; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;