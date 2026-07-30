-- ==========================================================
-- EXTENSIONS
-- ==========================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================================
-- 1. TABEL USERS (terhubung ke auth.users Supabase)
-- ==========================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('operator', 'admin')),
    wilayah_kerja   VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- 2. TABEL KATEGORI ASET
-- ==========================================================
CREATE TABLE kategori_aset (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kategori   VARCHAR(100) NOT NULL,
    deskripsi       TEXT,
    versi_skema     INTEGER NOT NULL DEFAULT 1,
    skema_formulir  JSONB NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kategori_skema_gin ON kategori_aset USING GIN (skema_formulir);

-- ==========================================================
-- 3. TABEL ASET_TOL
-- ==========================================================
CREATE TABLE aset_tol (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kategori_id             UUID NOT NULL REFERENCES kategori_aset(id),
    versi_skema_saat_input  INTEGER NOT NULL,

    nama_aset               VARCHAR(150) NOT NULL,
    nomor_seri              VARCHAR(100),
    ruas_tol                VARCHAR(100) NOT NULL DEFAULT 'Purbaleunyi',
    lokasi_km               NUMERIC(6,2) NOT NULL,
    jalur                   VARCHAR(10) NOT NULL CHECK (jalur IN ('A', 'B')),
    latitude                NUMERIC(10,7) NOT NULL,
    longitude               NUMERIC(10,7) NOT NULL,
    elevasi_mdpl             NUMERIC(6,2),

    status_kondisi          VARCHAR(20) NOT NULL DEFAULT 'baik'
                             CHECK (status_kondisi IN ('baik', 'rusak', 'perlu_perawatan')),

    status_validasi          VARCHAR(20) NOT NULL DEFAULT 'pending'
                             CHECK (status_validasi IN ('pending', 'approved', 'rejected')),
    validated_by             UUID REFERENCES users(id),
    validated_at             TIMESTAMPTZ,
    catatan_validasi          TEXT,

    atribut_spesifik          JSONB NOT NULL DEFAULT '{}',

    tanggal_aset_dibuat        DATE,
    input_by                   UUID NOT NULL REFERENCES users(id),
    created_at                 TIMESTAMPTZ DEFAULT now(),
    updated_at                 TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_koordinat_valid CHECK (
        latitude BETWEEN -11 AND 6 AND longitude BETWEEN 95 AND 141
    )
);

ALTER TABLE aset_tol ADD COLUMN geom geometry(Point, 4326)
    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED;

CREATE INDEX idx_aset_geom ON aset_tol USING GIST (geom);
CREATE INDEX idx_aset_kategori ON aset_tol(kategori_id);
CREATE INDEX idx_aset_status_validasi ON aset_tol(status_validasi);
CREATE INDEX idx_aset_status_kondisi ON aset_tol(status_kondisi);
CREATE INDEX idx_aset_ruas_km ON aset_tol(ruas_tol, lokasi_km);
CREATE INDEX idx_aset_spesifik_gin ON aset_tol USING GIN (atribut_spesifik);

-- ==========================================================
-- 4. TABEL FOTO_ASET
-- ==========================================================
CREATE TABLE foto_aset (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aset_id         UUID NOT NULL REFERENCES aset_tol(id) ON DELETE CASCADE,
    url_foto        TEXT NOT NULL,
    keterangan      VARCHAR(255),
    uploaded_by     UUID REFERENCES users(id),
    uploaded_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_foto_aset ON foto_aset(aset_id);

-- ==========================================================
-- 5. TABEL LOG_AKTIVITAS
-- ==========================================================
CREATE TABLE log_aktivitas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aset_id         UUID REFERENCES aset_tol(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id),
    aksi            VARCHAR(30) NOT NULL
                    CHECK (aksi IN ('create', 'update', 'approve', 'reject', 'delete')),
    data_sebelum    JSONB,
    data_sesudah    JSONB,
    keterangan      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_log_aset ON log_aktivitas(aset_id);
CREATE INDEX idx_log_user ON log_aktivitas(user_id);
CREATE INDEX idx_log_created ON log_aktivitas(created_at DESC);

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori_aset ENABLE ROW LEVEL SECURITY;
ALTER TABLE aset_tol ENABLE ROW LEVEL SECURITY;
ALTER TABLE foto_aset ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_aktivitas ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_admin" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- kategori_aset
CREATE POLICY "kategori_select_authenticated" ON kategori_aset
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "kategori_admin_all" ON kategori_aset
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- aset_tol
CREATE POLICY "aset_select_authenticated" ON aset_tol
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "aset_insert_authenticated" ON aset_tol
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "aset_update_own_or_admin" ON aset_tol
    FOR UPDATE USING (
        input_by = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "aset_delete_admin" ON aset_tol
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- foto_aset
CREATE POLICY "foto_select_authenticated" ON foto_aset
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "foto_insert_authenticated" ON foto_aset
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "foto_delete_admin" ON foto_aset
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- log_aktivitas
CREATE POLICY "log_select_authenticated" ON log_aktivitas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "log_insert_authenticated" ON log_aktivitas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');