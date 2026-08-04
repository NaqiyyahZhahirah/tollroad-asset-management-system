// GET  /api/users  → getAllUsers (admin only)
// POST /api/users  → createUser  (admin only)
const setCorsHeaders = require('../../src/utils/cors');
const runMiddleware = require('../../src/utils/runMiddleware');
const { verifyToken, requireAdmin } = require('../../src/middleware/auth.middleware');
const { getAllUsers, createUser } = require('../../src/controllers/user.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    await runMiddleware(req, res, requireAdmin);
    if (res.headersSent) return;

    if (req.method === 'GET') {
        return getAllUsers(req, res);
    }

    if (req.method === 'POST') {
        return createUser(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
