const validateAtributSpesifik = require('../utils/validateAtributSpesifik');
const supabase = require('../config/supabase');

// GET semua aset, sekalian join nama kategori (biar gak cuma dapat UUID)
async function getAllAset(req, res) {
    const { status_validasi, kategori_id } = req.query;

    let query = supabase
        .from('aset_tol')
        .select(`
            *,
            kategori_aset ( nama_kategori, skema_formulir ),
            foto_aset ( id, url_foto, keterangan )
        `)
        .order('created_at', { ascending: false });

    // Filter opsional lewat query param, misal: /api/aset?status_validasi=pending
    if (status_validasi) {
        query = query.eq('status_validasi', status_validasi);
    }
    if (kategori_id) {
        query = query.eq('kategori_id', kategori_id);
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data });
}

// GET satu aset by id
async function getAsetById(req, res) {
    const { id } = req.params;

    const { data, error } = await supabase
        .from('aset_tol')
        .select(`*, kategori_aset (*), foto_aset ( id, url_foto, keterangan )`)
        .eq('id', id)
        .single();

    if (error) {
        return res.status(404).json({ error: 'Aset tidak ditemukan' });
    }

    res.json({ data });
}

// POST bikin aset baru
async function createAset(req, res) {
    const {
        kategori_id, versi_skema_saat_input, nama_aset, nomor_seri, ruas_tol,
        lokasi_km, jalur, koordinat_geojson, elevasi_mdpl,
        status_kondisi, atribut_spesifik, tanggal_aset_dibuat, input_by
    } = req.body;

    if (!kategori_id || !nama_aset || !lokasi_km || !jalur || !koordinat_geojson || !input_by) {
        return res.status(400).json({ error: 'Field wajib belum lengkap (termasuk koordinat_geojson)' });
    }

    const { data: kategori, error: kategoriError } = await supabase
        .from('kategori_aset')
        .select('skema_formulir, versi_skema, tipe_geometri')
        .eq('id', kategori_id)
        .single();

    if (kategoriError || !kategori) {
        return res.status(400).json({ error: 'Kategori tidak ditemukan' });
    }

    // Validasi tipe geometri yang dikirim harus sesuai kategori
    const expectedType = { titik: 'Point', garis: 'LineString', area: 'Polygon' }[kategori.tipe_geometri];
    if (koordinat_geojson.type !== expectedType) {
        return res.status(400).json({
            error: `Kategori ini butuh geometri tipe ${expectedType}, tapi dikirim ${koordinat_geojson.type}`
        });
    }

    const validationErrors = validateAtributSpesifik(atribut_spesifik, kategori.skema_formulir);
    if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Validasi gagal', details: validationErrors });
    }

    const { data, error } = await supabase
        .from('aset_tol')
        .insert([{
            kategori_id,
            versi_skema_saat_input: versi_skema_saat_input || kategori.versi_skema,
            nama_aset, nomor_seri, ruas_tol: ruas_tol || 'Purbaleunyi',
            lokasi_km, jalur, koordinat_geojson, elevasi_mdpl,
            status_kondisi: status_kondisi || 'baik',
            status_validasi: 'pending',
            atribut_spesifik: atribut_spesifik || {},
            tanggal_aset_dibuat, input_by
        }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    await supabase.from('log_aktivitas').insert([{
        aset_id: data.id, user_id: input_by, aksi: 'create',
        data_sebelum: null, data_sesudah: data,
        keterangan: 'Aset baru dibuat oleh operator'
    }]);

    res.status(201).json({ data });
}

// PATCH approve/reject aset
async function updateStatusValidasi(req, res) {
    const { id } = req.params;
    const { status_validasi, validated_by, catatan_validasi } = req.body;

    if (!['approved', 'rejected'].includes(status_validasi)) {
        return res.status(400).json({ error: 'status_validasi harus approved atau rejected' });
    }

    // Ambil data sebelum diubah, buat log
    const { data: sebelum } = await supabase
        .from('aset_tol')
        .select('*')
        .eq('id', id)
        .single();

    const { data, error } = await supabase
        .from('aset_tol')
        .update({
            status_validasi,
            validated_by,
            validated_at: new Date().toISOString(),
            catatan_validasi
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    await supabase.from('log_aktivitas').insert([{
        aset_id: id,
        user_id: validated_by,
        aksi: status_validasi === 'approved' ? 'approve' : 'reject',
        data_sebelum: sebelum,
        data_sesudah: data,
        keterangan: catatan_validasi || null
    }]);

    res.json({ data });
}

// PUT / PATCH update data aset
async function updateAset(req, res) {
    const { id } = req.params;
    const {
        kategori_id, versi_skema_saat_input, nama_aset, nomor_seri, ruas_tol,
        lokasi_km, jalur, koordinat_geojson, elevasi_mdpl,
        status_kondisi, atribut_spesifik, tanggal_aset_dibuat
    } = req.body;

    const user = req.user;
    const userId = user?.id;

    // Ambil data sebelum diubah
    const { data: sebelum, error: fetchError } = await supabase
        .from('aset_tol')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !sebelum) {
        return res.status(404).json({ error: 'Aset tidak ditemukan' });
    }

    // Ownership check: jika bukan admin, hanya pembuat (input_by) yang boleh edit
    if (user?.role !== 'admin' && sebelum.input_by !== userId) {
        return res.status(403).json({ error: 'Anda tidak memiliki izin untuk mengedit aset ini' });
    }

    const targetKategoriId = kategori_id || sebelum.kategori_id;
    const { data: kategori, error: kategoriError } = await supabase
        .from('kategori_aset')
        .select('skema_formulir, versi_skema, tipe_geometri')
        .eq('id', targetKategoriId)
        .single();

    if (kategoriError || !kategori) {
        return res.status(400).json({ error: 'Kategori tidak ditemukan' });
    }

    if (koordinat_geojson) {
        const expectedType = { titik: 'Point', garis: 'LineString', area: 'Polygon' }[kategori.tipe_geometri];
        if (koordinat_geojson.type !== expectedType) {
            return res.status(400).json({
                error: `Kategori ini butuh geometri tipe ${expectedType}, tapi dikirim ${koordinat_geojson.type}`
            });
        }
    }

    if (atribut_spesifik) {
        const validationErrors = validateAtributSpesifik(atribut_spesifik, kategori.skema_formulir);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: 'Validasi gagal', details: validationErrors });
        }
    }

    const updatePayload = {
        updated_at: new Date().toISOString()
    };

    if (kategori_id !== undefined) updatePayload.kategori_id = kategori_id;
    if (versi_skema_saat_input !== undefined) updatePayload.versi_skema_saat_input = versi_skema_saat_input;
    if (nama_aset !== undefined) updatePayload.nama_aset = nama_aset;
    if (nomor_seri !== undefined) updatePayload.nomor_seri = nomor_seri;
    if (ruas_tol !== undefined) updatePayload.ruas_tol = ruas_tol;
    if (lokasi_km !== undefined) updatePayload.lokasi_km = Number(lokasi_km);
    if (jalur !== undefined) updatePayload.jalur = jalur;
    if (koordinat_geojson !== undefined) updatePayload.koordinat_geojson = koordinat_geojson;
    if (elevasi_mdpl !== undefined) updatePayload.elevasi_mdpl = elevasi_mdpl ? Number(elevasi_mdpl) : null;
    if (status_kondisi !== undefined) updatePayload.status_kondisi = status_kondisi;
    if (atribut_spesifik !== undefined) updatePayload.atribut_spesifik = atribut_spesifik;
    if (tanggal_aset_dibuat !== undefined) updatePayload.tanggal_aset_dibuat = tanggal_aset_dibuat;

    // Business rule:
    // 1. Jika aset berstatus 'rejected', diedit oleh SIAPAPUN (admin maupun operator), status_validasi reset ke 'pending'
    // 2. Jika aset berstatus 'approved' dan editor BUKAN admin, status_validasi reset ke 'pending'
    const isRejectedEdit = sebelum.status_validasi === 'rejected';
    const isApprovedNonAdminEdit = sebelum.status_validasi === 'approved' && user?.role !== 'admin';

    if (isRejectedEdit || isApprovedNonAdminEdit) {
        updatePayload.status_validasi = 'pending';
        updatePayload.validated_by = null;
        updatePayload.validated_at = null;
        updatePayload.catatan_validasi = null;
    }

    const { data, error } = await supabase
        .from('aset_tol')
        .update(updatePayload)
        .eq('id', id)
        .select(`*, kategori_aset ( nama_kategori, skema_formulir ), foto_aset ( id, url_foto, keterangan )`)
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    await supabase.from('log_aktivitas').insert([{
        aset_id: id,
        user_id: userId || sebelum.input_by,
        aksi: 'update',
        data_sebelum: sebelum,
        data_sesudah: data,
        keterangan: 'Aset diperbarui'
    }]);

    res.json({ data });
}

// DELETE aset — hanya admin
async function deleteAset(req, res) {
    const { id } = req.params;
    const userId = req.user?.id;

    // Ambil data sebelum dihapus untuk log
    const { data: sebelum, error: fetchError } = await supabase
        .from('aset_tol')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !sebelum) {
        return res.status(404).json({ error: 'Aset tidak ditemukan' });
    }

    // Hapus foto terkait terlebih dahulu
    await supabase.from('foto_aset').delete().eq('aset_id', id);

    const { error } = await supabase
        .from('aset_tol')
        .delete()
        .eq('id', id);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    await supabase.from('log_aktivitas').insert([{
        aset_id: id,
        user_id: userId,
        aksi: 'delete',
        data_sebelum: sebelum,
        data_sesudah: null,
        keterangan: `Aset "${sebelum.nama_aset}" dihapus oleh admin`
    }]);

    res.json({ message: `Aset "${sebelum.nama_aset}" berhasil dihapus` });
}

module.exports = { getAllAset, getAsetById, createAset, updateStatusValidasi, updateAset, deleteAset };