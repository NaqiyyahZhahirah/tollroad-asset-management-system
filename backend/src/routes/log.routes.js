const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getLogByAsetId, getAllLog } = require('../controllers/log.controller');

router.get('/', verifyToken, getAllLog);
router.get('/:aset_id', verifyToken, getLogByAsetId);

module.exports = router;