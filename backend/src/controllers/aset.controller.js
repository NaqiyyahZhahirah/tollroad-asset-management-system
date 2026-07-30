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
        .select(`*, kategori_aset ( nama_kategori, skema_formulir ), foto_aset ( id, url_foto, keterangan )`)
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
        kategori_id,
        versi_skema_saat_input,
        nama_aset,
        nomor_seri,
        ruas_tol,
        lokasi_km,
        jalur,
        latitude,
        longitude,
        elevasi_mdpl,
        status_kondisi,
        atribut_spesifik,
        tanggal_aset_dibuat,
        input_by
    } = req.body;

    if (!kategori_id || !nama_aset || !lokasi_km || !jalur || !latitude || !longitude || !input_by) {
        return res.status(400).json({ error: 'Field wajib belum lengkap' });
    }

    // Ambil skema_formulir dari kategori terkait
    const { data: kategori, error: kategoriError } = await supabase
        .from('kategori_aset')
        .select('skema_formulir, versi_skema')
        .eq('id', kategori_id)
        .single();

    if (kategoriError || !kategori) {
        return res.status(400).json({ error: 'Kategori tidak ditemukan' });
    }

    // Validasi atribut_spesifik sesuai skema
    const validationErrors = validateAtributSpesifik(atribut_spesifik, kategori.skema_formulir);
    if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Validasi gagal', details: validationErrors });
    }

    const { data, error } = await supabase
        .from('aset_tol')
        .insert([{
            kategori_id,
            versi_skema_saat_input: versi_skema_saat_input || kategori.versi_skema,
            nama_aset,
            nomor_seri,
            ruas_tol: ruas_tol || 'Purbaleunyi',
            lokasi_km,
            jalur,
            latitude,
            longitude,
            elevasi_mdpl,
            status_kondisi: status_kondisi || 'baik',
            status_validasi: 'pending',
            atribut_spesifik: atribut_spesifik || {},
            tanggal_aset_dibuat,
            input_by
        }])
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    await supabase.from('log_aktivitas').insert([{
        aset_id: data.id,
        user_id: input_by,
        aksi: 'create',
        data_sebelum: null,
        data_sesudah: data,
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

module.exports = { getAllAset, getAsetById, createAset, updateStatusValidasi };