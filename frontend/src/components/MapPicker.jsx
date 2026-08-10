import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import ReferensiJalanLayer from './ReferensiJalanLayer';
import ReferensiJalanToggles from './ReferensiJalanToggles';

const DEFAULT_REFERENSI_VISIBLE = { main_road: true, ramp: true, gerbang_tol: true, patok_heksa: true };

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        }
    });
    return position ? (
        <Marker
            position={position}
            draggable
            eventHandlers={{
                dragend: (e) => setPosition([e.target.getLatLng().lat, e.target.getLatLng().lng])
            }}
        />
    ) : null;
}

export default function MapPicker({ onLocationSelect, initialPosition }) {
    const [position, setPosition] = useState(initialPosition || null);
    const [visibleReferensi, setVisibleReferensi] = useState(DEFAULT_REFERENSI_VISIBLE);
    const [showPatokKm, setShowPatokKm] = useState(false);
    const defaultCenter = initialPosition || [-6.9147, 107.6098];

    function handleSetPosition(pos) {
        setPosition(pos);
        onLocationSelect(pos[0], pos[1]);
    }

    function toggleReferensiKategori(key) {
        setVisibleReferensi((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    return (
        <div className="relative h-full min-h-[300px] bg-card-alt">
            <MapContainer center={defaultCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <ReferensiJalanLayer visible={visibleReferensi} showKm={showPatokKm} />
                <LocationMarker position={position} setPosition={handleSetPosition} />
            </MapContainer>

            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur shadow-md p-2 rounded-lg border border-border pointer-events-none">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Koordinat Terpilih</p>
                <p className="text-sm text-navy font-mono">
                    {position ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}` : 'Tap peta untuk pilih lokasi'}
                </p>
            </div>

            <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur shadow-md p-2.5 rounded-lg border border-border w-40">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-purple-600">signpost</span>
                    Ref. Jalan
                </p>
                <ReferensiJalanToggles
                    visible={visibleReferensi}
                    onToggle={toggleReferensiKategori}
                    showKm={showPatokKm}
                    onToggleKm={() => setShowPatokKm((v) => !v)}
                />
            </div>
        </div>
    );
}