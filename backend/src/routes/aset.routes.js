const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
    getAllAset,
    getAsetById,
    createAset,
    updateStatusValidasi,
    updateAset
} = require('../controllers/aset.controller');

router.get('/', verifyToken, getAllAset);
router.get('/:id', verifyToken, getAsetById);
router.post('/', verifyToken, createAset);
router.put('/:id', verifyToken, updateAset);
router.patch('/:id', verifyToken, updateAset);
router.patch('/:id/validasi', verifyToken, requireAdmin, updateStatusValidasi);

module.exports = router;
