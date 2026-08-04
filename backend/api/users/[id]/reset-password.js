// POST /api/users/:id/reset-password  → resetUserPassword (admin only)
const setCorsHeaders = require('../../../../src/utils/cors');
const runMiddleware = require('../../../../src/utils/runMiddleware');
const { verifyToken, requireAdmin } = require('../../../../src/middleware/auth.middleware');
const { resetUserPassword } = require('../../../../src/controllers/user.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    await runMiddleware(req, res, requireAdmin);
    if (res.headersSent) return;

    req.params = { id: req.query.id };

    if (req.method === 'POST') {
        return resetUserPassword(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
