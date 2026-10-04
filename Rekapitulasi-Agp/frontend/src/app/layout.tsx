import type { Metadata, Viewport } from 'next';
import AppLayout from '@/components/common/AppLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kirani AGP Competition 2026 - Sistem Rekapitulasi Nilai',
  description: 'Sistem Manajemen Rekapitulasi Nilai Lomba, Urutan Tampil Realtime, Pembagian Barak, dan Auto-Generate SK Juara untuk Kirani AGP 2026.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#052e16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased min-h-screen bg-gray-50 text-gray-900 selection:bg-green-500 selection:text-white">
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
