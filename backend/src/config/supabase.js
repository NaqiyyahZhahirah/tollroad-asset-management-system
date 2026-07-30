const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Client admin: khusus buat query data & bypass RLS, JANGAN dipakai buat auth.signIn
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

module.exports = supabaseAdmin;