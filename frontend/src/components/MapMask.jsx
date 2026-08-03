import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { PURBALEUNYI_BOUNDS } from '../utils/purbaleunyiBounds';

/**
 * MapMask – merender overlay semi-transparan putih yang menutupi seluruh dunia
 * KECUALI area bounding box koridor Tol Purbaleunyi (sebagai lubang/hole).
 * Menggunakan teknik even-odd fill rule agar area dalam bounding box
 * tetap terlihat jernih, sementara area luar menjadi redup.
 */
export default function MapMask() {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        // Bounds dunia (outer ring, searah jarum jam)
        const worldOuter = [
            [-90, -180],
            [-90,  180],
            [ 90,  180],
            [ 90, -180],
            [-90, -180]
        ];

        // Bounding box koridor Purbaleunyi (inner ring/hole, berlawanan jarum jam)
        const [[swLat, swLng], [neLat, neLng]] = PURBALEUNYI_BOUNDS;
        const bboxHole = [
            [swLat, swLng],
            [neLat, swLng],
            [neLat, neLng],
            [swLat, neLng],
            [swLat, swLng]
        ];

        // GeoJSON Polygon dengan outer ring + inner hole
        const maskGeoJson = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                // GeoJSON: outer ring searah jarum jam, hole berlawanan jarum jam
                coordinates: [
                    worldOuter.map(([lat, lng]) => [lng, lat]),
                    bboxHole.map(([lat, lng]) => [lng, lat])
                ]
            }
        };

        const maskLayer = L.geoJSON(maskGeoJson, {
            style: {
                fillColor: '#f8fafc',
                fillOpacity: 0.72,
                stroke: false,
                interactive: false
            },
            fillRule: 'evenodd'
        }).addTo(map);

        // Tandai layer mask di z-order lebih rendah agar tidak menutupi marker
        maskLayer.setZIndex ? maskLayer.setZIndex(100) : null;
        layerRef.current = maskLayer;

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map]);

    return null;
}
