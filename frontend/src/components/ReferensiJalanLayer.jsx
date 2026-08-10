import { useEffect, useState, useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import axiosClient from '../api/axiosClient';

const STYLE_BY_KATEGORI = {
    main_road: { color: '#f59e0b', weight: 2.5, opacity: 0.75, dashArray: '4, 8' },
    ramp: { color: '#7c3aed', weight: 2, opacity: 0.8, dashArray: '6, 6' },
};

function gerbangTolIcon() {
    return L.divIcon({
        html: `<div style="width:16px;height:16px;background:#dc2626;border-radius:4px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
}

function patokHeksaIcon(km, showLabel) {
    const label = showLabel && km != null
        ? `<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);white-space:nowrap;font-size:10px;font-weight:700;color:#374151;background:rgba(255,255,255,0.85);padding:0 3px;border-radius:2px;">KM ${km}</span>`
        : '';

    return L.divIcon({
        html: `<div style="position:relative;width:8px;height:8px;">
                 <div style="width:8px;height:8px;background:#6b7280;border-radius:50%;border:1px solid white;"></div>
                 ${label}
               </div>`,
        className: '',
        iconSize: [8, 8],
        iconAnchor: [4, 4]
    });
}

const DEFAULT_VISIBLE = { main_road: true, ramp: true, gerbang_tol: true, patok_heksa: true };

export default function ReferensiJalanLayer({ visible = DEFAULT_VISIBLE, showKm = false }) {
    const [data, setData] = useState([]);

    useEffect(() => {
        axiosClient.get('/referensi-jalan').then((res) => {
            setData(res.data.data || []);
        }).catch((err) => {
            console.error('Gagal memuat data referensi jalan:', err);
        });
    }, []);

    return (
        <>
            {data.map((item) => {
                if (!visible[item.kategori]) return null;

                if (item.kategori === 'gerbang_tol') {
                    return (
                        <GeoJSON
                            key={item.id}
                            data={item.koordinat_geojson}
                            pointToLayer={(feature, latlng) => L.marker(latlng, { icon: gerbangTolIcon() })}
                            eventHandlers={{
                                click: (e) => { e.target.bindPopup(`<b>${item.nama || 'Gerbang Tol'}</b>`).openPopup(); }
                            }}
                        />
                    );
                }

                if (item.kategori === 'patok_heksa') {
                    return (
                        <GeoJSON
                            key={`${item.id}-${showKm}`}
                            data={item.koordinat_geojson}
                            pointToLayer={(feature, latlng) =>
                                L.marker(latlng, { icon: patokHeksaIcon(item.lokasi_km, showKm) })
                            }
                            eventHandlers={{
                                click: (e) => { e.target.bindPopup(`<b>${item.nama}</b>`).openPopup(); }
                            }}
                        />
                    );
                }

                return (
                    <GeoJSON
                        key={item.id}
                        data={item.koordinat_geojson}
                        style={STYLE_BY_KATEGORI[item.kategori] || { color: '#7c3aed', weight: 2 }}
                        eventHandlers={{
                            click: (e) => { e.target.bindPopup(`<b>${item.nama || item.kategori}</b>`).openPopup(); }
                        }}
                    />
                );
            })}
        </>
    );
}