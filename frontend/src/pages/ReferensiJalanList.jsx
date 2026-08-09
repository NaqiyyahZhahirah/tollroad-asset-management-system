import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useToast } from '../components/Toast';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const KATEGORI_OPTIONS = [
    { value: 'main_road', label: 'Main Road' },
    { value: 'ramp', label: 'Ramp / Akses' },
    { value: 'gerbang_tol', label: 'Gerbang Tol' },
    { value: 'patok_heksa', label: 'Patok Heksa' }
];
const KATEGORI_LABEL_MAP = Object.fromEntries(KATEGORI_OPTIONS.map((o) => [o.value, o.label]));

const kategoriBadge = {
    main_road: 'bg-amber-100 text-amber-800',
    ramp: 'bg-purple-100 text-purple-800',
    gerbang_tol: 'bg-red-100 text-red-800',
    patok_heksa: 'bg-gray-200 text-gray-700'
};

export default function ReferensiJalanList() {
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterKategori, setFilterKategori] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterKategori, searchQuery, pageSize]);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await axiosClient.get('/referensi-jalan');
            setDataList(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteConfirm() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await axiosClient.delete(`/referensi-jalan/${deleteTarget.id}`);
            toast.success('Data berhasil dihapus');
            setDeleteTarget(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menghapus data');
        } finally {
            setDeleting(false);
        }
    }

    const filteredList = dataList
        .filter((d) => !filterKategori || d.kategori === filterKategori)
        .filter((d) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                (d.nama || '').toLowerCase().includes(q) ||
                (d.sub_ruas || '').toLowerCase().includes(q) ||
                KATEGORI_LABEL_MAP[d.kategori]?.toLowerCase().includes(q)
            );
        });

    const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
    const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    function handlePageChange(page) {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    }

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-navy">Data Referensi Jalan</h2>
                        <button
                            onClick={() => navigate('/referensi-jalan/tambah')}
                            className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg font-bold hover:opacity-90 w-fit"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Tambah Data
                        </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[16px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama / sub ruas..."
                                className="h-9 pl-8 pr-3 bg-card border border-border focus:border-amber rounded-full text-sm text-navy w-56 focus:outline-none"
                            />
                        </div>
                        <select
                            value={filterKategori}
                            onChange={(e) => setFilterKategori(e.target.value)}
                            className="h-9 pl-3 pr-8 bg-card border border-border focus:border-amber rounded-full text-sm text-text-muted cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat transition-colors"
                        >
                            <option value="">Semua Kategori</option>
                            {KATEGORI_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-card border border-border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-navy text-white">
                                    <tr>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider">Nama</th>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider">Kategori</th>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider">Sub Ruas / Jalur</th>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider">Lokasi KM</th>
                                        <th className="p-3 text-xs font-bold text-white/90 uppercase tracking-wider text-left">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading && (
                                        <tr><td colSpan={5} className="p-8 text-center text-text-muted">Memuat data...</td></tr>
                                    )}
                                    {!loading && filteredList.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-text-muted">
                                            {searchQuery || filterKategori ? 'Tidak ada data yang cocok.' : 'Belum ada data referensi jalan.'}
                                        </td></tr>
                                    )}
                                    {paginatedList.map((item) => (
                                        <tr key={item.id} className="hover:bg-card-hover transition-colors">
                                            <td className="p-3 font-semibold text-sm text-navy">{item.nama || '-'}</td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${kategoriBadge[item.kategori]}`}>
                                                    {KATEGORI_LABEL_MAP[item.kategori]}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-text-muted">
                                                {item.sub_ruas || '-'} {item.jalur ? `Jalur ${item.jalur}` : ''}
                                            </td>
                                            <td className="p-3 text-sm text-text-muted">{item.lokasi_km ?? '-'}</td>
                                            <td className="p-3 text-left">
                                                <div className="flex items-center gap-1 justify-start">
                                                    <button
                                                        onClick={() => navigate(`/referensi-jalan/edit/${item.id}`)}
                                                        className="p-2 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber transition-colors"
                                                        title="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(item)}
                                                        className="p-2 rounded-lg bg-[#FEE2E2] text-[#991B1B] hover:opacity-80 transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                                                    </div>

                                                    <div className="p-3 flex items-center justify-between bg-card-alt/50 border-t border-border text-sm text-text-muted flex-wrap gap-3">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span>
                                                                {loading
                                                                    ? 'Memuat...'
                                                                    : filteredList.length === 0
                                                                    ? 'Tidak ada data'
                                                                    : `Menampilkan ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredList.length)} dari ${filteredList.length} data`}
                                                            </span>
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

                                                        {!loading && filteredList.length > pageSize && (
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

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[#991B1B]">delete_forever</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-navy text-base">Hapus Data</h3>
                                <p className="text-xs text-text-muted">Tindakan ini tidak dapat dibatalkan</p>
                            </div>
                        </div>
                        <p className="text-sm text-text-muted">
                            Yakin ingin menghapus{' '}
                            <span className="font-bold text-navy">"{deleteTarget.nama || KATEGORI_LABEL_MAP[deleteTarget.kategori]}"</span>?
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
                                className="px-4 py-2 rounded-lg bg-[#991B1B] text-white font-semibold text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
                            >
                                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}