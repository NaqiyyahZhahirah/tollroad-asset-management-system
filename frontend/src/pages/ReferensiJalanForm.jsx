import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import axiosClient from '../api/axiosClient';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useToast } from '../components/Toast';
import ReferensiJalanLayer from '../components/ReferensiJalanLayer';
import ReferensiJalanToggles from '../components/ReferensiJalanToggles';
import {
    PURBALEUNYI_BOUNDS,
    PURBALEUNYI_CENTER,
    PURBALEUNYI_MIN_ZOOM,
    PURBALEUNYI_DEFAULT_ZOOM
} from '../utils/purbaleunyiBounds';
const DEFAULT_REFERENSI_VISIBLE = { main_road: true, ramp: true, gerbang_tol: true, patok_heksa: true };
const KATEGORI_OPTIONS = [
    { value: 'main_road', label: 'Main Road (Garis)', shape: 'polyline' },
    { value: 'ramp', label: 'Ramp / Akses (Garis)', shape: 'polyline' },
    { value: 'gerbang_tol', label: 'Gerbang Tol (Titik)', shape: 'marker' },
    { value: 'patok_heksa', label: 'Patok Heksa (Titik)', shape: 'marker' }
];

function DrawControl({ shape, initialGeometry, onGeometryChange }) {
    const map = useMap();
    const drawnItemsRef = useRef(new L.FeatureGroup());

    useEffect(() => {
        const drawnItems = drawnItemsRef.current;
        map.addLayer(drawnItems);

        if (initialGeometry) {
            try {
                const geoJsonLayer = L.geoJSON(initialGeometry, {
                    style: { color: '#fea619', weight: 4 }
                });
                geoJsonLayer.eachLayer((layer) => drawnItems.addLayer(layer));
                const bounds = drawnItems.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { maxZoom: 16, padding: [40, 40] });
                }
            } catch (err) {
                console.error('Error loading initial geometry:', err);
            }
        }

        const drawOptions = {
            marker: false, polyline: false, polygon: false,
            circle: false, rectangle: false, circlemarker: false
        };
        if (shape) {
            drawOptions[shape] = shape === 'marker'
                ? {}
                : { shapeOptions: { color: '#7c3aed', weight: 4 } };
        }

        const drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: drawOptions,
            edit: { featureGroup: drawnItems, remove: true }
        });
        map.addControl(drawControl);

        function handleCreated(e) {
            drawnItems.clearLayers();
            drawnItems.addLayer(e.layer);
            onGeometryChange(e.layer.toGeoJSON().geometry);
        }
        function handleEdited(e) {
            e.layers.eachLayer((layer) => onGeometryChange(layer.toGeoJSON().geometry));
        }
        function handleDeleted() {
            onGeometryChange(null);
        }

        map.on(L.Draw.Event.CREATED, handleCreated);
        map.on(L.Draw.Event.EDITED, handleEdited);
        map.on(L.Draw.Event.DELETED, handleDeleted);

        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.off(L.Draw.Event.EDITED, handleEdited);
            map.off(L.Draw.Event.DELETED, handleDeleted);
            map.removeLayer(drawnItems);
            drawnItems.clearLayers();
        };
    }, [map, shape, initialGeometry, onGeometryChange]);

    return null;
}

function toggleReferensiKategori(key) {
    setVisibleReferensi((prev) => ({ ...prev, [key]: !prev[key] }));
}

