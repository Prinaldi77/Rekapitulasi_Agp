'use client';

import { useState, useEffect } from 'react';
import { getStoredSchedules, saveStoredSchedules, DynamicScheduleItem, SchoolLevel } from '@/lib/dynamicStore';
import { supabase } from '@/lib/supabase';

export default function ScheduleManagePage() {
  const [schedules, setSchedules] = useState<DynamicScheduleItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // User division restriction
  const [assignedJenjang, setAssignedJenjang] = useState<SchoolLevel | null>(null);

  // Form State
  const [participantNo, setParticipantNo] = useState('');
  const [teamName, setTeamName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [category, setCategory] = useState('LKBB PRAMUKA');
  const [jenjang, setJenjang] = useState<SchoolLevel>('SMA');
  const [timeSlot, setTimeSlot] = useState('');
  const [selectedFilterJenjang, setSelectedFilterJenjang] = useState<'ALL' | SchoolLevel>('ALL');

  useEffect(() => {
    setSchedules(getStoredSchedules());

    // Auto-detect division from active operator session
    const detectUserDivision = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase() || '';
      
      if (email.includes('sma')) {
        setJenjang('SMA');
        setSelectedFilterJenjang('SMA');
        setAssignedJenjang('SMA');
      } else if (email.includes('smp')) {
        setJenjang('SMP');
        setSelectedFilterJenjang('SMP');
        setAssignedJenjang('SMP');
      } else if (email.includes('sd')) {
        setJenjang('SD');
        setSelectedFilterJenjang('SD');
        setAssignedJenjang('SD');
      }
    };

    detectUserDivision();
  }, []);

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName || !schoolName) {
      setFeedback('⚠️ Nama Tim dan Pangkalan Sekolah wajib diisi.');
      return;
    }

    const maxNo = schedules.length > 0 ? Math.max(...schedules.map(s => s.noTampil)) : 0;
    const nextNo = maxNo + 1;

    const newItem: DynamicScheduleItem = {
      id: 's_' + Date.now(),
      noTampil: nextNo,
      participantNo: participantNo || `${jenjang}-0${nextNo}`,
      teamName,
      schoolName,
      category,
      jenjang,
      timeSlot: timeSlot || '09:00 - 09:20',
      status: 'WAITING',
    };

    const updated = [...schedules, newItem];
    setSchedules(updated);
    saveStoredSchedules(updated);

    setFeedback(`✨ Peserta '${teamName}' (${jenjang}) berhasil ditambahkan ke urutan tampil!`);
    setParticipantNo('');
    setTeamName('');
    setSchoolName('');
    setTimeSlot('');
  };

  const handleStatusChange = (id: string, newStatus: DynamicScheduleItem['status']) => {
    const updated = schedules.map(item => {
      if (item.id === id) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    setSchedules(updated);
    saveStoredSchedules(updated);

    const target = schedules.find(s => s.id === id);
    setFeedback(`⚡ Status '${target?.teamName}' diperbarui menjadi: ${newStatus}`);
  };

  const handleDeleteSchedule = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus peserta '${name}' dari jadwal?`)) {
      const updated = schedules.filter(s => s.id !== id);
      setSchedules(updated);
      saveStoredSchedules(updated);
      setFeedback(`🗑️ Peserta '${name}' berhasil dihapus dari jadwal.`);
    }
  };

  const filteredSchedules = schedules.filter(s => {
    if (selectedFilterJenjang === 'ALL') return true;
    return s.jenjang === selectedFilterJenjang;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <span>🎛️</span>
            <span>PANEL CONTROL ARENA LAPANGAN</span>
            {assignedJenjang && (
              <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold uppercase">
                DIVISI {assignedJenjang}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Pengelola Urutan Tampil Realtime
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {assignedJenjang 
              ? `Anda bertindak sebagai Operator Divisi LKBB ${assignedJenjang}. Mengelola urutan panggung peserta ${assignedJenjang}.`
              : 'Ganti status panggung (NOW PERFORMING / STANDBY / NEXT) secara live per Jenjang (SD, SMP, SMA).'}
          </p>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-2">
          <span>ℹ️</span>
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah Peserta */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
          <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
            <span>➕ Tambah Peserta LKBB ({jenjang})</span>
          </h2>

          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Tingkat Jenjang Sekolah *
              </label>
              <select
                disabled={!!assignedJenjang}
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value as SchoolLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-emerald-500 font-bold disabled:opacity-75"
              >
                <option value="SD">🎒 SD / MI (Sekolah Dasar)</option>
                <option value="SMP">🏫 SMP / MTs (Sekolah Menengah Pertama)</option>
                <option value="SMA">🏛️ SMA / SMK / MA (Sekolah Menengah Atas)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                No. Peserta / No. Dada
              </label>
              <input
                type="text"
                placeholder={`Contoh: ${jenjang}-01`}
                value={participantNo}
                onChange={(e) => setParticipantNo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Nama Pasukan / Tim *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PASBRATA UTAMA"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Sekolah / Pangkalan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: SMAN 1 KOTA BANDUNG"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Estimasi Jam Tampil
              </label>
              <input
                type="text"
                placeholder="Contoh: 09:00 - 09:20"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              ➕ TAMBAH KE JADWAL ARENA ({jenjang})
            </button>
          </form>
        </div>

        {/* Tabel Data Control Arena */}
        <div className="lg:col-span-2 space-y-4">
          {/* Jenjang Filter Tabs */}
          {!assignedJenjang && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedFilterJenjang('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedFilterJenjang === 'ALL'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                SEMUA ({schedules.length})
              </button>
              <button
                onClick={() => setSelectedFilterJenjang('SD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedFilterJenjang === 'SD'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                🎒 SD / MI ({schedules.filter(s => s.jenjang === 'SD').length})
              </button>
              <button
                onClick={() => setSelectedFilterJenjang('SMP')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedFilterJenjang === 'SMP'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                🏫 SMP / MTs ({schedules.filter(s => s.jenjang === 'SMP').length})
              </button>
              <button
                onClick={() => setSelectedFilterJenjang('SMA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedFilterJenjang === 'SMA'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                🏛️ SMA / SMK ({schedules.filter(s => s.jenjang === 'SMA').length})
              </button>
            </div>
          )}

          <div className="space-y-3">
            {filteredSchedules.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                      NO. {item.noTampil} ({item.participantNo})
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      item.jenjang === 'SD' ? 'bg-emerald-500/20 text-emerald-300' :
                      item.jenjang === 'SMP' ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {item.jenjang}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-base">{item.teamName}</h3>
                  <p className="text-xs text-slate-400">{item.schoolName}</p>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleStatusChange(item.id, 'NOW PERFORMING')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                      item.status === 'NOW PERFORMING'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-slate-950 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                  >
                    🔴 TAMPIL
                  </button>

                  <button
                    onClick={() => handleStatusChange(item.id, 'STANDBY')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                      item.status === 'STANDBY'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-950 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    ⏳ STANDBY
                  </button>

                  <button
                    onClick={() => handleStatusChange(item.id, 'NEXT')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                      item.status === 'NEXT'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-950 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    ➡️ NEXT
                  </button>

                  <button
                    onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                      item.status === 'COMPLETED'
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    ✓ SELESAI
                  </button>

                  <button
                    onClick={() => handleDeleteSchedule(item.id, item.teamName)}
                    className="p-1 text-slate-500 hover:text-rose-400 ml-1 text-xs"
                    title="Hapus"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
