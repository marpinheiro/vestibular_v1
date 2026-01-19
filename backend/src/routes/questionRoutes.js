const express = require('express');
const router = express.Router();
const {
  listarQuestoes,
  responderQuestao,
  obterFiltros,
  obterEstatisticas,
} = require('../controllers/questionController');
const { protect } = require('../middleware/auth');

// Todas as rotas são protegidas
router.use(protect);

// Rotas
router.get('/', listarQuestoes);
router.get('/filters', obterFiltros);
router.get('/stats', obterEstatisticas);
router.post('/:id/answer', responderQuestao);

module.exports = router;
