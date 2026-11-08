import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Bebas_Neue, JetBrains_Mono } from 'next/font/google';
import '../globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AGP-IV - Aktivitas Gerakan Pramuka SMKN 1 Soreang',
  description: 'Landing Page Resmi Kompetisi AGP • Pantau Jadwal Tampil, Lokasi Barak, dan Pengumuman Juara.',
};

export const viewport: Viewport = {
  themeColor: '#07201B',
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className="scroll-smooth dark">
      <body
        suppressHydrationWarning
        className={`${sans.variable} ${bebas.variable} ${mono.variable} font-sans antialiased min-h-screen bg-[#07201B] text-[#FFFFFF] selection:bg-[#E3EF26] selection:text-[#0C342C]`}
      >
        {children}
      </body>
    </html>
  );
}
