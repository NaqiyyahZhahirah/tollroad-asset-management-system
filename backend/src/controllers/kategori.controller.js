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
    const { nama_kategori, deskripsi, skema_formulir, tipe_geometri, created_by } = req.body;

    if (!nama_kategori || !skema_formulir || !tipe_geometri) {
        return res.status(400).json({ error: 'nama_kategori, skema_formulir, dan tipe_geometri wajib diisi' });
    }
    if (!['titik', 'garis', 'area'].includes(tipe_geometri)) {
        return res.status(400).json({ error: 'tipe_geometri harus titik, garis, atau area' });
    }

    const { data, error } = await supabase
        .from('kategori_aset')
        .insert([{ nama_kategori, deskripsi, versi_skema: 1, skema_formulir, tipe_geometri, created_by }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ data });
}

async function updateKategori(req, res) {
    const { id } = req.params;
    const { nama_kategori, deskripsi, skema_formulir, tipe_geometri, is_active, naikkan_versi } = req.body;

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

    // Naikkan versi_skema hanya jika admin mencentang checkbox di frontend
    if (naikkan_versi === true) {
        updatePayload.versi_skema = (current.versi_skema || 1) + 1;
    }

    if (nama_kategori !== undefined) updatePayload.nama_kategori = nama_kategori;
    if (deskripsi !== undefined) updatePayload.deskripsi = deskripsi;
    if (tipe_geometri !== undefined) updatePayload.tipe_geometri = tipe_geometri;
    if (skema_formulir !== undefined) updatePayload.skema_formulir = skema_formulir;
    if (is_active !== undefined) updatePayload.is_active = is_active;

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

async function deleteKategoriPermanently(req, res) {
    const { id } = req.params;

    // Cek apakah masih ada aset yang menggunakan kategori ini
    const { count, error: countError } = await supabase
        .from('aset_tol')
        .select('id', { count: 'exact', head: true })
        .eq('kategori_id', id);

    if (countError) {
        return res.status(500).json({ error: countError.message });
    }

    if (count > 0) {
        return res.status(400).json({
            error: `Kategori ini tidak dapat dihapus karena masih digunakan oleh ${count} aset.`
        });
    }

    // Jika tidak ada aset yang memakai, hapus permanen dari database
    const { error: deleteError } = await supabase
        .from('kategori_aset')
        .delete()
        .eq('id', id);

    if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
    }

    res.json({ message: 'Kategori berhasil dihapus secara permanen' });
}

module.exports = {
    getAllKategori,
    createKategori,
    updateKategori,
    deactivateKategori,
    activateKategori,
    deleteKategoriPermanently
};