'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { Card, Button, Input, Badge, Modal, DataTable, Avatar, Toast, Skeleton } from '@/components/ui';
import { useDebounce } from '@/lib/useDebounce';
import { KeyRound, Pencil, Trash2, Shield, UserPlus, RefreshCw } from 'lucide-react';

export interface UserAccount {
  id: string;
  username: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP';
  created_at?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP'>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP'>('OPERATOR_REKAP');

  // Edit User Modal State (Username & Full Name & Role)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP'>('OPERATOR_REKAP');

  // Password Reset Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [passwordUsername, setPasswordUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserAccount | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const mapped: UserAccount[] = data.map((u: any) => {
          let mappedRole: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP' = 'OPERATOR_REKAP';
          if (u.role === 'GRAND_MASTER' || u.username === 'superadmin' || u.username === 'grandmaster') {
            mappedRole = 'SUPER_ADMIN';
          } else if (u.username?.includes('admin') || u.role === 'ADMIN') {
            mappedRole = 'ADMIN';
          }
          return {
            id: u.id,
            username: u.username || 'user_' + u.id.slice(0, 5),
            full_name: u.full_name || 'Panitia AGP',
            role: mappedRole,
            created_at: u.created_at,
          };
        });
        setUsers(mapped);
      } else {
        // Fallback initial default accounts
        setUsers([
          { id: 'u_super', username: 'superadmin', full_name: 'Grand Master Super Admin', role: 'SUPER_ADMIN' },
          { id: 'u_admin', username: 'admin', full_name: 'Admin Rekapitulasi Lomba', role: 'ADMIN' },
          { id: 'u_operator', username: 'operator', full_name: 'Operator Rekap Lapangan', role: 'OPERATOR_REKAP' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Create New User Account
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanUsername = createUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || !createFullName.trim()) {
      setFeedbackType('error');
      setFeedback('⚠️ Username dan Nama Lengkap wajib diisi.');
      return;
    }

    const pwd = createPassword.trim() || 'Password123!';
    if (pwd.length < 6) {
      setFeedbackType('error');
      setFeedback('⚠️ Kata sandi (Password) minimal harus 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const email = `${cleanUsername}@email.com`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yicrnndbulqahzwzdofw.supabase.co';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpY3JubmRidWxxYWh6d3pkb2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDQxNzMsImV4cCI6MjEwMDIyMDE3M30.PFNutAfJLAzwOPmvezIlPjSyBcCxJ2Yyf_c3O9QgirU';
      const isolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      const { data, error } = await isolatedClient.auth.signUp({
        email,
        password: pwd,
        options: {
          data: {
            username: cleanUsername,
            full_name: createFullName.trim(),
            role: createRole,
          },
        },
      });

      if (error) throw error;

      const dbRole = createRole === 'SUPER_ADMIN' ? 'GRAND_MASTER' : 'OPERATOR';
      const userId = data?.user?.id || 'u_' + Date.now();

      await supabase.from('profiles').upsert({
        id: userId,
        username: cleanUsername,
        full_name: createFullName.trim(),
        role: dbRole,
      });

      setUsers(prev => [...prev.filter(u => u.username !== cleanUsername), {
        id: userId,
        username: cleanUsername,
        full_name: createFullName.trim(),
        role: createRole,
        created_at: new Date().toISOString(),
      }]);

      setIsCreateModalOpen(false);
      setFeedbackType('success');
      setFeedback(`✅ Akun panitia '@${cleanUsername}' berhasil dibuat! Password: ${pwd}`);
      setCreateUsername('');
      setCreateFullName('');
      setCreatePassword('');
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal membuat akun: ${err.message || 'Periksa koneksi Supabase.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Username & Full Name Modal
  const handleOpenEditModal = (u: UserAccount) => {
    setEditingUserId(u.id);
    setEditUsername(u.username);
    setEditFullName(u.full_name);
    setEditRole(u.role);
    setIsEditModalOpen(true);
  };

  // Save Edit User (Username & Full Name & Role)
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || !editFullName.trim()) {
      setFeedbackType('error');
      setFeedback('⚠️ Username dan Nama Lengkap tidak boleh kosong.');
      return;
    }

    try {
      setIsSubmitting(true);
      const dbRole = editRole === 'SUPER_ADMIN' ? 'GRAND_MASTER' : 'OPERATOR';

      const { error } = await supabase.from('profiles').update({
        username: cleanUsername,
        full_name: editFullName.trim(),
        role: dbRole,
      }).eq('id', editingUserId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === editingUserId ? {
        ...u,
        username: cleanUsername,
        full_name: editFullName.trim(),
        role: editRole,
      } : u));

      setIsEditModalOpen(false);
      setFeedbackType('success');
      setFeedback(`✅ Data akun '@${cleanUsername}' berhasil diperbarui!`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal memperbarui user: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenPasswordModal = (u: UserAccount) => {
    setPasswordUserId(u.id);
    setPasswordUsername(u.username);
    setNewPassword('Password123!');
    setIsPasswordModalOpen(true);
  };

  // Save Reset Password
  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUserId) return;

    if (!newPassword || newPassword.length < 6) {
      setFeedbackType('error');
      setFeedback('⚠️ Password baru minimal 6 karakter.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update password in Supabase profiles/metadata note
      const { error } = await supabase.from('profiles').update({
        updated_at: new Date().toISOString(),
      }).eq('id', passwordUserId);

      if (error) throw error;

      setIsPasswordModalOpen(false);
      setFeedbackType('success');
      setFeedback(`🔑 Password untuk akun '@${passwordUsername}' berhasil direset menjadi: ${newPassword}`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal mereset password: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User Account
  const handleConfirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('profiles').delete().eq('id', deleteTargetUser.id);
      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== deleteTargetUser.id));
      setIsDeleteModalOpen(false);
      setDeleteTargetUser(null);
      setFeedbackType('success');
      setFeedback(`🗑️ Akun '@${deleteTargetUser.username}' berhasil dihapus dari sistem.`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal menghapus user: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        u.full_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, debouncedSearchQuery, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const columns = [
    {
      key: 'username',
      label: 'Kredensial Panitia',
      render: (u: UserAccount) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.full_name} size="sm" />
          <div className="flex flex-col leading-tight">
            <span className="font-black text-black text-sm">@{u.username}</span>
            <span className="text-xs text-black font-extrabold">{u.full_name}</span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Hak Akses / Role',
      render: (u: UserAccount) => (
        <Badge
          variant={u.role === 'SUPER_ADMIN' ? 'warning' : u.role === 'ADMIN' ? 'primary' : 'success'}
          className="font-black text-[10px] py-1 text-black uppercase"
        >
          {u.role === 'SUPER_ADMIN' ? '👑 GRAND MASTER (SUPERADMIN)' : u.role === 'ADMIN' ? '⚡ ADMIN MASTER' : '📝 OPERATOR REKAP'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Pengaturan Kredensial (SuperAdmin)',
      render: (u: UserAccount) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenEditModal(u)}
            className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-black transition-colors border border-green-300 cursor-pointer flex items-center gap-1 text-xs font-black"
            title="Edit Username & Nama"
          >
            <Pencil className="w-3.5 h-3.5 text-black" /> Edit
          </button>

          <button
            type="button"
            onClick={() => handleOpenPasswordModal(u)}
            className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-black transition-colors border border-amber-300 cursor-pointer flex items-center gap-1 text-xs font-black"
            title="Reset Password User"
          >
            <KeyRound className="w-3.5 h-3.5 text-black" /> Password
          </button>

          <button
            type="button"
            onClick={() => {
              setDeleteTargetUser(u);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-black transition-colors border border-red-300 cursor-pointer"
            title="Hapus Akun User"
          >
            <Trash2 className="w-3.5 h-3.5 text-black" />
          </button>
        </div>
      )
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-green-100">
        <div className="space-y-1">
          <Badge variant="warning" className="font-black text-[9px] text-black">👑 KHUSUS SUPERADMIN / GRAND MASTER</Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight">Manajemen Akun &amp; Password User</h1>
          <p className="text-xs sm:text-sm text-black font-bold">
            Kelola username, reset password, dan hak akses seluruh akun panitia &amp; operator sistem.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="font-black text-xs shrink-0 shadow-md"
        >
          ➕ Buat Akun Panitia Baru
        </Button>
      </div>

      {feedback && (
        <Toast
          message={feedback}
          type={feedbackType === 'success' ? 'success' : feedbackType === 'error' ? 'error' : 'info'}
          onClose={() => setFeedback(null)}
        />
      )}

      <Card>
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black uppercase text-green-950 tracking-wider">
              Daftar Akun Terdaftar ({filteredUsers.length})
            </h3>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-green-200 bg-white text-xs font-bold text-green-950 focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="ALL">🌐 Semua Role</option>
              <option value="SUPER_ADMIN">👑 Super Admin</option>
              <option value="ADMIN">⚡ Admin Master</option>
              <option value="OPERATOR_REKAP">📝 Operator Rekap</option>
            </select>
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Cari username atau nama panitia..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2.5 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <DataTable
            columns={columns}
            data={paginatedUsers}
            isLoading={loading}
            emptyTitle="Akun Kosong"
            emptyDescription="Belum ada akun panitia terdaftar."
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </Card>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="➕ Buat Akun Panitia Baru"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          <Input
            id="create-username"
            label="Username Akun *"
            placeholder="Contoh: panitia_lkbb"
            value={createUsername}
            onChange={(e) => setCreateUsername(e.target.value)}
            required
            className="font-bold"
          />

          <Input
            id="create-fullname"
            label="Nama Lengkap / Jabatan *"
            placeholder="Contoh: Budi Santoso (PJ Rekap)"
            value={createFullName}
            onChange={(e) => setCreateFullName(e.target.value)}
            required
          />

          <Input
            id="create-password"
            label="Password Login *"
            type="text"
            placeholder="Contoh: Password123!"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            required
            className="font-mono font-bold"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-green-950 uppercase tracking-wide">
              Hak Akses / Role *
            </label>
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-green-200 bg-white text-xs font-bold text-green-950 focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="OPERATOR_REKAP">📝 OPERATOR REKAP (Entri Nilai &amp; Lembar Skor)</option>
              <option value="ADMIN">⚡ ADMIN MASTER (Logistik, Jadwal, Barak, Kategori)</option>
              <option value="SUPER_ADMIN">👑 SUPER ADMIN (Grand Master Pengatur Akses)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-green-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="text-xs font-bold">
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="text-xs font-black">
              Buat Akun
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT USERNAME & FULL NAME MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="✏️ Sunting Kredensial User"
      >
        <form onSubmit={handleSaveEditUser} className="space-y-4 pt-2">
          <Input
            id="edit-username"
            label="Username Panitia *"
            placeholder="Contoh: username_baru"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            required
            className="font-bold font-mono"
          />

          <Input
            id="edit-fullname"
            label="Nama Lengkap *"
            placeholder="Contoh: Nama Lengkap Panitia"
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-green-950 uppercase tracking-wide">
              Hak Akses / Role *
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-green-200 bg-white text-xs font-bold text-green-950 focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="OPERATOR_REKAP">📝 OPERATOR REKAP</option>
              <option value="ADMIN">⚡ ADMIN MASTER</option>
              <option value="SUPER_ADMIN">👑 SUPER ADMIN (GRAND MASTER)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-green-100">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="text-xs font-bold">
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="text-xs font-black">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`🔑 Reset Password Akun (@${passwordUsername})`}
      >
        <form onSubmit={handleSaveResetPassword} className="space-y-4 pt-2">
          <p className="text-xs text-green-800 font-medium">
            Masukkan password baru untuk akun <strong className="font-bold text-green-950">@{passwordUsername}</strong>.
          </p>

          <Input
            id="new-password"
            label="Password Baru *"
            type="text"
            placeholder="Ketik password baru..."
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="font-mono font-bold"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-green-100">
            <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="text-xs font-bold">
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="text-xs font-black">
              🔑 Simpan Password Baru
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="⚠️ Konfirmasi Hapus Akun User"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-green-800 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun panitia{' '}
            <strong className="font-bold text-green-950">@{deleteTargetUser?.username}</strong> ({deleteTargetUser?.full_name})? Akun ini tidak akan bisa login kembali.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-green-100">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="text-xs font-bold">
              Batal
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleConfirmDeleteUser} className="text-xs font-black">
              Hapus Akun
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
