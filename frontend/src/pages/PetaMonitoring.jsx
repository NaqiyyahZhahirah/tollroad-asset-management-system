import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useToast } from '../components/Toast';
import MapMask from '../components/MapMask';
import ReferensiJalanLayer from '../components/ReferensiJalanLayer';
import ReferensiJalanToggles from '../components/ReferensiJalanToggles';
import { MapSearchBar, MapSearchLayer } from '../components/MapSearchBar';
import {
    PURBALEUNYI_BOUNDS,
    PURBALEUNYI_CENTER,
    PURBALEUNYI_MIN_ZOOM,
    PURBALEUNYI_DEFAULT_ZOOM
} from '../utils/purbaleunyiBounds';

const pinColor = { baik: '#10b981', perlu_perawatan: '#f59e0b', rusak: '#dc2626' };
const actionIcon = { create: 'upload', approve: 'check_circle', reject: 'cancel', update: 'edit' };

const DEFAULT_REFERENSI_VISIBLE = { main_road: true, ramp: true, gerbang_tol: true, patok_heksa: true };

function getAssetStyle(aset, isSelected, isOther) {
    const isRejected = aset.status_validasi === 'rejected';
    const isPending = aset.status_validasi === 'pending';
    const color = isRejected ? '#6b7280' : (pinColor[aset.status_kondisi] || '#6b7280');

    let opacity = isSelected ? 0.95 : isOther ? 0.2 : 0.65;
    let fillOpacity = isSelected ? 0.25 : isOther ? 0.03 : 0.1;

    if (isPending) {
        opacity = isSelected ? 0.7 : isOther ? 0.15 : 0.5;
        fillOpacity = isSelected ? 0.15 : isOther ? 0.02 : 0.05;
    } else if (isRejected) {
        opacity = isSelected ? 0.8 : isOther ? 0.15 : 0.4;
        fillOpacity = isSelected ? 0.2 : isOther ? 0.02 : 0.05;
    }

    return {
        color,
        fillColor: color,
        weight: isSelected ? 4 : 2,
        opacity,
        fillOpacity,
        dashArray: isPending ? '6, 6' : undefined
    };
}

function coloredIcon(color, isSelected, isOther, isPending) {
    const size = isSelected ? 26 : isOther ? 18 : 22;
    let opacity = isSelected ? 1 : isOther ? 0.25 : 0.85;

    if (isPending) {
        opacity = isSelected ? 0.75 : isOther ? 0.2 : 0.5;
    }

    const borderStyle = isPending ? '1.5px dashed white' : '1.5px solid white';

    return L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:${borderStyle};box-shadow:0 1px 4px rgba(0,0,0,0.25);opacity:${opacity}"></div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size]
    });
}

function ZoomControl() {
    const map = useMap();
    return (
        <div className="absolute top-16 left-4 z-[1000] flex flex-col gap-1">
            <div className="bg-card p-1 rounded-xl shadow-lg border border-border flex flex-col items-center">
                <button onClick={() => map.zoomIn()} className="p-2 hover:bg-card-hover rounded-lg" title="Perbesar">
                    <span className="material-symbols-outlined text-navy">add</span>
                </button>
                <div className="w-8 h-px bg-border" />
                <button onClick={() => map.zoomOut()} className="p-2 hover:bg-card-hover rounded-lg" title="Perkecil">
                    <span className="material-symbols-outlined text-navy">remove</span>
                </button>
            </div>
        </div>
    );
}

function MapFlyTo({ selectedAset }) {
    const map = useMap();
    useEffect(() => {
        if (selectedAset?.koordinat_geojson) {
            try {
                const geoJsonLayer = L.geoJSON(selectedAset.koordinat_geojson);
                const bounds = geoJsonLayer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { maxZoom: 16, padding: [60, 60] });
                }
            } catch (err) {
                console.error('Error fitting bounds:', err);
            }
        }
    }, [selectedAset, map]);
    return null;
}

