// GET /api/log  → getAllLog (admin only)
const setCorsHeaders = require('../../src/utils/cors');
const runMiddleware = require('../../src/utils/runMiddleware');
const { verifyToken, requireAdmin } = require('../../src/middleware/auth.middleware');
const { getAllLog } = require('../../src/controllers/log.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    await runMiddleware(req, res, requireAdmin);
    if (res.headersSent) return;

    if (req.method === 'GET') {
        return getAllLog(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
