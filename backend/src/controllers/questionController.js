const Question = require('../models/Question');
const UserAnswer = require('../models/UserAnswer');
const User = require('../models/User');

// @desc    Listar questões com filtros
// @route   GET /api/questions
// @access  Private
exports.listarQuestoes = async (req, res) => {
  try {
    const {
      vestibular,
      subject,
      topic,
      year,
      difficulty,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {};
    if (vestibular) filters.vestibular = vestibular;
    if (subject) filters.subject = subject;
    if (topic) filters.topic = topic;
    if (year) filters.year = parseInt(year);
    if (difficulty) filters.difficulty = difficulty;
    if (search) filters.search = search;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [questoes, total] = await Promise.all([
      Question.findWithFilters(filters, parseInt(limit), offset),
      Question.countWithFilters(filters),
    ]);

    // Remover gabarito e explicação da listagem
    const questoesSemGabarito = questoes.map((q) => ({
      id: q.id,
      vestibular: q.vestibular,
      subject: q.subject,
      topic: q.topic,
      year: q.year,
      question_number: q.question_number,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e,
      difficulty: q.difficulty,
    }));

    res.status(200).json({
      success: true,
      data: {
        questoes: questoesSemGabarito,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao listar questões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar questões',
    });
  }
};

// @desc    Responder questão
// @route   POST /api/questions/:id/answer
// @access  Private
exports.responderQuestao = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const userId = req.user.id;

    console.log('📝 Responder questão:', { id, answer, userId });

    if (!answer || !['a', 'b', 'c', 'd', 'e'].includes(answer.toLowerCase())) {
      console.log('❌ Resposta inválida:', answer);
      return res.status(400).json({
        success: false,
        message: 'Resposta inválida. Use: a, b, c, d ou e',
      });
    }

    // Verificar limite por plano
    const user = await User.findById(userId);
    console.log('👤 Usuário:', { id: user.id, plan: user.current_plan_id });

    const isPremium = user.current_plan_id > 1;

    if (!isPremium) {
      const questoesNoMes = await UserAnswer.countThisMonth(userId);
      console.log('📊 Questões no mês:', questoesNoMes);

      if (questoesNoMes >= 50) {
        return res.status(403).json({
          success: false,
          message:
            'Você atingiu o limite de 50 questões por mês no plano gratuito. Assine o Premium para questões ilimitadas!',
        });
      }
    }

    // Buscar questão
    const questao = await Question.findById(id);
    console.log('❓ Questão encontrada:', questao ? 'SIM' : 'NÃO');

    if (!questao) {
      return res.status(404).json({
        success: false,
        message: 'Questão não encontrada',
      });
    }

    const userAnswer = answer.toLowerCase();
    const correctAnswer = questao.correct_answer.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;

    console.log('✅ Resposta:', { userAnswer, correctAnswer, isCorrect });

    // Salvar resposta
    try {
      await UserAnswer.create({
        user_id: userId,
        question_id: id,
        user_answer: userAnswer,
        is_correct: isCorrect,
      });
      console.log('💾 Resposta salva com sucesso');
    } catch (saveError) {
      console.error('❌ Erro ao salvar resposta:', saveError);
      // Continua mesmo se falhar ao salvar
    }

    res.status(200).json({
      success: true,
      data: {
        correct: isCorrect,
        correct_answer: correctAnswer,
        user_answer: userAnswer,
        explanation: questao.explanation || 'Explicação não disponível',
      },
    });
  } catch (error) {
    console.error('❌ Erro ao responder questão:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar resposta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Obter filtros disponíveis
// @route   GET /api/questions/filters
// @access  Private
exports.obterFiltros = async (req, res) => {
  try {
    const { vestibular, subject } = req.query;

    const [subjects, topics, years] = await Promise.all([
      Question.getSubjects(vestibular),
      Question.getTopics(subject, vestibular),
      Question.getYears(vestibular),
    ]);

    res.status(200).json({
      success: true,
      data: {
        vestibulares: ['enem', 'fuvest', 'unicamp', 'unesp'],
        subjects,
        topics,
        years,
        dificuldades: ['easy', 'medium', 'hard'],
      },
    });
  } catch (error) {
    console.error('Erro ao obter filtros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar filtros',
    });
  }
};

// @desc    Obter estatísticas do usuário
// @route   GET /api/questions/stats
// @access  Private
exports.obterEstatisticas = async (req, res) => {
  try {
    const userId = req.user.id;

    const [statsGeral, statsPorMateria, historico] = await Promise.all([
      UserAnswer.getStats(userId),
      UserAnswer.getStatsBySubject(userId),
      UserAnswer.getRecent(userId, 10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        geral: statsGeral,
        por_materia: statsPorMateria,
        historico,
      },
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
    });
  }
};
