'use client';

import { useState, useEffect } from 'react';
import { getStoredBaracks, saveStoredBaracks, DynamicBarackItem, SchoolLevel } from '@/lib/dynamicStore';

export default function BarackManagePage() {
  const [baracks, setBaracks] = useState<DynamicBarackItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [noTampil, setNoTampil] = useState('');
  const [teamName, setTeamName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [jenjang, setJenjang] = useState<SchoolLevel>('SMA');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterJenjang, setSelectedFilterJenjang] = useState<'ALL' | SchoolLevel>('ALL');

  useEffect(() => {
    setBaracks(getStoredBaracks());
  }, []);

  const handleSaveBarack = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName || !roomName) {
      setFeedback('⚠️ Nama Tim Pasukan dan Nama Ruangan wajib diisi.');
      return;
    }

    if (editingId) {
      // Edit mode
      const updated = baracks.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            noTampil: noTampil || item.noTampil,
            teamName,
            schoolName,
            roomName,
            jenjang,
          };
        }
        return item;
      });
      setBaracks(updated);
      saveStoredBaracks(updated);
      setFeedback(`✅ Alokasi barack untuk '${teamName}' (${jenjang}) berhasil diperbarui!`);
      setEditingId(null);
    } else {
      // Create mode
      const newItem: DynamicBarackItem = {
        id: 'b_' + Date.now(),
        noTampil: noTampil || `${jenjang}-0${baracks.length + 1}`,
        teamName,
        schoolName,
        roomName,
        jenjang,
      };
      const updated = [newItem, ...baracks];
      setBaracks(updated);
      saveStoredBaracks(updated);
      setFeedback(`✨ Alokasi barack baru untuk '${teamName}' (${jenjang}) berhasil ditambahkan!`);
    }

    // Reset Form
    setNoTampil('');
    setTeamName('');
    setSchoolName('');
    setRoomName('');
  };

  const handleEditClick = (item: DynamicBarackItem) => {
    setEditingId(item.id);
    setNoTampil(item.noTampil);
    setTeamName(item.teamName);
    setSchoolName(item.schoolName);
    setRoomName(item.roomName);
    setJenjang(item.jenjang);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus alokasi barack untuk '${name}'?`)) {
      const updated = baracks.filter(item => item.id !== id);
      setBaracks(updated);
      saveStoredBaracks(updated);
      setFeedback(`🗑️ Alokasi barack untuk '${name}' berhasil dihapus.`);
    }
  };

  const handleClearAllBaracks = () => {
    if (confirm('⚠️ PERINGATAN KONFIRMASI:\nApakah Anda yakin ingin MENGHAPUS SELURUH DATA BARAK?\nSemua alokasi akan dikosongkan untuk persiapan data real.')) {
      setBaracks([]);
      saveStoredBaracks([]);
      setFeedback('🔥 SELURUH DATA ALOKASI BARAK BERHASIL DI-RESET / DIKOSONGKAN 100%!');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNoTampil('');
    setTeamName('');
    setSchoolName('');
    setRoomName('');
  };

  const filteredBaracks = baracks.filter(b => {
    const matchesJenjang = selectedFilterJenjang === 'ALL' || b.jenjang === selectedFilterJenjang;
    const matchesQuery =
      b.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.noTampil.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesJenjang && matchesQuery;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-2">
            <span>⛺</span>
            <span>PANEL LOGISTIK &amp; TRANSIT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Pengelola Ruangan Transit / Barak Peserta
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Atur alokasi ruangan barak kontingen per Jenjang (SD, SMP, SMA).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {baracks.length > 0 && (
            <button
              onClick={handleClearAllBaracks}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs transition-all flex items-center space-x-2"
              title="Kosongkan seluruh data barak untuk persiapan data real"
            >
              <span>🔥</span>
              <span>RESET / HAPUS SEMUA DATA BARAK</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-2">
          <span>ℹ️</span>
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah / Edit Alokasi Barak */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
          <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
            <span>{editingId ? '✏️ Edit Alokasi Barak' : '➕ Tambah Ruang Barak Baru'}</span>
          </h2>

          <form onSubmit={handleSaveBarack} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Tingkat Jenjang Sekolah *
              </label>
              <select
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value as SchoolLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-cyan-500 font-bold"
              >
                <option value="SD">🎒 SD / MI (Sekolah Dasar)</option>
                <option value="SMP">🏫 SMP / MTs (Sekolah Menengah Pertama)</option>
                <option value="SMA">🏛️ SMA / SMK / MA (Sekolah Menengah Atas)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                No. Dada / Tampil
              </label>
              <input
                type="text"
                placeholder="Contoh: SMA-01"
                value={noTampil}
                onChange={(e) => setNoTampil(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-cyan-500 font-mono font-bold"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-cyan-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Sekolah / Pangkalan
              </label>
              <input
                type="text"
                placeholder="Contoh: SMAN 1 KOTA BANDUNG"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-cyan-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Nama Ruangan / Kelas Transit *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Kelas X-1"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-cyan-500 font-semibold"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20"
              >
                {editingId ? '💾 SIMPAN PERUBAHAN' : '➕ TAMBAH ALOKASI BARAK'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabel Data Alokasi Barak */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs Jenjang */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedFilterJenjang('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedFilterJenjang === 'ALL'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                SEMUA ({baracks.length})
              </button>
              <button
                onClick={() => setSelectedFilterJenjang('SD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedFilterJenjang === 'SD'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                🎒 SD ({baracks.filter(b => b.jenjang === 'SD').length})
              </button>
              <button
                onClick={() => setSelectedFilterJenjang('SMP')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedFilterJenjang === 'SMP'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                🏫 SMP ({baracks.filter(b => b.jenjang === 'SMP').length})
              </button>
              <button
                onClick={() => setSelectedFilterJenjang('SMA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedFilterJenjang === 'SMA'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                🏛️ SMA ({baracks.filter(b => b.jenjang === 'SMA').length})
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 Filter barak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs outline-none focus:border-cyan-500"
            />
          </div>

          {filteredBaracks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
              <p className="font-bold mb-1">Belum Ada Data Ruangan Barak</p>
              <p className="text-slate-500">Gunakan form di sebelah kiri untuk memasukkan alokasi ruangan barak baru.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBaracks.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold">
                        {item.noTampil}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        item.jenjang === 'SD' ? 'bg-emerald-500/20 text-emerald-300' :
                        item.jenjang === 'SMP' ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {item.jenjang}
                      </span>
                      <h3 className="font-extrabold text-white text-base">{item.teamName}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{item.schoolName}</p>

                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
                      <span>📍 Ruangan Transit: <strong className="text-white font-extrabold">{item.roomName}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id, item.teamName)}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-all"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
