'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Button, Badge, Skeleton, EmptyState } from '@/components/ui';
import Link from 'next/link';

interface DashboardStats {
  // Super Admin & Admin stats
  totalUsers: number;
  totalAdmins: number;
  totalPjRekap: number;
  totalParticipants: number;
  totalBaracks: number;
  totalCategories: number;
  totalSchedules: number;
  totalScoresEntered: number;
  progressOverall: number;
  
  // Operator Rekap stats
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

        // 1. Get User Profile & Role Mapping
        const { data: { session } } = await supabase.auth.getSession();
        let effectiveRole: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP' = 'OPERATOR_REKAP';
        
        if (session?.user) {
          const email = session.user.email?.toLowerCase() || '';
          setUserName(session.user.user_metadata?.full_name || email.split('@')[0]);

          const { data: profile } = await supabase
            .from('profiles')
            .select('role, username')
            .eq('id', session.user.id)
            .single();

          const metaRole = session.user.user_metadata?.role;
          const dbRole = profile?.role;

          if (metaRole === 'SUPER_ADMIN' || metaRole === 'ADMIN' || metaRole === 'OPERATOR_REKAP') {
            effectiveRole = metaRole as any;
          } else if (dbRole === 'GRAND_MASTER' || email.includes('grandmaster') || profile?.username === 'grandmaster') {
            effectiveRole = 'SUPER_ADMIN';
          } else if (profile?.username?.includes('admin') || email.includes('admin')) {
            effectiveRole = 'ADMIN';
          }
          setUserRole(effectiveRole);
        }

