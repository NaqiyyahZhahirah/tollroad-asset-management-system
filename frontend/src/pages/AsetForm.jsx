import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DynamicFormField from '../components/DynamicFormField';
import GeometryDrawer from '../components/GeometryDrawer';

export default function AsetForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const [kategoriList, setKategoriList] = useState([]);
    const [selectedKategori, setSelectedKategori] = useState(null);
    const [formData, setFormData] = useState({ status_kondisi: 'baik', ruas_tol: 'Purbaleunyi' });
    const [atributSpesifik, setAtributSpesifik] = useState({});
    const [photos, setPhotos] = useState([]); // { file, preview, isExisting, id }
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadingAsset, setLoadingAsset] = useState(isEdit);
    const [fetchingElevation, setFetchingElevation] = useState(false);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    async function handleGeometryChange(geojson) {
        setFormData((prev) => ({ ...prev, koordinat_geojson: geojson }));
        if (!geojson) return;

        let lat, lng;
        if (geojson.type === 'Point' && Array.isArray(geojson.coordinates)) {
            [lng, lat] = geojson.coordinates;
        } else if (geojson.type === 'LineString' && geojson.coordinates?.length > 0) {
            [lng, lat] = geojson.coordinates[0];
        } else if (geojson.type === 'Polygon' && geojson.coordinates[0]?.length > 0) {
            [lng, lat] = geojson.coordinates[0][0];
        }

        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
            setFetchingElevation(true);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    const elev = data.results[0].elevation;
                    setFormData((prev) => ({ ...prev, elevasi_mdpl: elev }));
                }
            } catch (err) {
                console.warn('Open-Elevation API lookup failed:', err);
            } finally {
                setFetchingElevation(false);
            }
        }
    }

    useEffect(() => {
        axiosClient.get('/kategori').then((res) => setKategoriList(res.data.data));
    }, []);

    useEffect(() => {
        if (isEdit) {
            setLoadingAsset(true);
            axiosClient.get(`/aset/${id}`).then((res) => {
                const aset = res.data.data;
                setFormData({
                    nama_aset: aset.nama_aset || '',
                    nomor_seri: aset.nomor_seri || '',
                    ruas_tol: aset.ruas_tol || 'Purbaleunyi',
                    lokasi_km: aset.lokasi_km !== undefined ? aset.lokasi_km : '',
                    jalur: aset.jalur || '',
                    tanggal_aset_dibuat: aset.tanggal_aset_dibuat || '',
                    elevasi_mdpl: aset.elevasi_mdpl !== undefined ? aset.elevasi_mdpl : '',
                    status_kondisi: aset.status_kondisi || 'baik',
                    koordinat_geojson: aset.koordinat_geojson || null,
                });
                setAtributSpesifik(aset.atribut_spesifik || {});
                if (aset.kategori_aset) {
                    setSelectedKategori(aset.kategori_aset);
                }
                if (aset.foto_aset) {
                    setPhotos(aset.foto_aset.map((f) => ({ preview: f.url_foto, isExisting: true, id: f.id })));
                }
            }).catch((err) => {
                console.error(err);
                setError('Gagal memuat data aset');
            }).finally(() => {
                setLoadingAsset(false);
            });
        }
    }, [id, isEdit]);

    function handleKategoriChange(id) {
        const kategori = kategoriList.find((k) => k.id === id);
        setSelectedKategori(kategori);
        if (!isEdit) {
            setAtributSpesifik({});
        }
    }

    function handleFieldChange(field, value) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    function handleSpesifikChange(key, value) {
        setAtributSpesifik((prev) => ({ ...prev, [key]: value }));
    }

    function handlePhotoSelect(e) {
        const files = Array.from(e.target.files);
        const newPhotos = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            isExisting: false
        }));
        setPhotos((prev) => [...prev, ...newPhotos]);
        e.target.value = '';
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
        if (!formData.koordinat_geojson) {
            setError('Gambar lokasi/bentuk aset dulu di peta');
            return;
        }

        setSaving(true);
        try {
            if (isEdit) {
                await axiosClient.put(`/aset/${id}`, {
                    kategori_id: selectedKategori.id,
                    versi_skema_saat_input: selectedKategori.versi_skema,
                    nama_aset: formData.nama_aset,
                    nomor_seri: formData.nomor_seri,
                    ruas_tol: formData.ruas_tol || 'Purbaleunyi',
                    lokasi_km: Number(formData.lokasi_km),
                    jalur: formData.jalur,
                    koordinat_geojson: formData.koordinat_geojson,
                    elevasi_mdpl: formData.elevasi_mdpl ? Number(formData.elevasi_mdpl) : null,
                    status_kondisi: formData.status_kondisi,
                    atribut_spesifik: atributSpesifik,
                    tanggal_aset_dibuat: formData.tanggal_aset_dibuat
                });

                for (const photo of photos) {
                    if (!photo.isExisting && photo.file) {
                        const fd = new FormData();
                        fd.append('foto', photo.file);
                        fd.append('aset_id', id);
                        fd.append('uploaded_by', user.id);
                        await axiosClient.post('/foto', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    }
                }
            } else {
                const res = await axiosClient.post('/aset', {
                    kategori_id: selectedKategori.id,
                    versi_skema_saat_input: selectedKategori.versi_skema,
                    nama_aset: formData.nama_aset,
                    nomor_seri: formData.nomor_seri,
                    ruas_tol: formData.ruas_tol || 'Purbaleunyi',
                    lokasi_km: Number(formData.lokasi_km),
                    jalur: formData.jalur,
                    koordinat_geojson: formData.koordinat_geojson,
                    elevasi_mdpl: formData.elevasi_mdpl ? Number(formData.elevasi_mdpl) : null,
                    status_kondisi: formData.status_kondisi,
                    atribut_spesifik: atributSpesifik,
                    tanggal_aset_dibuat: formData.tanggal_aset_dibuat,
                    input_by: user.id
                });

                const asetId = res.data.data.id;

                for (const photo of photos) {
                    if (photo.file) {
                        const fd = new FormData();
                        fd.append('foto', photo.file);
                        fd.append('aset_id', asetId);
                        fd.append('uploaded_by', user.id);
                        await axiosClient.post('/foto', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    }
                }
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

    if (loadingAsset) {
        return (
            <div className="min-h-screen flex bg-app-bg">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center text-text-muted">Memuat data aset...</main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />

                {/* Sticky title header - tanpa tombol aksi */}
                <div className="bg-card px-4 md:px-8 py-4 border-b border-border z-10 shrink-0">
                    <h1 className="text-lg md:text-xl font-bold text-navy">{isEdit ? 'Edit Aset' : 'Tambah Aset Baru'}</h1>
                    <p className="text-sm text-text-muted">{isEdit ? 'Perbarui data lokasi dan spesifikasi aset.' : 'Isi data lokasi dan spesifikasi aset.'}</p>
                </div>

                {error && (
                    <div className="mx-4 md:mx-8 mt-4 p-3 bg-danger-bg text-danger rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Content: map atas, form bawah */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
                    <div className="max-w-3xl mx-auto flex flex-col gap-6">
                        {/* Top: Map Picker */}
                        <div className="relative h-[360px] md:h-[420px] rounded-2xl border border-border overflow-hidden shadow-md z-0 shrink-0">
                            <GeometryDrawer
                                tipeGeometri={selectedKategori?.tipe_geometri || 'titik'}
                                initialGeometry={formData.koordinat_geojson}
                                onGeometryChange={handleGeometryChange}
                                disabled={!selectedKategori}
                            />
                        </div>

                        {/* Bottom: Form */}
                        <form id="aset-form" onSubmit={handleSubmit} className="w-full flex flex-col gap-8 mt-2">

                                {/* General Info */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                        <span className="material-symbols-outlined text-amber-dark">info</span>
                                        <h2 className="text-lg font-bold text-navy">Informasi Umum</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Kategori */}
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                Kategori Aset <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={selectedKategori?.id || ''}
                                                onChange={(e) => handleKategoriChange(e.target.value)}
                                                className={`w-full h-12 pl-4 pr-10 border border-border focus:border-amber outline-none rounded-lg text-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat ${!selectedKategori?.id ? 'text-text-muted' : 'text-navy'}`}
                                                required
                                            >
                                                <option value="" disabled hidden>Pilih kategori</option>
                                                {kategoriList.map((k) => (
                                                    <option key={k.id} value={k.id} className="text-navy">{k.nama_kategori}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Nama Aset */}
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                Nama Aset <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="contoh: Guardrail Segmen 1A"
                                                value={formData.nama_aset || ''}
                                                onChange={(e) => handleFieldChange('nama_aset', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            />
                                        </div>

                                        {/* Nomor Seri */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                Nomor Seri <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="contoh: GR-2024-001"
                                                value={formData.nomor_seri || ''}
                                                onChange={(e) => handleFieldChange('nomor_seri', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            />
                                        </div>

                                        {/* Ruas Tol */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                Ruas Tol <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="contoh: Purbaleunyi"
                                                value={formData.ruas_tol || ''}
                                                onChange={(e) => handleFieldChange('ruas_tol', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            />
                                        </div>

                                        {/* Lokasi KM */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                Lokasi KM <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                onWheel={(e) => e.target.blur()}
                                                step="0.01"
                                                min="0"
                                                placeholder="contoh: 91.5"
                                                value={formData.lokasi_km || ''}
                                                onChange={(e) => handleFieldChange('lokasi_km', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            />
                                        </div>

                                        {/* Jalur */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                Jalur <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.jalur || ''}
                                                onChange={(e) => handleFieldChange('jalur', e.target.value)}
                                                className={`w-full h-12 pl-4 pr-10 border border-border focus:border-amber outline-none rounded-lg text-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat ${!formData.jalur ? 'text-text-muted' : 'text-navy'}`}
                                                required
                                            >
                                                <option value="" disabled hidden>Pilih Jalur</option>
                                                <option value="A" className="text-navy">Jalur A</option>
                                                <option value="B" className="text-navy">Jalur B</option>
                                            </select>
                                        </div>

                                        {/* Tanggal Pemasangan */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                Tanggal Pemasangan <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.tanggal_aset_dibuat || ''}
                                                onChange={(e) => handleFieldChange('tanggal_aset_dibuat', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            />
                                        </div>

                                        {/* Elevasi */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide flex items-center justify-between">
                                                <span>Elevasi (mdpl) <span className="text-red-500">*</span></span>
                                                {fetchingElevation && (
                                                    <span className="text-[10px] text-amber-dark font-semibold flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
                                                        Mengambil elevasi...
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                type="number"
                                                onWheel={(e) => e.target.blur()}
                                                step="0.01"
                                                placeholder={fetchingElevation ? "Memuat elevasi..." : "contoh: 750.5"}
                                                value={formData.elevasi_mdpl !== undefined && formData.elevasi_mdpl !== null ? formData.elevasi_mdpl : ''}
                                                onChange={(e) => handleFieldChange('elevasi_mdpl', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Technical Specs - dinamis sesuai kategori */}
                                {selectedKategori && (selectedKategori.skema_formulir?.fields?.length > 0) && (
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

                                {/* Action Buttons at bottom of form */}
                                <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/aset')}
                                        className="px-6 h-12 border border-border text-navy font-bold hover:bg-card-hover transition-colors rounded-lg flex-1 sm:flex-none"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 h-12 bg-navy text-white font-bold hover:opacity-90 transition-opacity rounded-lg disabled:opacity-60 flex-1 sm:flex-none flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[18px]">save</span>
                                                {isEdit ? 'Simpan Perubahan' : 'Simpan Aset'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                    </div>
                </div>
            </main>
        </div>
    );
}