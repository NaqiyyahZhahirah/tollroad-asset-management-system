const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Client khusus buat proses signIn/signUp, terpisah dari client admin
function createAuthClient() {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

module.exports = createAuthClient;