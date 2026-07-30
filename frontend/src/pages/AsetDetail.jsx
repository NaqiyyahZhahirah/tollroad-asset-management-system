import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

const actionIcon = { create: 'upload', approve: 'check_circle', reject: 'cancel', update: 'edit' };

export default function AsetDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [aset, setAset] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRejectBox, setShowRejectBox] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, [id]);

    async function fetchDetail() {
        setLoading(true);
        try {
            const [asetRes, logRes] = await Promise.all([
                axiosClient.get(`/aset/${id}`),
                axiosClient.get(`/log/${id}`)
            ]);
            setAset(asetRes.data.data);
            setLogs(logRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDecision(status) {
        if (status === 'rejected' && !rejectReason) {
            alert('Isi alasan penolakan dulu');
            return;
        }
        setProcessing(true);
        try {
            await axiosClient.patch(`/aset/${id}/validasi`, {
                status_validasi: status,
                validated_by: user.id,
                catatan_validasi: status === 'rejected' ? rejectReason : null
            });
            await fetchDetail();
            setShowRejectBox(false);
            setRejectReason('');
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal memproses keputusan');
        } finally {
            setProcessing(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex bg-app-bg">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center text-text-muted">Memuat...</main>
            </div>
        );
    }

    if (!aset) {
        return (
            <div className="min-h-screen flex bg-app-bg">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center text-text-muted">Aset tidak ditemukan</main>
            </div>
        );
    }

    const specFields = aset.kategori_aset?.skema_formulir?.fields || [];

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">

                    <nav className="flex items-center gap-2 mb-4 text-sm">
                        <Link to="/aset" className="text-text-muted hover:underline">Daftar Aset</Link>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        <span className="font-bold text-navy">{aset.nama_aset}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left column */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Photo gallery */}
                            <section className="bg-card rounded-xl border border-border p-5">
                                <h2 className="text-lg font-bold text-navy mb-4">Foto Dokumentasi</h2>
                                {aset.foto_aset?.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {aset.foto_aset.map((f) => (
                                            <div key={f.id} className="relative rounded-lg overflow-hidden border border-border aspect-square">
                                                <img src={f.url_foto} alt={f.keterangan} className="w-full h-full object-cover" />
                                                {f.keterangan && (
                                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-navy/60 text-white backdrop-blur-sm">
                                                        <p className="text-xs">{f.keterangan}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-text-muted">Belum ada foto diupload.</p>
                                )}
                            </section>

                            {/* Technical spec */}
                            <section className="bg-card rounded-xl border border-border p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-navy">Spesifikasi Teknis</h2>
                                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                        {aset.status_validasi}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] text-text-muted uppercase font-bold">Kategori</p>
                                        <p className="font-bold text-navy">{aset.kategori_aset?.nama_kategori}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-text-muted uppercase font-bold">Lokasi</p>
                                        <p className="font-bold text-navy">KM {aset.lokasi_km} Jalur {aset.jalur}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-text-muted uppercase font-bold">Kondisi</p>
                                        <p className="font-bold text-navy capitalize">{aset.status_kondisi.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-text-muted uppercase font-bold">Tanggal Dibuat</p>
                                        <p className="font-bold text-navy">{aset.tanggal_aset_dibuat || '-'}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {specFields.map((field) => (
                                        <div key={field.key}>
                                            <p className="text-[10px] text-text-muted uppercase font-bold">{field.label}</p>
                                            <p className="font-bold text-navy">{aset.atribut_spesifik?.[field.key] ?? '-'}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Right column: actions + history */}
                        <div className="lg:col-span-4 space-y-6">
                            {user?.role === 'admin' && aset.status_validasi === 'pending' && (
                                <section className="bg-card rounded-xl border border-border p-5 shadow-sm sticky top-4">
                                    <h2 className="text-lg font-bold text-navy mb-4">Keputusan Review</h2>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleDecision('approved')}
                                            disabled={processing}
                                            className="w-full bg-[#065F46] hover:bg-[#044a36] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                                        >
                                            <span className="material-symbols-outlined">check_circle</span>
                                            Approve Aset
                                        </button>
                                        <button
                                            onClick={() => setShowRejectBox(true)}
                                            disabled={processing}
                                            className="w-full border-2 border-danger text-danger py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">cancel</span>
                                            Reject
                                        </button>

                                        {showRejectBox && (
                                            <div className="space-y-2 pt-2">
                                                <label className="text-xs font-bold text-text-muted uppercase">Alasan Penolakan</label>
                                                <textarea
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    rows={3}
                                                    className="w-full border border-border rounded-lg p-2 text-sm"
                                                    placeholder="Jelaskan alasan reject..."
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDecision('rejected')}
                                                        disabled={processing}
                                                        className="flex-1 bg-danger text-white py-2 rounded-lg font-bold text-sm"
                                                    >
                                                        Konfirmasi Reject
                                                    </button>
                                                    <button
                                                        onClick={() => setShowRejectBox(false)}
                                                        className="flex-1 bg-card-alt text-text-muted py-2 rounded-lg font-bold text-sm"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {aset.status_validasi !== 'pending' && (
                                <section className="bg-card rounded-xl border border-border p-5">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined ${aset.status_validasi === 'approved' ? 'text-[#065F46]' : 'text-danger'}`}>
                                            {aset.status_validasi === 'approved' ? 'check_circle' : 'cancel'}
                                        </span>
                                        <span className="font-bold capitalize">{aset.status_validasi}</span>
                                    </div>
                                    {aset.catatan_validasi && (
                                        <p className="text-sm text-text-muted mt-2">"{aset.catatan_validasi}"</p>
                                    )}
                                </section>
                            )}

                            {/* History */}
                            <section className="bg-card rounded-xl border border-border p-5">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Riwayat Aktivitas</h3>
                                <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                                    {logs.map((log) => (
                                        <div key={log.id} className="relative flex gap-3 pl-8">
                                            <div className="absolute left-0 w-6 h-6 rounded-full bg-amber flex items-center justify-center border-4 border-card">
                                                <span className="material-symbols-outlined text-[12px] text-amber-text">
                                                    {actionIcon[log.aksi] || 'circle'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-navy text-sm leading-tight capitalize">{log.aksi}</p>
                                                <p className="text-xs text-text-muted">
                                                    {log.users?.nama || 'System'} • {new Date(log.created_at).toLocaleString('id-ID')}
                                                </p>
                                                {log.keterangan && <p className="text-xs text-text-muted italic mt-1">{log.keterangan}</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {logs.length === 0 && <p className="text-sm text-text-muted">Belum ada riwayat.</p>}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}