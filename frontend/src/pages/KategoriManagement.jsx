import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function KategoriManagement() {
    const [kategoriList, setKategoriList] = useState([]);
    const [namaKategori, setNamaKategori] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [fields, setFields] = useState([{ key: '', label: '', type: 'text', required: false, options: '' }]);
    const { user } = useAuthStore();

    useEffect(() => {
        fetchKategori();
    }, []);

    async function fetchKategori() {
        const res = await axiosClient.get('/kategori');
        setKategoriList(res.data.data);
    }

    function addField() {
        setFields([...fields, { key: '', label: '', type: 'text', required: false, options: '' }]);
    }

    function updateField(index, key, value) {
        const updated = [...fields];
        updated[index][key] = value;
        setFields(updated);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const skema_formulir = {
            fields: fields.map((f) => ({
                key: f.key,
                label: f.label,
                type: f.type,
                required: f.required,
                ...(f.type === 'select' ? { options: f.options.split(',').map((o) => o.trim()) } : {})
            }))
        };

        try {
            await axiosClient.post('/kategori', {
                nama_kategori: namaKategori,
                deskripsi,
                skema_formulir,
                created_by: user.id
            });
            setNamaKategori('');
            setDeskripsi('');
            setFields([{ key: '', label: '', type: 'text', required: false, options: '' }]);
            fetchKategori();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal membuat kategori');
        }
    }

    async function handleDeactivate(id) {
        if (!confirm('Nonaktifkan kategori ini?')) return;
        await axiosClient.delete(`/kategori/${id}`);
        fetchKategori();
    }

    return (
        <div className="min-h-screen flex bg-[#f8f9ff]">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />

                <section className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

                        {/* ==== Panel Kiri: Kategori Aktif ==== */}
                        <section className="bg-white border border-[#c5c6cd] rounded-[0.25rem] h-fit overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#c5c6cd] bg-[#eff4ff]">
                                <h1 className="text-[20px] font-bold text-[#091426]">Kategori Aktif</h1>
                            </div>

                            <div className="p-4 space-y-2">
                                {kategoriList.map((k) => (
                                    <div
                                        key={k.id}
                                        className="group flex justify-between items-center p-3 bg-white border border-[#c5c6cd] rounded-[0.25rem] hover:border-[#fea619] hover:shadow-sm transition-all"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-[#0b1c30]">{k.nama_kategori}</p>
                                            <p className="text-[11px] uppercase tracking-widest text-[#45474c] mt-1">
                                                v{k.versi_skema}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeactivate(k.id)}
                                            className="text-[#ba1a1a] text-xs font-bold opacity-0 group-hover:opacity-100 hover:underline transition-opacity"
                                        >
                                            Nonaktifkan
                                        </button>
                                    </div>
                                ))}

                                {kategoriList.length === 0 && (
                                    <p className="text-sm text-[#45474c] italic">Belum ada kategori.</p>
                                )}
                            </div>
                        </section>

                        {/* ==== Panel Kanan: Bikin Kategori Baru ==== */}
                        <section className="bg-white border border-[#c5c6cd] rounded-[0.25rem] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#c5c6cd] bg-[#eff4ff]">
                                <h1 className="text-[20px] font-bold text-[#091426]">Bikin Kategori Baru</h1>
                                <p className="text-sm text-[#45474c] mt-1">
                                    Definisikan atribut spesifik untuk kategori ini.
                                </p>
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
                                        className="w-full h-11 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-3 text-sm transition-colors"
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
                                        className="w-full h-11 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-3 text-sm transition-colors"
                                    />
                                </div>

                                <div className="pt-4 border-t border-[#c5c6cd]">
                                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#45474c] mb-3">
                                        Field Spesifik
                                    </h3>

                                    <div className="space-y-3">
                                        {fields.map((field, i) => (
                                            <div
                                                key={i}
                                                className="border border-[#c5c6cd] rounded-[0.25rem] p-4 space-y-3 bg-[#f8f9ff] hover:border-[#fea619] transition-colors"
                                            >
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        placeholder="key (contoh: tipe_guardrail)"
                                                        value={field.key}
                                                        onChange={(e) => updateField(i, 'key', e.target.value)}
                                                        className="w-full h-9 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-2 text-sm bg-white"
                                                    />
                                                    <input
                                                        placeholder="Label"
                                                        value={field.label}
                                                        onChange={(e) => updateField(i, 'label', e.target.value)}
                                                        className="w-full h-9 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-2 text-sm bg-white"
                                                    />
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4">
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => updateField(i, 'type', e.target.value)}
                                                        className="h-9 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-2 text-sm bg-white"
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="number">Number</option>
                                                        <option value="select">Select</option>
                                                        <option value="date">Date</option>
                                                    </select>

                                                    <label className="flex items-center gap-2 text-xs font-bold text-[#45474c]">
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
                                                    <input
                                                        placeholder="Opsi, pisah koma (misal: Single,Double)"
                                                        value={field.options}
                                                        onChange={(e) => updateField(i, 'options', e.target.value)}
                                                        className="w-full h-9 border border-[#c5c6cd] focus:border-[#fea619] focus:ring-0 rounded-[0.125rem] px-2 text-sm bg-white"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addField}
                                        className="mt-3 text-[#855300] text-sm font-bold hover:underline"
                                    >
                                        + Tambah Field
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-12 bg-[#091426] text-white font-bold rounded-[0.125rem] hover:opacity-90 transition-opacity"
                                >
                                    Simpan Kategori
                                </button>
                            </form>
                        </section>
                    </div>
                </section>
            </main>
        </div>
    );
}