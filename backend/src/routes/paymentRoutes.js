const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
// const { protect } = require('../middleware/auth'); // Descomentar quando tiver auth

// Listar planos disponíveis (público)
router.get('/plans', paymentController.listarPlanos);

// Obter assinatura do usuário
router.get('/:userId/subscription', paymentController.obterAssinatura);

// Processar pagamento
router.post('/:userId/checkout', paymentController.processarPagamento);

// Cancelar assinatura
router.post('/:userId/cancel', paymentController.cancelarAssinatura);

// Histórico de transações
router.get('/:userId/transactions', paymentController.historicoTransacoes);

// Validar cupom
router.post('/coupon/validate', paymentController.validarCupom);

module.exports = router;
