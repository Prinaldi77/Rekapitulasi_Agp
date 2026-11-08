import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Bebas_Neue, JetBrains_Mono } from 'next/font/google';
import AppLayout from '@/components/common/AppLayout';
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
  title: 'Kirani AGP Competition - Sistem Rekapitulasi Nilai & Live Arena',
  description:
    'Sistem Manajemen Rekapitulasi Nilai Lomba, Urutan Tampil Realtime, Pembagian Barak, dan Auto-Generate SK Juara untuk Kirani AGP SMKN 1 Soreang.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07201B',
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
        className={`${sans.variable} ${bebas.variable} ${mono.variable} font-sans antialiased min-h-screen bg-[#07201B] text-[#FFFFFF] selection:bg-[#E3EF26] selection:text-[#0C342C]`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
