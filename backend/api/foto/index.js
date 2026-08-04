// POST /api/foto  → uploadFoto
//
// Vercel serverless functions disable body parsing by default for multipart/form-data.
// We disable Vercel's built-in bodyParser and use multer manually via runMiddleware
// so that req.file and req.body are populated exactly as they were in the Express app.
// The controller (foto.controller.js) is unchanged — it still reads req.file and req.body.

const multer = require('multer');
const setCorsHeaders = require('../../src/utils/cors');
const runMiddleware = require('../../src/utils/runMiddleware');
const { verifyToken } = require('../../src/middleware/auth.middleware');
const { uploadFoto } = require('../../src/controllers/foto.controller');

// Tell Vercel NOT to parse the body — we need the raw stream for multer
module.exports.config = {
    api: {
        bodyParser: false,
    },
};

// multer with memory storage (same as the original foto.routes.js)
const upload = multer({ storage: multer.memoryStorage() });

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    if (req.method === 'POST') {
        // Run multer to parse multipart/form-data and populate req.file + req.body
        await runMiddleware(req, res, upload.single('foto'));
        if (res.headersSent) return;

        return uploadFoto(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
