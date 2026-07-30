import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import axiosClient from '../api/axiosClient';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

const pinColor = { baik: '#10b981', perlu_perawatan: '#f59e0b', rusak: '#dc2626' };

function coloredIcon(color) {
    return L.divIcon({
        html: `<div style="width:28px;height:28px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
    });
}

function ZoomControl() {
    const map = useMap();
    return (
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1">
            <div className="bg-card p-1 rounded-xl shadow-lg border border-border flex flex-col items-center">
                <button onClick={() => map.zoomIn()} className="p-2 hover:bg-card-hover rounded-lg">
                    <span className="material-symbols-outlined text-navy">add</span>
                </button>
                <div className="w-8 h-px bg-border" />
                <button onClick={() => map.zoomOut()} className="p-2 hover:bg-card-hover rounded-lg">
                    <span className="material-symbols-outlined text-navy">remove</span>
                </button>
            </div>
        </div>
    );
}

export default function PetaMonitoring() {
    const [asetData, setAsetData] = useState([]);
    const [selectedAset, setSelectedAset] = useState(null);
    const [filterKondisi, setFilterKondisi] = useState('');

    useEffect(() => {
        axiosClient.get('/aset').then((res) => setAsetData(res.data.data));
    }, []);

    const filtered = filterKondisi ? asetData.filter((a) => a.status_kondisi === filterKondisi) : asetData;

    return (
        <div className="min-h-screen flex bg-app-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                <div className="relative flex-1 overflow-hidden">
                    <MapContainer center={[-6.9147, 107.6098]} zoom={12} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        <ZoomControl />
                        {filtered.map((aset) => (
                            <Marker
                                key={aset.id}
                                position={[aset.latitude, aset.longitude]}
                                icon={coloredIcon(pinColor[aset.status_kondisi])}
                                eventHandlers={{ click: () => setSelectedAset(aset) }}
                            />
                        ))}
                    </MapContainer>

                    {/* Filter bar mengambang */}
                    <div className="absolute top-4 right-4 left-4 md:left-auto z-[1000]">
                        <div className="bg-card/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-border flex flex-wrap items-center gap-4">
                            <select
                                value={filterKondisi}
                                onChange={(e) => setFilterKondisi(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
                            >
                                <option value="">Semua Kondisi</option>
                                <option value="baik">Baik</option>
                                <option value="perlu_perawatan">Perlu Perawatan</option>
                                <option value="rusak">Rusak</option>
                            </select>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-border w-44">
                        <h4 className="text-[10px] font-bold text-text-muted uppercase mb-2">Legenda Kondisi</h4>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-sm">Baik</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-sm">Perlu Perawatan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-600" />
                                <span className="text-sm">Rusak</span>
                            </div>
                        </div>
                    </div>

                    {/* Detail panel */}
                    {selectedAset && (
                        <div className="absolute top-0 right-0 h-full w-full md:w-[380px] bg-card/95 backdrop-blur-xl shadow-2xl border-l border-border z-[1000] flex flex-col">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h2 className="text-lg font-bold text-navy">Detail Aset</h2>
                                <button onClick={() => setSelectedAset(null)} className="p-2 hover:bg-card-hover rounded-full">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        selectedAset.status_kondisi === 'baik' ? 'bg-[#D1FAE5] text-[#065F46]' :
                                        selectedAset.status_kondisi === 'perlu_perawatan' ? 'bg-[#FEF3C7] text-[#92400E]' :
                                        'bg-[#FEE2E2] text-[#991B1B]'
                                    }`}>
                                        {selectedAset.status_kondisi.replace('_', ' ')}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-navy">{selectedAset.nama_aset}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-app-bg rounded-lg border border-border">
                                        <p className="text-[10px] text-text-muted font-bold uppercase">Kategori</p>
                                        <p className="font-bold text-navy">{selectedAset.kategori_aset?.nama_kategori}</p>
                                    </div>
                                    <div className="p-3 bg-app-bg rounded-lg border border-border">
                                        <p className="text-[10px] text-text-muted font-bold uppercase">Lokasi</p>
                                        <p className="font-bold text-navy">KM {selectedAset.lokasi_km} Jalur {selectedAset.jalur}</p>
                                    </div>
                                </div>
                                {selectedAset.foto_aset?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-navy mb-2">Foto Dokumentasi</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedAset.foto_aset.map((f) => (
                                                <img key={f.id} src={f.url_foto} alt={f.keterangan} className="aspect-square object-cover rounded-lg border border-border" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}