import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';

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
    const defaultCenter = initialPosition || [-6.9147, 107.6098];

    function handleSetPosition(pos) {
        setPosition(pos);
        onLocationSelect(pos[0], pos[1]);
    }

    return (
        <div className="relative h-full min-h-[300px] bg-card-alt">
            <MapContainer center={defaultCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <LocationMarker position={position} setPosition={handleSetPosition} />
            </MapContainer>

            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur shadow-md p-2 rounded-lg border border-border pointer-events-none">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Koordinat Terpilih</p>
                <p className="text-sm text-navy font-mono">
                    {position ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}` : 'Tap peta untuk pilih lokasi'}
                </p>
            </div>
        </div>
    );
}