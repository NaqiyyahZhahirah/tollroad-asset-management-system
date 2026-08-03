import { useState, useRef, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/** Red teardrop pin diletakkan di peta saat hasil pencarian dipilih */
function SearchPinMarker({ target }) {
    const map = useMap();
    const markerRef = useRef(null);

    useEffect(() => {
        if (!target) return;

        // Buat icon pin merah
        const icon = L.divIcon({
            html: `
                <div style="position:relative;width:32px;height:40px">
                    <div style="
                        width:32px;height:32px;
                        background:#ef4444;
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        border:2.5px solid white;
                        box-shadow:0 3px 8px rgba(0,0,0,0.35);
                    "></div>
                    <div style="
                        position:absolute;top:7px;left:7px;
                        width:18px;height:18px;
                        background:white;
                        border-radius:50%;
                        transform:rotate(45deg);
                        opacity:0.9;
                    "></div>
                </div>`,
            className: '',
            iconSize: [32, 40],
            iconAnchor: [16, 40]
        });

        if (markerRef.current) {
            map.removeLayer(markerRef.current);
        }
        const marker = L.marker([target.lat, target.lon], { icon, zIndexOffset: 2000 })
            .bindTooltip(target.label || 'Hasil Pencarian', { permanent: false, direction: 'top' })
            .addTo(map);
        markerRef.current = marker;

        return () => {
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
        };
    }, [target, map]);

    return null;
}

/** Terbang ke koordinat hasil pencarian */
function FlyToTarget({ target }) {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo([target.lat, target.lon], target.zoom ?? 15, { duration: 1.2 });
        }
    }, [target, map]);
    return null;
}

/**
 * MapSearchBar — search bar mengambang (absolute) di atas peta.
 * Taruh di luar <MapContainer> tapi di dalam div relative yang membungkus peta.
 *
 * Props:
 *   onFly(target)    — dipanggil saat hasil dipilih, set state flyTarget di parent
 *   className        — kelas tambahan untuk posisi (default: tengah atas)
 */
export function MapSearchBar({ onFly, className = '' }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const timerRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const search = useCallback((q) => {
        // Cek apakah input berupa koordinat  lat, lon  atau  lon, lat
        const coordMatch = q.match(/^(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
            const a = parseFloat(coordMatch[1]);
            const b = parseFloat(coordMatch[2]);
            const [lat, lon] = Math.abs(a) <= 90 ? [a, b] : [b, a];
            setResults([{
                place_id: 'coord',
                display_name: `Koordinat: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
                lat: String(lat),
                lon: String(lon),
                zoom: 16
            }]);
            setOpen(true);
            setLoading(false);
            return;
        }

        if (q.length < 3) { setResults([]); setOpen(false); return; }

        setLoading(true);
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ' Jawa Barat Indonesia')}&countrycodes=id&limit=6&accept-language=id`)
            .then((r) => r.json())
            .then((data) => { setResults(data); setOpen(data.length > 0); })
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    }, []);

    function handleInput(e) {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => search(val), 400);
    }

    function handleSelect(item) {
        onFly({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            zoom: item.zoom ?? 15,
            label: item.display_name.split(',')[0]
        });
        setQuery(item.display_name.split(',')[0]);
        setOpen(false);
        setResults([]);
    }

    function handleClear() {
        setQuery('');
        setResults([]);
        setOpen(false);
        onFly(null);
    }

    return (
        <div
            ref={wrapperRef}
            className={`absolute z-[1100] w-[min(340px,60%)] ${className || 'top-4 left-1/2 -translate-x-1/2'}`}
        >
            {/* Input */}
            <div className="flex items-center gap-2 bg-card/97 backdrop-blur-md border border-border rounded-xl shadow-xl px-3 h-10">
                {loading
                    ? <span className="material-symbols-outlined text-[18px] text-text-muted animate-spin">progress_activity</span>
                    : <span className="material-symbols-outlined text-[18px] text-text-muted">search</span>
                }
                <input
                    type="text"
                    value={query}
                    onChange={handleInput}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder="Cari lokasi, jalan, atau koordinat..."
                    className="flex-1 text-xs bg-transparent outline-none text-navy placeholder:text-text-muted min-w-0"
                />
                {query && (
                    <button type="button" onClick={handleClear} className="text-text-muted hover:text-navy shrink-0">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {open && results.length > 0 && (
                <div className="mt-1 bg-card/98 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden">
                    {results.map((item) => (
                        <button
                            key={item.place_id}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-3 py-2.5 hover:bg-card-hover transition-colors flex items-start gap-2 border-b border-border/50 last:border-0"
                        >
                            {/* Red location pin icon */}
                            <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                                location_on
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-navy truncate">{item.display_name.split(',')[0]}</p>
                                <p className="text-[10px] text-text-muted truncate">{item.display_name.split(',').slice(1, 3).join(',')}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * MapSearchLayer — taruh DALAM <MapContainer>.
 * Menangani FlyTo dan red pin marker hasil pencarian.
 */
export function MapSearchLayer({ target }) {
    return (
        <>
            <FlyToTarget target={target} />
            <SearchPinMarker target={target} />
        </>
    );
}