function CtrlScrollZoom() {
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();

        function handleWheel(e) {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    map.zoomIn();
                } else if (e.deltaY > 0) {
                    map.zoomOut();
                }
            }
        }

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [map]);

    return null;
}

// ---------- Filter Panel Component ----------
function FilterPanel({
    filters,
    onChange,
    onReset,
    activeCount,
    totalCount,
    filteredCount,
    visibleReferensi,
    onToggleReferensi,
    showPatokKm,
    onTogglePatokKm,
    showRejected,
    onToggleShowRejected,
    isAdmin
}) {
    const [open, setOpen] = useState(false);
    const anyReferensiOn = Object.values(visibleReferensi).some(Boolean);

    return (
        <div className="absolute top-16 right-4 z-[1000] flex flex-col items-end gap-2">
            <button
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-xl border backdrop-blur-md font-bold text-sm transition-colors ${
                    activeCount > 0 || anyReferensiOn  || showRejected
                        ? 'bg-navy text-white border-navy'
                        : 'bg-card/90 text-navy border-border'
                }`}
            >
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Filter &amp; Layer
                {activeCount > 0 && (
                    <span className="bg-white text-navy text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center leading-none">
                        {activeCount}
                    </span>
                )}
                <span className="material-symbols-outlined text-[16px] ml-1">{open ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
            </button>

            <div className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow text-xs font-semibold text-navy">
                Menampilkan <span className="font-black">{filteredCount}</span>/{totalCount} aset
            </div>

            {open && (
                <div className="bg-card/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-border w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-navy uppercase tracking-wider">Filter &amp; Layer Peta</h3>
                        {activeCount > 0 && (
                            <button
                                onClick={() => { onReset(); setOpen(false); }}
                                className="text-[10px] font-bold text-danger flex items-center gap-0.5 hover:opacity-80"
                            >
                                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                                Reset semua
                            </button>
                        )}
                    </div>

                    <div className="p-2.5 bg-app-bg rounded-xl border border-border space-y-2.5">
                        <span className="text-xs font-bold text-navy flex items-center gap-2">
                            Data Referensi Jalan
                        </span>
                        <ReferensiJalanToggles
                            visible={visibleReferensi}
                            onToggle={onToggleReferensi}
                            showKm={showPatokKm}
                            onToggleKm={onTogglePatokKm}
                        />
                    </div>

                    {isAdmin && (
                        <div className="p-2.5 bg-app-bg rounded-xl border border-border flex items-center justify-between">
                            <span className="text-xs font-bold text-navy flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-gray-500">cancel</span>
                                Tampilkan aset ditolak
                            </span>
                            <button
                                type="button"
                                onClick={() => onToggleShowRejected(!showRejected)}
                                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${showRejected ? 'bg-gray-700' : 'bg-gray-300'}`}
                                title="Tampilkan aset berstatus rejected di peta"
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showRejected ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Kondisi Aset</label>
                        <select
                            value={filters.kondisi}
                            onChange={(e) => onChange('kondisi', e.target.value)}
                            className="w-full h-9 pl-3 pr-8 border border-border rounded-lg text-sm text-navy bg-app-bg focus:border-amber focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat cursor-pointer"
                        >
                            <option value="">Semua Kondisi</option>
                            <option value="baik">Baik</option>
                            <option value="perlu_perawatan">Perlu Perawatan</option>
                            <option value="rusak">Rusak</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Tipe Geometri</label>
                        <select
                            value={filters.geomType}
                            onChange={(e) => onChange('geomType', e.target.value)}
                            className="w-full h-9 pl-3 pr-8 border border-border rounded-lg text-sm text-navy bg-app-bg focus:border-amber focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat cursor-pointer"
                        >
                            <option value="">Semua Tipe</option>
                            <option value="Point">Titik (Point)</option>
                            <option value="LineString">Garis (Polyline)</option>
                            <option value="Polygon">Area (Polygon)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Tanggal Pemasangan</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="text-[9px] text-text-muted font-semibold block mb-0.5">Dari</label>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => onChange('dateFrom', e.target.value)}
                                    className="w-full h-9 px-2 border border-border rounded-lg text-xs text-navy bg-app-bg focus:border-amber focus:outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] text-text-muted font-semibold block mb-0.5">Sampai</label>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => onChange('dateTo', e.target.value)}
                                    className="w-full h-9 px-2 border border-border rounded-lg text-xs text-navy bg-app-bg focus:border-amber focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------- Main Component ----------
