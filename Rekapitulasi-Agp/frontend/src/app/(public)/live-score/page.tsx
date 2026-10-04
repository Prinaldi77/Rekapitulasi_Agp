'use client';

import React, { useState, useEffect } from 'react';
import { generateSkPdf } from '@/lib/pdf';
import { SchoolLevel } from '@/lib/dynamicStore';
import { fetchLeaderboardFromApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Card, Button, Badge, Skeleton, EmptyState } from '@/components/ui';
import Link from 'next/link';

interface WinnerItem {
  rank: number;
  noTampil: string;
  teamName: string;
  schoolName: string;
  totalScore: number;
  badgeTitle: string;
  badgeBg: string;
  jenjang: SchoolLevel;
}

interface FeedItem {
  id: string;
  message: string;
  time: string;
  type: 'performing' | 'completed' | 'standby';
}

export default function WinnerAnnouncementPage() {
  const [user, setUser] = useState<any>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedJenjang, setSelectedJenjang] = useState<SchoolLevel>('SMA');
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Activity Feed State
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [recentScores, setRecentScores] = useState<any[]>([]);

  // Check user session for admin preview
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        let currentUser = session?.user ?? null;

        if (!currentUser && typeof window !== 'undefined') {
          const savedDevUser = localStorage.getItem('agp_dev_user');
          if (savedDevUser) {
            try {
              currentUser = JSON.parse(savedDevUser);
            } catch {
              currentUser = null;
            }
          }
        }
        setUser(currentUser);
      } catch (err) {
        console.warn('Live score getSession notice:', err);
      }
    };
    getSession();
  }, []);

  const fetchWinnersAndFeed = async () => {
    try {
      const { data: cat } = await supabase
        .from('categories')
        .select('id, is_published')
        .eq('level', selectedJenjang)
        .limit(1)
        .maybeSingle();

      if (cat) {
        setIsPublished(cat.is_published);
        
        const result = await fetchLeaderboardFromApi(cat.id);
        if (result.success && result.data) {
          const mapped: WinnerItem[] = result.data.map((item: any) => ({
            rank: item.rank,
            noTampil: item.participantNo,
            teamName: item.teamName,
            schoolName: item.schoolName,
            totalScore: item.grandTotal,
            badgeTitle: item.rank === 1 ? '🏆 JUARA 1 (EMAS)' : item.rank === 2 ? '🥈 JUARA 2 (PERAK)' : '🥉 JUARA 3 (PERUNGGU)',
            badgeBg: item.rank === 1 ? 'bg-amber-500 text-white font-black' : item.rank === 2 ? 'bg-slate-300 text-slate-900 font-black' : 'bg-amber-700 text-white font-black',
            jenjang: selectedJenjang,
          }));
          setWinners(mapped);
        } else {
          setWinners([]);
        }
      }

      // Fetch live schedule status updates for Activity Feed
      const { data: scheds } = await supabase
        .from('schedules')
        .select('*, participant:participants(*)')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (scheds) {
        const mappedFeed: FeedItem[] = scheds.map((s: any) => {
          let msg = '';
          let type: FeedItem['type'] = 'standby';

          if (s.status === 'NOW PERFORMING' || s.status === 'PERFORMING') {
            msg = `🔥 Regu ${s.participant?.team_name || 'Peserta'} sedang tampil LIVE di arena.`;
            type = 'performing';
          } else if (s.status === 'COMPLETED') {
            msg = `✅ Regu ${s.participant?.team_name || 'Peserta'} telah selesai tampil.`;
            type = 'completed';
          } else {
            msg = `⏳ Regu ${s.participant?.team_name || 'Peserta'} bersiap (STANDBY) di gerbang masuk.`;
            type = 'standby';
          }

          return {
            id: s.id,
            message: msg,
            time: 'Baru saja',
            type
          };
        });
        setFeed(mappedFeed);

        // Fetch recent scores inputted (for admin)
        const { data: scoresData } = await supabase
          .from('scores')
          .select('*, participant:participants(*)')
          .order('created_at', { ascending: false })
          .limit(4);

        if (scoresData) {
          setRecentScores(scoresData);
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinnersAndFeed();

    const interval = setInterval(() => {
      fetchWinnersAndFeed();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedJenjang]);

  const currentWinners = winners;
  const categoryTitle = `LKBB UTAMA AGP 2026 (JENJANG ${selectedJenjang})`;

  const handleDownloadPdf = () => {
    generateSkPdf(categoryTitle, currentWinners);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Bar */}
      <div className="pb-6 border-b border-green-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600"></span>
            </span>
            <Badge variant="primary" className="font-extrabold text-[9px] uppercase tracking-wider">
              REALTIME LIVE SCOREBOARD
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">
            Papan Skor Live Arena
          </h1>
          <p className="text-xs sm:text-sm text-green-700/70 font-medium">
            Daftar pemenang resmi terverifikasi dan akumulasi skor live kompetisi AGP 2026.
          </p>
        </div>

        {/* Lock Status & Download PDF */}
        <div className="flex items-center gap-3">
          <span className={`px-3.5 py-2 rounded-xl text-xs font-black border flex items-center gap-2 ${
            isPublished 
              ? 'bg-green-100 text-green-800 border-green-300' 
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}>
            <span>{isPublished ? '🔓 PUBLISHED' : '🔒 RAHASIA / LOCKED'}</span>
          </span>

          {isPublished && (
            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              size="sm"
              className="text-xs font-bold"
              disabled={currentWinners.length === 0}
            >
              📄 Download SK PDF
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Filter Category Jenjang SD, SMP, SMA */}
      <div className="flex items-center gap-2 overflow-x-auto touch-pan-x pb-1">
        <Button
          variant={selectedJenjang === 'SD' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSelectedJenjang('SD')}
          className="text-xs font-black whitespace-nowrap shrink-0"
        >
          🎒 Jenjang SD / MI
        </Button>
        <Button
          variant={selectedJenjang === 'SMP' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSelectedJenjang('SMP')}
          className="text-xs font-black whitespace-nowrap shrink-0"
        >
          🏫 Jenjang SMP / MTs
        </Button>
        <Button
          variant={selectedJenjang === 'SMA' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSelectedJenjang('SMA')}
          className="text-xs font-black whitespace-nowrap shrink-0"
        >
          🏛️ Jenjang SMA / SMK
        </Button>
      </div>

      {/* 🔒 IF PUBLIC USER AND NOT PUBLISHED YET: SHOW OFFICIAL SEALED LOCK SCREEN */}
      {!isPublished && !user ? (
        <Card className="p-8 sm:p-14 text-center max-w-3xl mx-auto space-y-6 border-amber-300 bg-gradient-to-b from-amber-50/60 to-white shadow-xl">
          <div className="w-20 h-20 rounded-full bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center text-4xl mx-auto shadow-sm animate-pulse">
            🔒
          </div>
          <div className="space-y-3">
            <Badge variant="warning" className="font-black text-[10px] uppercase tracking-wider py-1 px-3">
              REKAPITULASI PENILAIAN RAHASIA
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-green-950">
              Papan Skor &amp; SK Juara Masih Dikunci
            </h2>
            <p className="text-xs sm:text-sm text-green-800 font-semibold leading-relaxed max-w-lg mx-auto">
              Seluruh akumulasi nilai juri dan perolehan juara 1, 2, 3 Kirani AGP 2026 saat ini dalam proses rekapitulasi rahasia oleh Dewan Juri &amp; Panitia Pengawas.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-amber-200 text-left text-xs font-semibold text-green-950 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
              <span>📣 Hype Pengumuman Juara Resmi:</span>
            </div>
            <p className="text-green-800 leading-relaxed">
              Klasemen Papan Skor Live, Peringkat Juara Resmi, dan Dokumen PDF SK Penetapan Juara akan dibuka serentak oleh Grand Master saat <strong>Acara Pengumuman Pemenang di Panggung Utama</strong>.
            </p>
          </div>

          <div className="pt-2 text-[11px] font-bold text-amber-800">
            ⏳ Silakan tunggu pengumuman dari pembawa acara di arena utama.
          </div>
        </Card>
      ) : (
        /* UNLOCKED FOR PUBLIC OR ADMIN PREVIEW MODE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Admin Preview Warning Banner */}
          {!isPublished && user && (
            <div className="lg:col-span-3 p-4 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span>👁️</span>
                <span><strong>MODE PRATINJAU PANITIA (LOCKED):</strong> Papan skor ini sedang tersembunyi dari Publik Penonton sampai Grand Master membuka publikasi.</span>
              </div>
              <Link href="/admin/leaderboard">
                <Button variant="primary" size="sm" className="text-xs font-black">
                  ⚙️ Buka Publikasi Juara di Admin
                </Button>
              </Link>
            </div>
          )}

          {/* Left Side: Standings Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="border-b border-green-100 pb-4 mb-4 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase text-green-950 tracking-wider">
                  {isPublished ? '🏆 Papan Klasemen Akhir Juara' : '📈 Klasemen Sementara (Pratinjau Panitia)'}
                </h3>
                <Badge variant={isPublished ? 'success' : 'warning'} className="text-[8px] uppercase">
                  {isPublished ? 'Final Winner' : 'Admin Locked'}
                </Badge>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : currentWinners.length === 0 ? (
                <EmptyState
                  title="Klasemen Kosong"
                  description="Belum ada data nilai juri masuk untuk kategori ini."
                />
              ) : (
                <div className="space-y-6">
                  {/* Visual Podium Showcase */}
                  {currentWinners.length >= 3 && (
                    <div className="flex flex-col sm:flex-row items-end justify-center gap-3 pt-2 pb-4 border-b border-green-100">
                      {/* 2nd Place */}
                      <div className="w-full sm:w-48 flex flex-col items-center">
                        <div className="text-center space-y-0.5 mb-1.5">
                          <div className="font-black text-xs text-green-950 truncate max-w-[180px]">{currentWinners[1]?.teamName}</div>
                          <div className="text-[10px] font-mono font-bold text-green-800">{currentWinners[1]?.totalScore} pts</div>
                        </div>
                        <div className="w-full h-20 bg-gradient-to-t from-green-100 to-white border-x border-t border-green-200 rounded-t-2xl flex flex-col items-center justify-center shadow-sm">
                          <span className="text-xl font-black">🥈</span>
                          <span className="text-[8px] font-extrabold text-green-900 uppercase">JUARA 2</span>
                        </div>
                      </div>

                      {/* 1st Place */}
                      <div className="w-full sm:w-56 flex flex-col items-center">
                        <div className="text-center space-y-0.5 mb-1.5">
                          <div className="font-black text-sm text-amber-900 truncate max-w-[200px]">{currentWinners[0]?.teamName}</div>
                          <div className="text-xs font-mono font-black text-amber-800">{currentWinners[0]?.totalScore} pts</div>
                        </div>
                        <div className="w-full h-28 bg-gradient-to-t from-amber-100 to-white border-x border-t border-amber-300 rounded-t-3xl flex flex-col items-center justify-center shadow-md">
                          <span className="text-3xl font-black">🏆</span>
                          <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest mt-1">CHAMPION</span>
                        </div>
                      </div>

                      {/* 3rd Place */}
                      <div className="w-full sm:w-48 flex flex-col items-center">
                        <div className="text-center space-y-0.5 mb-1.5">
                          <div className="font-black text-xs text-green-950 truncate max-w-[180px]">{currentWinners[2]?.teamName}</div>
                          <div className="text-[10px] font-mono font-bold text-green-800">{currentWinners[2]?.totalScore} pts</div>
                        </div>
                        <div className="w-full h-16 bg-gradient-to-t from-amber-50 to-white border-x border-t border-amber-200 rounded-t-2xl flex flex-col items-center justify-center shadow-sm">
                          <span className="text-lg font-black">🥉</span>
                          <span className="text-[8px] font-extrabold text-amber-900 uppercase">JUARA 3</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complete Rankings List */}
                  <div className="space-y-3">
                    {currentWinners.map((winner) => (
                      <div
                        key={winner.noTampil}
                        className="p-4 rounded-2xl border border-green-200 bg-white hover:border-green-400 transition-all flex items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                            winner.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                            winner.rank === 2 ? 'bg-slate-200 text-slate-900' :
                            winner.rank === 3 ? 'bg-amber-200 text-amber-900' : 'bg-green-100 text-green-900'
                          }`}>
                            #{winner.rank}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-green-950 truncate">{winner.teamName}</h4>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-900">
                                {winner.noTampil}
                              </span>
                            </div>
                            <p className="text-xs text-green-800 font-semibold truncate">{winner.schoolName}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-mono font-black text-green-950">{winner.totalScore}</div>
                          <div className="text-[9px] font-bold text-green-700 uppercase">POINTS</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Side: Live Activity & Recent Score Inputs */}
          <div className="space-y-6">
            <Card>
              <div className="border-b border-green-100 pb-3 mb-4">
                <h3 className="text-xs font-black uppercase text-green-950 tracking-wider">
                  Aktivitas Arena Live
                </h3>
              </div>
              <div className="space-y-3">
                {feed.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-green-50/60 border border-green-100 text-xs font-semibold text-green-950">
                    <p className="leading-snug">{item.message}</p>
                    <span className="text-[9px] text-green-700 font-bold mt-1 block">{item.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

        </div>
      )}
    </main>
  );
}
