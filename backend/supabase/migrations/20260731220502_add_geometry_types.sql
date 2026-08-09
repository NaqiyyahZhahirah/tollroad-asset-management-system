ALTER TABLE kategori_aset
    ADD COLUMN tipe_geometri VARCHAR(10) NOT NULL DEFAULT 'titik'
    CHECK (tipe_geometri IN ('titik', 'garis', 'area'));

DROP INDEX IF EXISTS idx_aset_geom;
ALTER TABLE aset_tol DROP COLUMN IF EXISTS geom;

ALTER TABLE aset_tol ADD COLUMN koordinat_geojson JSONB;

ALTER TABLE aset_tol ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE aset_tol ALTER COLUMN longitude DROP NOT NULL;

ALTER TABLE aset_tol ADD COLUMN geom geometry(Geometry, 4326);
CREATE INDEX idx_aset_geom ON aset_tol USING GIST (geom);

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