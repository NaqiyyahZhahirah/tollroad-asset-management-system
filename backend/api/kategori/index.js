// GET  /api/kategori        → getAllKategori
// POST /api/kategori        → createKategori (admin only)
const setCorsHeaders = require('../../src/utils/cors');
const runMiddleware = require('../../src/utils/runMiddleware');
const { verifyToken, requireAdmin } = require('../../src/middleware/auth.middleware');
const { getAllKategori, createKategori } = require('../../src/controllers/kategori.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    if (req.method === 'GET') {
        return getAllKategori(req, res);
    }

    if (req.method === 'POST') {
        await runMiddleware(req, res, requireAdmin);
        if (res.headersSent) return;
        return createKategori(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
