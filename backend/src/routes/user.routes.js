const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
    getAllUsers,
    createUser,
    updateUserRole,
    toggleUserActive,
    resetUserPassword
} = require('../controllers/user.controller');

router.get('/', verifyToken, requireAdmin, getAllUsers);
router.post('/', verifyToken, requireAdmin, createUser);
router.patch('/:id/role', verifyToken, requireAdmin, updateUserRole);
router.patch('/:id/status', verifyToken, requireAdmin, toggleUserActive);
router.post('/:id/reset-password', verifyToken, requireAdmin, resetUserPassword);

module.exports = router;
