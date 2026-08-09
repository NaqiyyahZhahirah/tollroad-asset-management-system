CREATE TABLE kelompok_aset (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kelompok VARCHAR(100) NOT NULL UNIQUE,
    deskripsi     TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kategori_aset
    ADD COLUMN kelompok_id UUID REFERENCES kelompok_aset(id);

INSERT INTO kelompok_aset (nama_kelompok, deskripsi) VALUES
    ('Sarkapja', 'Sarana Pelengkap Jalan'),
    ('Lingkungan', 'Aset terkait lingkungan dan drainase');