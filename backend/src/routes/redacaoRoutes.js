const express = require('express');
const router = express.Router();
const {
  enviarRedacao,
  listarRedacoes,
  obterRedacao,
  deletarRedacao,
  obterEstatisticas,
} = require('../controllers/redacaoController');
const { protect } = require('../middleware/auth');

// Todas as rotas são protegidas
router.use(protect);

// Rotas
router.post('/', enviarRedacao);
router.get('/', listarRedacoes);
router.get('/stats', obterEstatisticas);
router.get('/:id', obterRedacao);
router.delete('/:id', deletarRedacao);

module.exports = router;
