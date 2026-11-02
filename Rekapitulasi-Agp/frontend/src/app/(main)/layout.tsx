import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import AppLayout from '@/components/common/AppLayout';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap' });

export const metadata: Metadata = {
  title: 'Kirani AGP Competition 2026 - Sistem Rekapitulasi Nilai',
  description:
    'Sistem Manajemen Rekapitulasi Nilai Lomba, Urutan Tampil Realtime, Pembagian Barak, dan Auto-Generate SK Juara untuk Kirani AGP 2026.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0C342C',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="scroll-smooth dark">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${bebas.variable} font-inter antialiased min-h-screen bg-[#0C342C] text-[#ffffff] selection:bg-[#E3EF26] selection:text-[#0C342C]`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
