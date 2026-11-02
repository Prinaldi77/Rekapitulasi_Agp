import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap' });

export const metadata: Metadata = {
  title: 'AGP 2027 - Aktivitas Gerakan Pramuka',
  description: 'Landing Page Resmi Kompetisi AGP — Pantau Jadwal Tampil, Lokasi Barak, dan Pengumuman Juara.',
};

export const viewport: Viewport = {
  themeColor: '#0C342C',
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className="scroll-smooth dark">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${bebas.variable} font-inter antialiased min-h-screen bg-[#0C342C] text-[#ffffff] selection:bg-[#E3EF26] selection:text-[#0C342C]`}
      >
        {children}
      </body>
    </html>
  );
}
