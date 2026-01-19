//backend/src/routes/progressoRoutes.js
const express = require('express');
const router = express.Router();
const progressoController = require('../controllers/progressoController');
const { protect } = require('../middleware/auth');

// ============================================
// ROTAS DE PROGRESSO - TODAS PROTEGIDAS
// ============================================

// Obter progresso completo do usuário
// GET /api/progresso/:userId
router.get('/:userId', protect, progressoController.getProgresso);

// Adicionar tarefa completada
// POST /api/progresso/:userId/task
// Body: { xp: 50, type: 'small' }
router.post('/:userId/task', protect, progressoController.addTask);

// Registrar atividade de estudo (questões)
// POST /api/progresso/:userId/atividade
// Body: { subjectName, questionsAnswered, correctAnswers, studyTime }
router.post(
  '/:userId/atividade',
  protect,
  progressoController.registrarAtividade,
);

// Criar nova meta
// POST /api/progresso/:userId/meta
// Body: { name, description, type, target }
router.post('/:userId/meta', protect, progressoController.criarMeta);

// Obter estatísticas por período
// GET /api/progresso/:userId/stats?period=week
router.get('/:userId/stats', protect, progressoController.getStats);

module.exports = router;
