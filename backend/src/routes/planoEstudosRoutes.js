const express = require('express');
const router = express.Router();
const planoEstudosController = require('../controllers/planoEstudosController');
// const { protect } = require('../middleware/auth'); // ← Comentado temporariamente

// Todas as rotas requerem autenticação
// router.use(protect); // ← Comentado temporariamente para testar

// Criar novo plano
router.post('/:userId', planoEstudosController.criarPlano);

// Listar todos os planos do usuário
router.get('/:userId', planoEstudosController.listarPlanos);

// Obter plano ativo
router.get('/:userId/ativo', planoEstudosController.obterPlanoAtivo);

// Ativar plano
router.put('/:userId/:planoId/ativar', planoEstudosController.ativarPlano);

// Excluir plano
router.delete('/:userId/:planoId', planoEstudosController.excluirPlano);

// Registrar estudo
router.post(
  '/:userId/:planoId/registrar',
  planoEstudosController.registrarEstudo,
);

module.exports = router;
