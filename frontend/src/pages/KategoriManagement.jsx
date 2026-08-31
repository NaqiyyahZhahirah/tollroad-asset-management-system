import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useToast } from '../components/Toast';

export default function KategoriManagement() {
    const [kategoriList, setKategoriList] = useState([]);
    const [editingKategori, setEditingKategori] = useState(null);
    const [namaKategori, setNamaKategori] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [tipeGeometri, setTipeGeometri] = useState('');
    const [naikkanVersi, setNaikkanVersi] = useState(false);
    const [fields, setFields] = useState([]);
    
    const [isAktifOpen, setIsAktifOpen] = useState(true);
    const [isNonaktifOpen, setIsNonaktifOpen] = useState(true);

    const [draggedIndex, setDraggedIndex] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null); 

    const [kelompokList, setKelompokList] = useState([]);
    const [kelompokId, setKelompokId] = useState('');
    const [showTambahKelompok, setShowTambahKelompok] = useState(false);
    const [namaKelompokBaru, setNamaKelompokBaru] = useState('');
    const [deskripsiKelompokBaru, setDeskripsiKelompokBaru] = useState('');

    const { user } = useAuthStore();
    const toast = useToast();

    useEffect(() => {
        fetchKategori();
        fetchKelompok();
    }, []);

    async function fetchKategori() {
        try {
            const res = await axiosClient.get('/kategori?include_inactive=true');
            setKategoriList(res.data.data || []);
        } catch (err) {
            console.error('Error fetching kategori:', err);
        }
    }

    async function fetchKelompok() {
        try {
            const res = await axiosClient.get('/kelompok');
            setKelompokList(res.data.data || []);
        } catch (err) {
            console.error('Error fetching kelompok:', err);
        }
    }

    async function handleTambahKelompok(e) {
        e.preventDefault();
        if (!namaKelompokBaru.trim()) return;

        try {
            await axiosClient.post('/kelompok', {
                nama_kelompok: namaKelompokBaru,
                deskripsi: deskripsiKelompokBaru
            });
            toast.success('Kelompok berhasil ditambahkan');
            setNamaKelompokBaru('');
            setDeskripsiKelompokBaru('');
            setShowTambahKelompok(false);
            fetchKelompok();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menambahkan kelompok');
        }
    }

    function generateKeyFromLabel(label) {
        if (!label) return '';
        return label
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function resetForm() {
        setEditingKategori(null);
        setNamaKategori('');
        setDeskripsi('');
        setTipeGeometri('');
        setKelompokId(''); 
        setNaikkanVersi(false);
        setFields([]);
    }

    function startEdit(kategori) {
        setEditingKategori(kategori);
        setNamaKategori(kategori.nama_kategori || '');
        setDeskripsi(kategori.deskripsi || '');
        setTipeGeometri(kategori.tipe_geometri || '');
        setKelompokId(kategori.kelompok_id || '');
        setNaikkanVersi(false);
        
        const loadedFields = kategori.skema_formulir?.fields || [];
        if (loadedFields.length > 0) {
            setFields(loadedFields.map(f => {
                let parsedOpts = [''];
                if (Array.isArray(f.options)) {
                    parsedOpts = f.options.length > 0 ? f.options : [''];
                } else if (typeof f.options === 'string' && f.options.trim()) {
                    parsedOpts = f.options.split(',').map(o => o.trim()).filter(Boolean);
                    if (parsedOpts.length === 0) parsedOpts = [''];
                }

                return {
                    key: f.key || generateKeyFromLabel(f.label || ''),
                    label: f.label || '',
                    type: f.type || 'text',
                    required: !!f.required,
                    options: parsedOpts
                };
            }));
        } else {
            setFields([]);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function addField() {
        setFields([...fields, { key: '', label: '', type: 'text', required: false, options: [''] }]);
    }

    function removeField(index) {
        setFields(fields.filter((_, i) => i !== index));
    }

    function updateField(index, key, value) {
        const updated = [...fields];
        updated[index][key] = value;

        if (key === 'label') {
            updated[index]['key'] = generateKeyFromLabel(value);
        }

        if (key === 'type' && value === 'select') {
            if (!Array.isArray(updated[index].options) || updated[index].options.length === 0) {
                updated[index].options = [''];
            }
        }

        setFields(updated);
    }

    function addOption(fieldIndex) {
        const updated = [...fields];
        const currentOpts = Array.isArray(updated[fieldIndex].options) ? updated[fieldIndex].options : [];
        updated[fieldIndex].options = [...currentOpts, ''];
        setFields(updated);
    }

    function updateOption(fieldIndex, optionIndex, value) {
        const updated = [...fields];
        const currentOpts = Array.isArray(updated[fieldIndex].options) ? [...updated[fieldIndex].options] : [];
        currentOpts[optionIndex] = value;
        updated[fieldIndex].options = currentOpts;
        setFields(updated);
    }

    function removeOption(fieldIndex, optionIndex) {
        const updated = [...fields];
        const currentOpts = Array.isArray(updated[fieldIndex].options) ? updated[fieldIndex].options : [];
        if (currentOpts.length <= 1) return;
        updated[fieldIndex].options = currentOpts.filter((_, i) => i !== optionIndex);
        setFields(updated);
    }

    function handleDragStart(e, index) {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e, index) {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const updatedFields = [...fields];
        const [draggedItem] = updatedFields.splice(draggedIndex, 1);
        updatedFields.splice(index, 0, draggedItem);
        setDraggedIndex(index);
        setFields(updatedFields);
    }

    function handleDragEnd() {
        setDraggedIndex(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const skema_formulir = {
            fields: fields.map((f) => ({
                key: f.key || generateKeyFromLabel(f.label),
                label: f.label,
                type: f.type,
                required: f.required,
                ...(f.type === 'select'
                    ? {
                        options: (Array.isArray(f.options)
                            ? f.options
                            : typeof f.options === 'string'
                            ? f.options.split(',')
                            : []
                        )
                            .map((o) => o.trim())
                            .filter(Boolean)
                      }
                    : {})
            }))
        };

        try {
            if (editingKategori) {
                await axiosClient.patch(`/kategori/${editingKategori.id}`, {
                    nama_kategori: namaKategori,
                    deskripsi,
                    tipe_geometri: tipeGeometri,
                    kelompok_id: kelompokId || null,   // ← tambah ini
                    skema_formulir,
                    naikkan_versi: naikkanVersi
                });
                toast.success('Kategori berhasil diperbarui!');
            } else {
                await axiosClient.post('/kategori', {
                    nama_kategori: namaKategori,
                    deskripsi,
                    tipe_geometri: tipeGeometri,
                    kelompok_id: kelompokId || null,   // ← tambah ini
                    skema_formulir,
                    created_by: user?.id
                });
                toast.success('Kategori berhasil dibuat!');
            }

            resetForm();
            fetchKategori();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan kategori');
        }
    }

    function handleDeactivate(id) {
        setConfirmModal({
            title: 'Nonaktifkan Kategori',
            message: 'Kategori ini akan dinonaktifkan dari sistem.',
            onConfirm: async () => {
                try {
                    await axiosClient.patch(`/kategori/${id}/deactivate`);
                    toast.success('Kategori berhasil dinonaktifkan');
                    if (editingKategori?.id === id) resetForm();
                    fetchKategori();
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Gagal menonaktifkan kategori');
                } finally {
                    setConfirmModal(null);
                }
            }
        });
    }

    function handleDelete(kategori) {
        setConfirmModal({
            title: 'Hapus Kategori Permanen',
            message: `Apakah Anda yakin ingin menghapus kategori "${kategori.nama_kategori}" secara permanen?`,
            danger: true,
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/kategori/${kategori.id}`);
                    toast.success(`Kategori "${kategori.nama_kategori}" berhasil dihapus`);
                    if (editingKategori?.id === kategori.id) resetForm();
                    fetchKategori();
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Gagal menghapus kategori');
                } finally {
                    setConfirmModal(null);
                }
            }
        });
    }

    function handleActivate(id) {
        setConfirmModal({
            title: 'Aktifkan Kategori',
            message: 'Kategori ini akan diaktifkan kembali.',
            onConfirm: async () => {
                try {
                    await axiosClient.patch(`/kategori/${id}/activate`);
                    toast.success('Kategori berhasil diaktifkan kembali');
                    fetchKategori();
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Gagal mengaktifkan kategori');
                } finally {
                    setConfirmModal(null);
                }
            }
        });
    }

    const activeKategori = kategoriList.filter((k) => k.is_active !== false);
    const inactiveKategori = kategoriList.filter((k) => k.is_active === false);

    return (
        <div className="min-h-screen flex bg-[#f8f9ff]">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />

                <section className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">

                        <div className="space-y-4">
                            <section className="bg-white border border-[#c5c6cd] rounded-[0.25rem] overflow-hidden shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setIsAktifOpen(!isAktifOpen)}
                                    className="w-full px-5 py-4 border-b border-navy/30 bg-navy text-white flex items-center justify-between hover:opacity-95 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-white text-xl">
                                            {isAktifOpen ? 'expand_more' : 'chevron_right'}
                                        </span>
                                        <h1 className="text-[17px] font-bold text-white">
                                            Kategori Aktif
                                        </h1>
                                        <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-amber text-navy">
                                            {activeKategori.length}
                                        </span>
                                    </div>
                                </button>

                                {isAktifOpen && (
                                    <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto">
                                        {activeKategori.map((k) => {
                                            const isSelected = editingKategori?.id === k.id;
                                            return (
                                                <div
                                                    key={k.id}
                                                    className={`group flex justify-between items-center p-3 bg-white border rounded-[0.25rem] transition-all ${
                                                        isSelected
                                                            ? 'border-[#fea619] ring-2 ring-[#fea619]/20 bg-[#fffdfa]'
                                                            : 'border-[#c5c6cd] hover:border-[#fea619] hover:shadow-sm'
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-[#0b1c30]">{k.nama_kategori}</p>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <p className="text-[11px] uppercase tracking-widest text-[#45474c]">
                                                                v{k.versi_skema}
                                                            </p>
                                                            {k.kelompok_aset?.nama_kelompok && (
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#091426] border border-[#c5c6cd]">
                                                                    {k.kelompok_aset.nama_kelompok}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => startEdit(k)}
                                                            className="h-7 px-2.5 text-[#091426] hover:bg-[#091426]/10 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                                                            title="Edit Kategori"
                                                        >
                                                            <span className="material-symbols-outlined text-[15px]">edit</span>
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeactivate(k.id)}
                                                            className="h-7 px-2.5 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 text-xs font-bold rounded flex items-center justify-center transition-colors"
                                                        >
                                                            Nonaktifkan
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {activeKategori.length === 0 && (
                                            <p className="text-sm text-[#45474c] italic py-2 text-center">
                                                Tidak ada kategori aktif.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </section>

                            <section className="bg-white border border-[#c5c6cd] rounded-[0.25rem] overflow-hidden shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setIsNonaktifOpen(!isNonaktifOpen)}
                                    className="w-full px-5 py-4 border-b border-navy/30 bg-navy/90 text-white flex items-center justify-between hover:opacity-95 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-white/80 text-xl">
                                            {isNonaktifOpen ? 'expand_more' : 'chevron_right'}
                                        </span>
                                        <h1 className="text-[17px] font-bold text-white">
                                            Kategori Nonaktif
                                        </h1>
                                        <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-200 border border-red-400/30">
                                            {inactiveKategori.length}
                                        </span>
                                    </div>
                                </button>

                                {isNonaktifOpen && (
                                    <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto bg-[#fafafa]">
                                        {inactiveKategori.map((k) => {
                                            const isSelected = editingKategori?.id === k.id;
                                            return (
                                                <div
                                                    key={k.id}
                                                    className={`group flex justify-between items-center p-3 bg-white border rounded-[0.25rem] transition-all opacity-85 hover:opacity-100 ${
                                                        isSelected
                                                            ? 'border-[#fea619] ring-2 ring-[#fea619]/20'
                                                            : 'border-[#e0e0e0] hover:border-[#091426]'
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-[#45474c] line-through decoration-1">
                                                            {k.nama_kategori}
                                                        </p>
                                                        <p className="text-[11px] uppercase tracking-widest text-[#75777c] mt-1">
                                                            v{k.versi_skema}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(k)}
                                                            className="h-7 px-2.5 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                                                            title="Hapus Kategori Permanen"
                                                        >
                                                            <span className="material-symbols-outlined text-[15px]">delete</span>
                                                            Hapus
                                                        </button>
                                                        <button
                                                            onClick={() => handleActivate(k.id)}
                                                            className="h-7 px-2.5 text-[#107c41] hover:bg-[#107c41]/10 text-xs font-bold rounded flex items-center justify-center transition-colors"
                                                        >
                                                            Aktifkan
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {inactiveKategori.length === 0 && (
                                            <p className="text-sm text-[#75777c] italic py-2 text-center">
                                                Tidak ada kategori nonaktif.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>

                        <section className="bg-white border border-[#c5c6cd] rounded-[0.25rem] overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-navy/30 bg-navy text-white flex items-center justify-between">
                                <div>
                                    <h1 className="text-[20px] font-bold text-white">
                                        {editingKategori ? `Edit Kategori: ${editingKategori.nama_kategori}` : 'Buat Kategori Baru'}
                                    </h1>
                                    <p className="text-sm text-gray-300 mt-1">
                                        {editingKategori
                                            ? `Mengubah definisi atribut dan skema kategori (Versi Saat Ini: v${editingKategori.versi_skema}).`
                                            : 'Definisikan atribut spesifik untuk kategori ini.'}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-[#0b1c30] mb-1.5">
                                        Nama Kategori
                                    </label>
                                    <input
                                        placeholder="Nama Kategori"
                                        value={namaKategori}
                                        onChange={(e) => setNamaKategori(e.target.value)}
                                        className="w-full h-11 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-3 text-sm transition-colors bg-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#0b1c30] mb-1.5">
                                        Deskripsi
                                    </label>
                                    <input
                                        placeholder="Deskripsi"
                                        value={deskripsi}
                                        onChange={(e) => setDeskripsi(e.target.value)}
                                        className="w-full h-11 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-3 text-sm transition-colors bg-white"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-bold text-[#0b1c30]">
                                            Kelompok Aset
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowTambahKelompok(!showTambahKelompok)}
                                            className="text-xs font-bold text-[#855300] flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">add_circle</span>
                                            <span className="hover:underline">Kelompok Baru</span>
                                        </button>
                                    </div>

                                    {showTambahKelompok && (
                                        <div className="mb-2 p-3 bg-[#eff4ff] border border-[#c5c6cd] rounded-[0.25rem] space-y-2">
                                            <input
                                                placeholder="Nama Kelompok (misal: Struktur)"
                                                value={namaKelompokBaru}
                                                onChange={(e) => setNamaKelompokBaru(e.target.value)}
                                                className="w-full h-9 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-3 text-sm bg-white"
                                            />
                                            <input
                                                placeholder="Deskripsi (opsional)"
                                                value={deskripsiKelompokBaru}
                                                onChange={(e) => setDeskripsiKelompokBaru(e.target.value)}
                                                className="w-full h-9 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-3 text-sm bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleTambahKelompok}
                                                className="w-full h-9 bg-[#091426] text-white text-xs font-bold rounded-[0.125rem] hover:opacity-90"
                                            >
                                                Simpan Kelompok
                                            </button>
                                        </div>
                                    )}

                                    <select
                                        value={kelompokId}
                                        onChange={(e) => setKelompokId(e.target.value)}
                                        className={`w-full h-11 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] pl-3 pr-8 text-sm transition-colors bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat ${
                                            !kelompokId ? 'text-[#9ca3af]' : 'text-[#0b1c30]'
                                        }`}
                                        required
                                    >
                                        <option value="" disabled hidden>
                                            Pilih Kelompok Aset
                                        </option>
                                        {kelompokList.map((k) => (
                                            <option key={k.id} value={k.id} className="text-[#0b1c30]">{k.nama_kelompok}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#0b1c30] mb-1.5">
                                        Tipe Geometri di Peta <span className="text-[#ba1a1a]">*</span>
                                    </label>
                                    <select
                                        value={tipeGeometri}
                                        onChange={(e) => setTipeGeometri(e.target.value)}
                                        className={`w-full h-11 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] pl-3 pr-8 text-sm transition-colors bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat ${
                                            !tipeGeometri ? 'text-[#9ca3af]' : 'text-[#0b1c30]'
                                        }`}
                                        required
                                    >
                                        <option value="" disabled hidden>
                                            Pilih Tipe Geometri
                                        </option>
                                        <option value="titik" className="text-[#0b1c30]">Point</option>
                                        <option value="garis" className="text-[#0b1c30]">Polyline</option>
                                        <option value="area" className="text-[#0b1c30]">Polygon</option>
                                    </select>
                                </div>

                                {editingKategori && (
                                    <div className="p-3 bg-[#eff4ff] border border-[#c5c6cd] rounded-[0.25rem]">
                                        <label className="flex items-center gap-2.5 text-xs font-bold text-[#091426] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={naikkanVersi}
                                                onChange={(e) => setNaikkanVersi(e.target.checked)}
                                                className="h-4 w-4 rounded-[0.125rem] border-[#c5c6cd] text-[#091426] focus:ring-[#fea619]"
                                            />
                                            Naikkan Versi Skema (v{editingKategori.versi_skema} → v{editingKategori.versi_skema + 1})
                                        </label>
                                        <p className="text-[11px] text-[#45474c] mt-1 ml-6">
                                            Centang jika perubahan skema cukup besar agar aset lama tetap tercatat menggunakan snapshot skema v{editingKategori.versi_skema}.
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-[#c5c6cd]">
                                    <div className="mb-4 p-3 rounded-[0.25rem] bg-[#eff4ff] border border-[#c5c6cd] flex gap-2.5">
                                        <span className="material-symbols-outlined text-[#091426] text-base mt-0.5 shrink-0">info</span>
                                        <div className="text-[11.5px] text-[#45474c] leading-relaxed">
                                            <p className="font-bold text-[#091426] mb-1">Field bawaan yang otomatis ada di form tambah aset:</p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                <li><span className="font-semibold">Nama Aset</span>: nama/identitas aset</li>
                                                <li><span className="font-semibold">Kode Aset</span>: kode unik aset</li>
                                                <li><span className="font-semibold">Kondisi</span>: baik / rusak ringan / rusak berat</li>
                                                <li><span className="font-semibold">Tanggal Pemasangan</span>: kapan aset dipasang</li>
                                                <li><span className="font-semibold">Lokasi / Koordinat</span>: posisi geometri di peta</li>
                                                <li><span className="font-semibold">Catatan</span>: keterangan tambahan opsional</li>
                                            </ul>
                                            <p className="mt-1.5 text-[#75777c]">Tambahkan atribut spesifik di bawah ini jika kategori ini membutuhkan data teknis tambahan.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#45474c]">
                                            Atribut Spesifik
                                        </h3>
                                        <span className="text-xs text-[#75777c]">
                                            Tarik titik 6 untuk mengatur urutan
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {fields.map((field, i) => (
                                            <div
                                                key={i}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, i)}
                                                onDragOver={(e) => handleDragOver(e, i)}
                                                onDragEnd={handleDragEnd}
                                                className={`border border-[#c5c6cd] rounded-[0.25rem] p-4 space-y-3 bg-[#f8f9ff] hover:border-[#fea619] transition-all relative ${
                                                    draggedIndex === i ? 'opacity-40 border-dashed border-[#fea619]' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between pb-2 border-b border-[#e0e0e0]">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="material-symbols-outlined text-[#75777c] hover:text-[#091426] cursor-grab active:cursor-grabbing select-none text-xl"
                                                            title="Tarik untuk mengubah urutan"
                                                        >
                                                            drag_indicator
                                                        </span>
                                                        <span className="text-xs font-bold text-[#091426]">
                                                            Atribut #{i + 1}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeField(i)}
                                                        className="flex items-center gap-1 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 px-2 py-1 rounded text-xs font-bold transition-colors"
                                                        title="Hapus field ini"
                                                    >
                                                        <span className="material-symbols-outlined text-base">delete</span>
                                                        Hapus
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-xs font-semibold text-[#45474c] mb-1">
                                                            Label Atribut <span className="text-[#ba1a1a]">*</span>
                                                        </label>
                                                        <input
                                                            placeholder="contoh: Tipe Guardrail"
                                                            value={field.label}
                                                            onChange={(e) => updateField(i, 'label', e.target.value)}
                                                            className="w-full h-9 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-3 text-sm bg-white"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-[#45474c] mb-1">
                                                            Tipe Data
                                                        </label>
                                                        <select
                                                            value={field.type}
                                                            onChange={(e) => updateField(i, 'type', e.target.value)}
                                                            className={`w-full h-9 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] pl-2 pr-8 text-sm transition-colors bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat ${
                                                                !field.type ? 'text-[#9ca3af]' : 'text-[#0b1c30]'
                                                            }`}
                                                        >
                                                            <option value="" disabled hidden>
                                                                Pilih Tipe Data
                                                            </option>
                                                            <option value="text" className="text-[#0b1c30]">Teks</option>
                                                            <option value="number" className="text-[#0b1c30]">Angka</option>
                                                            <option value="select" className="text-[#0b1c30]">Pilihan</option>
                                                            <option value="date" className="text-[#0b1c30]">Tanggal</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex items-center">
                                                    <label className="flex items-center gap-2 text-xs font-bold text-[#45474c] cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required}
                                                            onChange={(e) => updateField(i, 'required', e.target.checked)}
                                                            className="h-4 w-4 rounded-[0.125rem] border-[#c5c6cd] text-[#091426] focus:ring-[#fea619]"
                                                        />
                                                        Wajib diisi
                                                    </label>
                                                </div>

                                                {field.type === 'select' && (
                                                    <div className="pt-3 border-t border-[#e0e0e0] space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="block text-xs font-semibold text-[#45474c]">
                                                                Opsi Pilihan (Select Options) <span className="text-[#ba1a1a]">*</span>
                                                            </label>
                                                            <span className="text-[11px] text-[#75777c]">
                                                                Tambahkan pilihan yang bisa dipilih user
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {(Array.isArray(field.options) && field.options.length > 0 ? field.options : ['']).map((opt, optIdx) => (
                                                                <div key={optIdx} className="flex items-center gap-2">
                                                                    <span className="text-xs font-semibold text-[#75777c] w-5 text-right shrink-0">
                                                                        {optIdx + 1}.
                                                                    </span>
                                                                    <input
                                                                        placeholder={`Nama Opsi #${optIdx + 1} (misal: Single)`}
                                                                        value={opt}
                                                                        onChange={(e) => updateOption(i, optIdx, e.target.value)}
                                                                        className="flex-1 h-9 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-3 text-sm bg-white"
                                                                        required
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeOption(i, optIdx)}
                                                                        className="p-1.5 text-[#75777c] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#75777c]"
                                                                        title="Hapus opsi ini"
                                                                        disabled={(field.options?.length || 0) <= 1}
                                                                    >
                                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => addOption(i)}
                                                            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#855300] group"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add_circle</span>
                                                            <span className="group-hover:underline">Tambah Opsi Pilihan</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {fields.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-6 rounded-[0.25rem] border border-dashed border-[#c5c6cd] bg-[#fafafa] text-center">
                                                <span className="material-symbols-outlined text-[#c5c6cd] text-3xl mb-2">format_list_bulleted_add</span>
                                                <p className="text-sm font-semibold text-[#75777c]">Belum ada atribut spesifik</p>
                                                <p className="text-xs text-[#9ca3af] mt-0.5">Klik "Tambah Atribut" di bawah jika kategori ini butuh data teknis khusus.</p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addField}
                                        className="mt-3 inline-flex items-center gap-1.5 text-[#855300] text-sm font-bold group"
                                    >
                                        <span className="material-symbols-outlined text-base">add</span>
                                        <span className="group-hover:underline">Tambah Atribut</span>
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    {editingKategori && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="w-1/3 h-12 border border-[#c5c6cd] text-[#091426] font-bold rounded-[0.125rem] hover:bg-gray-100 transition-colors"
                                        >
                                            Batal
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className={`${editingKategori ? 'w-2/3' : 'w-full'} h-12 bg-[#091426] text-white font-bold rounded-[0.125rem] hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {editingKategori ? 'save' : 'check'}
                                        </span>
                                        {editingKategori ? 'Update Kategori' : 'Simpan Kategori'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </section>
            </main>

            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-amber-700">help_outline</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-navy text-base">{confirmModal.title}</h3>
                                <p className="text-xs text-text-muted">{confirmModal.message}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 rounded-lg border border-border text-navy font-semibold text-sm hover:bg-card-hover transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className="px-4 py-2 rounded-lg bg-navy text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                            >
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}