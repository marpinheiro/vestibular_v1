const Redacao = require('../models/Redacao');
const User = require('../models/User');
const { corrigirRedacao } = require('../services/openaiService');

// @desc    Enviar redação para correção
// @route   POST /api/redacoes
// @access  Private
exports.enviarRedacao = async (req, res) => {
  try {
    const { titulo, texto, tema } = req.body;
    const userId = req.user.id;

    // Validações
    if (!titulo || !texto || !tema) {
      return res.status(400).json({
        success: false,
        message: 'Título, texto e tema são obrigatórios',
      });
    }

    if (texto.length < 200) {
      return res.status(400).json({
        success: false,
        message: 'A redação deve ter no mínimo 200 caracteres',
      });
    }

    if (texto.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'A redação deve ter no máximo 5000 caracteres',
      });
    }

    // Verificar limites por plano
    const user = await User.findById(userId);
    const isPremium = user.current_plan_id > 1;

    if (!isPremium) {
      const redacoesNoMes = await Redacao.countThisMonth(userId);
      if (redacoesNoMes >= 1) {
        return res.status(403).json({
          success: false,
          message:
            'Você atingiu o limite de 1 redação por mês no plano gratuito. Assine o Premium para redações ilimitadas!',
        });
      }
    }

    // Corrigir com IA
    console.log('Enviando para correção com IA...');
    const correcao = await corrigirRedacao(texto, tema);

    // Salvar no banco
    const redacao = await Redacao.create({
      user_id: userId,
      titulo,
      texto,
      tema,
      ...correcao,
    });

    res.status(201).json({
      success: true,
      message: 'Redação corrigida com sucesso!',
      data: {
        id: redacao.id,
        titulo,
        tema,
        nota_total: correcao.nota_total,
        competencias: {
          competencia1: correcao.competencia1,
          competencia2: correcao.competencia2,
          competencia3: correcao.competencia3,
          competencia4: correcao.competencia4,
          competencia5: correcao.competencia5,
        },
        feedback_geral: correcao.feedback_geral,
        sugestoes: JSON.parse(correcao.sugestoes),
        detalhes: correcao.detalhes,
      },
    });
  } catch (error) {
    console.error('Erro ao enviar redação:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao processar redação',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Listar redações do usuário
// @route   GET /api/redacoes
// @access  Private
exports.listarRedacoes = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const redacoes = await Redacao.findByUserId(userId, limit);

    res.status(200).json({
      success: true,
      data: redacoes,
    });
  } catch (error) {
    console.error('Erro ao listar redações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar redações',
    });
  }
};

// @desc    Obter redação específica
// @route   GET /api/redacoes/:id
// @access  Private
exports.obterRedacao = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const redacao = await Redacao.findById(id, userId);

    if (!redacao) {
      return res.status(404).json({
        success: false,
        message: 'Redação não encontrada',
      });
    }

    // Parse sugestões se necessário
    if (typeof redacao.sugestoes === 'string') {
      redacao.sugestoes = JSON.parse(redacao.sugestoes);
    }

    res.status(200).json({
      success: true,
      data: redacao,
    });
  } catch (error) {
    console.error('Erro ao obter redação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar redação',
    });
  }
};

// @desc    Deletar redação
// @route   DELETE /api/redacoes/:id
// @access  Private
exports.deletarRedacao = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await Redacao.delete(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Redação não encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Redação deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar redação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar redação',
    });
  }
};

// @desc    Obter estatísticas de redações
// @route   GET /api/redacoes/stats
// @access  Private
exports.obterEstatisticas = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Redacao.getStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
    });
  }
};
