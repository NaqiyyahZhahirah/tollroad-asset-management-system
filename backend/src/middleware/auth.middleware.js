const supabaseAdmin = require('../config/supabase');

async function verifyToken(req, res, next) {
    console.log('Middleware verifyToken dipanggil');
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];

    // Verifikasi token ke Supabase Auth
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    }

    // Ambil juga profil (role) biar bisa dipakai buat cek hak akses
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, nama, email, role, wilayah_kerja')
        .eq('id', data.user.id)
        .single();

    if (profileError || !profile) {
        return res.status(404).json({ error: 'Profil user tidak ditemukan' });
    }

    // Simpan info user di req, biar bisa dipakai controller selanjutnya
    req.user = profile;
    next();
}

// Middleware tambahan: khusus buat endpoint yang cuma boleh admin
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak, khusus admin' });
    }
    next();
}

module.exports = { verifyToken, requireAdmin };