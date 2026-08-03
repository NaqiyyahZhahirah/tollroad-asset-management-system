import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

const conditionBadge = {
    baik: 'bg-[#D1FAE5] text-[#065F46]',
    perlu_perawatan: 'bg-[#FEF3C7] text-[#92400E]',
    rusak: 'bg-[#FEE2E2] text-[#991B1B]'
};
const conditionLabel = { baik: 'Baik', perlu_perawatan: 'Perlu Perawatan', rusak: 'Rusak' };

const validasiBadge = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-[#D1FAE5] text-[#065F46]',
    rejected: 'bg-[#FEE2E2] text-[#991B1B]'
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function AsetList() {
    const [asetData, setAsetData] = useState([]);
    const [kategoriList, setKategoriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterKategori, setFilterKategori] = useState('');
    const [filterValidasi, setFilterValidasi] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        axiosClient.get('/kategori').then((res) => setKategoriList(res.data.data));
    }, []);

    useEffect(() => {
        fetchAset();
    }, [filterKategori, filterValidasi]);

    // Reset to first page whenever filters or page size change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [filterKategori, filterValidasi, pageSize]);

    async function fetchAset() {
        setLoading(true);
        try {
            const params = {};
            if (filterValidasi) params.status_validasi = filterValidasi;
            if (filterKategori) params.kategori_id = filterKategori;
            const res = await axiosClient.get('/aset', { params });
            setAsetData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function toggleSelect(id) {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    }

    function toggleSelectAll(e) {
        setSelectedIds(e.target.checked ? paginatedAset.map((a) => a.id) : []);
    }

    // --- Single approve/reject ---
    async function handleApprove(id, status) {
        try {
            const catatan = status === 'rejected' ? prompt('Alasan reject?') : null;
            if (status === 'rejected' && !catatan) return;
            await axiosClient.patch(`/aset/${id}/validasi`, {
                status_validasi: status,
                validated_by: user.id,
                catatan_validasi: catatan
            });
            fetchAset();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal update status');
        }
    }

    // --- Bulk approve/reject ---
    async function handleBulkAction(status) {
        // Saring hanya yang statusnya pending
        const pendingIds = selectedIds.filter((id) => {
            const aset = asetData.find((a) => a.id === id);
            return aset?.status_validasi === 'pending';
        });

        if (pendingIds.length === 0) {
            alert('Tidak ada aset berstatus pending dari pilihan yang dipilih.');
            return;
        }

        let catatan = null;
        if (status === 'rejected') {
            catatan = prompt(`Alasan reject untuk ${pendingIds.length} aset?`);
            if (!catatan) return;
        }

        setBulkLoading(true);
        try {
            await Promise.all(
                pendingIds.map((id) =>
                    axiosClient.patch(`/aset/${id}/validasi`, {
                        status_validasi: status,
                        validated_by: user.id,
                        catatan_validasi: catatan
                    })
                )
            );
            setSelectedIds([]);
            fetchAset();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal bulk update status');
        } finally {
            setBulkLoading(false);
        }
    }

    // --- Delete ---
    async function handleDeleteConfirm() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await axiosClient.delete(`/aset/${deleteTarget.id}`);
            setDeleteTarget(null);
            fetchAset();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menghapus aset');
        } finally {
            setDeleting(false);
        }
    }

    const totalPages = Math.max(1, Math.ceil(asetData.length / pageSize));
    const paginatedAset = asetData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    function handlePageChange(page) {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    }

    // Count pending in selection (for bulk action info)
    const pendingSelectedCount = selectedIds.filter((id) => {
        const aset = asetData.find((a) => a.id === id);
        return aset?.status_validasi === 'pending';
    }).length;

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-navy">Inventaris Aset</h2>
                        <button
                            onClick={() => navigate('/aset/tambah')}
                            className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg font-bold hover:opacity-90 w-fit"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Tambah Aset
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
                        <select
                            value={filterKategori}
                            onChange={(e) => setFilterKategori(e.target.value)}
                            className="px-3 py-1.5 bg-card border border-border rounded-full text-sm text-text-muted"
                        >
                            <option value="">Semua Kategori</option>
                            {kategoriList.map((k) => (
                                <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                            ))}
                        </select>
                        {['', 'pending', 'approved', 'rejected'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterValidasi(s)}
                                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                                    filterValidasi === s ? 'bg-card-strong text-navy font-bold' : 'bg-card border border-border text-text-muted'
                                }`}
                            >
                                {s === '' ? 'Semua Status' : s}
                            </button>
                        ))}
                    </div>

                    {/* Bulk Action Bar — tampil saat ada pilihan */}
                    {selectedIds.length > 0 && (
                        <div className="mb-3 flex items-center gap-3 flex-wrap bg-card border border-border rounded-xl px-4 py-3">
                            <span className="font-semibold text-navy text-sm">
                                {selectedIds.length} aset dipilih
                                {user?.role === 'admin' && pendingSelectedCount > 0 && (
                                    <span className="text-text-muted font-normal"> ({pendingSelectedCount} pending)</span>
                                )}
                            </span>
                            {user?.role === 'admin' && (
                                <>
                                    <button
                                        onClick={() => handleBulkAction('approved')}
                                        disabled={bulkLoading || pendingSelectedCount === 0}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] text-sm font-semibold hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                    >
                                        {bulkLoading ? (
                                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                        )}
                                        Approve Semua
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('rejected')}
                                        disabled={bulkLoading || pendingSelectedCount === 0}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-sm font-semibold hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                    >
                                        {bulkLoading ? (
                                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                                        )}
                                        Reject Semua
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setSelectedIds([])}
                                className="ml-auto text-text-muted hover:text-navy text-sm flex items-center gap-1 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                                Batal pilih
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-card-alt border-b border-border">
                                    <tr>
                                        <th className="p-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                onChange={toggleSelectAll}
                                                checked={paginatedAset.length > 0 && paginatedAset.every((a) => selectedIds.includes(a.id))}
                                                ref={(el) => {
                                                    if (el) {
                                                        const someChecked = paginatedAset.some((a) => selectedIds.includes(a.id));
                                                        const allChecked = paginatedAset.length > 0 && paginatedAset.every((a) => selectedIds.includes(a.id));
                                                        el.indeterminate = someChecked && !allChecked;
                                                    }
                                                }}
                                            />
                                        </th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Nama Aset</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Kategori</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Lokasi</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Kondisi</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Status</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider text-left">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading && (
                                        <tr><td colSpan={7} className="p-8 text-center text-text-muted">Memuat data...</td></tr>
                                    )}
                                    {!loading && asetData.length === 0 && (
                                        <tr><td colSpan={7} className="p-8 text-center text-text-muted">Belum ada data aset</td></tr>
                                    )}
                                    {paginatedAset.map((aset) => (
                                        <tr key={aset.id} className={`hover:bg-card-hover transition-colors ${selectedIds.includes(aset.id) ? 'bg-card-alt/40' : ''}`}>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(aset.id)}
                                                    onChange={() => toggleSelect(aset.id)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-card-strong rounded flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-navy text-[18px]">construction</span>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/peta?selectedId=${aset.id}`)}
                                                        className="font-semibold text-sm text-navy hover:underline text-left"
                                                        title="Lihat di Peta"
                                                    >
                                                        {aset.nama_aset}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-text-muted">{aset.kategori_aset?.nama_kategori}</td>
                                            <td className="p-3 text-sm text-text-muted">KM {aset.lokasi_km} Jalur {aset.jalur}</td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${conditionBadge[aset.status_kondisi]}`}>
                                                    {conditionLabel[aset.status_kondisi]}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${validasiBadge[aset.status_validasi]}`}>
                                                    {aset.status_validasi}
                                                </span>
                                            </td>
                                            <td className="p-3 text-left">
                                                <div className="flex items-center gap-1 justify-start">
                                                    <button
                                                        onClick={() => navigate(`/peta?selectedId=${aset.id}`)}
                                                        className="p-2 rounded-lg bg-card-strong hover:bg-amber transition-colors"
                                                        title="Lihat Detail di Peta"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </button>
                                                    {(user?.role === 'admin' || user?.role === 'operator') && (
                                                        <button
                                                            onClick={() => navigate(`/aset/edit/${aset.id}`)}
                                                            className="p-2 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber transition-colors"
                                                            title="Edit / Update Aset"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    )}
                                                    {user?.role === 'admin' && aset.status_validasi === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(aset.id, 'approved')}
                                                                className="p-2 rounded-lg bg-[#D1FAE5] text-[#065F46] hover:opacity-80"
                                                                title="Approve"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">check</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleApprove(aset.id, 'rejected')}
                                                                className="p-2 rounded-lg bg-[#FEE2E2] text-[#991B1B] hover:opacity-80"
                                                                title="Reject"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    {user?.role === 'admin' && (
                                                        <button
                                                            onClick={() => setDeleteTarget({ id: aset.id, nama: aset.nama_aset })}
                                                            className="p-2 rounded-lg bg-[#FEE2E2] text-[#991B1B] hover:opacity-80 transition-colors"
                                                            title="Hapus Aset"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="p-3 flex items-center justify-between bg-card-alt/50 border-t border-border text-sm text-text-muted flex-wrap gap-3">
                            {/* Kiri: info + page size */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <span>
                                    {loading
                                        ? 'Memuat...'
                                        : asetData.length === 0
                                        ? 'Tidak ada data'
                                        : `Menampilkan ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, asetData.length)} dari ${asetData.length} aset`}
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
                            {!loading && asetData.length > pageSize && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-border text-text-muted hover:bg-card-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Halaman pertama"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">first_page</span>
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
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
                                                    onClick={() => handlePageChange(item)}
                                                    className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium border transition-colors ${
                                                        currentPage === item
                                                            ? 'bg-navy text-white border-navy'
                                                            : 'border-border text-text-muted hover:bg-card-strong'
                                                    }`}
                                                >
                                                    {item}
                                                </button>
                                            )
                                        )}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg border border-border text-text-muted hover:bg-card-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Berikutnya"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
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

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[#991B1B]">delete_forever</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-navy text-base">Hapus Aset</h3>
                                <p className="text-xs text-text-muted">Tindakan ini tidak dapat dibatalkan</p>
                            </div>
                        </div>
                        <p className="text-sm text-text-muted">
                            Yakin ingin menghapus aset{' '}
                            <span className="font-bold text-navy">"{deleteTarget.nama}"</span>?
                            Semua data termasuk foto akan ikut terhapus.
                        </p>
                        <div className="flex gap-2 justify-end mt-1">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg border border-border text-navy font-semibold text-sm hover:bg-card-hover transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg bg-[#991B1B] text-white font-semibold text-sm hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {deleting ? (
                                    <>
                                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        Ya, Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}