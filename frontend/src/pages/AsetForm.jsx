import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DynamicFormField from '../components/DynamicFormField';
import MapPicker from '../components/MapPicker';

export default function AsetForm() {
    const [kategoriList, setKategoriList] = useState([]);
    const [selectedKategori, setSelectedKategori] = useState(null);
    const [formData, setFormData] = useState({ status_kondisi: 'baik' });
    const [atributSpesifik, setAtributSpesifik] = useState({});
    const [photos, setPhotos] = useState([]); // { file, preview }
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        axiosClient.get('/kategori').then((res) => setKategoriList(res.data.data));
    }, []);

    function handleKategoriChange(id) {
        const kategori = kategoriList.find((k) => k.id === id);
        setSelectedKategori(kategori);
        setAtributSpesifik({});
    }

    function handleFieldChange(field, value) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    function handleSpesifikChange(key, value) {
        setAtributSpesifik((prev) => ({ ...prev, [key]: value }));
    }

    function handleLocationSelect(lat, lng) {
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    }

    function handlePhotoSelect(e) {
        const files = Array.from(e.target.files);
        const newPhotos = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setPhotos((prev) => [...prev, ...newPhotos]);
        e.target.value = ''; // reset biar bisa pilih file yang sama lagi kalau perlu
    }

    function removePhoto(index) {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!selectedKategori) {
            setError('Pilih kategori dulu');
            return;
        }
        if (!formData.latitude || !formData.longitude) {
            setError('Tap peta untuk pilih lokasi dulu');
            return;
        }

        setSaving(true);
        try {
            // 1. Bikin aset dulu
            const res = await axiosClient.post('/aset', {
                kategori_id: selectedKategori.id,
                versi_skema_saat_input: selectedKategori.versi_skema,
                nama_aset: formData.nama_aset,
                nomor_seri: formData.nomor_seri,
                ruas_tol: 'Purbaleunyi',
                lokasi_km: Number(formData.lokasi_km),
                jalur: formData.jalur,
                latitude: formData.latitude,
                longitude: formData.longitude,
                elevasi_mdpl: formData.elevasi_mdpl ? Number(formData.elevasi_mdpl) : null,
                status_kondisi: formData.status_kondisi,
                atribut_spesifik: atributSpesifik,
                tanggal_aset_dibuat: formData.tanggal_aset_dibuat,
                input_by: user.id
            });

            const asetId = res.data.data.id;

            // 2. Upload semua foto yang dipilih, satu per satu
            for (const photo of photos) {
                const fd = new FormData();
                fd.append('foto', photo.file);
                fd.append('aset_id', asetId);
                fd.append('uploaded_by', user.id);
                await axiosClient.post('/foto', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            navigate('/aset');
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal menyimpan aset');
            if (err.response?.data?.details) {
                setError(err.response.data.details.join(', '));
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />

                {/* Sticky action header */}
                <div className="bg-card flex items-center justify-between px-4 md:px-8 py-4 border-b border-border z-10 shrink-0 flex-wrap gap-3">
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-navy">Tambah Aset Baru</h1>
                        <p className="text-sm text-text-muted">Isi data lokasi dan spesifikasi aset.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/aset')}
                            className="px-5 h-11 border border-border text-navy font-bold hover:bg-card-alt transition-colors rounded-lg"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="aset-form"
                            disabled={saving}
                            className="px-5 h-11 bg-navy text-white font-bold hover:opacity-90 transition-opacity rounded-lg disabled:opacity-60"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Aset'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mx-4 md:mx-8 mt-4 p-3 bg-danger-bg text-danger rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Content grid: map + form */}
                <div className="flex-1 overflow-y-auto pb-20 md:pb-8">
                    <div className="grid grid-cols-1 xl:grid-cols-2 xl:h-full">
                        {/* Left: Map */}
                        <div className="relative min-h-[350px] xl:h-auto xl:border-r border-border">
                            <MapPicker onLocationSelect={handleLocationSelect} />
                        </div>

                        {/* Right: Form */}
                        <div className="p-4 md:p-8">
                            <form id="aset-form" onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col gap-8">

                                {/* General Info */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                        <span className="material-symbols-outlined text-amber-dark">info</span>
                                        <h2 className="text-lg font-bold text-navy">Informasi Umum</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Kategori Aset</label>
                                            <select
                                                onChange={(e) => handleKategoriChange(e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            >
                                                <option value="">Pilih kategori</option>
                                                {kategoriList.map((k) => (
                                                    <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Nama Aset</label>
                                            <input
                                                type="text"
                                                onChange={(e) => handleFieldChange('nama_aset', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Nomor Seri</label>
                                            <input
                                                type="text"
                                                onChange={(e) => handleFieldChange('nomor_seri', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Lokasi KM</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                onChange={(e) => handleFieldChange('lokasi_km', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Jalur</label>
                                            <select
                                                onChange={(e) => handleFieldChange('jalur', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            >
                                                <option value="">Pilih</option>
                                                <option value="A">Jalur A</option>
                                                <option value="B">Jalur B</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Elevasi (mdpl)</label>
                                            <input
                                                type="number"
                                                onChange={(e) => handleFieldChange('elevasi_mdpl', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Technical Specs - dinamis sesuai kategori */}
                                {selectedKategori && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                            <span className="material-symbols-outlined text-amber-dark">settings_suggest</span>
                                            <h2 className="text-lg font-bold text-navy">Spesifikasi {selectedKategori.nama_kategori}</h2>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedKategori.skema_formulir.fields.map((field) => (
                                                <div key={field.key} className={field.type === 'select' && field.options?.length > 3 ? 'col-span-2' : ''}>
                                                    <DynamicFormField
                                                        field={field}
                                                        value={atributSpesifik[field.key]}
                                                        onChange={handleSpesifikChange}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Condition */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                        <span className="material-symbols-outlined text-amber-dark">assessment</span>
                                        <h2 className="text-lg font-bold text-navy">Kondisi Aset</h2>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['baik', 'perlu_perawatan', 'rusak'].map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => handleFieldChange('status_kondisi', status)}
                                                className={`py-3 rounded-lg text-sm font-bold border-2 transition-colors capitalize ${
                                                    formData.status_kondisi === status
                                                        ? status === 'baik'
                                                            ? 'bg-[#D1FAE5] border-[#065F46] text-[#065F46]'
                                                            : status === 'perlu_perawatan'
                                                            ? 'bg-[#FEF3C7] border-[#92400E] text-[#92400E]'
                                                            : 'bg-[#FEE2E2] border-[#991B1B] text-[#991B1B]'
                                                        : 'border-border text-text-muted'
                                                }`}
                                            >
                                                {status.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Photo Upload */}
                                <section className="mb-8">
                                    <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-amber-dark">add_a_photo</span>
                                            <h2 className="text-lg font-bold text-navy">Foto Dokumentasi</h2>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {photos.map((photo, i) => (
                                            <div key={i} className="aspect-square rounded-lg border border-border bg-cover bg-center relative group overflow-hidden">
                                                <img src={photo.preview} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(i)}
                                                        className="text-white"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted cursor-pointer hover:bg-card-hover transition-colors">
                                            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                                            <span className="text-[10px] font-bold mt-1">TAMBAH FOTO</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                multiple
                                                onChange={handlePhotoSelect}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </section>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}