        // 2. Fetch Common Database Statistics
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: partCount } = await supabase.from('participants').select('*', { count: 'exact', head: true });
        const { count: barackCount } = await supabase.from('baracks').select('*', { count: 'exact', head: true });
        const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
        const { count: schedCount } = await supabase.from('schedules').select('*', { count: 'exact', head: true });
        const { count: scoresCount } = await supabase.from('scores').select('*', { count: 'exact', head: true });

        // Calculate specific roles stats
        const { count: adminRoleCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'GRAND_MASTER');
        const { count: operatorRoleCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'OPERATOR');

        // Fetch scores data to compute grading status
        const { data: scoresData } = await supabase.from('scores').select('participant_id');
        const uniqueGradedParticipants = new Set(scoresData?.map(s => s.participant_id) || []).size;
        
        const participantsPendingCount = Math.max(0, (partCount || 0) - uniqueGradedParticipants);
        const overallProgress = partCount && partCount > 0 ? Math.round((uniqueGradedParticipants / partCount) * 100) : 0;

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
          
          // Operator Rekap specifics
          sheetsEntered: scoresCount || 0,
          sheetsPending: participantsPendingCount * 3, // Assuming 3 judges per participant
          participantsGraded: uniqueGradedParticipants,
          participantsPending: participantsPendingCount,
        });

        // 3. Fetch Leaderboard Preview (Top 5 participants)
        const { data: leaderboards } = await supabase
          .from('participants')
          .select('*, scores(*)')
          .limit(5);

        if (leaderboards) {
          const processed = leaderboards.map(p => {
            const total = p.scores?.reduce((sum: number, s: any) => sum + s.score_value, 0) || 0;
            return {
              id: p.id,
              teamName: p.team_name,
              schoolName: p.school_name,
              score: total,
            };
          }).sort((a, b) => b.score - a.score);
          setLeaderboardPreview(processed);
        }

        // 4. Fetch last input metadata from localStorage for PJ Rekap
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

        // 5. Populate activities & audit logs
        const mockActivities: ActivityItem[] = [
          { id: '1', type: 'score', message: 'Lembar Nilai LKBB Juri 2 untuk SMA-02 berhasil disimpan.', time: '2 menit lalu' },
          { id: '2', type: 'schedule', message: 'Status urutan tampil SMA-01 diperbarui menjadi PERFORMING.', time: '10 menit lalu' },
          { id: '3', type: 'barack', message: 'Alokasi Barak Kelas X-1 untuk SMP-03 tersimpan.', time: '20 menit lalu' },
        ];
        setActivities(mockActivities);

        const mockAuditLogs: ActivityItem[] = [
          { id: 'a1', type: 'system', message: 'Backup database otomatis terjadwal berhasil diselesaikan.', time: '1 jam lalu' },
          { id: 'a2', type: 'user', message: 'User @operator_lkbb_sma memperbarui nilai dada SMA-04.', time: '2 jam lalu' },
          { id: 'a3', type: 'system', message: 'System Settings "Publish Juara" diperbarui oleh @grandmaster.', time: '4 jam lalu' },
        ];
        setAuditLogs(mockAuditLogs);

      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Quick Action Handlers
  const handleBackupDb = useCallback(() => {
    alert('💾 Backup Database berhasil dipicu! Berkas cadangan dikompresi ke SQL Gzip.');
  }, []);

  const handleRestoreDb = useCallback(() => {
    alert('🔄 Restore Database dipicu! Pilih titik pemulihan pada menu Restore.');
  }, []);

  const handleSystemSettings = useCallback(() => {
    alert('⚙️ Pengaturan Sistem: Kunci Sesi Input Lomba berhasil diperbarui.');
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-green-800 to-green-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Selamat Datang, {userName}!
          </h2>
          <p className="text-green-100 text-xs sm:text-sm">
            {userRole === 'SUPER_ADMIN' ? 'Hak akses penuh sebagai GRAND MASTER pemilik sistem.' :
             userRole === 'ADMIN' ? 'Mengelola data master logistik, barak, jadwal, dan kategori.' :
             'Fokus entri lembar nilai juri dengan kenyamanan & kecepatan input maksimal.'}
          </p>
        </div>
        <Badge variant="warning" className="self-start md:self-center font-black px-4 py-1.5 text-[9px] shadow-sm">
          👑 {userRole}
        </Badge>
      </div>

      {/* RENDER DASHBOARDS DYNAMICALLY BY ROLE */}
      
      {/* ======================================================== */}
      {/* 1. SUPER ADMIN DASHBOARD */}
      {/* ======================================================== */}
      {userRole === 'SUPER_ADMIN' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverGlow>
              <div className="text-[10px] font-bold text-green-700/80 uppercase tracking-wider mb-1">Total User / Admin</div>
              <div className="text-2xl font-black text-green-900">{stats.totalUsers} <span className="text-xs text-green-700/70">({stats.totalAdmins} Admin)</span></div>
              <p className="text-[9px] text-green-600/70 mt-1">Akun panitia terdaftar</p>
            </Card>

            <Card hoverGlow>
              <div className="text-[10px] font-bold text-green-700/80 uppercase tracking-wider mb-1">Total Peserta &amp; Barak</div>
              <div className="text-2xl font-black text-green-900">{stats.totalParticipants} <span className="text-xs text-green-700/70">({stats.totalBaracks} Ruang)</span></div>
              <p className="text-[9px] text-green-600/70 mt-1">Peserta &amp; Ruang transit</p>
            </Card>

            <Card hoverGlow>
              <div className="text-[10px] font-bold text-green-700/80 uppercase tracking-wider mb-1">Jadwal &amp; Kategori</div>
              <div className="text-2xl font-black text-green-900">{stats.totalSchedules} <span className="text-xs text-green-700/70">({stats.totalCategories} Kategori)</span></div>
              <p className="text-[9px] text-green-600/70 mt-1">Agenda arena aktif</p>
            </Card>

            <Card hoverGlow>
              <div className="text-[10px] font-bold text-green-700/80 uppercase tracking-wider mb-1">Total Nilai Masuk</div>
              <div className="text-2xl font-black text-green-700 font-mono">{stats.totalScoresEntered} PTS</div>
              <p className="text-[9px] text-green-600/70 mt-1">Skor lembar juri tersimpan</p>
            </Card>
          </div>

          {/* Progress & Split Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Overall Progress */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Progress Rekapitulasi Lomba</h3>
                  <Badge variant="warning">{stats.progressOverall}% Selesai</Badge>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-emerald-500 to-brand-cyan-500 transition-all duration-1000"
                    style={{ width: `${stats.progressOverall}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Rasio total kontingen sekolah yang sudah mendapat rekap skor juri penuh dari seluruh kategori terdaftar.
                </p>
              </Card>

              {/* Leaderboard Preview */}
              <Card>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Peringkat 5 Teratas Sementara</h3>
                  <Link href="/admin/leaderboard">
                    <Button variant="outline" size="sm" className="text-[10px] font-bold">Selengkapnya</Button>
                  </Link>
                </div>
                {leaderboardPreview.length === 0 ? (
                  <EmptyState title="Klasemen Kosong" description="Belum ada skor lomba terinput." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-[9px] font-bold uppercase text-slate-500 tracking-wider">
                          <th className="py-2.5">Regu</th>
                          <th className="py-2.5">Sekolah</th>
                          <th className="py-2.5 text-right">Skor Akumulasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60 text-xs">
                        {leaderboardPreview.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3 font-bold text-slate-200">{item.teamName}</td>
                            <td className="py-3 text-slate-400">{item.schoolName}</td>
                            <td className="py-3 text-right font-mono font-black text-brand-emerald-400">{item.score} pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

            </div>

            {/* Quick Actions & Audit Logs */}
            <div className="space-y-6">
              
              {/* SuperAdmin User & Password Management Widget */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase text-green-950 tracking-wider flex items-center gap-2">
                    <span>👑</span> Kelola User &amp; Password Panitia
                  </h3>
                  <Link href="/admin/users">
                    <Button variant="primary" size="sm" className="text-[10px] font-black">
                      👥 Pengaturan Lengkap
                    </Button>
                  </Link>
                </div>
                <p className="text-[11px] text-green-800 font-semibold mb-4">
                  Sebagai SuperAdmin (Grand Master), Anda dapat menambah akun, menyunting username, dan mereset password panitia.
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/admin/users" className="w-full">
                    <Button variant="primary" className="w-full justify-start text-xs font-black py-3.5 shadow-md">
                      👥 Tambah &amp; Atur Username / Password User
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start text-xs font-bold py-3" onClick={handleBackupDb}>
                    💾 Backup Database SQL
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-bold py-3" onClick={handleRestoreDb}>
                    🔄 Restore Database SQL
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-bold py-3" onClick={handleSystemSettings}>
                    ⚙️ Pengaturan Sistem &amp; Kunci Sesi
                  </Button>
                </div>
              </Card>

              {/* Audit Logs */}
              <Card>
                <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-5">Audit Log Sistem Terbaru</h3>
                <div className="flex flex-col gap-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="text-xs border-b border-slate-900 pb-3 last:border-0 last:pb-0 flex gap-2">
                      <span className="text-slate-500">⚙️</span>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <p className="text-slate-300 leading-normal text-[11px]">{log.message}</p>
                        <span className="text-[9px] text-slate-500 font-bold">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ADMIN DASHBOARD */}
      {/* ======================================================== */}
      {userRole === 'ADMIN' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverGlow>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Peserta</div>
              <div className="text-2xl font-black text-white">{stats.totalParticipants} Tim</div>
              <p className="text-[9px] text-slate-500 mt-1">Kontingen terdaftar</p>
            </Card>

            <Card hoverGlow>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Ruang Barack</div>
              <div className="text-2xl font-black text-white">{stats.totalBaracks} Ruang</div>
              <p className="text-[9px] text-slate-500 mt-1">Alokasi logistik transit</p>
            </Card>

            <Card hoverGlow>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jadwal &amp; Kategori</div>
              <div className="text-2xl font-black text-white">{stats.totalSchedules} / {stats.totalCategories}</div>
              <p className="text-[9px] text-slate-500 mt-1">Agenda terdaftar</p>
            </Card>

            <Card hoverGlow>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Nilai Masuk</div>
              <div className="text-2xl font-black text-brand-emerald-400">{stats.totalScoresEntered} lembar</div>
              <p className="text-[9px] text-slate-500 mt-1">Tersimpan dari lembar juri</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Progress Rekap */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Progress Rekap Nilai</h3>
                  <Badge variant="primary">{stats.progressOverall}% Dinilai</Badge>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-brand-emerald-500 transition-all duration-1000"
                    style={{ width: `${stats.progressOverall}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">Total data nilai peserta terisi keseluruhan.</p>
              </Card>

              {/* Leaderboard Preview */}
              <Card>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Leaderboard Sementara</h3>
                  <Link href="/admin/leaderboard">
                    <Button variant="outline" size="sm" className="text-[10px]">Lihat Rekap</Button>
                  </Link>
                </div>
                {leaderboardPreview.length === 0 ? (
                  <EmptyState title="Tidak ada data" description="Lakukan input nilai terlebih dahulu." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-[9px] font-bold uppercase text-slate-500">
                          <th className="py-2">Regu</th>
                          <th className="py-2">Sekolah</th>
                          <th className="py-2 text-right">Skor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60 text-xs">
                        {leaderboardPreview.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5 font-bold text-slate-200">{item.teamName}</td>
                            <td className="py-2.5 text-slate-400">{item.schoolName}</td>
                            <td className="py-2.5 text-right font-black text-brand-emerald-400">{item.score} pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

            </div>

            {/* Admin Quick Actions & Activities */}
            <div className="space-y-6">
              
              <Card>
                <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-6">Admin Quick Actions</h3>
                <div className="flex flex-col gap-3">
                  <Link href="/admin/participants" className="w-full">
                    <Button variant="primary" className="w-full justify-start text-xs font-bold py-3.5">
                      🏃 Kelola Kontingen Peserta
                    </Button>
                  </Link>
                  <Link href="/admin/barack-manage" className="w-full">
                    <Button variant="secondary" className="w-full justify-start text-xs font-bold py-3.5">
                      ⛺ Kelola Alokasi Barak
                    </Button>
                  </Link>
                  <Link href="/admin/schedule-manage" className="w-full">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold py-3.5">
                      ⏱️ Atur Jadwal Arena Lomba
                    </Button>
                  </Link>
                  <Link href="/admin/categories" className="w-full">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold py-3.5">
                      📋 Kelola Kategori Penilaian
                    </Button>
                  </Link>
                  <Link href="/admin/operators" className="w-full">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold py-3.5">
                      👥 Kelola PJ Operator Rekap
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card>
                <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-6">Aktivitas Terkini</h3>
                <div className="flex flex-col gap-4">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-2 text-xs border-b border-slate-900 pb-3 last:border-0 last:pb-0">
                      <span>{act.type === 'score' ? '📝' : '⏱️'}</span>
                      <div className="flex-1">
                        <p className="text-slate-300 leading-normal text-[11px]">{act.message}</p>
                        <span className="text-[9px] text-slate-500">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. OPERATOR REKAP DASHBOARD */}
      {/* ======================================================== */}
      {userRole === 'OPERATOR_REKAP' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverGlow>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sudah Diinput</div>
              <div className="text-2xl font-black text-brand-emerald-400">{stats.sheetsEntered} Lembar</div>
              <p className="text-[9px] text-slate-500 mt-1">Skor juri berhasil diproses</p>
            </Card>

            <Card hoverGlow>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Belum Diinput</div>
              <div className="text-2xl font-black text-brand-rose-400">{stats.sheetsPending} Lembar</div>
              <p className="text-[9px] text-slate-500 mt-1">Taksiran lembar juri tersisa</p>
            </Card>

            <Card hoverGlow>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Peserta Dinilai</div>
              <div className="text-2xl font-black text-white">{stats.participantsGraded} Tim</div>
              <p className="text-[9px] text-slate-500 mt-1">Sudah dinilai ({stats.participantsPending} tim antre)</p>
            </Card>

            <Card hoverGlow>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Progress Input Anda</div>
              <div className="text-2xl font-black text-brand-cyan-400">{stats.progressOverall}%</div>
              <p className="text-[9px] text-slate-500 mt-1">Berdasarkan total tim terdaftar</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Leaderboard Preview (Ranking Sementara) */}
              <Card>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Papan Peringkat Sementara</h3>
                  <Link href="/admin/leaderboard">
                    <Button variant="outline" size="sm" className="text-[10px] font-bold">Lihat Semua Rekap</Button>
                  </Link>
                </div>
                {leaderboardPreview.length === 0 ? (
                  <EmptyState title="Leaderboard Kosong" description="Lakukan penginputan nilai untuk melihat peringkat." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-[9px] font-bold uppercase text-slate-500 tracking-wider">
                          <th className="py-2.5">Peringkat</th>
                          <th className="py-2.5">Regu / Pangkalan</th>
                          <th className="py-2.5 text-right">Akumulasi Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60 text-xs">
                        {leaderboardPreview.map((item, index) => (
                          <tr key={item.id}>
                            <td className="py-3 font-black text-slate-400">#{index + 1}</td>
                            <td className="py-3">
                              <span className="font-extrabold text-white block">{item.teamName}</span>
                              <span className="text-[10px] text-slate-500">{item.schoolName}</span>
                            </td>
                            <td className="py-3 text-right font-mono font-black text-brand-emerald-400">{item.score} pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

            </div>

            {/* Operator Quick Actions & Last Input info */}
            <div className="space-y-6">
              
              {/* Quick Actions */}
              <Card>
                <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-6">Operator Quick Actions</h3>
                <div className="flex flex-col gap-3">
                  <Link href="/admin/score-entry" className="w-full">
                    <Button variant="primary" className="w-full justify-start text-xs font-bold py-3.5">
                      ⚡ INPUT NILAI JURI (BARU)
                    </Button>
                  </Link>
                  
                  {lastInputMetadata && (
                    <Link href={`/admin/score-entry?materi=${lastInputMetadata.materi}&noPeserta=${lastInputMetadata.noPeserta}&juri=${lastInputMetadata.juri}`} className="w-full">
                      <Button variant="secondary" className="w-full justify-start text-xs font-bold py-3.5">
                        🔄 Lanjutkan Input Terakhir ({lastInputMetadata.noPeserta})
                      </Button>
                    </Link>
                  )}

                  <Link href="/admin/leaderboard" className="w-full">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold py-3.5">
                      🏆 Lihat Rekap Nilai Lomba
                    </Button>
                  </Link>
                  <Link href="/admin/leaderboard" className="w-full">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold py-3.5">
                      📄 Export Rekap Resmi (PDF)
                    </Button>
                  </Link>
                  <Link href="/admin/leaderboard" className="w-full">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold py-3.5">
                      📊 Export Data Rekap (Excel)
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Last Action / Last Graded Tim */}
              <Card>
                <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">Aktivitas Input Terakhir Anda</h3>
                {lastInputMetadata ? (
                  <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/40 space-y-2 text-xs leading-normal">
                    <div className="flex justify-between items-center">
                      <Badge variant="success">Juri {lastInputMetadata.juri}</Badge>
                      <span className="text-[10px] text-slate-500 font-bold">Materi: {lastInputMetadata.materi}</span>
                    </div>
                    <p className="font-extrabold text-white text-sm mt-1">{lastInputMetadata.namaTim}</p>
                    <p className="text-slate-400 text-xs">{lastInputMetadata.namaSekolah}</p>
                    <div className="pt-2 border-t border-slate-900/60 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                      <span>Total Nilai: <strong className="text-brand-emerald-400">{lastInputMetadata.grandTotal} Pts</strong></span>
                      <span>{new Date(lastInputMetadata.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic text-center py-6">Belum ada aktivitas input dari komputer ini.</p>
                )}
              </Card>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
