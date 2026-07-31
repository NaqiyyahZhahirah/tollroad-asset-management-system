const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
    getAllKategori,
    createKategori,
    updateKategori,
    deactivateKategori,
    activateKategori
} = require('../controllers/kategori.controller');

router.get('/', verifyToken, getAllKategori);
router.post('/', verifyToken, requireAdmin, createKategori);
router.patch('/:id/activate', verifyToken, requireAdmin, activateKategori);
router.patch('/:id', verifyToken, requireAdmin, updateKategori);
router.delete('/:id', verifyToken, requireAdmin, deactivateKategori);

module.exports = router;