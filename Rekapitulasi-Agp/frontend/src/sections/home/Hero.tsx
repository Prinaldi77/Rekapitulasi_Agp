// Lokasi file: src/sections/home/Hero.tsx
// Deskripsi: Komponen Hero Section untuk halaman utama (Home) yang menampilkan judul utama, sub-judul, dan status publikasi.

import React from 'react';
import { Badge, Card } from '@/components/ui';
import { Trophy, Lock, LockOpen } from 'lucide-react';

// 1. Definisi strict interface untuk Props
interface HeroProps {
  isPublished: boolean;
}

// 2. Menggunakan Arrow Function dengan React.FC
const Hero: React.FC<HeroProps> = ({ isPublished }) => {
  return (
    <section className="text-center max-w-4xl mx-auto space-y-8 pt-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Label/Badge Atas */}
      <div className="flex justify-center">
        <Badge 
          variant="primary" 
          className="font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] py-1.5 px-4 bg-green-50 text-green-700 border border-green-200/50 shadow-sm rounded-full"
        >
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Portal Informasi & Live Score AGP 2026
          </span>
        </Badge>
      </div>

      {/* Main Typography Area */}
      <div className="space-y-5">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15]">
          Rekapitulasi Nilai Lomba & <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
            Live Scoreboard
          </span>
        </h1>
        <p className="text-gray-500 font-medium text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Pantau hasil nilai secara langsung, urutan tampil arena, serta peta lokasi transit barak secara realtime dari perangkat Anda.
        </p>
      </div>

      {/* Status Pengumuman Card (Glassmorphism ringan) */}
      <div className="pt-4">
        <Card className="max-w-lg mx-auto bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
          <div className="flex items-center justify-between gap-4 p-2">
            <div className="flex items-center space-x-3">
              <span className={`w-3 h-3 rounded-full shadow-sm ${isPublished ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status Pengumuman Juara
              </span>
            </div>
            <Badge 
              variant={isPublished ? 'success' : 'warning'} 
              className="text-[10px] font-extrabold uppercase shadow-sm px-3 py-1"
            >
              <span className="flex items-center gap-1">
                {isPublished ? <LockOpen className="w-3 h-3" /> : <Lock className="w-3 h-3" />} 
                {isPublished ? 'Published' : 'Locked'}
              </span>
            </Badge>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Hero;
