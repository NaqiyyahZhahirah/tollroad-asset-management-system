// GET  /api/aset  → getAllAset
// POST /api/aset  → createAset
const setCorsHeaders = require('../../src/utils/cors');
const runMiddleware = require('../../src/utils/runMiddleware');
const { verifyToken } = require('../../src/middleware/auth.middleware');
const { getAllAset, createAset } = require('../../src/controllers/aset.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    if (req.method === 'GET') {
        return getAllAset(req, res);
    }

    if (req.method === 'POST') {
        return createAset(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
