// GET /api/foto/:aset_id → getFotoByAsetId
const setCorsHeaders = require('../../../src/utils/cors');
const runMiddleware = require('../../../src/utils/runMiddleware');
const { verifyToken } = require('../../../src/middleware/auth.middleware');
const { getFotoByAsetId } = require('../../../src/controllers/foto.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    req.params = { aset_id: req.query.aset_id };

    if (req.method === 'GET') {
        return getFotoByAsetId(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
