const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
    getAllReferensiJalan,
    createReferensiJalan,
    updateReferensiJalan,
    deleteReferensiJalan
} = require('../controllers/referensiJalan.controller');

router.get('/', verifyToken, getAllReferensiJalan);
router.post('/', verifyToken, requireAdmin, createReferensiJalan);
router.patch('/:id', verifyToken, requireAdmin, updateReferensiJalan);
router.delete('/:id', verifyToken, requireAdmin, deleteReferensiJalan);

module.exports = router;