// PATCH /api/kategori/:id/activate → activateKategori (admin only)
const setCorsHeaders = require('../../../src/utils/cors');
const runMiddleware = require('../../../src/utils/runMiddleware');
const { verifyToken, requireAdmin } = require('../../../src/middleware/auth.middleware');
const { activateKategori } = require('../../../src/controllers/kategori.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    await runMiddleware(req, res, requireAdmin);
    if (res.headersSent) return;

    req.params = { id: req.query.id };

    if (req.method === 'PATCH') {
        return activateKategori(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
