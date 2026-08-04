// GET    /api/aset/:id  → getAsetById
// PATCH  /api/aset/:id  → updateAset
// PUT    /api/aset/:id  → updateAset (same handler, Express had both)
// DELETE /api/aset/:id  → deleteAset (admin only)
const setCorsHeaders = require('../../../src/utils/cors');
const runMiddleware = require('../../../src/utils/runMiddleware');
const { verifyToken, requireAdmin } = require('../../../src/middleware/auth.middleware');
const { getAsetById, updateAset, deleteAset } = require('../../../src/controllers/aset.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    // Inject dynamic param
    req.params = { id: req.query.id };

    if (req.method === 'GET') {
        return getAsetById(req, res);
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
        return updateAset(req, res);
    }

    if (req.method === 'DELETE') {
        await runMiddleware(req, res, requireAdmin);
        if (res.headersSent) return;
        return deleteAset(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
