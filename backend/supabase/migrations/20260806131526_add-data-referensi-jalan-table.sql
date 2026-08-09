CREATE TABLE data_referensi_jalan (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kategori           VARCHAR(20) NOT NULL CHECK (kategori IN ('main_road', 'ramp', 'gerbang_tol', 'patok_heksa')),
    ruas               VARCHAR(100) NOT NULL DEFAULT 'Purbaleunyi',
    sub_ruas           VARCHAR(50),
    jalur              VARCHAR(10) CHECK (jalur IN ('A', 'B')),
    nama               VARCHAR(150),
    lokasi_km          NUMERIC(6,2),
    koordinat_geojson  JSONB NOT NULL,
    latitude           NUMERIC(10,7),
    longitude          NUMERIC(10,7),
    created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referensi_kategori ON data_referensi_jalan(kategori);
CREATE INDEX idx_referensi_km ON data_referensi_jalan(ruas, lokasi_km);