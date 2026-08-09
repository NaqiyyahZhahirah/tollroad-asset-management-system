const supabaseAdmin = require('../config/supabase');

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, nama, email, role, wilayah_kerja')
        .eq('id', data.user.id)
        .single();

    if (profileError || !profile) {
        return res.status(404).json({ error: 'Profil user tidak ditemukan' });
    }

    req.user = profile;
    next();
}

function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak, khusus admin' });
    }
    next();
}

module.exports = { verifyToken, requireAdmin };