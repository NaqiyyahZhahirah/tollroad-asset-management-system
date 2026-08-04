import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import axiosClient from '../api/axiosClient';
import MapMask from './MapMask';
import TollRouteLayer from './TollRouteLayer';
import { MapSearchBar, MapSearchLayer } from './MapSearchBar';
import {
    PURBALEUNYI_BOUNDS,
    PURBALEUNYI_CENTER,
    PURBALEUNYI_MIN_ZOOM,
    PURBALEUNYI_DEFAULT_ZOOM
} from '../utils/purbaleunyiBounds';

const geometryToLeafletShape = { titik: 'marker', garis: 'polyline', area: 'polygon' };
const pinColor = { baik: '#10b981', perlu_perawatan: '#f59e0b', rusak: '#dc2626' };

function existingIcon(color) {
    return L.divIcon({
        html: `<div style="width:20px;height:20px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.25);opacity:0.75"></div>`,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 20]
    });
}

function DrawControl({ tipeGeometri, initialGeometry, onGeometryChange, disabled }) {
    const map = useMap();
    const drawnItemsRef = useRef(new L.FeatureGroup());

    useEffect(() => {
        const drawnItems = drawnItemsRef.current;
        map.addLayer(drawnItems);

        const zoomControl = L.control.zoom({ position: 'topleft' });
        map.addControl(zoomControl);

        if (initialGeometry && drawnItems.getLayers().length === 0) {
            try {
                const geoJsonLayer = L.geoJSON(initialGeometry, {
                    style: { color: '#fea619', weight: 4, fillOpacity: 0.35 }
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

        const shape = disabled ? null : geometryToLeafletShape[tipeGeometri];
        const drawOptions = {
            marker: false, polyline: false, polygon: false,
            circle: false, rectangle: false, circlemarker: false
        };
        if (shape) {
            drawOptions[shape] = shape === 'marker'
                ? {}
                : { shapeOptions: { color: '#fea619', weight: 4, fillOpacity: 0.35 } };
        }

        const drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: drawOptions,
            edit: { featureGroup: drawnItems, remove: !disabled }
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
        function handleDeleted() { onGeometryChange(null); }

        map.on(L.Draw.Event.CREATED, handleCreated);
        map.on(L.Draw.Event.EDITED, handleEdited);
        map.on(L.Draw.Event.DELETED, handleDeleted);

        return () => {
            map.removeControl(zoomControl);
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.off(L.Draw.Event.EDITED, handleEdited);
            map.off(L.Draw.Event.DELETED, handleDeleted);
            map.removeLayer(drawnItems);
        };
    }, [map, tipeGeometri, initialGeometry, onGeometryChange, disabled]);

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

export default function GeometryDrawer({ tipeGeometri, initialGeometry, onGeometryChange, disabled = false }) {
    const [existingAssets, setExistingAssets] = useState([]);
    const [showExisting, setShowExisting] = useState(true);
    const [showTollRoute, setShowTollRoute] = useState(true);
    const [flyTarget, setFlyTarget] = useState(null);

    useEffect(() => {
        axiosClient.get('/aset')
            .then((res) => setExistingAssets(res.data.data || []))
            .catch(() => setExistingAssets([]));
    }, []);

    const instructionText = {
        titik: 'Pilih lokasi aset: tap tombol marker di kiri atas, lalu klik lokasi di peta.',
        garis: 'Gambar garis: tap tombol garis di kiri atas, lalu klik titik-titik sepanjang aset.',
        area: 'Gambar area: tap tombol poligon di kiri atas, lalu klik sudut-sudut area aset.'
    };

    const sortedExisting = useMemo(() => {
        const typePriority = {
            Polygon: 1, MultiPolygon: 1,
            LineString: 2, MultiLineString: 2,
            Point: 3, MultiPoint: 3
        };
        return [...existingAssets].sort((a, b) => {
            const typeA = a.koordinat_geojson?.type || 'Point';
            const typeB = b.koordinat_geojson?.type || 'Point';
            return (typePriority[typeA] || 3) - (typePriority[typeB] || 3);
        });
    }, [existingAssets]);

    return (
        <div className="h-full min-h-[450px] relative">
            <MapContainer
                center={PURBALEUNYI_CENTER}
                zoom={PURBALEUNYI_DEFAULT_ZOOM}
                minZoom={PURBALEUNYI_MIN_ZOOM}
                maxZoom={19}
                maxBounds={PURBALEUNYI_BOUNDS}
                maxBoundsViscosity={1.0}
                zoomControl={false}
                scrollWheelZoom={false}
                className="[&_.leaflet-top.leaflet-left]:!top-16 transition-all"
                style={{ height: '100%', width: '100%' }}
            >
                <CtrlScrollZoom />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    subdomains="abcd"
                    maxZoom={19}
                />

                {showTollRoute && <TollRouteLayer />}
                <MapMask />

                {/* Fly-to + red pin hasil pencarian */}
                <MapSearchLayer target={flyTarget} />

                {showExisting && sortedExisting.map((aset) => (
                    <GeoJSON
                        key={aset.id}
                        data={aset.koordinat_geojson}
                        style={{
                            color: pinColor[aset.status_kondisi] || '#6b7280',
                            weight: 2,
                            fillOpacity: 0.1,
                            opacity: 0.6
                        }}
                        pointToLayer={(feature, latlng) =>
                            L.marker(latlng, {
                                icon: existingIcon(pinColor[aset.status_kondisi] || '#6b7280'),
                                zIndexOffset: 50
                            })
                        }
                    >
                        <Tooltip sticky direction="top" className="text-xs font-bold">
                            {aset.nama_aset} ({aset.kategori_aset?.nama_kategori || 'Aset'})
                        </Tooltip>
                    </GeoJSON>
                ))}

                <DrawControl
                    tipeGeometri={tipeGeometri}
                    initialGeometry={initialGeometry}
                    onGeometryChange={onGeometryChange}
                    disabled={disabled}
                />
            </MapContainer>

            {/* Search bar – responsif tanpa menutupi toolbar */}
            <MapSearchBar onFly={setFlyTarget} className="top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[340px]" />

            {/* Overlay bila kategori belum dipilih */}
            {disabled && (
                <div className="absolute inset-0 z-[1050] bg-black/25 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                    <div className="bg-card/95 backdrop-blur-md border border-amber px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-dark text-2xl">info</span>
                        <span className="text-sm font-bold text-navy">Pilih kategori aset terlebih dahulu</span>
                    </div>
                </div>
            )}

            {/* Instruction Banner – bawah peta */}
            {!disabled && (
                <div className="absolute bottom-3 left-3 right-3 z-[1000] max-w-[calc(100%-1.5rem)] bg-card/95 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs text-navy border border-border shadow-lg flex items-start gap-2 pointer-events-none overflow-visible">
                    <span className="material-symbols-outlined text-amber-dark text-[16px] shrink-0 mt-0.5">edit_location_alt</span>
                    <span className="font-semibold leading-snug whitespace-normal break-words">
                        {instructionText[tipeGeometri] || instructionText.titik}
                    </span>
                </div>
            )}

            {/* Layer Control – kanan atas di bawah search bar */}
            <div className="absolute top-16 right-3 z-[1000] flex flex-col items-end gap-2">
                <div className="bg-card/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-border flex flex-col gap-2 text-xs font-bold text-navy">
                    <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-text-muted">
                            <span className="material-symbols-outlined text-[16px] text-blue-600">alt_route</span>
                            Garis Tol
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowTollRoute((v) => !v)}
                            className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${showTollRoute ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showTollRoute ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="w-full h-px bg-border" />
                    <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-text-muted">
                            <span className="material-symbols-outlined text-[16px] text-emerald-600">layers</span>
                            Aset Lain ({existingAssets.length})
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowExisting((v) => !v)}
                            className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${showExisting ? 'bg-emerald-600' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showExisting ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}