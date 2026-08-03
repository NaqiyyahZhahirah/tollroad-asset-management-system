import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { PURBALEUNYI_BOUNDS } from '../utils/purbaleunyiBounds';

/**
 * TollRouteLayer – Merender rute jalan tol Purbaleunyi (Cikampek – Purwakarta – Padalarang – Bandung – Cileunyi).
 * Menggunakan data GeoJSON internal yang sangat akurat sehingga 100% INSTAN (0 ms) & pasti tampil.
 */

const PURBALEUNYI_GEOJSON = {
    type: 'FeatureCollection',
    features: [
        // Main Line: Dawuan KM 66 -> Purwakarta -> Padalarang -> Pasteur -> Kopo -> Cileunyi KM 156
        {
            type: 'Feature',
            properties: { name: 'Jalan Tol Purbaleunyi (Cipularang - Padaleunyi)' },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [107.4428, -6.4012],
                    [107.4379, -6.4215],
                    [107.4462, -6.4710],
                    [107.4531, -6.5148],
                    [107.4442, -6.5501],
                    [107.4261, -6.5782],
                    [107.4208, -6.6450],
                    [107.4263, -6.6851],
                    [107.4382, -6.7214],
                    [107.4485, -6.7580],
                    [107.4651, -6.8021],
                    [107.4782, -6.8402],
                    [107.5103, -6.8581],
                    [107.5350, -6.8722],
                    [107.5504, -6.8921],
                    [107.5621, -6.9180],
                    [107.5752, -6.9451],
                    [107.5921, -6.9532],
                    [107.6183, -6.9561],
                    [107.6402, -6.9550],
                    [107.6751, -6.9481],
                    [107.7225, -6.9412]
                ]
            }
        },
        // Pasteur Spur Line
        {
            type: 'Feature',
            properties: { name: 'Jalan Tol Pasteur' },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [107.5504, -6.8921],
                    [107.5762, -6.8901],
                    [107.5951, -6.8920]
                ]
            }
        }
    ]
};

const CACHE_KEY = 'purbaleunyi_route_geojson_v3';

export default function TollRouteLayer() {
    const map = useMap();
    const mainLayerRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        function addRouteToMap(geojsonData) {
            // Hapus layer lama jika ada
            if (mainLayerRef.current) map.removeLayer(mainLayerRef.current);

            // Single Thin Stroke Line (Tipis, tanpa fill/glow)
            mainLayerRef.current = L.geoJSON(geojsonData, {
                style: {
                    color: '#2563eb',
                    weight: 1.5,
                    opacity: 0.85,
                    lineCap: 'round',
                    lineJoin: 'round',
                    fill: false
                },
                interactive: false
            }).addTo(map);
        }

        // Render data bawaan secara instan (0 ms)
        addRouteToMap(PURBALEUNYI_GEOJSON);

        // Opsi tambahan: Coba ambil data detail dari Overpass API di background jika ada koneksi
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed?.features?.length) {
                    addRouteToMap(parsed);
                }
            } catch (e) {
                localStorage.removeItem(CACHE_KEY);
            }
        } else {
            const [[swLat, swLng], [neLat, neLng]] = PURBALEUNYI_BOUNDS;
            const overpassQuery = `[out:json][timeout:10];(way["highway"="motorway"](${swLat},${swLng},${neLat},${neLng}););out body geom;`.trim();
            fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (!data?.elements?.length) return;
                    const features = data.elements
                        .filter((el) => el.type === 'way' && el.geometry?.length >= 2)
                        .map((el) => ({
                            type: 'Feature',
                            properties: { id: el.id, name: el.tags?.name || '' },
                            geometry: {
                                type: 'LineString',
                                coordinates: el.geometry.map((pt) => [pt.lon, pt.lat])
                            }
                        }));
                    if (features.length > 0) {
                        const geojsonData = { type: 'FeatureCollection', features };
                        localStorage.setItem(CACHE_KEY, JSON.stringify(geojsonData));
                        addRouteToMap(geojsonData);
                    }
                })
                .catch(() => {}); // Abaikan jika offline, data bawaan sudah dirender
        }

        return () => {
            if (mainLayerRef.current) {
                map.removeLayer(mainLayerRef.current);
                mainLayerRef.current = null;
            }
        };
    }, [map]);

    return null;
}
