import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

const statusBadge = {
    baik: 'bg-[#D1FAE5] text-[#065F46]',
    perlu_perawatan: 'bg-[#FEF3C7] text-[#92400E]',
    rusak: 'bg-[#FEE2E2] text-[#991B1B]'
};
const statusLabel = { baik: 'Baik', perlu_perawatan: 'Perlu Perawatan', rusak: 'Rusak' };

const validasiBadge = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-[#D1FAE5] text-[#065F46]',
    rejected: 'bg-[#FEE2E2] text-[#991B1B]'
};

const PAGE_SIZE = 5;

export default function Dashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, pending: 0, rusak: 0 });
    const [recentAset, setRecentAset] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        setLoading(true);
        try {
            const [allRes, pendingRes] = await Promise.all([
                axiosClient.get('/aset'),
                axiosClient.get('/aset', { params: { status_validasi: 'pending' } })
            ]);

            const allData = allRes.data.data;
            const rusakCount = allData.filter((a) => a.status_kondisi === 'rusak').length;

            setStats({
                total: allData.length,
                pending: pendingRes.data.data.length,
                rusak: rusakCount
            });

            setRecentAset(allData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const totalPages = Math.max(1, Math.ceil(recentAset.length / PAGE_SIZE));
    const paginatedAset = recentAset.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    function handlePageChange(page) {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    }

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-grow flex flex-col overflow-hidden">
                <TopBar />
                <section className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6 pb-20 md:pb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-navy">
                                Halo, {user?.nama}
                            </h2>
                            <p className="text-text-muted mt-1 capitalize">
                                Role: {user?.role} — {user?.wilayah_kerja}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/aset/tambah')}
                            className="bg-navy text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 w-fit"
                        >
                            <span className="material-symbols-outlined">add_box</span>
                            Tambah Aset Baru
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-card border border-border p-5 rounded-xl">
                            <div className="flex justify-between items-start">
                                <span className="text-xs text-text-muted uppercase font-semibold">Total Aset</span>
                                <div className="p-2 bg-card-alt text-navy rounded-lg">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                            </div>
                            <div className="text-3xl font-bold mt-4">{loading ? '...' : stats.total}</div>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-xl">
                            <div className="flex justify-between items-start">
                                <span className="text-xs text-text-muted uppercase font-semibold">Menunggu Approval</span>
                                <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                                    <span className="material-symbols-outlined">pending_actions</span>
                                </div>
                            </div>
                            <div className="text-3xl font-bold mt-4">{loading ? '...' : stats.pending}</div>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-xl">
                            <div className="flex justify-between items-start">
                                <span className="text-xs text-text-muted uppercase font-semibold">Kondisi Rusak</span>
                                <div className="p-2 bg-red-50 text-red-700 rounded-lg">
                                    <span className="material-symbols-outlined">error_outline</span>
                                </div>
                            </div>
                            <div className="text-3xl font-bold mt-4 text-danger">{loading ? '...' : stats.rusak}</div>
                        </div>
                    </div>

                    {/* Recent Activity Table */}
                    <div className="bg-card border border-border p-5 rounded-xl">
                        <h3 className="text-lg font-bold text-navy mb-4">Aset Terbaru</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-3 px-3 text-xs text-text-muted uppercase">Nama Aset</th>
                                        <th className="py-3 px-3 text-xs text-text-muted uppercase">Kategori</th>
                                        <th className="py-3 px-3 text-xs text-text-muted uppercase">KM</th>
                                        <th className="py-3 px-3 text-xs text-text-muted uppercase">Jalur</th>
                                        <th className="py-3 px-3 text-xs text-text-muted uppercase">Status Kondisi</th>
                                        <th className="py-3 px-3 text-xs text-text-muted uppercase">Approval</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-border">
                                    {loading && (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-text-muted">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    )}
                                    {paginatedAset.map((aset) => (
                                        <tr key={aset.id} className="hover:bg-card-hover transition-colors">
                                            <td className="py-3 px-3 font-bold text-navy">{aset.nama_aset}</td>
                                            <td className="py-3 px-3 text-text-muted">{aset.kategori_aset?.nama_kategori}</td>
                                            <td className="py-3 px-3 text-text-muted">{aset.lokasi_km}</td>
                                            <td className="py-3 px-3 text-text-muted">{aset.jalur ?? '-'}</td>
                                            <td className="py-3 px-3">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${statusBadge[aset.status_kondisi]}`}>
                                                    {statusLabel[aset.status_kondisi]}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${validasiBadge[aset.status_validasi]}`}>
                                                    {aset.status_validasi}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && recentAset.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-text-muted">
                                                Belum ada data aset
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && recentAset.length > 0 && (
                            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                                <span className="text-sm text-text-muted">
                                    Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, recentAset.length)} dari {recentAset.length} aset
                                </span>
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
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}