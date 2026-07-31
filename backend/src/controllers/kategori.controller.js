const supabase = require('../config/supabase');

async function getAllKategori(req, res) {
    let query = supabase.from('kategori_aset').select('*');

    if (req.query.include_inactive !== 'true') {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data });
}

async function createKategori(req, res) {
    const { nama_kategori, deskripsi, skema_formulir, created_by } = req.body;

    if (!nama_kategori || !skema_formulir) {
        return res.status(400).json({ error: 'nama_kategori dan skema_formulir wajib diisi' });
    }

    const { data, error } = await supabase
        .from('kategori_aset')
        .insert([{
            nama_kategori,
            deskripsi,
            versi_skema: 1,
            skema_formulir,
            created_by
        }])
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ data });
}

async function updateKategori(req, res) {
    const { id } = req.params;
    const { nama_kategori, deskripsi, skema_formulir, naikkan_versi, is_active } = req.body;

    // Ambil versi_skema saat ini
    const { data: current, error: currentError } = await supabase
        .from('kategori_aset')
        .select('versi_skema')
        .eq('id', id)
        .single();

    if (currentError || !current) {
        return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    const updatePayload = {
        updated_at: new Date().toISOString()
    };

    if (nama_kategori !== undefined) updatePayload.nama_kategori = nama_kategori;
    if (deskripsi !== undefined) updatePayload.deskripsi = deskripsi;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    // Kalau skema_formulir berubah, naikkan versi_skema
    // biar data lama yang pakai versi lama tetap tercatat valid dengan snapshot-nya sendiri
    if (skema_formulir) {
        updatePayload.skema_formulir = skema_formulir;
        updatePayload.versi_skema = naikkan_versi ? current.versi_skema + 1 : current.versi_skema;
    }

    const { data, error } = await supabase
        .from('kategori_aset')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data });
}

// Soft-delete: nonaktifkan kategori, JANGAN hapus permanen
// karena aset lama masih merujuk ke kategori ini
async function deactivateKategori(req, res) {
    const { id } = req.params;

    const { data, error } = await supabase
        .from('kategori_aset')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data, message: 'Kategori dinonaktifkan' });
}

async function activateKategori(req, res) {
    const { id } = req.params;

    const { data, error } = await supabase
        .from('kategori_aset')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data, message: 'Kategori diaktifkan' });
}

module.exports = { getAllKategori, createKategori, updateKategori, deactivateKategori, activateKategori };