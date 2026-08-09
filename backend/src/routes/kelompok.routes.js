const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const { getAllKelompok, createKelompok } = require('../controllers/kelompok.controller');

router.get('/', verifyToken, getAllKelompok);
router.post('/', verifyToken, requireAdmin, createKelompok);

module.exports = router;