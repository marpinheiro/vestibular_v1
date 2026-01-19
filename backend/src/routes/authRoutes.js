const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// ✅ Rota protegida - Retorna dados atualizados do usuário
router.get('/me', protect, authController.getMe);

module.exports = router;
