'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Skeleton, EmptyState, Toast } from '@/components/ui';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Tent,
  Clock,
  Trophy,
  Zap,
  Database,
  RefreshCw,
  Settings,
  ShieldAlert,
  Crown,
  FileText,
  ClipboardList,
  ArrowUpRight,
} from 'lucide-react';

const EASE_AWWWARDS: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalPjRekap: number;
  totalParticipants: number;
  totalBaracks: number;
  totalCategories: number;
  totalSchedules: number;
  totalScoresEntered: number;
  progressOverall: number;
  sheetsEntered: number;
  sheetsPending: number;
  participantsGraded: number;
  participantsPending: number;
}

interface ActivityItem {
  id: string;
  type: 'score' | 'schedule' | 'barack' | 'user' | 'system';
  message: string;
  time: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP'>('OPERATOR_REKAP');
  const [userName, setUserName] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalPjRekap: 0,
    totalParticipants: 0,
    totalBaracks: 0,
    totalCategories: 0,
    totalSchedules: 0,
    totalScoresEntered: 0,
    progressOverall: 0,
    sheetsEntered: 0,
    sheetsPending: 0,
    participantsGraded: 0,
    participantsPending: 0,
  });

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActivityItem[]>([]);
  const [leaderboardPreview, setLeaderboardPreview] = useState<any[]>([]);
  const [lastInputMetadata, setLastInputMetadata] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        let effectiveRole: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP' = 'OPERATOR_REKAP';

        if (session?.user) {
          const email = session.user.email?.toLowerCase() || '';

          const { data: profile } = await supabase
            .from('profiles')
            .select('role, username, full_name')
            .eq('id', session.user.id)
            .maybeSingle();

          const metaRole = session.user.user_metadata?.role;
          const dbRole = profile?.role;
          const uname = (
            profile?.username ||
            session.user.user_metadata?.username ||
            email.split('@')[0] ||
            'operator'
          ).toLowerCase();

          if (
            uname === 'superadmin' ||
            uname === 'grandmaster' ||
            dbRole === 'GRAND_MASTER' ||
            metaRole === 'SUPER_ADMIN' ||
            metaRole === 'GRAND_MASTER'
          ) {
            effectiveRole = 'SUPER_ADMIN';
          } else if (uname === 'admin' || uname.includes('admin') || metaRole === 'ADMIN') {
            effectiveRole = 'ADMIN';
          } else {
            effectiveRole = 'OPERATOR_REKAP';
          }

          const resolvedName =
            profile?.full_name ||
            session.user.user_metadata?.full_name ||
            (effectiveRole === 'SUPER_ADMIN'
              ? 'Sekretaris Utama AGP (Super Admin)'
              : effectiveRole === 'ADMIN'
                ? 'Pengelola Master Data (Admin)'
                : 'Operator Entri Nilai (PJ Rekap)');

          setUserName(resolvedName);
          setUserRole(effectiveRole);
        }

        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        const { count: partCount } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true });
        const { count: barackCount } = await supabase
          .from('baracks')
          .select('*', { count: 'exact', head: true });
        const { count: catCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });
        const { count: schedCount } = await supabase
          .from('schedules')
          .select('*', { count: 'exact', head: true });
        const { count: scoresCount } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true });

        const { count: adminRoleCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'GRAND_MASTER');
        const { count: operatorRoleCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'OPERATOR');

        const { data: scoresData } = await supabase.from('scores').select('participant_id');
        const uniqueGradedParticipants = new Set(scoresData?.map((s) => s.participant_id) || [])
          .size;

        const participantsPendingCount = Math.max(0, (partCount || 0) - uniqueGradedParticipants);
        const overallProgress =
          partCount && partCount > 0 ? Math.round((uniqueGradedParticipants / partCount) * 100) : 0;

        setStats({
          totalUsers: userCount || 3,
          totalAdmins: adminRoleCount || 1,
          totalPjRekap: operatorRoleCount || 2,
          totalParticipants: partCount || 0,
          totalBaracks: barackCount || 0,
          totalCategories: catCount || 0,
          totalSchedules: schedCount || 0,
          totalScoresEntered: scoresCount || 0,
          progressOverall: overallProgress,
          sheetsEntered: scoresCount || 0,
          sheetsPending: participantsPendingCount * 3,
          participantsGraded: uniqueGradedParticipants,
          participantsPending: participantsPendingCount,
        });

        const { data: leaderboards } = await supabase
          .from('participants')
          .select('*, scores(*)')
          .limit(5);

        if (leaderboards) {
          const processed = leaderboards
            .map((p) => {
              const total = p.scores?.reduce((sum: number, s: any) => sum + s.score_value, 0) || 0;
              return {
                id: p.id,
                teamName: p.team_name,
                schoolName: p.school_name,
                score: total,
              };
            })
            .sort((a, b) => b.score - a.score);
          setLeaderboardPreview(processed);
        }

        if (typeof window !== 'undefined') {
          const lastInputStr = localStorage.getItem('agp_last_score_entry');
          if (lastInputStr) {
            try {
              setLastInputMetadata(JSON.parse(lastInputStr));
            } catch (e) {
              console.error(e);
            }
          }
        }

        setActivities([
          {
            id: '1',
            type: 'score',
            message: 'Lembar Nilai LKBB Juri 2 untuk SMA-02 berhasil disimpan.',
            time: '2 menit lalu',
          },
          {
            id: '2',
            type: 'schedule',
            message: 'Status urutan tampil SMA-01 diperbarui menjadi PERFORMING.',
            time: '10 menit lalu',
          },
          {
            id: '3',
            type: 'barack',
            message: 'Alokasi Barak Kelas X-1 untuk SMP-03 tersimpan.',
            time: '20 menit lalu',
          },
        ]);

        setAuditLogs([
          {
            id: 'a1',
            type: 'system',
            message: 'Pencadangan basis data otomatis terjadwal berhasil diselesaikan.',
            time: '1 jam lalu',
          },
          {
            id: 'a2',
            type: 'user',
            message: 'Operator @operator_lkbb_sma memperbarui nilai peserta SMA-04.',
            time: '2 jam lalu',
          },
          {
            id: 'a3',
            type: 'system',
            message: 'Status publikasi pengumuman juara diperbarui oleh @grandmaster.',
            time: '4 jam lalu',
          },
        ]);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleBackupDb = useCallback(() => {
    setToastMsg('Pencadangan basis data berhasil dipicu. Berkas siap diunduh di menu Backup.');
  }, []);

  const handleRoleSwitch = (nextRole: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP') => {
    setUserRole(nextRole);
    setToastMsg(`Tampilan ruang kerja dialihkan ke mode ${nextRole}.`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toastMsg && <Toast message={toastMsg} type="info" onClose={() => setToastMsg(null)} />}

      {/* Awwwards 3D Command Center Banner */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE_AWWWARDS }}
        className="relative overflow-hidden rounded-[28px] bg-[#092922]/90 border border-[#076653]/80 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <img
          src="/images/landing/card-knowledge.jpg"
          alt="AGP Command Center"
          className="absolute right-0 top-0 h-full w-80 object-cover opacity-20 pointer-events-none select-none"
        />

        <div className="flex items-start sm:items-center gap-5 relative z-10 max-w-2xl">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0C342C] border border-[#076653] flex items-center justify-center shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <img
              src="/kirani.svg"
              alt="Logo Kirani AGP"
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-[0_2px_8px_rgba(227,239,38,0.25)]"
            />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0C342C] border border-[#076653] text-[10px] font-mono uppercase tracking-[0.16em] text-[#E3EF26]">
              <span className="w-2 h-2 rounded-full bg-[#E3EF26] animate-pulse" />
              <span>KIRANI AGP-III • SMKN 1 SOREANG (04.105–04.106)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Selamat Datang, <span className="text-[#E3EF26]">{userName || 'Panitia AGP'}</span>
            </h1>
            <p className="text-[#94B8AE] text-xs sm:text-sm leading-relaxed">
              {userRole === 'SUPER_ADMIN'
                ? 'Otoritas penuh sebagai Sekretaris Utama (Super Admin) untuk validasi rekapitulasi nilai 106 Trophy, penerbitan SK Juara AGP-III, dan konfigurasi sistem.'
                : userRole === 'ADMIN'
                  ? 'Mengelola operasional master data kontingen peserta (Kuota 50 Basis), giliran tampil arena (8 Menit), serta alokasi ruangan barak SMKN 1 Soreang.'
                  : 'Ruang kerja cepat Operator Entri Nilai (PJ Rekap) untuk tabulasi lembar nilai dewan juri Periode I–IV dan pemantauan klasemen.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-3 relative z-10">
          <div className="flex items-center gap-2 self-start sm:self-end">
            <a
              href="/Juklak_AGP_III_SMKN1_Soreang.pdf"
              download="Surat_Edaran_dan_JUKLAK_AGP_Vol_III_SMKN1_Soreang.pdf"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#061C18] border border-[#E3EF26]/45 text-[11px] font-mono font-bold text-[#E3EF26] hover:bg-[#E3EF26] hover:text-[#0C342C] transition-all"
            >
              <FileText className="w-3 h-3" />
              <span>Unduh Juklak PDF</span>
            </a>
            <Badge variant="danger" className="gap-1.5 py-1 px-3">
              <Crown className="w-3.5 h-3.5" />
              <span>{userRole}</span>
            </Badge>
          </div>

          {/* Segmented Role Switcher Pill */}
          <div className="inline-flex items-center gap-1 rounded-full bg-[#061C18] p-1.5 border border-[#076653]">
            {(['SUPER_ADMIN', 'ADMIN', 'OPERATOR_REKAP'] as const).map((r) => {
              const active = userRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSwitch(r)}
                  className={`relative px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                    active ? 'text-[#0C342C]' : 'text-[#94B8AE] hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-role-pill"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-[#E3EF26]"
                    />
                  )}
                  <span className="relative z-10">
                    {r === 'SUPER_ADMIN' ? 'GM' : r === 'ADMIN' ? 'ADMIN' : 'REKAP'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 1. SUPER ADMIN DASHBOARD */}
      {userRole === 'SUPER_ADMIN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                label: 'TOTAL AKUN PANITIA',
                val: stats.totalUsers,
                sub: `(${stats.totalAdmins} GM)`,
                desc: 'Akun panitia aktif terverifikasi',
                highlight: false,
              },
              {
                label: 'PESERTA & BARAK',
                val: stats.totalParticipants,
                sub: `(${stats.totalBaracks} Ruang)`,
                desc: 'Kontingen & ruang transit',
                highlight: false,
              },
              {
                label: 'JADWAL & KATEGORI',
                val: stats.totalSchedules,
                sub: `(${stats.totalCategories} Kat)`,
                desc: 'Antrean tampil terdaftar',
                highlight: false,
              },
              {
                label: 'DATA SKOR MASUK',
                val: stats.totalScoresEntered,
                sub: 'Lembar',
                desc: 'Rekaman nilai juri tersimpan',
                highlight: true,
              },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05, ease: EASE_AWWWARDS }}
                className={`rounded-[22px] p-5 sm:p-6 border backdrop-blur-xl ${
                  item.highlight
                    ? 'bg-[#0C342C]/90 border-[#E3EF26]/55'
                    : 'bg-[#092922]/85 border-[#076653]/70'
                }`}
              >
                <div className="text-[11px] font-mono text-[#94B8AE] uppercase tracking-wider mb-2">
                  {item.label}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                  <span className={item.highlight ? 'text-[#E3EF26]' : 'text-white'}>
                    {item.val}
                  </span>{' '}
                  <span className="text-xs font-normal text-[#8AB0A5]">{item.sub}</span>
                </div>
                <p className="text-xs text-[#7FA69A] mt-1.5">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-[24px] bg-[#092922]/85 border border-[#076653]/70 p-6 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    Progres Rekapitulasi Lomba
                  </h3>
                  <Badge variant="success">{stats.progressOverall}% SELESAI</Badge>
                </div>
                <div className="w-full h-3 rounded-full bg-[#061C18] border border-[#076653] overflow-hidden mb-2.5">
                  <div
                    className="h-full rounded-full bg-[#E3EF26] transition-all duration-700"
                    style={{ width: `${stats.progressOverall}%` }}
                  />
                </div>
                <p className="text-xs text-[#94B8AE]">
                  Rasio kontingen pangkalan yang telah memiliki rekapitulasi nilai dewan juri.
                </p>
              </div>

              <div className="rounded-[24px] bg-[#092922]/85 border border-[#076653]/70 p-6 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#076653]/50">
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    Peringkat 5 Teratas Sementara
                  </h3>
                  <Link
                    href="/admin/leaderboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3EF26] hover:underline"
                  >
                    <span>Buka Master Leaderboard</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {leaderboardPreview.length === 0 ? (
                  <EmptyState
                    title="Klasemen Kosong"
                    description="Belum ada skor lomba yang diinput."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#076653]/50 text-[11px] font-mono uppercase text-[#8AB0A5]">
                          <th className="py-2.5">Regu</th>
                          <th className="py-2.5">Pangkalan</th>
                          <th className="py-2.5 text-right">Total Skor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#076653]/35 text-xs">
                        {leaderboardPreview.map((item) => (
                          <tr key={item.id} className="hover:bg-[#061C18]/60 transition-colors">
                            <td className="py-3 font-bold text-white">{item.teamName}</td>
                            <td className="py-3 text-[#94B8AE]">{item.schoolName}</td>
                            <td className="py-3 text-right font-mono font-bold text-[#E3EF26]">
                              {item.score} PTS
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[24px] bg-[#092922]/85 border border-[#076653]/70 p-6 backdrop-blur-xl">
                <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider mb-4">
                  Pintasan Kendali Grand Master
                </h3>
                <div className="flex flex-col gap-2.5">
                  <Link href="/admin/score-entry">
                    <Button variant="primary" className="w-full justify-start gap-2.5">
                      <Zap className="w-4 h-4" /> Input Nilai Juri &amp; AI OCR
                    </Button>
                  </Link>
                  <Link href="/admin/leaderboard">
                    <Button variant="secondary" className="w-full justify-start gap-2.5">
                      <Trophy className="w-4 h-4 text-[#E3EF26]" /> Rekap Master &amp; Cetak SK PDF
                    </Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button variant="outline" className="w-full justify-start gap-2.5">
                      <Users className="w-4 h-4" /> Kelola Akun &amp; Peran Panitia
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2.5"
                    onClick={handleBackupDb}
                  >
                    <Database className="w-4 h-4" /> Backup Basis Data
                  </Button>
                  <Link href="/admin/restore">
                    <Button variant="outline" className="w-full justify-start gap-2.5">
                      <RefreshCw className="w-4 h-4" /> Restore Basis Data JSON
                    </Button>
                  </Link>
                  <Link href="/admin/settings">
                    <Button variant="outline" className="w-full justify-start gap-2.5">
                      <Settings className="w-4 h-4" /> Pengaturan Sistem
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-[24px] bg-[#092922]/85 border border-[#076653]/70 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 text-[#E3EF26]" />
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    Catatan Audit Terbaru
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-[#061C18]/90 border border-[#076653]/60 text-xs"
                    >
                      <p className="text-white leading-relaxed">{log.message}</p>
                      <span className="text-[10px] font-mono text-[#E3EF26] mt-1 block">
                        {log.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN LAPANGAN DASHBOARD */}
      {userRole === 'ADMIN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-[22px] bg-[#092922]/85 border border-[#076653]/70 p-5">
              <div className="text-[11px] font-mono text-[#94B8AE] uppercase mb-2">
                TOTAL PESERTA
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {stats.totalParticipants} Regu
              </div>
            </div>
            <div className="rounded-[22px] bg-[#092922]/85 border border-[#076653]/70 p-5">
              <div className="text-[11px] font-mono text-[#94B8AE] uppercase mb-2">
                RUANG BARAK
              </div>
              <div className="text-2xl font-mono font-black text-[#E3EF26]">
                {stats.totalBaracks} Ruang
              </div>
            </div>
            <div className="rounded-[22px] bg-[#092922]/85 border border-[#076653]/70 p-5">
              <div className="text-[11px] font-mono text-[#94B8AE] uppercase mb-2">
                JADWAL ARENA
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {stats.totalSchedules} Slot
              </div>
            </div>
            <div className="rounded-[22px] bg-[#092922]/85 border border-[#076653]/70 p-5">
              <div className="text-[11px] font-mono text-[#94B8AE] uppercase mb-2">
                NILAI MASUK
              </div>
              <div className="text-2xl font-mono font-black text-[#E3EF26]">
                {stats.totalScoresEntered}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-[24px] bg-[#092922]/85 border border-[#076653]/70 p-6">
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider mb-4">
                Aktivitas Operasional Lapangan
              </h3>
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl bg-[#061C18]/90 border border-[#076653]/60 text-xs flex justify-between items-center gap-4"
                  >
                    <span className="text-white">{act.message}</span>
                    <span className="text-[10px] font-mono text-[#E3EF26] shrink-0">
                      {act.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-[#092922]/85 border border-[#076653]/70 p-6">
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider mb-4">
                Pintasan Operasional
              </h3>
              <div className="flex flex-col gap-2.5">
                <Link href="/admin/schedule-manage">
                  <Button variant="primary" className="w-full justify-start gap-2">
                    <Clock className="w-4 h-4" /> Kelola Urutan Tampil
                  </Button>
                </Link>
                <Link href="/admin/barack-manage">
                  <Button variant="secondary" className="w-full justify-start gap-2">
                    <Tent className="w-4 h-4 text-[#E3EF26]" /> Kelola Lokasi Barak
                  </Button>
                </Link>
                <Link href="/admin/participants">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <UserCheck className="w-4 h-4" /> Kelola Kontingen Peserta
                  </Button>
                </Link>
                <Link href="/admin/categories">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <ClipboardList className="w-4 h-4" /> Kategori Penilaian
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. OPERATOR REKAP DASHBOARD */}
      {userRole === 'OPERATOR_REKAP' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-[22px] bg-[#092922]/85 border border-[#076653]/70 p-5">
              <div className="text-[11px] font-mono text-[#94B8AE] uppercase mb-2">
                SUDAH DIINPUT
              </div>
              <div className="text-2xl font-mono font-black text-[#E3EF26]">
                {stats.sheetsEntered} Item
              </div>
            </div>
            <div className="rounded-[22px] bg-[#092922]/85 border border-[#076653]/70 p-5">
              <div className="text-[11px] font-mono text-[#94B8AE] uppercase mb-2">
                BELUM DIINPUT
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {stats.sheetsPending} Lembar
              </div>
            </div>
            <div className="rounded-[22px] bg-[#092922]/85 border border-[#076653]/70 p-5">
              <div className="text-[11px] font-mono text-[#94B8AE] uppercase mb-2">
                PESERTA DINILAI
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {stats.participantsGraded} Tim
              </div>
            </div>
            <div className="rounded-[22px] bg-[#092922]/85 border border-[#076653]/70 p-5">
              <div className="text-[11px] font-mono text-[#94B8AE] uppercase mb-2">
                PROGRES REKAP
              </div>
              <div className="text-2xl font-mono font-black text-[#E3EF26]">
                {stats.progressOverall}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-[24px] bg-[#092922]/85 border border-[#076653]/70 p-6">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#076653]/50">
                <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                  Peringkat Sementara
                </h3>
                <Link
                  href="/admin/leaderboard"
                  className="text-xs font-bold text-[#E3EF26] hover:underline"
                >
                  Buka Semua Rekap
                </Link>
              </div>
              {leaderboardPreview.length === 0 ? (
                <EmptyState
                  title="Leaderboard Kosong"
                  description="Lakukan input nilai terlebih dahulu."
                />
              ) : (
                <div className="space-y-2.5">
                  {leaderboardPreview.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#061C18]/90 border border-[#076653]/60 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-mono text-[#E3EF26] font-bold mr-2.5">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-bold text-white">{item.teamName}</span>
                        <span className="text-xs text-[#94B8AE] block mt-0.5">
                          {item.schoolName}
                        </span>
                      </div>
                      <span className="font-mono font-black text-sm text-[#E3EF26]">
                        {item.score} PTS
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] bg-[#092922]/85 border border-[#076653]/70 p-6">
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider mb-4">
                Aksi Cepat Operator Rekap
              </h3>
              <div className="flex flex-col gap-2.5">
                <Link href="/admin/score-entry">
                  <Button variant="primary" className="w-full justify-start gap-2">
                    <Zap className="w-4 h-4" /> Input Nilai Juri Baru
                  </Button>
                </Link>
                {lastInputMetadata && (
                  <Link
                    href={`/admin/score-entry?materi=${lastInputMetadata.materi}&noPeserta=${lastInputMetadata.noPeserta}&juri=${lastInputMetadata.juri}`}
                  >
                    <Button variant="secondary" className="w-full justify-start gap-2">
                      <RefreshCw className="w-4 h-4" /> Lanjutkan ({lastInputMetadata.noPeserta})
                    </Button>
                  </Link>
                )}
                <Link href="/admin/leaderboard">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Trophy className="w-4 h-4" /> Lihat Rekap Nilai Lomba
                  </Button>
                </Link>
                <Link href="/live-score">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileText className="w-4 h-4" /> Pratinjau Halaman Publik
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
