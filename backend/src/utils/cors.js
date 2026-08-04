/**
 * Sets CORS headers and handles OPTIONS preflight for Vercel serverless functions.
 * Call this at the top of every handler, before any middleware or logic.
 *
 * Returns true if the request was a preflight (OPTIONS) — caller should return
 * immediately after this call in that case (the 200 has already been sent).
 *
 * Allowed origins:
 *   - The deployed Vercel frontend
 *   - Local dev server
 */

const ALLOWED_ORIGINS = [
    'https://tollroad-ams.vercel.app',   // ganti dengan URL Vercel frontend yang sebenarnya
    'http://localhost:5173',
    'http://localhost:3000',
];

function setCorsHeaders(req, res) {
    const origin = req.headers.origin;

    // Reflect origin back hanya kalau ada di whitelist, biar aman
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Fallback ke wildcard untuk request tanpa Origin header (misalnya server-to-server)
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true; // signal: preflight selesai, caller harus return
    }

    return false;
}

module.exports = setCorsHeaders;
