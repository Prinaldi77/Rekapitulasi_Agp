// Lokasi file: src/sections/home/QuickNav.tsx
// Deskripsi: Komponen navigasi cepat (Quick Navigation Cards) untuk halaman utama.

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { Trophy, Clock, Tent, ArrowRight } from 'lucide-react';

const QuickNav: React.FC = () => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {/* Card 1: Live Scoreboard */}
      <Link href="/live-score" className="group block h-full">
        <Card className="h-full bg-white border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 rounded-2xl flex flex-col">
          <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 text-green-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
            Hasil Rekapitulasi &amp; SK Juara (PDF)
          </h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 flex-1">
            Lihat daftar resmi pemenang juara dan download dokumen SK Penetapan Juara resmi dalam format PDF.
          </p>
          <span className="text-xs font-bold text-green-600 group-hover:text-green-700 flex items-center gap-1.5 mt-auto">
            Lihat Hasil &amp; SK Juara <ArrowRight className="w-4 h-4" />
          </span>
        </Card>
      </Link>

      {/* Card 2: Urutan Tampil */}
      <Link href="/schedule" className="group block h-full">
        <Card className="h-full bg-white border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 rounded-2xl flex flex-col">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
            Urutan Tampil Realtime
          </h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 flex-1">
            Cek peserta yang sedang tampil di lapangan, nomor standby, dan giliran berikutnya secara live.
          </p>
          <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 mt-auto">
            Pantau Lapangan Live <ArrowRight className="w-4 h-4" />
          </span>
        </Card>
      </Link>

      {/* Card 3: Transit Barak */}
      <Link href="/barack" className="group block h-full">
        <Card className="h-full bg-white border-gray-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 rounded-2xl flex flex-col">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Tent className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors">
            Pemetaan Transit &amp; Barak
          </h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 flex-1">
            Cari nomor ruangan transit dan gedung istirahat untuk masing-masing kontingen sekolah.
          </p>
          <span className="text-xs font-bold text-amber-600 group-hover:text-amber-700 flex items-center gap-1.5 mt-auto">
            Cari Ruang Transit <ArrowRight className="w-4 h-4" />
          </span>
        </Card>
      </Link>
    </section>
  );
};

export default QuickNav;
