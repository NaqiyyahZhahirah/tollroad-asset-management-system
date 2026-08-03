const supabaseAdmin = require('../config/supabase');

async function getAllUsers(req, res) {
    let query = supabaseAdmin
        .from('users')
        .select('id, nama, email, role, wilayah_kerja, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

    if (req.query.role) {
        query = query.eq('role', req.query.role);
    }
    if (req.query.is_active !== undefined) {
        query = query.eq('is_active', req.query.is_active === 'true');
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data });
}

async function createUser(req, res) {
    const { nama, email, password, role, wilayah_kerja } = req.body;

    if (!nama || !email || !password || !role) {
        return res.status(400).json({ error: 'nama, email, password, dan role wajib diisi' });
    }
    if (!['operator', 'admin'].includes(role)) {
        return res.status(400).json({ error: "role harus 'operator' atau 'admin'" });
    }

    // Buat akun auth Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        return res.status(400).json({ error: authError.message });
    }

    const authUserId = authData.user.id;

    // Insert profil ke public.users
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert([{ id: authUserId, nama, email, role, wilayah_kerja: wilayah_kerja || null }])
        .select('id, nama, email, role, wilayah_kerja, is_active, created_at, updated_at')
        .single();

    if (profileError) {
        // Rollback: hapus auth user yg sudah terbuat
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        return res.status(500).json({ error: 'Gagal menyimpan profil pengguna: ' + profileError.message });
    }

    res.status(201).json({ data: profile });
}

async function updateUserRole(req, res) {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['operator', 'admin'].includes(role)) {
        return res.status(400).json({ error: "role harus 'operator' atau 'admin'" });
    }

    // Cegah admin menurunkan role diri sendiri
    if (id === req.user.id && role !== 'admin') {
        return res.status(400).json({ error: 'Anda tidak bisa menurunkan role akun sendiri' });
    }

    const { data, error } = await supabaseAdmin
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, nama, email, role, wilayah_kerja, is_active, created_at, updated_at')
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    if (!data) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({ data });
}

async function toggleUserActive(req, res) {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active harus berupa boolean' });
    }

    // Cegah admin menonaktifkan diri sendiri
    if (id === req.user.id && !is_active) {
        return res.status(400).json({ error: 'Anda tidak bisa menonaktifkan akun sendiri' });
    }

    const { data, error } = await supabaseAdmin
        .from('users')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, nama, email, role, wilayah_kerja, is_active, created_at, updated_at')
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    if (!data) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({ data });
}

async function resetUserPassword(req, res) {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
        return res.status(400).json({ error: 'new_password wajib diisi' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: new_password
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password berhasil direset' });
}

module.exports = {
    getAllUsers,
    createUser,
    updateUserRole,
    toggleUserActive,
    resetUserPassword
};
