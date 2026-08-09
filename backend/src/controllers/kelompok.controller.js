const supabase = require('../config/supabase');

async function getAllKelompok(req, res) {
    const { data, error } = await supabase.from('kelompok_aset').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data });
}

async function createKelompok(req, res) {
    const { nama_kelompok, deskripsi } = req.body;
    if (!nama_kelompok) {
        return res.status(400).json({ error: 'nama_kelompok wajib diisi' });
    }

    const { data, error } = await supabase
        .from('kelompok_aset')
        .insert([{ nama_kelompok, deskripsi }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ data });
}

module.exports = { getAllKelompok, createKelompok };