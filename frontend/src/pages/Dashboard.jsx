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

export default function Dashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, pending: 0, rusak: 0 });
    const [recentAset, setRecentAset] = useState([]);
    const [loading, setLoading] = useState(true);

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

            setRecentAset(allData.slice(0, 5));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                                        <th className="py-3 px-3 text-xs text-text-muted uppercase">Status</th>
                                        <th className="py-3 px-3 text-xs text-text-muted uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-border">
                                    {recentAset.map((aset) => (
                                        <tr key={aset.id} className="hover:bg-card-hover transition-colors">
                                            <td className="py-3 px-3 font-bold text-navy">{aset.nama_aset}</td>
                                            <td className="py-3 px-3 text-text-muted">{aset.kategori_aset?.nama_kategori}</td>
                                            <td className="py-3 px-3 text-text-muted">{aset.lokasi_km}</td>
                                            <td className="py-3 px-3">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${statusBadge[aset.status_kondisi]}`}>
                                                    {statusLabel[aset.status_kondisi]}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <button
                                                    onClick={() => navigate('/aset')}
                                                    className="p-2 rounded-lg bg-card-strong hover:bg-amber transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && recentAset.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center text-text-muted">
                                                Belum ada data aset
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}