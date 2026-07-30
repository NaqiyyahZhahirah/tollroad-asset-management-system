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

export default function AsetList() {
    const [asetData, setAsetData] = useState([]);
    const [kategoriList, setKategoriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterKategori, setFilterKategori] = useState('');
    const [filterValidasi, setFilterValidasi] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        axiosClient.get('/kategori').then((res) => setKategoriList(res.data.data));
    }, []);

    useEffect(() => {
        fetchAset();
    }, [filterKategori, filterValidasi]);

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
        setSelectedIds(e.target.checked ? asetData.map((a) => a.id) : []);
    }

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

                    {selectedIds.length > 0 && (
                        <div className="mb-3 flex items-center gap-3 text-sm">
                            <span className="font-medium text-navy">{selectedIds.length} aset dipilih</span>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-card-alt border-b border-border">
                                    <tr>
                                        <th className="p-3 w-10 text-center">
                                            <input type="checkbox" onChange={toggleSelectAll} />
                                        </th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Nama Aset</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Kategori</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Lokasi</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Kondisi</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider">Status</th>
                                        <th className="p-3 text-xs text-text-muted uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading && (
                                        <tr><td colSpan={7} className="p-8 text-center text-text-muted">Memuat data...</td></tr>
                                    )}
                                    {!loading && asetData.length === 0 && (
                                        <tr><td colSpan={7} className="p-8 text-center text-text-muted">Belum ada data aset</td></tr>
                                    )}
                                    {asetData.map((aset) => (
                                        <tr key={aset.id} className="hover:bg-card-hover transition-colors">
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
                                                    <span className="font-semibold text-sm">{aset.nama_aset}</span>
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
                                            <td className="p-3 text-right">
                                                {user?.role === 'admin' && aset.status_validasi === 'pending' ? (
                                                    <div className="flex gap-1 justify-end">
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
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => navigate(`/aset/${aset.id}`)}
                                                        className="p-2 rounded-lg bg-card-strong hover:bg-amber transition-colors">
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-3 flex items-center justify-between bg-card-alt/50 border-t border-border text-sm text-text-muted">
                            <span>Menampilkan {asetData.length} aset</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}