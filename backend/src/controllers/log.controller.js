const supabase = require('../config/supabase');

async function getLogByAsetId(req, res) {
    const { aset_id } = req.params;

    const { data, error } = await supabase
        .from('log_aktivitas')
        .select('*, users(nama, role)')
        .eq('aset_id', aset_id)
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data });
}

async function getAllLog(req, res) {
    const { aksi, user_id } = req.query;

    let query = supabase
        .from('log_aktivitas')
        .select('*, users(nama, role), aset_tol(nama_aset)')
        .order('created_at', { ascending: false })
        .limit(100);   // batasi biar gak berat kalau datanya udah banyak

    if (aksi) query = query.eq('aksi', aksi);
    if (user_id) query = query.eq('user_id', user_id);

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data });
}

module.exports = { getLogByAsetId, getAllLog };