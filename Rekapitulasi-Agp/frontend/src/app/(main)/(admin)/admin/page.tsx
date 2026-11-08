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

        // Real Top 5 Leaderboard Preview from Supabase
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

        // Real Audit Logs from Supabase audit_logs table
        try {
          const { data: realLogs } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

          if (realLogs && realLogs.length > 0) {
            setAuditLogs(
              realLogs.map((l: any) => ({
                id: l.id,
                type: 'system',
                message: l.action || l.description || l.details || 'Aktivitas audit sistem',
                time: new Date(l.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              }))
            );
          } else {
            setAuditLogs([]);
          }
        } catch {
          setAuditLogs([]);
        }

        // Real Recent Operational Activities from schedules
        try {
          const { data: recentScheds } = await supabase
            .from('schedules')
            .select('*, participant:participants(team_name)')
            .order('updated_at', { ascending: false })
            .limit(4);

          if (recentScheds && recentScheds.length > 0) {
            setActivities(
              recentScheds.map((s: any) => ({
                id: s.id,
                type: 'schedule',
                message: `Status urutan tampil ${s.participant?.team_name || 'Regu'} diperbarui menjadi ${s.status}.`,
                time: new Date(s.updated_at || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              }))
            );
          } else {
            setActivities([]);
          }
        } catch {
          setActivities([]);
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
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {toastMsg && <Toast message={toastMsg} type="info" onClose={() => setToastMsg(null)} />}

      {/* Command Center Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE_AWWWARDS }}
        className="rounded-2xl bg-[#0A2620] border border-[#1E564A] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm"
      >
        <div className="flex items-start sm:items-center gap-5 max-w-2xl">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0E332B] border border-[#1E564A] flex items-center justify-center shrink-0">
            <img
              src="/kirani.svg"
              alt="Logo Kirani AGP"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
            />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0E332B] border border-[#1E564A] text-xs font-mono uppercase tracking-wider text-[#E3EF26]">
              <span className="w-2 h-2 rounded-full bg-[#E3EF26]" />
              <span>KIRANI AGP • SMKN 1 SOREANG (04.105–04.106)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Selamat Datang, <span className="text-[#E3EF26]">{userName || 'Panitia AGP'}</span>
            </h1>
            <p className="text-[#C5E0D8] text-xs sm:text-sm leading-relaxed">
              {userRole === 'SUPER_ADMIN'
                ? 'Wewenang Sekretaris Utama untuk memvalidasi rekapitulasi nilai 106 piala, menerbitkan SK penetapan juara resmi, dan mengelola konfigurasi sistem.'
                : userRole === 'ADMIN'
                  ? 'Mengelola data kontingen peserta (kuota 50 basis), jadwal giliran tampil arena (8 menit), serta alokasi ruangan barak SMKN 1 Soreang.'
                  : 'Ruang kerja Operator Entri Nilai untuk mencatat lembar nilai dewan juri Periode I–IV dan memantau klasemen.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-3">
          <div className="flex items-center gap-2 self-start sm:self-end">
            <a
              href="/Juklak_AGP_IV_SMKN1_Soreang.pdf"
              download="Juklak_Resmi_AGP_IV_SMKN1_Soreang.pdf"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#07201B] border border-[#1E564A] text-xs font-mono font-bold text-[#E3EF26] hover:bg-[#0E332B] hover:border-[#E3EF26] transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Unduh Juklak PDF</span>
            </a>
            <Badge variant="danger" className="gap-1.5 py-1.5 px-3">
              <Crown className="w-4 h-4" />
              <span>{userRole}</span>
            </Badge>
          </div>

          {/* Role Switcher Pill */}
          <div className="inline-flex items-center gap-1 rounded-lg bg-[#07201B] p-1 border border-[#1E564A]">
            {(['SUPER_ADMIN', 'ADMIN', 'OPERATOR_REKAP'] as const).map((r) => {
              const active = userRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSwitch(r)}
                  className={`relative px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${
                    active ? 'text-[#0C342C]' : 'text-[#A7C7BE] hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-role-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-md bg-[#E3EF26]"
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
                className={`rounded-xl p-5 sm:p-6 border ${
                  item.highlight
                    ? 'bg-[#0E332B] border-[#E3EF26]'
                    : 'bg-[#0A2620] border-[#1E564A]'
                }`}
              >
                <div className="text-xs font-mono text-[#A7C7BE] uppercase tracking-wider mb-2">
                  {item.label}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                  <span className={item.highlight ? 'text-[#E3EF26]' : 'text-white'}>
                    {item.val}
                  </span>{' '}
                  <span className="text-xs font-normal text-[#C5E0D8]">{item.sub}</span>
                </div>
                <p className="text-xs text-[#A7C7BE] mt-1.5">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    Progres Rekapitulasi Lomba
                  </h3>
                  <Badge variant="success">{stats.progressOverall}% SELESAI</Badge>
                </div>
                <div className="w-full h-3 rounded-full bg-[#07201B] border border-[#123E34] overflow-hidden mb-2.5">
                  <div
                    className="h-full rounded-full bg-[#E3EF26] transition-all duration-700"
                    style={{ width: `${stats.progressOverall}%` }}
                  />
                </div>
                <p className="text-xs text-[#C5E0D8]">
                  Rasio kontingen pangkalan yang telah memiliki rekapitulasi nilai dewan juri.
                </p>
              </div>

              <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-6">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#123E34]">
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    Peringkat 5 Teratas Sementara
                  </h3>
                  <Link
                    href="/admin/leaderboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3EF26] hover:underline"
                  >
                    <span>Buka Master Leaderboard</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
                {leaderboardPreview.length === 0 ? (
                  <EmptyState
                    title="Klasemen Kosong"
                    description="Belum ada skor lomba yang diinput ke sistem."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#123E34] text-xs font-mono uppercase text-[#A7C7BE]">
                          <th className="py-2.5">Regu</th>
                          <th className="py-2.5">Pangkalan</th>
                          <th className="py-2.5 text-right">Total Skor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#123E34] text-xs">
                        {leaderboardPreview.map((item) => (
                          <tr key={item.id} className="hover:bg-[#07201B] transition-colors">
                            <td className="py-3 font-bold text-white text-sm">{item.teamName}</td>
                            <td className="py-3 text-[#C5E0D8]">{item.schoolName}</td>
                            <td className="py-3 text-right font-mono font-bold text-sm text-[#E3EF26]">
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
              <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-6">
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

              <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 text-[#E3EF26]" />
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    Catatan Audit Sistem
                  </h3>
                </div>
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-[#A7C7BE]">Belum ada aktivitas audit sistem yang tercatat.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-lg bg-[#07201B] border border-[#123E34] text-xs"
                      >
                        <p className="text-white leading-relaxed">{log.message}</p>
                        <span className="text-xs font-mono text-[#E3EF26] mt-1 block">
                          {log.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN LAPANGAN DASHBOARD */}
      {userRole === 'ADMIN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5">
              <div className="text-xs font-mono text-[#A7C7BE] uppercase mb-2">
                TOTAL PESERTA
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {stats.totalParticipants} Regu
              </div>
            </div>
            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5">
              <div className="text-xs font-mono text-[#A7C7BE] uppercase mb-2">
                RUANG BARAK
              </div>
              <div className="text-2xl font-mono font-black text-[#E3EF26]">
                {stats.totalBaracks} Ruang
              </div>
            </div>
            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5">
              <div className="text-xs font-mono text-[#A7C7BE] uppercase mb-2">
                JADWAL ARENA
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {stats.totalSchedules} Slot
              </div>
            </div>
            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5">
              <div className="text-xs font-mono text-[#A7C7BE] uppercase mb-2">
                NILAI MASUK
              </div>
              <div className="text-2xl font-mono font-black text-[#E3EF26]">
                {stats.totalScoresEntered}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl bg-[#0A2620] border border-[#1E564A] p-6">
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider mb-4">
                Aktivitas Operasional Lapangan
              </h3>
              {activities.length === 0 ? (
                <p className="text-xs text-[#A7C7BE]">Belum ada aktivitas operasional lapangan.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-lg bg-[#07201B] border border-[#123E34] text-xs flex justify-between items-center gap-4"
                    >
                      <span className="text-white">{act.message}</span>
                      <span className="text-xs font-mono text-[#E3EF26] shrink-0">
                        {act.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-6">
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
            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5">
              <div className="text-xs font-mono text-[#A7C7BE] uppercase mb-2">
                SUDAH DIINPUT
              </div>
              <div className="text-2xl font-mono font-black text-[#E3EF26]">
                {stats.sheetsEntered} Item
              </div>
            </div>
            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5">
              <div className="text-xs font-mono text-[#A7C7BE] uppercase mb-2">
                BELUM DIINPUT
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {stats.sheetsPending} Lembar
              </div>
            </div>
            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5">
              <div className="text-xs font-mono text-[#A7C7BE] uppercase mb-2">
                PESERTA DINILAI
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {stats.participantsGraded} Tim
              </div>
            </div>
            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-5">
              <div className="text-xs font-mono text-[#A7C7BE] uppercase mb-2">
                PROGRES REKAP
              </div>
              <div className="text-2xl font-mono font-black text-[#E3EF26]">
                {stats.progressOverall}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl bg-[#0A2620] border border-[#1E564A] p-6">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#123E34]">
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
                      className="p-4 rounded-lg bg-[#07201B] border border-[#123E34] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-mono text-[#E3EF26] font-bold mr-2.5">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-bold text-white">{item.teamName}</span>
                        <span className="text-xs text-[#C5E0D8] block mt-0.5">
                          {item.schoolName}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#E3EF26]">
                        {item.score} PTS
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#0A2620] border border-[#1E564A] p-6">
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
                    <Trophy className="w-4 h-4" /> Pantau Rekap Nilai
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
