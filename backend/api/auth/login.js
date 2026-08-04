// POST /api/auth/login
const setCorsHeaders = require('../../src/utils/cors');
const { login } = require('../../src/controllers/auth.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method tidak diizinkan' });
    }

    return login(req, res);
};
