const express = require('express');
const router = express.Router();
const simuladosController = require('../controllers/simuladosController');
// const { protect } = require('../middleware/auth'); // Descomentar quando tiver auth

// Todas as rotas requerem autenticação
// router.use(protect); // Descomentar quando tiver auth

// Listar simulados do usuário
router.get('/:userId', simuladosController.listarSimulados);

// Criar novo simulado
router.post('/:userId/criar', simuladosController.criarSimulado);

// Obter simulado específico com questões
router.get('/:userId/:simuladoId', simuladosController.obterSimulado);

// Salvar resposta de uma questão
router.post(
  '/:userId/:simuladoId/questao/:questionId',
  simuladosController.salvarResposta,
);

// Finalizar simulado
router.post(
  '/:userId/:simuladoId/finalizar',
  simuladosController.finalizarSimulado,
);

// Obter resultado detalhado
router.get(
  '/:userId/:simuladoId/resultado',
  simuladosController.obterResultado,
);

// Estatísticas gerais do usuário
router.get('/:userId/stats/geral', simuladosController.obterEstatisticas);

module.exports = router;
