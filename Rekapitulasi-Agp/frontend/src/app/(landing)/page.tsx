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
  COMPETITION_PERIODS,
  TIMELINE_DATA,
  FAQ_DATA,
  CONTACT_PERSONS,
} from '@/data/landingData';

const EASE_AWWWARDS: [number, number, number, number] = [0.16, 1, 0.3, 1];

function MaskRevealLine({
  children,
  delay = 0,
  duration = 0.8,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <span className={`block overflow-hidden pb-[0.06em] -mb-[0.06em] ${className}`}>
      <motion.span
        className="block will-change-transform"
        initial={{ y: '105%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration, delay, ease: EASE_AWWWARDS }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState<
    'HOME' | 'PORTAL' | 'KATEGORI' | 'TIMELINE' | 'FAQ'
  >('HOME');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Sync active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const portalEl = document.getElementById('portal');
      const kategoriEl = document.getElementById('kategori');
      const timelineEl = document.getElementById('timeline');
      const faqEl = document.getElementById('faq');

      if (faqEl && y >= faqEl.offsetTop - 240) {
        setActiveNav('FAQ');
      } else if (timelineEl && y >= timelineEl.offsetTop - 240) {
        setActiveNav('TIMELINE');
      } else if (kategoriEl && y >= kategoriEl.offsetTop - 240) {
        setActiveNav('KATEGORI');
      } else if (portalEl && y >= portalEl.offsetTop - 240) {
        setActiveNav('PORTAL');
      } else {
        setActiveNav('HOME');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07201B] text-[#FFFFFF] selection:bg-[#E3EF26] selection:text-[#0C342C]">
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
              className="w-10 h-10 object-contain shrink-0 group-hover:opacity-90 transition-opacity"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider text-white uppercase">
                KIRANI<span className="text-[#E3EF26]">.AGP</span>
              </span>
              <span className="text-xs font-mono tracking-wider text-[#A7C7BE]">
                SMKN 1 SOREANG
              </span>
            </div>
          </Link>

          {/* Section Navigation Links */}
          <nav aria-label="Navigasi Utama" className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-[#0A2620] border border-[#1E564A]">
            {[
              { id: 'HOME', label: 'Beranda', target: 'home' },
              { id: 'PORTAL', label: 'Akses Portal', target: 'portal' },
              { id: 'KATEGORI', label: 'Periode Lomba', target: 'kategori' },
              { id: 'TIMELINE', label: 'Jadwal Agenda', target: 'timeline' },
              { id: 'FAQ', label: 'FAQ & Kontak', target: 'faq' },
            ].map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.target)}
                  className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                    active ? 'text-[#0C342C]' : 'text-[#C5E0D8] hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="landing-active-tab"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-[#E3EF26]"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <a
              href={JUKLAK_PDF_URL}
              download={JUKLAK_DOWNLOAD_NAME}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A2620] border border-[#1E564A] text-xs font-bold text-[#E3EF26] hover:bg-[#0E332B] hover:border-[#E3EF26] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Juklak PDF</span>
            </a>

            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E3EF26] text-[#0C342C] text-xs font-extrabold hover:bg-[#d8e420] transition-colors shadow-sm"
            >
              <Radio className="w-4 h-4" />
              <span>Portal Live Arena</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* =====================================================================
            2. HERO SECTION (EDITORIAL TECH / BENTO STAGE)
           ===================================================================== */}
        <section id="home" className="pt-14 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Institutional Header Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_AWWWARDS }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#08231D] border border-[#17483D] text-xs font-mono font-semibold tracking-widest text-[#C5E0D8] mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#E3EF26]" />
            <span>PRAMUKA SMKN 1 SOREANG • TINGKAT JAWA BARAT</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-1.5">
                <MaskRevealLine delay={0.05} duration={0.85}>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.12]">
                    Lomba Aktivitas Gerakan Pramuka
                  </h1>
                </MaskRevealLine>
                <MaskRevealLine delay={0.12} duration={0.85}>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#E3EF26] leading-[1.12]">
                    (AGP) SMKN 1 Soreang.
                  </h2>
                </MaskRevealLine>
              </div>

              {/* Bounded Line-Length Description (~65ch) */}
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: EASE_AWWWARDS }}
                className="text-base sm:text-lg text-[#C5E0D8] leading-relaxed max-w-xl"
              >
                Diselenggarakan oleh Sangga Kerja Ambalan{' '}
                <strong className="text-white font-semibold">
                  Ki Hajar Dewantara &amp; R.A. Kartini 04.105–04.106
                </strong>.
                Memperebutkan{' '}
                <strong className="text-[#E3EF26] font-semibold">106 Kategori Piala</strong>{' '}
                tingkat Penggalang SD/SMP dan Penegak SMA/SMK se-Jawa Barat dengan transparansi
                rekapitulasi nilai terpadu.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.28, ease: EASE_AWWWARDS }}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <a
                  href={JUKLAK_PDF_URL}
                  download={JUKLAK_DOWNLOAD_NAME}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E3EF26] text-[#0C342C] text-sm font-bold hover:bg-[#d8e420] transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Juklak Resmi (PDF)</span>
                </a>

                <Link
                  href="/schedule"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#08231D] border border-[#17483D] text-sm font-semibold text-white hover:border-[#E3EF26] hover:text-[#E3EF26] transition-colors"
                >
                  <Radio className="w-4 h-4 text-[#E3EF26]" />
                  <span>Urutan Tampil Lapangan</span>
                </Link>

                <Link
                  href="/barack"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#08231D] border border-[#17483D] text-sm font-semibold text-[#A7C7BE] hover:text-white hover:border-[#E3EF26] transition-colors"
                >
                  <MapPin className="w-4 h-4 text-[#A7C7BE]" />
                  <span>Direktori Barak</span>
                </Link>
              </motion.div>
            </div>

            {/* Right Column: Championship Telemetry Bento Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.18, ease: EASE_AWWWARDS }}
              className="lg:col-span-4 rounded-2xl bg-[#08231D] border border-[#17483D] p-6 sm:p-7 space-y-5 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-[#123E34] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E3EF26]" />
                  <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26] uppercase">
                    RINGKASAN EVENT
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#0D362C] text-[#C5E0D8] border border-[#17483D]">
                  AGP-IV / 2025
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-xs font-mono text-[#7AA89C] uppercase tracking-wider">Lokasi Pelaksanaan</div>
                  <div className="font-semibold text-white text-sm mt-0.5">
                    Kampus SMK Negeri 1 Soreang, Kab. Bandung
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono text-[#7AA89C] uppercase tracking-wider">Hari &amp; Tanggal Utama</div>
                  <div className="font-semibold text-white text-sm mt-0.5">
                    Sabtu, 22 Februari 2025 (Pukul 06.00 WIB – Selesai)
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono text-[#7AA89C] uppercase tracking-wider">Standar Acuan LKBB</div>
                  <div className="font-semibold text-white text-sm mt-0.5">
                    PERPANG TNI Nomor 58 Tahun 2018 (Kavling 20 x 12 m)
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono text-[#7AA89C] uppercase tracking-wider">Total Kejuaraan</div>
                  <div className="font-bold text-[#E3EF26] text-sm mt-0.5">
                    106 Kategori Piala (Piala Bergilir &amp; Tetap)
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#123E34]">
                <Link
                  href="/live-score"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#0E332B] border border-[#17483D] text-xs font-bold text-white hover:border-[#E3EF26] hover:text-[#E3EF26] transition-colors"
                >
                  <Trophy className="w-4 h-4 text-[#E3EF26]" />
                  <span>Lihat Klasemen &amp; Rekapitulasi</span>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Metrics Bento Grid (Editorial Telemetry) */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HERO_STATS.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: EASE_AWWWARDS }}
                className="rounded-2xl bg-[#08231D] border border-[#17483D] hover:border-[#E3EF26]/60 transition-colors p-5 flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#7AA89C] mb-3">
                  <span>METRIK #{`0${idx + 1}`}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3EF26]/80" />
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold font-mono tracking-wider text-[#E3EF26] mt-2 uppercase">
                    {stat.label}
                  </div>
                  {stat.desc && (
                    <div className="text-xs text-[#C5E0D8] mt-1 leading-relaxed">{stat.desc}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            3. PORTAL ACCESS CARDS (BENTO MODULAR)
           ===================================================================== */}
        <section id="portal" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#123E34]">
          <div className="mb-8">
            <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26] uppercase">
              AKSES CEPAT ARENA
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Portal Layanan &amp; Informasi Kegiatan
            </h2>
            <p className="text-sm text-[#C5E0D8] mt-1 max-w-xl">
              Akses instan ke fasilitas pemantauan jadwal tampil langsung, pemetaan barak peserta,
              rekapitulasi nilai juri, serta berkas regulasi resmi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PORTAL_CARDS.map((card, idx) => {
              const content = (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: EASE_AWWWARDS }}
                  className="h-full flex flex-col justify-between rounded-2xl bg-[#08231D] border border-[#17483D] hover:border-[#E3EF26]/70 transition-colors p-5 group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded text-xs font-mono font-bold text-[#0C342C] bg-[#E3EF26]">
                        {card.badge}
                      </span>
                      <span className="text-xs font-mono text-[#7AA89C] font-semibold">{card.code}</span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#E3EF26] transition-colors leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#C5E0D8] mt-2 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#123E34] flex items-center justify-between text-xs font-semibold text-[#E3EF26]">
                    <span>{card.actionLabel || 'Buka Layanan'}</span>
                    {card.isDownload ? (
                      <Download className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    )}
                  </div>
                </motion.div>
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
            4. EMPAT PERIODE KEJUARAAN (EXECUTIVE BENTO GRID)
           ===================================================================== */}
        <section id="kategori" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#123E34]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-[#E3EF26] uppercase">
                STRUKTUR PENILAIAN LOMBA
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Empat Periode Kejuaraan AGP
              </h2>
              <p className="text-sm text-[#C5E0D8] mt-1 max-w-xl">
                Seluruh perlombaan terbagi ke dalam 4 periode penilaian terpadu untuk jenjang
                Penggalang SD/SMP dan Penegak SMA/SMK.
              </p>
            </div>

            <a
              href={JUKLAK_PDF_URL}
              download={JUKLAK_DOWNLOAD_NAME}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E332B] border border-[#17483D] text-xs font-semibold text-white hover:border-[#E3EF26] transition-colors self-start md:self-end"
            >
              <Download className="w-4 h-4 text-[#E3EF26]" />
              <span>Unduh Juklak Lengkap (PDF)</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMPETITION_PERIODS.map((period, idx) => (
              <motion.div
                key={period.period}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: EASE_AWWWARDS }}
                className={`rounded-2xl p-6 sm:p-7 border flex flex-col justify-between shadow-sm transition-colors ${
                  period.highlight
                    ? 'bg-[#092720] border-[#E3EF26]/70'
                    : 'bg-[#08231D] border-[#17483D] hover:border-[#1E564A]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-[#E3EF26] tracking-wider">
                      {period.period}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#07201B] text-[#A7C7BE] border border-[#123E34]">
                      {period.code}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                    {period.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#C5E0D8] mt-2.5 leading-relaxed">
                    {period.scope}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#123E34] text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#A7C7BE]">
                    <span className="font-mono text-xs text-[#7AA89C] uppercase tracking-wider">Bobot:</span>
                    <span className="text-white font-medium">{period.weight}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#A7C7BE]">
                    <span className="font-mono text-xs text-[#7AA89C] uppercase tracking-wider">Arena:</span>
                    <span className="text-white font-medium">{period.arena}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Regulatory Callout Box */}
          <div className="mt-8 p-6 rounded-2xl bg-[#08231D] border border-[#17483D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-[#E3EF26] uppercase tracking-wider">
                REGULASI RESMI &amp; TEKNIS DETAIL
              </div>
              <p className="text-xs sm:text-sm text-[#C5E0D8] max-w-2xl leading-relaxed">
                Rincian pasal perlombaan, seragam, daftar urutan aba-aba PBB LKBB lengkap, formulir pendaftaran, dan lampiran resmi tercantum di dalam berkas Petunjuk Pelaksanaan (Juklak) PDF.
              </p>
            </div>
            <a
              href={JUKLAK_PDF_URL}
              download={JUKLAK_DOWNLOAD_NAME}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E3EF26] text-[#0C342C] text-xs font-bold hover:bg-[#d8e420] transition-colors shrink-0 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Juklak PDF Resmi</span>
            </a>
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
            <p className="text-sm text-[#C5E0D8] mt-1 max-w-xl">
              Catat tanggal pelaksanaan pendaftaran, technical meeting, daftar ulang, serta hari
              perlombaan utama di Kampus SMK Negeri 1 Soreang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIMELINE_DATA.map((item, idx) => {
              const isMain = item.step === '04';
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: EASE_AWWWARDS }}
                  className={`rounded-2xl p-6 border flex flex-col justify-between shadow-sm transition-colors ${
                    isMain
                      ? 'bg-[#0E332B] border-[#E3EF26]/80'
                      : 'bg-[#08231D] border-[#17483D]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#E3EF26]">
                        TAHAP {item.step}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          isMain
                            ? 'bg-[#E3EF26] text-[#0C342C]'
                            : 'bg-[#07201B] text-[#C5E0D8] border border-[#123E34]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#A7C7BE]">{item.date}</div>

                    <h3 className="text-base font-bold text-white leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-[#C5E0D8] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#123E34] flex items-center justify-between text-xs text-[#A7C7BE]">
                    <span>SMKN 1 Soreang</span>
                    <CheckCircle2 className="w-4 h-4 text-[#E3EF26]" />
                  </div>
                </motion.div>
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
                <p className="text-sm text-[#C5E0D8] mt-2 leading-relaxed max-w-md">
                  Pertanyaan terkait teknis perlombaan, pendaftaran, dan administrasi dapat
                  disampaikan langsung kepada narahubung resmi AGP.
                </p>
              </div>

              {/* Official Contacts List */}
              <div className="rounded-2xl bg-[#08231D] border border-[#17483D] p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E3EF26]">
                  <Phone className="w-4 h-4" />
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
                        className="py-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-white text-sm">{person.name}</div>
                          <div className="text-xs text-[#A7C7BE]">{person.role}</div>
                        </div>

                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#E3EF26] hover:underline"
                        >
                          <span>{person.phone}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official Location */}
              <div className="rounded-2xl bg-[#08231D] border border-[#17483D] p-6 text-xs space-y-2 shadow-sm">
                <div className="flex items-center gap-2 font-mono font-bold text-[#E3EF26]">
                  <MapPin className="w-4 h-4" />
                  <span>SEKRETARIAT PANITIA</span>
                </div>
                <div className="text-white font-medium text-sm">Kampus SMK Negeri 1 Soreang</div>
                <div className="text-[#C5E0D8]">
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
                    className={`rounded-2xl border transition-colors ${
                      isOpen
                        ? 'bg-[#0E332B] border-[#E3EF26]/60 shadow-sm'
                        : 'bg-[#08231D] border-[#17483D] hover:border-[#1E564A]'
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

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: EASE_AWWWARDS }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#C5E0D8] leading-relaxed border-t border-[#123E34]">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                <span className="text-[#A7C7BE] ml-2">
                  Basis SMK Negeri 1 Soreang, Kab. Bandung
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[#C5E0D8]">
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
                onClick={() => scrollToSection('kategori')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Periode Lomba
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('timeline')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Jadwal Agenda
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('faq')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                FAQ &amp; Kontak
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A7C7BE]">
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
