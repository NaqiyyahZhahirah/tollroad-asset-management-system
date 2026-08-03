import { useEffect, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useToast } from '../components/Toast';

// ─── Utility ──────────────────────────────────────────────────────────────────
function generatePassword(length = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Badge components (Matching AsetList pill badges) ──────────────────────────
function RoleBadge({ role }) {
    const isAdmin = role === 'admin';
    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
            isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
        }`}>
            {isAdmin ? 'Admin' : 'Operator'}
        </span>
    );
}

function StatusBadge({ active }) {
    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
            active ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
            {active ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// ─── Add User Modal ───────────────────────────────────────────────────────────
function AddUserModal({ onClose, onSuccess }) {
    const toast = useToast();
    const [form, setForm] = useState({
        nama: '', email: '', password: '', role: 'operator', wilayah_kerja: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.nama || !form.email || !form.password || !form.role) {
            toast.warning('Semua field wajib diisi kecuali Wilayah Kerja');
            return;
        }
        setLoading(true);
        try {
            const res = await axiosClient.post('/users', form);
            toast.success(`Pengguna "${res.data.data.nama}" berhasil ditambahkan`);
            onSuccess(res.data.data);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menambahkan pengguna');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border bg-card-alt">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber">person_add</span>
                        <h3 className="font-bold text-navy">Tambah Pengguna Baru</h3>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-navy">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Nama Lengkap *</label>
                        <input
                            name="nama"
                            value={form.nama}
                            onChange={handleChange}
                            placeholder="Masukkan nama lengkap"
                            className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text-dark focus:outline-none focus:border-amber"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Email *</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="user@email.com"
                            className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text-dark focus:outline-none focus:border-amber"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Password *</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    name="password"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Minimal 6 karakter"
                                    className="w-full px-3 py-2 pr-9 bg-card border border-border rounded-lg text-sm text-text-dark focus:outline-none focus:border-amber"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(s => !s)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {showPass ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                                title="Generate password acak"
                                className="px-3 py-2 bg-card-strong border border-border rounded-lg text-xs font-semibold text-navy hover:bg-amber transition-colors flex items-center gap-1 shrink-0"
                            >
                                <span className="material-symbols-outlined text-[16px]">casino</span>
                                Auto
                            </button>
                        </div>
                        {form.password && (
                            <p className="mt-1.5 text-xs text-text-muted font-mono bg-card-alt px-2.5 py-1 rounded border border-border select-all">
                                {showPass ? form.password : '••••••••••••'}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Role *</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="w-full px-3 py-2 pr-8 bg-card border border-border rounded-lg text-sm text-text-dark focus:outline-none focus:border-amber appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat cursor-pointer"
                        >
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Wilayah Kerja</label>
                        <input
                            name="wilayah_kerja"
                            value={form.wilayah_kerja}
                            onChange={handleChange}
                            placeholder="Contoh: Ruas Cawang–Tomang"
                            className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text-dark focus:outline-none focus:border-amber"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-text-muted hover:bg-card-strong transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-navy text-white px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                        >
                            {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                            {loading ? 'Menyimpan...' : 'Simpan Pengguna'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ user: targetUser, onClose }) {
    const toast = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            toast.warning('Password minimal 6 karakter');
            return;
        }
        setLoading(true);
        try {
            await axiosClient.post(`/users/${targetUser.id}/reset-password`, { new_password: newPassword });
            toast.success(`Password ${targetUser.nama} berhasil direset`);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal mereset password');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border bg-card-alt">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber">lock_reset</span>
                        <h3 className="font-bold text-navy">Reset Password</h3>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-navy">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <p className="text-sm text-text-muted">
                        Set password baru untuk <strong className="text-navy">{targetUser.nama}</strong>
                    </p>

                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Password Baru *</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    className="w-full px-3 py-2 pr-9 bg-card border border-border rounded-lg text-sm text-text-dark focus:outline-none focus:border-amber"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(s => !s)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {showPass ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setNewPassword(generatePassword())}
                                title="Generate password acak"
                                className="px-3 py-2 bg-card-strong border border-border rounded-lg text-xs font-semibold text-navy hover:bg-amber transition-colors flex items-center gap-1 shrink-0"
                            >
                                <span className="material-symbols-outlined text-[16px]">casino</span>
                                Auto
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-text-muted hover:bg-card-strong transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-navy text-white px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                        >
                            {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                            {loading ? 'Menyimpan...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ modal, onClose }) {
    if (!modal) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl p-6 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined text-2xl mt-0.5 ${modal.danger ? 'text-danger' : 'text-amber'}`}>
                        {modal.icon || 'help'}
                    </span>
                    <div>
                        <h3 className="font-bold text-navy">{modal.title}</h3>
                        <p className="text-sm text-text-muted mt-1">{modal.message}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-text-muted hover:bg-card-strong transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => { modal.onConfirm(); onClose(); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 ${
                            modal.danger ? 'bg-danger' : 'bg-navy'
                        }`}
                    >
                        {modal.confirmText || 'Ya'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserManagement() {
    const { user: currentUser } = useAuthStore();
    const toast = useToast();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [showAddModal, setShowAddModal] = useState(false);
    const [resetTarget, setResetTarget] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (roleFilter !== 'all') params.set('role', roleFilter);
            if (statusFilter !== 'all') params.set('is_active', statusFilter === 'active' ? 'true' : 'false');
            const res = await axiosClient.get(`/users?${params}`);
            setUsers(res.data.data || []);
        } catch (err) {
            toast.error('Gagal memuat data pengguna');
        } finally {
            setLoading(false);
        }
    }, [roleFilter, statusFilter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Reset pagination when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [roleFilter, statusFilter, search, pageSize]);

    // Filter search client-side
    const filteredUsers = users.filter(u => {
        const q = search.toLowerCase();
        return !q || u.nama?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.wilayah_kerja?.toLowerCase().includes(q);
    });

    // Pagination slice
    const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    async function handleToggleRole(targetUser) {
        const newRole = targetUser.role === 'admin' ? 'operator' : 'admin';
        const label = newRole === 'admin' ? 'Admin' : 'Operator';
        setConfirmModal({
            title: 'Ubah Role Pengguna',
            message: `Ubah role ${targetUser.nama} menjadi ${label}?`,
            icon: 'manage_accounts',
            confirmText: `Jadikan ${label}`,
            onConfirm: async () => {
                try {
                    const res = await axiosClient.patch(`/users/${targetUser.id}/role`, { role: newRole });
                    setUsers(prev => prev.map(u => u.id === targetUser.id ? res.data.data : u));
                    toast.success(`Role ${targetUser.nama} diubah menjadi ${label}`);
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Gagal mengubah role');
                }
            }
        });
    }

    async function handleToggleActive(targetUser) {
        const willDeactivate = targetUser.is_active;
        setConfirmModal({
            title: willDeactivate ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna',
            message: willDeactivate
                ? `${targetUser.nama} tidak akan bisa login setelah dinonaktifkan.`
                : `${targetUser.nama} akan bisa login kembali.`,
            icon: willDeactivate ? 'block' : 'check_circle',
            danger: willDeactivate,
            confirmText: willDeactivate ? 'Nonaktifkan' : 'Aktifkan',
            onConfirm: async () => {
                try {
                    const res = await axiosClient.patch(`/users/${targetUser.id}/status`, { is_active: !targetUser.is_active });
                    setUsers(prev => prev.map(u => u.id === targetUser.id ? res.data.data : u));
                    toast.success(`Status ${targetUser.nama} berhasil diperbarui`);
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Gagal mengubah status');
                }
            }
        });
    }

    const isSelf = (u) => u.id === currentUser?.id;

    const ROLE_TABS = [
        { key: 'all', label: 'Semua Role' },
        { key: 'admin', label: 'Admin' },
        { key: 'operator', label: 'Operator' },
    ];
    const STATUS_TABS = [
        { key: 'all', label: 'Semua Status' },
        { key: 'active', label: 'Aktif' },
        { key: 'inactive', label: 'Nonaktif' },
    ];

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-navy">Kelola Pengguna</h2>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg font-bold hover:opacity-90 w-fit"
                        >
                            <span className="material-symbols-outlined">person_add</span>
                            Tambah Pengguna
                        </button>
                    </div>

                    {/* Filters Toolbar (Pill buttons without icons) */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
                        {/* Role & Status Pill Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                            {ROLE_TABS.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setRoleFilter(t.key)}
                                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                                        roleFilter === t.key
                                            ? 'bg-card-strong text-navy font-bold shadow-sm'
                                            : 'bg-card border border-border text-text-muted hover:text-navy'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}

                            <div className="h-4 w-px bg-border mx-1 shrink-0" />

                            {STATUS_TABS.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setStatusFilter(t.key)}
                                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                                        statusFilter === t.key
                                            ? 'bg-card-strong text-navy font-bold shadow-sm'
                                            : 'bg-card border border-border text-text-muted hover:text-navy'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Box */}
                        <div className="relative min-w-[240px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari nama, email, wilayah..."
                                className="w-full pl-9 pr-3 py-1.5 bg-card border border-border rounded-full text-sm text-text-dark focus:outline-none focus:border-amber"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-navy text-white">
                                    <tr>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider">Pengguna</th>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider hidden md:table-cell">Wilayah Kerja</th>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider">Role</th>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider">Status</th>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider text-left">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading && (
                                        <tr><td colSpan={5} className="p-8 text-center text-text-muted">Memuat data...</td></tr>
                                    )}
                                    {!loading && filteredUsers.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-text-muted">Tidak ada data pengguna</td></tr>
                                    )}
                                    {!loading && paginatedUsers.map((u) => (
                                        <tr key={u.id} className={`hover:bg-card-hover transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                                            {/* Pengguna col */}
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                        u.role === 'admin' ? 'bg-amber-100 text-amber-900' : 'bg-card-strong text-navy'
                                                    }`}>
                                                        {u.nama?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-sm text-navy truncate flex items-center gap-1.5">
                                                            {u.nama}
                                                            {isSelf(u) && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Anda</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-text-muted truncate">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Wilayah */}
                                            <td className="p-3 text-sm text-text-muted hidden md:table-cell">
                                                {u.wilayah_kerja || <span className="text-text-muted/40 italic">—</span>}
                                            </td>

                                            {/* Role */}
                                            <td className="p-3"><RoleBadge role={u.role} /></td>

                                            {/* Status */}
                                            <td className="p-3"><StatusBadge active={u.is_active} /></td>

                                            {/* Actions */}
                                            <td className="p-3 text-left">
                                                <div className="flex items-center gap-2 justify-start">
                                                    {/* Toggle Role (Equalized width: w-28) */}
                                                    <button
                                                        onClick={() => handleToggleRole(u)}
                                                        disabled={isSelf(u)}
                                                        title={isSelf(u) ? 'Tidak bisa mengubah role akun sendiri' : `Jadikan ${u.role === 'admin' ? 'Operator' : 'Admin'}`}
                                                        className={`p-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-semibold w-24 shrink-0 ${
                                                            isSelf(u)
                                                                ? 'opacity-30 cursor-not-allowed bg-card-strong text-text-muted'
                                                                : 'bg-card-strong text-navy hover:bg-amber'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                                                        <span>{u.role === 'admin' ? 'Operator' : 'Admin'}</span>
                                                    </button>

                                                    {/* Toggle Active (Equalized width: w-28) */}
                                                    <button
                                                        onClick={() => handleToggleActive(u)}
                                                        disabled={isSelf(u)}
                                                        title={isSelf(u)
                                                            ? 'Tidak bisa menonaktifkan akun sendiri'
                                                            : u.is_active ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
                                                        className={`p-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-semibold w-28 shrink-0 ${
                                                            isSelf(u)
                                                                ? 'opacity-30 cursor-not-allowed bg-card-strong text-text-muted'
                                                                : u.is_active
                                                                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            {u.is_active ? 'block' : 'check_circle'}
                                                        </span>
                                                        <span>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                                                    </button>

                                                    {/* Reset Password (Equalized width: w-24) */}
                                                    <button
                                                        onClick={() => setResetTarget(u)}
                                                        title="Reset Password"
                                                        className="p-2 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber transition-colors flex items-center justify-center gap-1 text-xs font-semibold w-24 shrink-0"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                                                        <span>Reset PW</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer (Matching AsetList pagination) */}
                        <div className="p-3 flex items-center justify-between bg-card-alt/50 border-t border-border text-sm text-text-muted flex-wrap gap-3">
                            {/* Kiri: info + page size */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <span>
                                    {loading
                                        ? 'Memuat...'
                                        : filteredUsers.length === 0
                                        ? 'Tidak ada data'
                                        : `Menampilkan ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredUsers.length)} dari ${filteredUsers.length} pengguna`}
                                </span>
                                {/* Page size selector */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs">Per halaman:</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(Number(e.target.value))}
                                        className="h-7 px-2 rounded-lg border border-border bg-card text-xs text-navy font-medium focus:outline-none focus:border-amber cursor-pointer"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Kanan: navigasi halaman */}
                            {!loading && filteredUsers.length > pageSize && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-border text-text-muted hover:bg-card-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Halaman pertama"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">first_page</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-border text-text-muted hover:bg-card-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Sebelumnya"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .reduce((acc, p, idx, arr) => {
                                            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((item, idx) =>
                                            item === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="px-2 text-text-muted text-sm">…</span>
                                            ) : (
                                                <button
                                                    key={item}
                                                    onClick={() => setCurrentPage(item)}
                                                    className={`px-3 py-1 rounded-lg border text-sm font-semibold transition-colors ${
                                                        currentPage === item
                                                            ? 'bg-amber border-amber text-navy font-bold'
                                                            : 'border-border text-text-muted hover:bg-card-strong'
                                                    }`}
                                                >
                                                    {item}
                                                </button>
                                            )
                                        )}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg border border-border text-text-muted hover:bg-card-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Berikutnya"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg border border-border text-text-muted hover:bg-card-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Halaman terakhir"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">last_page</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* Modals */}
            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={(newUser) => setUsers(prev => [newUser, ...prev])}
                />
            )}
            {resetTarget && (
                <ResetPasswordModal
                    user={resetTarget}
                    onClose={() => setResetTarget(null)}
                />
            )}
            <ConfirmModal
                modal={confirmModal}
                onClose={() => setConfirmModal(null)}
            />
        </div>
    );
}
