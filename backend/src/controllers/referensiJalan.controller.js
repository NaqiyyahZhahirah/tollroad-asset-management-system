const supabase = require('../config/supabase');

async function getAllReferensiJalan(req, res) {
    let query = supabase.from('data_referensi_jalan').select('*');

    if (req.query.kategori) {
        query = query.eq('kategori', req.query.kategori);
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data });
}

async function createReferensiJalan(req, res) {
    const { kategori, ruas, sub_ruas, jalur, nama, lokasi_km, koordinat_geojson } = req.body;

    if (!kategori || !koordinat_geojson) {
        return res.status(400).json({ error: 'kategori dan koordinat_geojson wajib diisi' });
    }
    if (!['main_road', 'ramp', 'gerbang_tol', 'patok_heksa'].includes(kategori)) {
        return res.status(400).json({ error: 'kategori tidak valid' });
    }

    let latitude = null, longitude = null;
    try {
        const coords = koordinat_geojson.type === 'Point'
            ? koordinat_geojson.coordinates
            : koordinat_geojson.coordinates[0];
        longitude = coords[0];
        latitude = coords[1];
    } catch (e) {

    }

    const { data, error } = await supabase
        .from('data_referensi_jalan')
        .insert([{
            kategori,
            ruas: ruas || 'Purbaleunyi',
            sub_ruas,
            jalur,
            nama,
            lokasi_km,
            koordinat_geojson,
            latitude,
            longitude
        }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ data });
}

async function updateReferensiJalan(req, res) {
    const { id } = req.params;
    const { kategori, ruas, sub_ruas, jalur, nama, lokasi_km, koordinat_geojson } = req.body;

    if (kategori && !['main_road', 'ramp', 'gerbang_tol', 'patok_heksa'].includes(kategori)) {
        return res.status(400).json({ error: 'kategori tidak valid' });
    }

    const updatePayload = {};
    if (kategori !== undefined) updatePayload.kategori = kategori;
    if (ruas !== undefined) updatePayload.ruas = ruas;
    if (sub_ruas !== undefined) updatePayload.sub_ruas = sub_ruas;
    if (jalur !== undefined) updatePayload.jalur = jalur;
    if (nama !== undefined) updatePayload.nama = nama;
    if (lokasi_km !== undefined) updatePayload.lokasi_km = lokasi_km;

    if (koordinat_geojson !== undefined) {
        updatePayload.koordinat_geojson = koordinat_geojson;
        try {
            const coords = koordinat_geojson.type === 'Point'
                ? koordinat_geojson.coordinates
                : koordinat_geojson.coordinates[0];
            updatePayload.longitude = coords[0];
            updatePayload.latitude = coords[1];
        } catch (e) {
        }
    }

    const { data, error } = await supabase
        .from('data_referensi_jalan')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });

    res.json({ data });
}

async function deleteReferensiJalan(req, res) {
    const { id } = req.params;

    const { error } = await supabase
        .from('data_referensi_jalan')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Data referensi jalan berhasil dihapus' });
}

module.exports = {
    getAllReferensiJalan,
    createReferensiJalan,
    updateReferensiJalan,
    deleteReferensiJalan
};