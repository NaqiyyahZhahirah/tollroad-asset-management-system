// PATCH /api/kategori/:id           → updateKategori (admin only)
// DELETE /api/kategori/:id          → deleteKategoriPermanently (admin only)
//
// Sub-routes handled via query param trick in Vercel:
// PATCH /api/kategori/:id?action=activate  → activateKategori
// PATCH /api/kategori/:id?action=deactivate → deactivateKategori
//
// NOTE: Vercel does not support nested dynamic catch-all routes like [id]/activate.js
// easily in the same [id].js file, so we use a query param ?action= for sub-actions.
// The frontend calls:
//   axiosClient.patch(`/kategori/${id}/activate`)   → routed to this file with id containing "ID/activate"
// To avoid that ambiguity, we rely on the frontend already calling:
//   axiosClient.patch(`/kategori/${id}/activate`)
// which Vercel will route to api/kategori/[id]/activate.js — see that file.

const setCorsHeaders = require('../../src/utils/cors');
const runMiddleware = require('../../src/utils/runMiddleware');
const { verifyToken, requireAdmin } = require('../../src/middleware/auth.middleware');
const {
    updateKategori,
    deleteKategoriPermanently
} = require('../../src/controllers/kategori.controller');

module.exports = async function handler(req, res) {
    if (setCorsHeaders(req, res)) return;

    await runMiddleware(req, res, verifyToken);
    if (res.headersSent) return;

    await runMiddleware(req, res, requireAdmin);
    if (res.headersSent) return;

    // Inject :id dari Vercel dynamic route ke req.params
    req.params = { id: req.query.id };

    if (req.method === 'PATCH') {
        return updateKategori(req, res);
    }

    if (req.method === 'DELETE') {
        return deleteKategoriPermanently(req, res);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
};