export default function ReferensiJalanForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const [kategori, setKategori] = useState('main_road');
    const [subRuas, setSubRuas] = useState('Cipularang');
    const [jalur, setJalur] = useState('A');
    const [nama, setNama] = useState('');
    const [lokasiKm, setLokasiKm] = useState('');
    const [geometry, setGeometry] = useState(null);
    const [initialGeometry, setInitialGeometry] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(isEdit);
    const [visibleReferensi, setVisibleReferensi] = useState(DEFAULT_REFERENSI_VISIBLE);
    const [showPatokKm, setShowPatokKm] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const toast = useToast();

    const selectedOption = KATEGORI_OPTIONS.find((k) => k.value === kategori);

    useEffect(() => {
        if (isEdit) {
            axiosClient.get('/referensi-jalan').then((res) => {
                const item = (res.data.data || []).find((d) => d.id === id);
                if (item) {
                    setKategori(item.kategori);
                    setSubRuas(item.sub_ruas || 'Cipularang');
                    setJalur(item.jalur || 'A');
                    setNama(item.nama || '');
                    setLokasiKm(item.lokasi_km ?? '');
                    setGeometry(item.koordinat_geojson);
                    setInitialGeometry(item.koordinat_geojson);
                } else {
                    setError('Data tidak ditemukan');
                }
                setLoadingData(false);
            }).catch(() => {
                setError('Gagal memuat data');
                setLoadingData(false);
            });
        }
    }, [id, isEdit]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!geometry) {
            setError('Gambar dulu titik/garisnya di peta');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                kategori,
                sub_ruas: subRuas,
                jalur,
                nama,
                lokasi_km: lokasiKm ? parseFloat(lokasiKm) : null,
                koordinat_geojson: geometry
            };

            if (isEdit) {
                await axiosClient.patch(`/referensi-jalan/${id}`, payload);
                toast.success('Data berhasil diperbarui');
            } else {
                await axiosClient.post('/referensi-jalan', payload);
                toast.success('Data berhasil disimpan');
            }
            navigate('/referensi-jalan');
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal menyimpan data');
            toast.error(err.response?.data?.error || 'Gagal menyimpan data');
        } finally {
            setSaving(false);
        }
    }

    if (loadingData) {
        return (
            <div className="min-h-screen flex bg-app-bg">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center text-text-muted">Memuat data...</main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />

                <div className="bg-card px-4 md:px-8 py-4 border-b border-border z-10 shrink-0">
                    <h1 className="text-lg md:text-xl font-bold text-navy">{isEdit ? 'Edit Data Referensi Jalan' : 'Tambah Data Referensi Jalan'}</h1>
                    <p className="text-sm text-text-muted">{isEdit ? 'Perbarui kategori, metadata, atau geometri.' : 'Isi metadata lalu gambar geometrinya di peta.'}</p>
                </div>

                {error && (
                    <div className="mx-4 md:mx-8 mt-4 p-3 bg-danger-bg text-danger rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
                    <div className="max-w-3xl mx-auto flex flex-col gap-6">

                        <div className="relative h-[360px] md:h-[420px] rounded-2xl border border-border overflow-hidden shadow-md z-0 shrink-0">
                            <MapContainer
                                center={PURBALEUNYI_CENTER}
                                zoom={PURBALEUNYI_DEFAULT_ZOOM}
                                minZoom={PURBALEUNYI_MIN_ZOOM}
                                maxBounds={PURBALEUNYI_BOUNDS}
                                className="w-full h-full"
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    subdomains="abcd"
                                    maxZoom={19}
                                />
                                <ReferensiJalanLayer visible={visibleReferensi} showKm={showPatokKm} />
                                <DrawControl
                                    shape={selectedOption.shape}
                                    initialGeometry={initialGeometry}
                                    onGeometryChange={setGeometry}
                                />
                            </MapContainer>

                            <div className="absolute top-2 right-2 z-[1000] flex flex-col items-end gap-2">
                                <div className="bg-card/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-border flex flex-col gap-2 text-xs font-bold text-navy w-44">
                                    <span className="flex items-center gap-1.5 text-text-muted">
                                        <span className="material-symbols-outlined text-[16px] text-purple-600">signpost</span>
                                        Ref. Jalan
                                    </span>
                                    <ReferensiJalanToggles
                                        visible={visibleReferensi}
                                        onToggle={toggleReferensiKategori}
                                        showKm={showPatokKm}
                                        onToggleKm={() => setShowPatokKm((v) => !v)}
                                    />
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 mt-2">
                            <section>
                                <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                    <span className="material-symbols-outlined text-amber-dark">signpost</span>
                                    <h2 className="text-lg font-bold text-navy">Informasi Data</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">
                                            Kategori <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={kategori}
                                            onChange={(e) => setKategori(e.target.value)}
                                            className="w-full h-12 pl-4 pr-10 border border-border focus:border-amber outline-none rounded-lg text-sm text-navy appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat"
                                        >
                                            {KATEGORI_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Nama</label>
                                        <input
                                            type="text"
                                            placeholder="misal: Gerbang Tol Pasteur"
                                            value={nama}
                                            onChange={(e) => setNama(e.target.value)}
                                            className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Sub Ruas</label>
                                        <select
                                            value={subRuas}
                                            onChange={(e) => setSubRuas(e.target.value)}
                                            className="w-full h-12 pl-4 pr-10 border border-border focus:border-amber outline-none rounded-lg text-sm text-navy appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat"
                                        >
                                            <option value="Cipularang">Cipularang</option>
                                            <option value="Padaleunyi">Padaleunyi</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Jalur</label>
                                        <select
                                            value={jalur}
                                            onChange={(e) => setJalur(e.target.value)}
                                            className="w-full h-12 pl-4 pr-10 border border-border focus:border-amber outline-none rounded-lg text-sm text-navy appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat"
                                        >
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Lokasi KM (opsional)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="misal: 67.2"
                                            value={lokasiKm}
                                            onChange={(e) => setLokasiKm(e.target.value)}
                                            className="w-full h-12 px-4 border border-border focus:border-amber outline-none rounded-lg text-sm"
                                        />
                                    </div>

                                    <div className="col-span-2 p-3 bg-app-bg rounded-lg border border-border text-xs text-text-muted">
                                        {geometry
                                            ? 'Geometri sudah digambar di peta'
                                            : `Gambar ${selectedOption.shape === 'marker' ? 'titik' : 'garis'} di peta menggunakan tool di kiri atas peta.`}
                                    </div>
                                </div>
                            </section>

                            <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate('/referensi-jalan')}
                                    className="px-6 h-12 border border-border text-navy font-bold hover:bg-card-hover transition-colors rounded-lg flex-1 sm:flex-none"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 h-12 bg-navy text-white font-bold hover:opacity-90 transition-opacity rounded-lg disabled:opacity-60 flex-1 sm:flex-none flex items-center justify-center gap-2"
                                >
                                    {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}