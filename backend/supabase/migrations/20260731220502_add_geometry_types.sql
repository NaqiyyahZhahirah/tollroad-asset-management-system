-- ==========================================================
-- 1. Tambah tipe_geometri di kategori_aset
-- ==========================================================
ALTER TABLE kategori_aset
    ADD COLUMN tipe_geometri VARCHAR(10) NOT NULL DEFAULT 'titik'
    CHECK (tipe_geometri IN ('titik', 'garis', 'area'));

-- ==========================================================
-- 2. Ubah aset_tol: geom jadi tipe generik + simpan raw GeoJSON
-- ==========================================================

-- Hapus kolom geom lama (yang dibatasi Point) beserta index-nya
DROP INDEX IF EXISTS idx_aset_geom;
ALTER TABLE aset_tol DROP COLUMN IF EXISTS geom;

-- Kolom baru buat nyimpan geometri mentah dalam format GeoJSON
ALTER TABLE aset_tol ADD COLUMN koordinat_geojson JSONB;

-- latitude/longitude sekarang jadi TITIK PUSAT (centroid) — dihitung otomatis,
-- tetap dipakai buat validasi bounding box & tampilan ringkas
ALTER TABLE aset_tol ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE aset_tol ALTER COLUMN longitude DROP NOT NULL;

-- Kolom geom generik, bisa nampung Point, LineString, atau Polygon
ALTER TABLE aset_tol ADD COLUMN geom geometry(Geometry, 4326);
CREATE INDEX idx_aset_geom ON aset_tol USING GIST (geom);

-- ==========================================================
-- 3. Trigger: otomatis isi geom & centroid lat/long dari koordinat_geojson
-- ==========================================================
CREATE OR REPLACE FUNCTION set_geom_from_geojson()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.koordinat_geojson IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_GeomFromGeoJSON(NEW.koordinat_geojson::text), 4326);
        NEW.latitude := ST_Y(ST_Centroid(NEW.geom));
        NEW.longitude := ST_X(ST_Centroid(NEW.geom));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_geom
    BEFORE INSERT OR UPDATE ON aset_tol
    FOR EACH ROW EXECUTE FUNCTION set_geom_from_geojson();