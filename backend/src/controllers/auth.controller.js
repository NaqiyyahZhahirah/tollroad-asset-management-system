const supabaseAdmin = require('../config/supabase');
const createAuthClient = require('../config/supabaseAuth');

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    // Pakai client SEMENTARA khusus buat login, biar gak ganggu client admin
    const authClient = createAuthClient();

    const { data, error } = await authClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return res.status(401).json({ error: error.message });
    }

    // Query profil pakai client ADMIN (yang tetap bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, nama, email, role, wilayah_kerja')
        .eq('id', data.user.id)
        .single();

    if (profileError) {
        return res.status(404).json({ error: 'Profil user tidak ditemukan' });
    }

    res.json({
        session: data.session,
        user: profile
    });
}

module.exports = { login };