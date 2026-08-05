'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PublicLandingPage() {
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    // Check lock/publish status from localStorage or API
    const publishedState = localStorage.getItem('agp_published') === 'true';
    setIsPublished(publishedState);
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Banner / Hero */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 mb-6">
          <span>🏆</span>
          <span>Portal Informasi & Live Score Mobile AGP 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Rekapitulasi Nilai Lomba &amp; Live Scoreboard
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Pantau hasil nilai live, urutan tampil arena, serta peta lokasi transit barak secara realtime dari perangkat mobile Anda.
        </p>

        {/* Lock & Publish Status Dynamic Card */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-xl mx-auto shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`w-3.5 h-3.5 rounded-full ${isPublished ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-xs font-bold text-slate-200">
                STATUS PENGUMUMAN JUARA:
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              isPublished 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isPublished ? '🔓 PUBLISHED (TERBUKA)' : '🔒 LOCKED (SESI PENILAIAN)'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Card 1: Live Scoreboard */}
        <Link
          href="/live-score"
          className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all shadow-xl hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
            🏆
          </div>
          <h2 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
            Hasil Rekapitulasi &amp; SK Juara (PDF)
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Lihat daftar resmi pemenang juara dan download dokumen SK Penetapan Juara resmi dalam format PDF.
          </p>
          <span className="text-xs font-bold text-emerald-400 flex items-center">
            Lihat Hasil &amp; SK Juara &rarr;
          </span>
        </Link>

        {/* Card 2: Urutan Tampil */}
        <Link
          href="/schedule"
          className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 transition-all shadow-xl hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
            ⏱️
          </div>
          <h2 className="text-lg font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
            Urutan Tampil Realtime
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Cek peserta yang sedang tampil di lapangan, nomor standby, dan giliran berikutnya.
          </p>
          <span className="text-xs font-bold text-teal-400 flex items-center">
            Cek Jadwal &rarr;
          </span>
        </Link>

        {/* Card 3: Transit Barak Locator */}
        <Link
          href="/barack"
          className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all shadow-xl hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
            🏕️
          </div>
          <h2 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
            Pembagian Ruang Barak
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Cari lokasi ruangan transit/barak kontingen sekolah Anda berdasarkan gedung dan lantai.
          </p>
          <span className="text-xs font-bold text-cyan-400 flex items-center">
            Cari Lokasi Barak &rarr;
          </span>
        </Link>
      </div>

      {/* LAN Server Notice */}
      <div className="mt-12 text-center text-xs text-slate-500">
        <p>Akses jaringan lokal LAN via Wi-Fi Router tanpa internet &bull; Dynamic IP Host: 0.0.0.0</p>
      </div>
    </main>
  );
}
