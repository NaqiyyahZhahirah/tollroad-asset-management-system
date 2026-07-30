const express = require('express');
const multer = require('multer');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const { uploadFoto, getFotoByAsetId } = require('../controllers/foto.controller');

// Simpan file di memory dulu (buffer), baru diteruskan ke Supabase
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', verifyToken, upload.single('foto'), uploadFoto);
router.get('/:aset_id', verifyToken, getFotoByAsetId);

module.exports = router;