export default function PetaMonitoring() {
    const [asetData, setAsetData] = useState([]);
    const [selectedAset, setSelectedAset] = useState(null);
    const [logs, setLogs] = useState([]);
    const [showRejectBox, setShowRejectBox] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [visibleReferensi, setVisibleReferensi] = useState(DEFAULT_REFERENSI_VISIBLE);
    const [showPatokKm, setShowPatokKm] = useState(false);
    const [showRejected, setShowRejected] = useState(false);
    const [searchFlyTarget, setSearchFlyTarget] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const toast = useToast();

    // Filters state
    const [filters, setFilters] = useState({
        kondisi: '',
        geomType: '',
        dateFrom: '',
        dateTo: ''
    });

    const selectedId = searchParams.get('selectedId');

    useEffect(() => {
        axiosClient.get('/aset').then((res) => {
            const data = res.data.data || [];
            setAsetData(data);
            if (selectedId) {
                const target = data.find((a) => a.id === selectedId);
                if (target) setSelectedAset(target);
            }
        });
    }, [selectedId]);

    useEffect(() => {
        if (selectedAset) {
            axiosClient.get(`/log/aset/${selectedAset.id}`).then((res) => {
                setLogs(res.data.data || []);
            });
        }
    }, [selectedAset]);

    function handleFilterChange(key, value) {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }

    function resetFilters() {
        setFilters({ kondisi: '', geomType: '', dateFrom: '', dateTo: '' });
    }

    function toggleReferensiKategori(key) {
        setVisibleReferensi((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    // Client-side filtering
    const filtered = useMemo(() => {
        return asetData.filter((aset) => {
            // Asset dengan status_validasi === 'rejected' di-exclude dari peta secara default
            if (aset.status_validasi === 'rejected' && (!showRejected || user?.role !== 'admin')) {
                return false;
            }
            if (filters.kondisi && aset.status_kondisi !== filters.kondisi) return false;
            if (filters.geomType && aset.koordinat_geojson?.type !== filters.geomType) return false;
            if (filters.dateFrom && aset.tanggal_aset_dibuat && aset.tanggal_aset_dibuat < filters.dateFrom) return false;
            if (filters.dateTo && aset.tanggal_aset_dibuat && aset.tanggal_aset_dibuat > filters.dateTo) return false;
            return true;
        });
    }, [asetData, filters, showRejected, user?.role]);

    // Urutkan aset agar geometri Polygon berada paling bawah, LineString di tengah,
    // dan Point (marker) paling atas. Dengan demikian, titik/garis yang berada di dalam area polygon
    // tetap SELALU dapat dipencet (bisa diklik).
    const sortedFiltered = useMemo(() => {
        const typePriority = {
            Polygon: 1,
            MultiPolygon: 1,
            LineString: 2,
            MultiLineString: 2,
            Point: 3,
            MultiPoint: 3
        };

        return [...filtered].sort((a, b) => {
            const typeA = a.koordinat_geojson?.type || 'Point';
            const typeB = b.koordinat_geojson?.type || 'Point';
            const prioA = typePriority[typeA] || 3;
            const prioB = typePriority[typeB] || 3;

            if (prioA !== prioB) return prioA - prioB;
            if (a.id === selectedAset?.id) return 1;
            if (b.id === selectedAset?.id) return -1;
            return 0;
        });
    }, [filtered, selectedAset?.id]);

    function selectAsset(aset) {
        setSelectedAset(aset);
        setSearchParams({ selectedId: aset.id });
        setShowRejectBox(false);
        setRejectReason('');
    }

    function handleCloseDetail() {
        setSelectedAset(null);
        setSearchParams({});
        setShowRejectBox(false);
        setRejectReason('');
    }

    async function handleDecision(status) {
        setProcessing(true);
        try {
            await axiosClient.patch(`/aset/${selectedAset.id}/validasi`, {
                status_validasi: status,
                validated_by: user?.id,
                catatan_validasi: status === 'rejected' ? rejectReason : null
            });
            toast.success(status === 'approved' ? 'Aset berhasil disetujui' : 'Aset ditolak');
            const res = await axiosClient.get('/aset');
            setAsetData(res.data.data || []);
            const updated = (res.data.data || []).find((a) => a.id === selectedAset.id);
            if (updated) setSelectedAset(updated);
            setShowRejectBox(false);
            setRejectReason('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal memproses keputusan');
        } finally {
            setProcessing(false);
        }
    }

    const specFields = selectedAset?.kategori_aset?.skema_formulir?.fields || [];

    const getCoordinatesString = (geojson) => {
        if (!geojson || !geojson.coordinates) return '-';
        const type = geojson.type;
        if (type === 'Point') return `[${geojson.coordinates[1]?.toFixed(6)}, ${geojson.coordinates[0]?.toFixed(6)}]`;
        if (type === 'LineString') return `${geojson.coordinates.length} titik bentangan`;
        if (type === 'Polygon') return `${geojson.coordinates[0]?.length || 0} titik sudut area`;
        return type;
    };

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 relative overflow-hidden">

                    <div className="w-full h-full">
                        <MapContainer
                            center={PURBALEUNYI_CENTER}
                            zoom={PURBALEUNYI_DEFAULT_ZOOM}
                            minZoom={PURBALEUNYI_MIN_ZOOM}
                            maxBounds={PURBALEUNYI_BOUNDS}
                            zoomControl={false}
                            className="w-full h-full z-0"
                        >
                            <TileLayer
                                url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_CARTO_API_KEY}`}
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                subdomains="abcd"
                                maxZoom={19}
                            />
                            
                            <ReferensiJalanLayer visible={visibleReferensi} showKm={showPatokKm} />
                            <MapMask />

                            <ZoomControl />
                            <MapFlyTo selectedAset={selectedAset} />
                            <MapSearchLayer target={searchFlyTarget} />

                            {sortedFiltered.map((aset) => {
                                const isSelected = selectedAset?.id === aset.id;
                                const isOther = selectedAset && !isSelected;
                                const isPending = aset.status_validasi === 'pending';
                                const isRejected = aset.status_validasi === 'rejected';
                                const color = isRejected ? '#6b7280' : (pinColor[aset.status_kondisi] || '#6b7280');
                                const style = getAssetStyle(aset, isSelected, isOther);

                                return (
                                <GeoJSON
                                    key={`${aset.id}-${aset.status_kondisi}-${aset.status_validasi}-${isSelected}`}
                                    data={aset.koordinat_geojson}
                                    style={style}
                                    pointToLayer={(feature, latlng) =>
                                        L.marker(latlng, {
                                            icon: coloredIcon(color, isSelected, isOther, isPending),
                                            zIndexOffset: isSelected ? 1000 : isOther ? 10 : 100
                                        })
                                    }
                                    eventHandlers={{ click: () => selectAsset(aset) }}
                                />
                                );
                            })}
                        </MapContainer>

                        <MapSearchBar onFly={setSearchFlyTarget} className="top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[340px]" />

                        <FilterPanel
                            filters={filters}
                            onChange={handleFilterChange}
                            onReset={resetFilters}
                            activeCount={activeFilterCount}
                            totalCount={asetData.length}
                            filteredCount={filtered.length}
                            visibleReferensi={visibleReferensi}
                            onToggleReferensi={toggleReferensiKategori}
                            showPatokKm={showPatokKm}
                            onTogglePatokKm={() => setShowPatokKm((v) => !v)}
                            showRejected={showRejected}
                            onToggleShowRejected={setShowRejected}
                            isAdmin={user?.role === 'admin'}
                        />

                        <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-border w-52">
                            <h4 className="text-[10px] font-bold text-text-muted uppercase mb-2 tracking-wider">Legenda Kondisi &amp; Layer</h4>
                            <div className="space-y-1.5">
                                {[
                                    { color: 'bg-emerald-500', label: 'Baik', count: filtered.filter(a => a.status_kondisi === 'baik' && a.status_validasi !== 'rejected').length },
                                    { color: 'bg-amber-500', label: 'Perlu Perawatan', count: filtered.filter(a => a.status_kondisi === 'perlu_perawatan' && a.status_validasi !== 'rejected').length },
                                    { color: 'bg-red-600', label: 'Rusak', count: filtered.filter(a => a.status_kondisi === 'rusak' && a.status_validasi !== 'rejected').length }
                                ].map(({ color, label, count }) => (
                                    <div key={label} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
                                            <span className="text-xs font-semibold text-navy">{label}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-text-muted">{count}</span>
                                    </div>
                                ))}
                                {user?.role === 'admin' && showRejected && (
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border mt-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full shrink-0 bg-gray-500" />
                                            <span className="text-xs font-semibold text-navy">Ditolak</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-text-muted">
                                            {filtered.filter(a => a.status_validasi === 'rejected').length}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {selectedAset && (
                        <div className="absolute top-0 right-0 h-full w-full md:w-[480px] xl:w-[540px] bg-card/98 backdrop-blur-xl shadow-2xl border-l border-border z-[1000] flex flex-col">

                            <div className="p-4 border-b border-border flex justify-between items-center bg-card-alt shrink-0">
                                <div className="overflow-hidden">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Detail Aset Lengkap</span>
                                    <h2 className="text-base font-bold text-navy truncate max-w-[260px] md:max-w-[300px]">{selectedAset.nama_aset}</h2>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {(user?.role === 'admin' || (user?.role === 'operator' && selectedAset.input_by === user?.id && (selectedAset.status_validasi === 'pending' || selectedAset.status_validasi === 'rejected'))) && (
                                        <button
                                            onClick={() => navigate(`/aset/edit/${selectedAset.id}`)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-navy text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                            Edit
                                        </button>
                                    )}
                                    <button onClick={handleCloseDetail} className="p-1.5 hover:bg-card-hover rounded-full text-text-muted" title="Tutup Detail">
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">

                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                                            selectedAset.status_kondisi === 'baik' ? 'bg-[#D1FAE5] text-[#065F46]' :
                                            selectedAset.status_kondisi === 'perlu_perawatan' ? 'bg-[#FEF3C7] text-[#92400E]' :
                                            'bg-[#FEE2E2] text-[#991B1B]'
                                        }`}>
                                            Kondisi: {(selectedAset.status_kondisi || '').replace('_', ' ')}
                                        </span>
                                        {selectedAset.status_validasi === 'pending' ? (
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                                                Menunggu Verifikasi
                                            </span>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                                                selectedAset.status_validasi === 'approved' ? 'bg-[#D1FAE5] text-[#065F46]' :
                                                'bg-[#FEE2E2] text-[#991B1B]'
                                            }`}>
                                                Validasi: {selectedAset.status_validasi}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-navy leading-tight">{selectedAset.nama_aset}</h3>
                                    <p className="text-xs text-text-muted font-mono mt-0.5">No. Seri: {selectedAset.nomor_seri || '-'}</p>
                                </div>

                                <section className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1">
                                        <span className="material-symbols-outlined text-amber-dark text-[16px]">location_on</span>
                                        Informasi Umum &amp; Lokasi
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {[
                                            { label: 'Kategori', value: selectedAset.kategori_aset?.nama_kategori || '-' },
                                            { label: 'Tipe Geometri', value: selectedAset.kategori_aset?.tipe_geometri || selectedAset.koordinat_geojson?.type || '-', capitalize: true },
                                            { label: 'Ruas Tol', value: selectedAset.ruas_tol || 'Purbaleunyi' },
                                            { label: 'Lokasi KM & Jalur', value: `KM ${selectedAset.lokasi_km ?? '-'} Jalur ${selectedAset.jalur || '-'}` },
                                            { label: 'Elevasi (mdpl)', value: selectedAset.elevasi_mdpl != null ? `${selectedAset.elevasi_mdpl} m` : '-' },
                                            { label: 'Tanggal Pemasangan', value: selectedAset.tanggal_aset_dibuat || '-' }
                                        ].map(({ label, value, capitalize }) => (
                                            <div key={label} className="p-2.5 bg-app-bg rounded-lg border border-border">
                                                <p className="text-[9px] text-text-muted font-bold uppercase">{label}</p>
                                                <p className={`font-bold text-navy mt-0.5 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                                            </div>
                                        ))}
                                        <div className="col-span-2 p-2.5 bg-app-bg rounded-lg border border-border">
                                            <p className="text-[9px] text-text-muted font-bold uppercase">Koordinat ({selectedAset.koordinat_geojson?.type || 'GeoJSON'})</p>
                                            <p className="font-mono text-navy mt-0.5 break-all text-[11px]">{getCoordinatesString(selectedAset.koordinat_geojson)}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1">
                                        <span className="material-symbols-outlined text-amber-dark text-[16px]">history_edu</span>
                                        Metadata &amp; Validasi
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {[
                                            { label: 'Versi Skema Input', value: `Versi ${selectedAset.versi_skema_saat_input || 1}` },
                                            { label: 'Dibuat (created_at)', value: selectedAset.created_at ? new Date(selectedAset.created_at).toLocaleString('id-ID') : '-' },
                                            { label: 'Diperbarui (updated_at)', value: selectedAset.updated_at ? new Date(selectedAset.updated_at).toLocaleString('id-ID') : '-' },
                                            { label: 'Waktu Divalidasi', value: selectedAset.validated_at ? new Date(selectedAset.validated_at).toLocaleString('id-ID') : '-' }
                                        ].map(({ label, value }) => (
                                            <div key={label} className="p-2.5 bg-app-bg rounded-lg border border-border">
                                                <p className="text-[9px] text-text-muted font-bold uppercase">{label}</p>
                                                <p className="font-bold text-navy mt-0.5">{value}</p>
                                            </div>
                                        ))}
                                        {selectedAset.catatan_validasi && (
                                            <div className="col-span-2 p-2.5 bg-app-bg rounded-lg border border-border">
                                                <p className="text-[9px] text-text-muted font-bold uppercase">Catatan Validasi</p>
                                                <p className="font-bold text-navy mt-0.5 italic">"{selectedAset.catatan_validasi}"</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {selectedAset.atribut_spesifik && Object.keys(selectedAset.atribut_spesifik).length > 0 && (
                                    <section className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1">
                                            <span className="material-symbols-outlined text-amber-dark text-[16px]">settings_suggest</span>
                                            Spesifikasi Teknis ({selectedAset.kategori_aset?.nama_kategori})
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {specFields.length > 0
                                                ? specFields.map((field) => (
                                                    <div key={field.key} className="p-2.5 bg-app-bg rounded-lg border border-border">
                                                        <p className="text-[9px] text-text-muted font-bold uppercase">{field.label}</p>
                                                        <p className="font-bold text-navy mt-0.5">{selectedAset.atribut_spesifik?.[field.key] ?? '-'}</p>
                                                    </div>
                                                ))
                                                : Object.entries(selectedAset.atribut_spesifik).map(([key, val]) => (
                                                    <div key={key} className="p-2.5 bg-app-bg rounded-lg border border-border">
                                                        <p className="text-[9px] text-text-muted font-bold uppercase">{key.replace(/_/g, ' ')}</p>
                                                        <p className="font-bold text-navy mt-0.5">{val?.toString() || '-'}</p>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </section>
                                )}

                                <section className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1">
                                        <span className="material-symbols-outlined text-amber-dark text-[16px]">add_a_photo</span>
                                        Foto Dokumentasi ({selectedAset.foto_aset?.length || 0})
                                    </h4>
                                    {selectedAset.foto_aset?.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedAset.foto_aset.map((f) => (
                                                <div
                                                    key={f.id}
                                                    onClick={() => setPreviewPhoto(f.url_foto)}
                                                    className="aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 relative group"
                                                >
                                                    <img src={f.url_foto} alt={f.keterangan || 'Foto Aset'} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-white text-xl">zoom_in</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-text-muted">Belum ada foto dokumentasi diupload.</p>
                                    )}
                                </section>

                                {user?.role === 'admin' && selectedAset.status_validasi === 'pending' && (
                                    <section className="bg-card-strong p-4 rounded-xl border border-amber/30 space-y-3">
                                        <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-amber-dark text-[16px]">gavel</span>
                                            Review Validasi Admin
                                        </h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDecision('approved')}
                                                disabled={processing}
                                                className="flex-1 bg-[#065F46] hover:bg-[#044a36] text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setShowRejectBox(true)}
                                                disabled={processing}
                                                className="flex-1 border border-danger text-danger bg-danger-bg hover:bg-danger hover:text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">cancel</span>
                                                Reject
                                            </button>
                                        </div>
                                        {showRejectBox && (
                                            <div className="space-y-2 pt-2 border-t border-border">
                                                <label className="text-[9px] font-bold text-text-muted uppercase">Alasan Penolakan</label>
                                                <textarea
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    rows={2}
                                                    className="w-full border border-border rounded-lg p-2 text-xs bg-card"
                                                    placeholder="Masukkan catatan alasan reject..."
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDecision('rejected')}
                                                        disabled={processing}
                                                        className="flex-1 bg-danger text-white py-1.5 rounded-lg font-bold text-xs disabled:opacity-60"
                                                    >
                                                        Konfirmasi Reject
                                                    </button>
                                                    <button
                                                        onClick={() => setShowRejectBox(false)}
                                                        className="flex-1 bg-card border border-border text-text-muted py-1.5 rounded-lg font-bold text-xs"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}

                                <section className="space-y-2 pb-4">
                                    <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1">
                                        <span className="material-symbols-outlined text-amber-dark text-[16px]">history</span>
                                        Riwayat Aktivitas
                                    </h4>
                                    <div className="space-y-3 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                                        {(logs || []).map((log) => (
                                            <div key={log.id} className="relative flex gap-3 pl-7">
                                                <div className="absolute left-0 w-6 h-6 rounded-full bg-card-strong flex items-center justify-center border-2 border-border">
                                                    <span className="material-symbols-outlined text-[11px] text-navy">
                                                        {actionIcon[log.aksi] || 'circle'}
                                                    </span>
                                                </div>
                                                <div className="text-xs">
                                                    <p className="font-bold text-navy capitalize leading-none">{log.aksi}</p>
                                                    <p className="text-[10px] text-text-muted mt-0.5">
                                                        {log.users?.nama || 'Pengguna'} • {log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}
                                                    </p>
                                                    {log.keterangan && <p className="text-[11px] text-text-muted italic mt-0.5">"{log.keterangan}"</p>}
                                                </div>
                                            </div>
                                        ))}
                                        {(!logs || logs.length === 0) && (
                                            <p className="text-xs text-text-muted pl-4">Belum ada riwayat aktivitas.</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>

                {previewPhoto && (
                    <div
                        className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setPreviewPhoto(null)}
                    >
                        <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-black">
                            <img src={previewPhoto} alt="Foto Dokumentasi" className="max-w-full max-h-[85vh] object-contain" />
                            <button
                                onClick={() => setPreviewPhoto(null)}
                                className="absolute top-2 right-2 text-white bg-black/60 p-2 rounded-full"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}