import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DynamicFormField from '../components/DynamicFormField';
import GeometryDrawer from '../components/GeometryDrawer';
import { useToast } from '../components/Toast';

export default function AsetForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const [kategoriList, setKategoriList] = useState([]);
    const [selectedKategori, setSelectedKategori] = useState(null);
    const [formData, setFormData] = useState({ status_kondisi: 'baik', ruas_tol: 'Purbaleunyi' });
    const [atributSpesifik, setAtributSpesifik] = useState({});
    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadingAsset, setLoadingAsset] = useState(isEdit);
    const [fetchingElevation, setFetchingElevation] = useState(false);
    const groupedKategori = useMemo(() => {
        const groups = {};
        kategoriList.forEach((k) => {
            const groupName = k.kelompok_aset?.nama_kelompok || 'Tanpa Kelompok';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(k);
        });
        return groups;
    }, [kategoriList]);
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const toast = useToast();
    const currentYear = new Date().getFullYear();
    const YEAR_OPTIONS = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

    async function fetchElevation(lat, lng) {
        try {
            const ctrl1 = new AbortController();
            const t1 = setTimeout(() => ctrl1.abort(), 5000);
            const res1 = await fetch(
                `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
                { signal: ctrl1.signal }
            );
            clearTimeout(t1);
            if (res1.ok) {
                const d1 = await res1.json();
                if (d1.elevation && d1.elevation.length > 0) {
                    return d1.elevation[0];
                }
            }
        } catch (e) {
            console.warn('Open-Meteo elevation failed, trying fallback...', e);
        }

        try {
            const ctrl2 = new AbortController();
            const t2 = setTimeout(() => ctrl2.abort(), 7000);
            const res2 = await fetch(
                `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`,
                { signal: ctrl2.signal }
            );
            clearTimeout(t2);
            if (res2.ok) {
                const d2 = await res2.json();
                if (d2.results && d2.results.length > 0) {
                    return d2.results[0].elevation;
                }
            }
        } catch (e) {
            console.warn('Open-Elevation fallback juga gagal:', e);
        }

        return null;
    }

    async function handleGeometryChange(geojson) {
        setFormData((prev) => ({ ...prev, koordinat_geojson: geojson }));
        if (!geojson) return;

        if (geojson.type === 'LineString' && geojson.coordinates?.length >= 2) {
            const panjang = calculatePolylineLength(geojson.coordinates);
            setFormData((prev) => ({ ...prev, panjang_bentang: Math.round(panjang * 100) / 100 }));
        }

        if (geojson.type === 'Polygon' && geojson.coordinates?.[0]?.length >= 3) {
            const luas = calculatePolygonArea(geojson.coordinates);
            setFormData((prev) => ({ ...prev, luas_area: Math.round(luas * 100) / 100 }));
        }

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
                const elev = await fetchElevation(lat, lng);
                if (elev !== null) {
                    setFormData((prev) => ({ ...prev, elevasi_mdpl: elev }));
                } else {
                    console.warn('Tidak berhasil mendapatkan elevasi dari semua API');
                }
            } finally {
                setFetchingElevation(false);
            }
        }
    }

    async function handleRetryElevation() {
        const geojson = formData.koordinat_geojson;
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
                const elev = await fetchElevation(lat, lng);
                if (elev !== null) setFormData((prev) => ({ ...prev, elevasi_mdpl: elev }));
            } finally {
                setFetchingElevation(false);
            }
        }
    }

    useEffect(() => {
        if (isEdit) {
            setLoadingAsset(true);
            Promise.all([
                axiosClient.get('/kategori'),
                axiosClient.get(`/aset/${id}`)
            ]).then(([resKategori, resAset]) => {
                const listKategori = resKategori.data.data || [];
                setKategoriList(listKategori);

                const aset = resAset.data.data;

                const matchedKategori = listKategori.find((k) => k.id === aset.kategori_id) || aset.kategori_aset;
                setSelectedKategori(matchedKategori || null);

                let formattedDate = '';
                if (aset.tanggal_aset_dibuat) {
                    formattedDate = String(aset.tanggal_aset_dibuat).substring(0, 10);
                }

                setFormData({
                    kategori_id: aset.kategori_id || matchedKategori?.id || '',
                    nama_aset: aset.nama_aset || '',
                    nomor_seri: aset.nomor_seri || '',
                    ruas_tol: aset.ruas_tol || 'Purbaleunyi',
                    lokasi_km: aset.lokasi_km !== undefined && aset.lokasi_km !== null ? aset.lokasi_km : '',
                    jalur: aset.jalur || '',
                    tanggal_aset_dibuat: formattedDate,
                    elevasi_mdpl: aset.elevasi_mdpl !== undefined && aset.elevasi_mdpl !== null ? aset.elevasi_mdpl : '',
                    luas_area: aset.luas_area !== undefined && aset.luas_area !== null ? aset.luas_area : '',
                    panjang_bentang: aset.panjang_bentang !== undefined && aset.panjang_bentang !== null ? aset.panjang_bentang : '',
                    status_kondisi: aset.status_kondisi || 'baik',
                    status_validasi: aset.status_validasi || '',
                    catatan_validasi: aset.catatan_validasi || '',
                    koordinat_geojson: aset.koordinat_geojson || null,
                });

                setAtributSpesifik(aset.atribut_spesifik || {});

                if (aset.foto_aset) {
                    setPhotos(aset.foto_aset.map((f) => ({ preview: f.url_foto, isExisting: true, id: f.id })));
                }
            }).catch((err) => {
                console.error(err);
                setError('Gagal memuat data aset');
            }).finally(() => {
                setLoadingAsset(false);
            });
        } else {
            axiosClient.get('/kategori').then((res) => setKategoriList(res.data.data || []));
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

    function calculatePolylineLength(coordinates) {
        const R = 6371000;
        let total = 0;
        for (let i = 1; i < coordinates.length; i++) {
            const [lon1, lat1] = coordinates[i - 1];
            const [lon2, lat2] = coordinates[i];
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) ** 2;
            total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        return total;
    }

    function calculatePolygonArea(coordinates) {
        const ring = coordinates[0];
        if (!ring || ring.length < 3) return 0;

        const R = 6371000; // radius bumi (meter)
        const toRad = (deg) => deg * Math.PI / 180;

        let area = 0;
        for (let i = 0; i < ring.length - 1; i++) {
            const [lon1, lat1] = ring[i];
            const [lon2, lat2] = ring[i + 1];
            area += toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
        }
        area = Math.abs(area * R * R / 2);
        return area; // hasil dalam meter persegi
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
                    lokasi_km_akhir: selectedKategori.tipe_geometri === 'garis' && formData.lokasi_km_akhir
                        ? Number(formData.lokasi_km_akhir)
                        : null,                    
                    jalur: formData.jalur,
                    koordinat_geojson: formData.koordinat_geojson,
                    elevasi_mdpl: formData.elevasi_mdpl ? Number(formData.elevasi_mdpl) : null,
                    panjang_bentang: formData.panjang_bentang || null,
                    luas_area: formData.luas_area || null,
                    status_kondisi: formData.status_kondisi,
                    catatan_kondisi: formData.catatan_kondisi || null,
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
                    lokasi_km_akhir: selectedKategori.tipe_geometri === 'garis' && formData.lokasi_km_akhir
                        ? Number(formData.lokasi_km_akhir)
                        : null,
                    jalur: formData.jalur,
                    koordinat_geojson: formData.koordinat_geojson,
                    elevasi_mdpl: formData.elevasi_mdpl ? Number(formData.elevasi_mdpl) : null,
                    panjang_bentang: formData.panjang_bentang || null,
                    luas_area: formData.luas_area || null,
                    status_kondisi: formData.status_kondisi,
                    catatan_kondisi: formData.catatan_kondisi || null,
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

            toast.success(isEdit ? 'Aset berhasil diperbarui!' : 'Aset baru berhasil disimpan!');
            navigate('/aset');
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal menyimpan aset');
            toast.error(err.response?.data?.error || 'Gagal menyimpan aset');
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

                <div className="bg-card px-4 md:px-8 py-4 border-b border-border z-10 shrink-0">
                    <h1 className="text-lg md:text-xl font-bold text-navy">{isEdit ? 'Edit Aset' : 'Tambah Aset Baru'}</h1>
                    <p className="text-sm text-text-muted">{isEdit ? 'Perbarui data lokasi dan spesifikasi aset.' : 'Isi data lokasi dan spesifikasi aset.'}</p>
                </div>

                {error && (
                    <div className="mx-4 md:mx-8 mt-4 p-3 bg-danger-bg text-danger rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
                    <div className="max-w-3xl mx-auto flex flex-col gap-6">

                        {isEdit && formData.status_validasi === 'rejected' && (
                            <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-2xl flex items-start gap-3 text-[#991B1B] shadow-sm">
                                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
                                <div>
                                    <h4 className="font-bold text-sm">Aset Ini Pernah Ditolak</h4>
                                    {formData.catatan_validasi ? (
                                        <p className="text-xs mt-1 leading-relaxed">
                                            <span className="font-semibold">Alasan penolakan sebelumnya:</span> "{formData.catatan_validasi}"
                                        </p>
                                    ) : (
                                        <p className="text-xs mt-1 leading-relaxed">
                                            Aset ini pernah ditolak oleh admin. Perbaiki data sebelum mengajukan ulang.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="relative h-[420px] md:h-[500px] rounded-2xl border border-border overflow-hidden shadow-md z-0 shrink-0">
                            <GeometryDrawer
                                tipeGeometri={selectedKategori?.tipe_geometri || 'titik'}
                                initialGeometry={formData.koordinat_geojson}
                                onGeometryChange={handleGeometryChange}
                                disabled={!selectedKategori}
                            />
                        </div>

                        <form id="aset-form" onSubmit={handleSubmit} className="w-full flex flex-col gap-8 mt-2">

                                <section>
                                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                        <span className="material-symbols-outlined text-amber-dark">info</span>
                                        <h2 className="text-lg font-bold text-navy">Informasi Umum</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
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
                                                {Object.entries(groupedKategori).map(([groupName, kategoris]) => (
                                                    <optgroup key={groupName} label={groupName}>
                                                        {kategoris.map((k) => (
                                                            <option key={k.id} value={k.id} className="text-navy">{k.nama_kategori}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>

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

                                        {selectedKategori?.tipe_geometri === 'garis' && (
                                            <div>
                                                <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                    Panjang Bentang (meter)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="contoh: 125"
                                                    value={formData.panjang_bentang ?? ''}
                                                    onChange={(e) => handleFieldChange('panjang_bentang', e.target.value)}
                                                    className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                />
                                            </div>
                                        )}

                                        {selectedKategori?.tipe_geometri === 'area' && (
                                            <div>
                                                <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                    Luas Area (m²)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="contoh: 1500"
                                                    value={formData.luas_area ?? ''}
                                                    onChange={(e) => handleFieldChange('luas_area', e.target.value)}
                                                    className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                />
                                            </div>
                                        )}

                                        {selectedKategori?.tipe_geometri === 'garis' ? (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                        Lokasi KM Awal <span className="text-red-500">*</span>
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
                                                <div>
                                                    <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                        Lokasi KM Akhir <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        onWheel={(e) => e.target.blur()}
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="contoh: 92.0"
                                                        value={formData.lokasi_km_akhir || ''}
                                                        onChange={(e) => handleFieldChange('lokasi_km_akhir', e.target.value)}
                                                        className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                        required
                                                    />
                                                </div>
                                            </>
                                        ) : (
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
                                        )}

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

                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                                Tahun Pemasangan <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.tanggal_aset_dibuat ? formData.tanggal_aset_dibuat.substring(0, 4) : ''}
                                                onChange={(e) => handleFieldChange('tanggal_aset_dibuat', `${e.target.value}-01-01`)}
                                                className={`w-full h-12 pl-4 pr-10 border border-border focus:border-amber outline-none rounded-lg text-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat ${!formData.tanggal_aset_dibuat ? 'text-text-muted' : 'text-navy'}`}
                                                required
                                            >
                                                <option value="" disabled hidden>Pilih Tahun</option>
                                                {YEAR_OPTIONS.map((y) => (
                                                    <option key={y} value={y} className="text-navy">{y}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide flex items-center justify-between">
                                                <span>Elevasi (mdpl) <span className="text-red-500">*</span></span>
                                                <span className="flex items-center gap-1">
                                                    {fetchingElevation ? (
                                                        <span className="text-[10px] text-amber-dark font-semibold flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
                                                            Mengambil elevasi...
                                                        </span>
                                                    ) : (
                                                        formData.koordinat_geojson && (
                                                            <button
                                                                type="button"
                                                                onClick={handleRetryElevation}
                                                                title="Ambil ulang elevasi dari koordinat"
                                                                className="text-[10px] text-amber-dark font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
                                                            >
                                                                <span className="material-symbols-outlined text-[12px]">refresh</span>
                                                                Ambil ulang
                                                            </button>
                                                        )
                                                    )}
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                onWheel={(e) => e.target.blur()}
                                                step="0.01"
                                                placeholder={fetchingElevation ? "Memuat elevasi..." : "contoh: 750"}
                                                value={formData.elevasi_mdpl !== undefined && formData.elevasi_mdpl !== null ? formData.elevasi_mdpl : ''}
                                                onChange={(e) => handleFieldChange('elevasi_mdpl', e.target.value)}
                                                className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                </section>

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
                                
                                    <div className="mt-3">
                                        <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                            Catatan Kondisi (opsional)
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Jelaskan kondisi khusus"
                                            value={formData.catatan_kondisi || ''}
                                            onChange={(e) => handleFieldChange('catatan_kondisi', e.target.value)}
                                            className="w-full px-4 py-3 border border-border focus:border-amber outline-none rounded-lg text-sm resize-none"
                                        />
                                    </div>
                                </section>

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
                                                multiple
                                                onChange={handlePhotoSelect}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </section>

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