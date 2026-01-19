const express = require('express');
const router = express.Router();
const configurationsController = require('../controllers/configurationsController');
// const { protect } = require('../middleware/auth'); // Descomentar quando tiver auth

// Todas as rotas requerem autenticação
// router.use(protect); // Descomentar quando tiver auth

// Obter perfil do usuário
router.get('/:userId', configurationsController.obterPerfil);

// Atualizar perfil
router.put('/:userId/perfil', configurationsController.atualizarPerfil);

// Alterar senha
router.put('/:userId/senha', configurationsController.alterarSenha);

// Atualizar preferências
router.put(
  '/:userId/preferencias',
  configurationsController.atualizarPreferencias,
);

// Exportar dados
router.get('/:userId/exportar', configurationsController.exportarDados);

// Excluir conta
router.delete('/:userId/excluir', configurationsController.excluirConta);

module.exports = router;
