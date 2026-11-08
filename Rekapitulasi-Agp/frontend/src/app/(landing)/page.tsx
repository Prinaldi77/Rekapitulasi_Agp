'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  Download,
  Radio,
  MapPin,
  Trophy,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Phone,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  JUKLAK_PDF_URL,
  JUKLAK_DOWNLOAD_NAME,
  HERO_STATS,
  PORTAL_CARDS,
  SHOWCASE_ITEMS,
  ABA_ABA_SD_GROUPS,
  ABA_ABA_SMP_SMA_GROUPS,
  LKBB_PENALTIES,
  TIMELINE_DATA,
  FAQ_DATA,
  CONTACT_PERSONS,
  type ShowcaseCategory,
  type ShowcaseCardItem,
} from '@/data/landingData';

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState<
    'HOME' | 'PORTAL' | 'EXPLORE' | 'ABA_ABA' | 'TIMELINE' | 'FAQ'
  >('HOME');
  const [activeCategory, setActiveCategory] = useState<ShowcaseCategory>('ALL');
  const [activeAbaJenjang, setActiveAbaJenjang] = useState<'SD' | 'SMP_SMA'>('SMP_SMA');
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseCardItem | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Sync active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const portalEl = document.getElementById('portal');
      const exploreEl = document.getElementById('explore');
      const abaEl = document.getElementById('aba-aba');
      const timelineEl = document.getElementById('timeline');
      const faqEl = document.getElementById('faq');

      if (faqEl && y >= faqEl.offsetTop - 240) {
        setActiveNav('FAQ');
      } else if (timelineEl && y >= timelineEl.offsetTop - 240) {
        setActiveNav('TIMELINE');
      } else if (abaEl && y >= abaEl.offsetTop - 240) {
        setActiveNav('ABA_ABA');
      } else if (exploreEl && y >= exploreEl.offsetTop - 240) {
        setActiveNav('EXPLORE');
      } else if (portalEl && y >= portalEl.offsetTop - 240) {
        setActiveNav('PORTAL');
      } else {
        setActiveNav('HOME');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedShowcase(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredShowcase =
    activeCategory === 'ALL'
      ? SHOWCASE_ITEMS
      : SHOWCASE_ITEMS.filter((item) => item.category === activeCategory);

  const activeAbaGroups =
    activeAbaJenjang === 'SD' ? ABA_ABA_SD_GROUPS : ABA_ABA_SMP_SMA_GROUPS;

  return (
    <div className="min-h-screen bg-[#07201B] text-[#F4F9F7] selection:bg-[#E3EF26] selection:text-[#0C342C]">
      {/* =====================================================================
          1. NAVIGATION BAR
         ===================================================================== */}
      <header className="sticky top-0 z-40 bg-[#07201B]/95 border-b border-[#123E34] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/kirani.svg"
              alt="Logo Kirani AGP"
              className="w-10 h-10 object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider text-white uppercase">
                KIRANI<span className="text-[#E3EF26]">.AGP</span>
              </span>
              <span className="text-[10px] font-mono tracking-wider text-[#729B90]">
                SMKN 1 SOREANG
              </span>
            </div>
          </Link>

          {/* Section Navigation Links */}
          <nav aria-label="Navigasi Utama" className="hidden lg:flex items-center gap-1">
            {[
              { id: 'HOME', label: 'Beranda', target: 'home' },
              { id: 'PORTAL', label: 'Akses Portal', target: 'portal' },
              { id: 'EXPLORE', label: 'Mata Lomba', target: 'explore' },
              { id: 'ABA_ABA', label: 'Aba-Aba LKBB', target: 'aba-aba' },
              { id: 'TIMELINE', label: 'Jadwal', target: 'timeline' },
              { id: 'FAQ', label: 'FAQ & Kontak', target: 'faq' },
            ].map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.target)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0E332B] text-[#E3EF26] border border-[#1E564A]'
                      : 'text-[#A7C7BE] hover:text-white hover:bg-[#0A2620]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <a
              href={JUKLAK_PDF_URL}
              download={JUKLAK_DOWNLOAD_NAME}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0A2620] border border-[#1E564A] text-xs font-semibold text-[#E3EF26] hover:bg-[#0E332B] hover:border-[#E3EF26] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Juklak PDF</span>
            </a>

            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E3EF26] text-[#0C342C] text-xs font-bold hover:bg-[#d8e420] transition-colors shadow-sm"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Portal Live Arena</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* =====================================================================
            2. HERO SECTION
           ===================================================================== */}
        <section id="home" className="pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0A2620] border border-[#1E564A] text-[11px] font-mono tracking-wider text-[#A7C7BE] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#E3EF26]" />
            <span>PRAMUKA SMKN 1 SOREANG • TINGKAT JAWA BARAT</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Lomba Aktivitas Gerakan Pramuka{' '}
                <span className="text-[#E3EF26] block sm:inline">(AGP)</span>
              </h1>

              <p className="text-base sm:text-lg text-[#A7C7BE] leading-relaxed max-w-3xl">
                Diselenggarakan oleh Sangga Kerja Ambalan{' '}
                <strong className="text-white font-semibold">
                  Ki Hajar Dewantara &amp; R.A. Kartini 04.105–04.106
                </strong>{' '}
                Basis SMK Negeri 1 Soreang. Memperebutkan{' '}
                <strong className="text-[#E3EF26] font-semibold">106 Kategori Piala</strong>{' '}
                tingkat Penggalang SD/SMP dan Penegak SMA/SMK se-Jawa Barat dengan
                transparansi jadwal tampil, direktori barak, dan rekapitulasi nilai terpadu.
              </p>

              {/* Direct Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={JUKLAK_PDF_URL}
                  download={JUKLAK_DOWNLOAD_NAME}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E3EF26] text-[#0C342C] text-sm font-bold hover:bg-[#d8e420] transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Juklak Resmi (PDF)</span>
                </a>

                <Link
                  href="/schedule"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0A2620] border border-[#1E564A] text-sm font-semibold text-white hover:border-[#E3EF26] hover:text-[#E3EF26] transition-colors"
                >
                  <Radio className="w-4 h-4 text-[#E3EF26]" />
                  <span>Jadwal Urutan Tampil</span>
                </Link>

                <Link
                  href="/barack"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0A2620] border border-[#1E564A] text-sm font-semibold text-[#A7C7BE] hover:text-white hover:border-[#729B90] transition-colors"
                >
                  <MapPin className="w-4 h-4 text-[#729B90]" />
                  <span>Direktori Barak</span>
                </Link>
              </div>
            </div>

            {/* Right Card: Quick Reference */}
            <div className="lg:col-span-4 rounded-2xl bg-[#0A2620] border border-[#1E564A] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#123E34] pb-3">
                <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26]">
                  RINGKASAN EVENT
                </span>
                <span className="text-[11px] font-mono text-[#729B90]">AGP-III / 2025</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[#729B90]">Lokasi Pelaksanaan</div>
                  <div className="font-semibold text-white mt-0.5">
                    Kampus SMK Negeri 1 Soreang, Kab. Bandung
                  </div>
                </div>

                <div>
                  <div className="text-[#729B90]">Hari &amp; Tanggal Utama</div>
                  <div className="font-semibold text-white mt-0.5">
                    Sabtu, 22 Februari 2025 (06.00 WIB – Selesai)
                  </div>
                </div>

                <div>
                  <div className="text-[#729B90]">Standar Acuan LKBB</div>
                  <div className="font-semibold text-white mt-0.5">
                    PERPANG TNI Nomor 58 Tahun 2018
                  </div>
                </div>

                <div>
                  <div className="text-[#729B90]">Total Kejuaraan</div>
                  <div className="font-semibold text-[#E3EF26] mt-0.5">
                    106 Piala (Piala Bergilir &amp; Tetap)
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#123E34]">
                <Link
                  href="/live-score"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#0E332B] border border-[#1E564A] text-xs font-semibold text-white hover:border-[#E3EF26] hover:text-[#E3EF26] transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#E3EF26]" />
                  <span>Lihat Klasemen &amp; Rekapitulasi</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Metrics Ribbon */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-[#0A2620] border border-[#123E34] p-4 text-center"
              >
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-[#E3EF26] mt-1">{stat.label}</div>
                {stat.desc && (
                  <div className="text-[11px] text-[#729B90] mt-0.5">{stat.desc}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            3. PORTAL ACCESS CARDS (Clean Grid replacing 3D Fan Deck)
           ===================================================================== */}
        <section id="portal" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#123E34]">
          <div className="mb-8">
            <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26] uppercase">
              AKSES CEPAT ARENA
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Portal Layanan &amp; Informasi Kegiatan
            </h2>
            <p className="text-sm text-[#A7C7BE] mt-1 max-w-2xl">
              Akses instan ke fasilitas live monitoring jadwal, pemetaan barak peserta,
              rekapitulasi nilai juri, serta berkas regulasi resmi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PORTAL_CARDS.map((card) => {
              const content = (
                <div className="h-full flex flex-col justify-between rounded-xl bg-[#0A2620] border border-[#1E564A] hover:border-[#E3EF26] transition-colors p-5 group">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[#0C342C] bg-[#E3EF26]">
                        {card.badge}
                      </span>
                      <span className="text-[10px] font-mono text-[#729B90]">{card.code}</span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#E3EF26] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#A7C7BE] mt-2 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#123E34] flex items-center justify-between text-xs font-semibold text-[#E3EF26]">
                    <span>Buka Layanan</span>
                    {card.isDownload ? (
                      <Download className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    )}
                  </div>
                </div>
              );

              return card.isDownload ? (
                <a
                  key={card.id}
                  href={card.href}
                  download={JUKLAK_DOWNLOAD_NAME}
                  className="block h-full"
                >
                  {content}
                </a>
              ) : (
                <Link key={card.id} href={card.href} className="block h-full">
                  {content}
                </Link>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            4. MATA LOMBA (SHOWCASE GRID)
           ===================================================================== */}
        <section id="explore" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#123E34]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26] uppercase">
                SPESIFIKASI MATA LOMBA
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Cabang Perlombaan &amp; Bobot Penilaian
              </h2>
              <p className="text-sm text-[#A7C7BE] mt-1 max-w-2xl">
                Seluruh perlombaan dibagi ke dalam 4 Periode penilaian untuk jenjang SD/MI,
                SMP/MTs, dan SMA/SMK/MA.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#0A2620] border border-[#1E564A]">
              {[
                { id: 'ALL', label: 'Semua Periode' },
                { id: 'PERIODE_4', label: 'Periode IV (LKBB)' },
                { id: 'PERIODE_2', label: 'Periode II (Materi)' },
                { id: 'PERIODE_3', label: 'Periode III (Kreativitas)' },
                { id: 'PERIODE_1', label: 'Periode I (Admin)' },
              ].map((tab) => {
                const active = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id as ShowcaseCategory)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#E3EF26] text-[#0C342C] font-bold'
                        : 'text-[#A7C7BE] hover:text-white hover:bg-[#0E332B]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShowcase.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedShowcase(item)}
                className="h-full flex flex-col justify-between rounded-xl bg-[#0A2620] border border-[#1E564A] hover:border-[#E3EF26] transition-colors p-5 cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-3">
                    <span className="font-bold text-[#E3EF26]">{item.code}</span>
                    <span className="text-[#729B90]">{item.categoryLabel}</span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-[#E3EF26] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#A7C7BE] mt-2 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#123E34] text-xs space-y-1">
                    <div className="text-[#729B90]">
                      Bobot:{' '}
                      <span className="text-white font-medium">{item.weightLabel}</span>
                    </div>
                    <div className="text-[#729B90]">
                      Arena:{' '}
                      <span className="text-white font-medium">{item.arenaLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#123E34] flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#0E332B] text-[#A7C7BE] border border-[#123E34]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span className="text-xs font-semibold text-[#E3EF26] inline-flex items-center gap-1 shrink-0">
                    Detail
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Detail Mata Lomba */}
          <AnimatePresence>
            {selectedShowcase && (
              <div
                role="dialog"
                aria-modal="true"
                onClick={() => setSelectedShowcase(null)}
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-xl rounded-2xl bg-[#0A2620] border border-[#E3EF26]/60 p-6 sm:p-8 space-y-5 shadow-2xl relative"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedShowcase(null)}
                    aria-label="Tutup Detail"
                    className="absolute top-5 right-5 p-1.5 rounded-lg bg-[#0E332B] text-[#A7C7BE] hover:text-white hover:bg-[#123E34] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 text-xs font-mono text-[#E3EF26]">
                    <span>{selectedShowcase.code}</span>
                    <span>•</span>
                    <span>{selectedShowcase.categoryLabel}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight pr-8">
                    {selectedShowcase.title}
                  </h3>

                  <div className="space-y-2 text-xs sm:text-sm text-[#A7C7BE]">
                    <div className="p-3 rounded-lg bg-[#0E332B] border border-[#123E34] space-y-1">
                      <div>
                        <strong className="text-white">Bobot Penilaian:</strong>{' '}
                        {selectedShowcase.weightLabel}
                      </div>
                      <div>
                        <strong className="text-white">Arena:</strong>{' '}
                        {selectedShowcase.arenaLabel}
                      </div>
                      <div>
                        <strong className="text-white">Spesifikasi:</strong>{' '}
                        {selectedShowcase.subtitle}
                      </div>
                    </div>

                    <p className="leading-relaxed pt-2 text-[#F4F9F7]">
                      {selectedShowcase.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedShowcase.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded text-xs bg-[#0E332B] text-[#E3EF26] border border-[#1E564A]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#123E34] flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href="/schedule"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E3EF26] text-[#0C342C] text-xs font-bold hover:bg-[#d8e420]"
                    >
                      <span>Urutan Tampil Lomba Ini</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    <a
                      href={JUKLAK_PDF_URL}
                      download={JUKLAK_DOWNLOAD_NAME}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0E332B] border border-[#1E564A] text-xs font-semibold text-white hover:border-[#E3EF26]"
                    >
                      <Download className="w-3.5 h-3.5 text-[#E3EF26]" />
                      <span>Juklak Lengkap (PDF)</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* =====================================================================
            5. ABA-ABA PBB LKBB & REGULASI PENALTI
           ===================================================================== */}
        <section id="aba-aba" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#123E34]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26] uppercase">
                STANDAR PERPANG TNI NO. 58 TAHUN 2018
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Daftar Resmi Aba-Aba PBB LKBB
              </h2>
              <p className="text-sm text-[#A7C7BE] mt-1 max-w-2xl">
                Seluruh aba-aba wajib dihafal secara berurutan pada kavling lapangan{' '}
                <strong className="text-white">20 x 12 meter</strong> dengan batas waktu tampil{' '}
                <strong className="text-white">8 menit</strong>.
              </p>
            </div>

            {/* Jenjang Switcher Tabs */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-[#0A2620] border border-[#1E564A] self-start lg:self-end">
              <button
                type="button"
                onClick={() => setActiveAbaJenjang('SD')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeAbaJenjang === 'SD'
                    ? 'bg-[#E3EF26] text-[#0C342C] font-bold'
                    : 'text-[#A7C7BE] hover:text-white hover:bg-[#0E332B]'
                }`}
              >
                Penggalang SD/MI (27 Aba-aba)
              </button>

              <button
                type="button"
                onClick={() => setActiveAbaJenjang('SMP_SMA')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeAbaJenjang === 'SMP_SMA'
                    ? 'bg-[#E3EF26] text-[#0C342C] font-bold'
                    : 'text-[#A7C7BE] hover:text-white hover:bg-[#0E332B]'
                }`}
              >
                SMP/MTs &amp; SMA/SMK (28 Aba-aba)
              </button>
            </div>
          </div>

          {/* Aba-Aba Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {activeAbaGroups.map((grp) => (
              <div
                key={`${activeAbaJenjang}-${grp.groupCode}`}
                className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#123E34] pb-2">
                  <span className="text-[11px] font-mono font-bold text-[#E3EF26]">
                    BAGIAN {grp.groupCode}
                  </span>
                  <span className="text-[11px] font-mono text-[#729B90]">
                    {grp.items.length} Gerakan
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  {grp.groupTitle}
                </h3>

                <ul className="space-y-1.5 text-xs text-[#A7C7BE]">
                  {grp.items.map((item) => (
                    <li
                      key={item}
                      className="py-1 px-2.5 rounded bg-[#07201B] border border-[#123E34]/80 flex items-center justify-between"
                    >
                      <span>{item}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E3EF26]/70 shrink-0 ml-2" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* LKBB Penalty Rules Callout */}
          <div className="rounded-2xl bg-[#0A2620] border border-amber-600/40 p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>REGULASI RESMI PENGURANGAN NILAI (PENALTI) LKBB</span>
            </div>

            <p className="text-xs text-[#A7C7BE]">
              Ketentuan penalti diberlakukan langsung oleh dewan juri dan panitia penilai kavling
              selama penampilan berlangsung:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {LKBB_PENALTIES.map((p) => (
                <div
                  key={p.code}
                  className="rounded-lg bg-[#07201B] border border-[#123E34] p-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#729B90]">
                      {p.code}
                    </span>
                    <p className="text-xs text-[#F4F9F7] leading-snug">{p.rule}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#123E34] text-xs font-mono font-bold text-rose-400">
                    {p.deduction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            6. TIMELINE & JADWAL KEGIATAN
           ===================================================================== */}
        <section id="timeline" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#123E34]">
          <div className="mb-8">
            <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26] uppercase">
              RANGKAIAN TAHAPAN KEGIATAN
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Jadwal &amp; Agenda Penting
            </h2>
            <p className="text-sm text-[#A7C7BE] mt-1 max-w-2xl">
              Catat tanggal pelaksanaan pendaftaran, technical meeting, daftar ulang, serta hari
              perlombaan utama di Kampus SMK Negeri 1 Soreang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIMELINE_DATA.map((item) => {
              const isMain = item.step === '04';
              return (
                <div
                  key={item.step}
                  className={`rounded-xl p-5 border flex flex-col justify-between ${
                    isMain
                      ? 'bg-[#0E332B] border-[#E3EF26]'
                      : 'bg-[#0A2620] border-[#1E564A]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#E3EF26]">
                        TAHAP {item.step}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isMain
                            ? 'bg-[#E3EF26] text-[#0C342C]'
                            : 'bg-[#07201B] text-[#A7C7BE] border border-[#123E34]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#729B90]">{item.date}</div>

                    <h3 className="text-base font-bold text-white leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-[#A7C7BE] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#123E34] flex items-center justify-between text-xs text-[#729B90]">
                    <span>SMKN 1 Soreang</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E3EF26]" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            7. INFORMASI, FAQ & NARAHUBUNG
           ===================================================================== */}
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#123E34]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Contact Info */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26] uppercase">
                  INFORMASI &amp; NARAHUBUNG
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                  Kontak Resmi Sangga Kerja
                </h2>
                <p className="text-sm text-[#A7C7BE] mt-2 leading-relaxed">
                  Pertanyaan terkait teknis perlombaan, pendaftaran, dan administrasi dapat
                  disampaikan langsung kepada narahubung resmi AGP.
                </p>
              </div>

              {/* Official Contacts List */}
              <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E3EF26]">
                  <Phone className="w-3.5 h-3.5" />
                  <span>WHATSAPP RESMI SANGGA KERJA</span>
                </div>

                <div className="divide-y divide-[#123E34] text-xs">
                  {CONTACT_PERSONS.map((person) => {
                    const cleanNumber = person.phone.replace(/[^0-9]/g, '');
                    const waNumber = cleanNumber.startsWith('0')
                      ? '62' + cleanNumber.slice(1)
                      : cleanNumber;
                    return (
                      <div
                        key={person.name}
                        className="py-2.5 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-white">{person.name}</div>
                          <div className="text-[11px] text-[#729B90]">{person.role}</div>
                        </div>

                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[#E3EF26] hover:underline"
                        >
                          <span>{person.phone}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official Location */}
              <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-mono font-bold text-[#E3EF26]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>SEKRETARIAT PANITIA</span>
                </div>
                <div className="text-white font-medium">Kampus SMK Negeri 1 Soreang</div>
                <div className="text-[#A7C7BE]">
                  Jl. Nyalindung No. 1, Kec. Soreang, Kabupaten Bandung, Jawa Barat.
                </div>
              </div>
            </div>

            {/* Right: FAQ Accordion */}
            <div className="lg:col-span-7 space-y-3">
              <div className="mb-2">
                <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26] uppercase">
                  PERTANYAAN UMUM (FAQ)
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Hal yang Sering Ditanyakan Peserta
                </h3>
              </div>

              {FAQ_DATA.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-colors ${
                      isOpen
                        ? 'bg-[#0E332B] border-[#E3EF26]/60'
                        : 'bg-[#0A2620] border-[#1E564A] hover:border-[#1E564A]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-sm font-bold text-white">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#E3EF26] shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#A7C7BE] leading-relaxed border-t border-[#123E34]">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          8. FOOTER
         ===================================================================== */}
      <footer className="border-t border-[#123E34] bg-[#051713] pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Bottom Navigation & Brand Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#123E34] text-xs">
            <div className="flex items-center gap-3">
              <img
                src="/kirani.svg"
                alt="Logo Kirani AGP"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div>
                <span className="font-bold text-white tracking-wider uppercase">
                  KIRANI AGP
                </span>
                <span className="text-[#729B90] ml-2">
                  Basis SMK Negeri 1 Soreang, Kab. Bandung
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[#A7C7BE]">
              <button
                type="button"
                onClick={() => scrollToSection('home')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Beranda
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('portal')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Akses Portal
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('explore')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Mata Lomba
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('aba-aba')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Aba-Aba LKBB
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('timeline')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Jadwal
              </button>
              <a
                href={JUKLAK_PDF_URL}
                download={JUKLAK_DOWNLOAD_NAME}
                className="text-[#E3EF26] hover:underline font-semibold"
              >
                Unduh Juklak PDF
              </a>
            </div>
          </div>

          {/* Copyright & Disclaimer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#729B90]">
            <div>
              © Sangga Kerja Lomba Aktivitas Gerakan Pramuka (AGP) Ambalan Ki Hajar Dewantara
              &amp; R.A. Kartini SMKN 1 Soreang.
            </div>
            <div>Hak Cipta Dilindungi Undang-Undang.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
