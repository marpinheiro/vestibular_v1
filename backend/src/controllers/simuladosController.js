const { pool } = require('../config/database');

const simuladosController = {
  // Listar simulados do usuário
  listarSimulados: async (req, res) => {
    try {
      const userId = req.params.userId;

      const [simulados] = await pool.query(
        `SELECT 
          s.*,
          COUNT(sq.id) as total_answered,
          GROUP_CONCAT(DISTINCT q.subject) as subjects
        FROM simulados s
        LEFT JOIN simulado_questions sq ON s.id = sq.simulado_id
        LEFT JOIN questions q ON sq.question_id = q.id
        WHERE s.user_id = ?
        GROUP BY s.id
        ORDER BY s.started_at DESC`,
        [userId],
      );

      res.json({
        success: true,
        data: simulados,
      });
    } catch (error) {
      console.error('Erro ao listar simulados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar simulados',
        error: error.message,
      });
    }
  },

  // Criar novo simulado
  criarSimulado: async (req, res) => {
    try {
      const userId = req.params.userId;
      const { vestibular, totalQuestions, subjects } = req.body;

      // Validações
      if (!vestibular || !totalQuestions) {
        return res.status(400).json({
          success: false,
          message: 'Vestibular e quantidade de questões são obrigatórios',
        });
      }

      // Buscar questões aleatórias
      let query = `
        SELECT * FROM questions 
        WHERE vestibular = ?
      `;
      const params = [vestibular];

      // Filtrar por matérias se fornecido
      if (subjects && subjects.length > 0) {
        query += ` AND subject IN (?)`;
        params.push(subjects);
      }

      query += ` ORDER BY RAND() LIMIT ?`;
      params.push(parseInt(totalQuestions));

      const [questoes] = await pool.query(query, params);

      if (questoes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma questão encontrada com os critérios especificados',
        });
      }

      // Criar simulado
      const title = `Simulado ${vestibular.toUpperCase()} - ${new Date().toLocaleDateString('pt-BR')}`;

      const [result] = await pool.query(
        `INSERT INTO simulados 
        (user_id, vestibular, title, total_questions, started_at) 
        VALUES (?, ?, ?, ?, NOW())`,
        [userId, vestibular, title, questoes.length],
      );

      const simuladoId = result.insertId;

      // Associar questões ao simulado
      const questoesValues = questoes.map((q) => [simuladoId, q.id]);
      await pool.query(
        'INSERT INTO simulado_questions (simulado_id, question_id) VALUES ?',
        [questoesValues],
      );

      res.json({
        success: true,
        message: 'Simulado criado com sucesso',
        data: {
          id: simuladoId,
          title: title,
          total_questions: questoes.length,
        },
      });
    } catch (error) {
      console.error('Erro ao criar simulado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar simulado',
        error: error.message,
      });
    }
  },

  // Obter simulado com questões
  obterSimulado: async (req, res) => {
    try {
      const userId = req.params.userId;
      const simuladoId = req.params.simuladoId;

      // Buscar dados do simulado
      const [simulados] = await pool.query(
        'SELECT * FROM simulados WHERE id = ? AND user_id = ?',
        [simuladoId, userId],
      );

      if (simulados.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Simulado não encontrado',
        });
      }

      const simulado = simulados[0];

      // Buscar questões do simulado
      const [questoes] = await pool.query(
        `SELECT 
          q.*,
          sq.user_answer,
          sq.is_correct
        FROM simulado_questions sq
        JOIN questions q ON sq.question_id = q.id
        WHERE sq.simulado_id = ?
        ORDER BY sq.id`,
        [simuladoId],
      );

      res.json({
        success: true,
        data: {
          ...simulado,
          questoes: questoes,
        },
      });
    } catch (error) {
      console.error('Erro ao obter simulado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter simulado',
        error: error.message,
      });
    }
  },

  // Salvar resposta de uma questão
  salvarResposta: async (req, res) => {
    try {
      const { simuladoId, questionId } = req.params;
      const { resposta } = req.body;

      if (!resposta || !['a', 'b', 'c', 'd', 'e'].includes(resposta)) {
        return res.status(400).json({
          success: false,
          message: 'Resposta inválida',
        });
      }

      // Buscar questão para verificar gabarito
      const [questoes] = await pool.query(
        'SELECT correct_answer FROM questions WHERE id = ?',
        [questionId],
      );

      if (questoes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Questão não encontrada',
        });
      }

      const isCorrect = questoes[0].correct_answer === resposta;

      // Atualizar resposta
      await pool.query(
        `UPDATE simulado_questions 
        SET user_answer = ?, is_correct = ? 
        WHERE simulado_id = ? AND question_id = ?`,
        [resposta, isCorrect, simuladoId, questionId],
      );

      res.json({
        success: true,
        message: 'Resposta salva',
        data: {
          is_correct: isCorrect,
        },
      });
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar resposta',
        error: error.message,
      });
    }
  },

  // Finalizar simulado
  finalizarSimulado: async (req, res) => {
    try {
      const { simuladoId } = req.params;
      const { duration } = req.body;

      // Calcular resultados
      const [results] = await pool.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
        FROM simulado_questions
        WHERE simulado_id = ?`,
        [simuladoId],
      );

      const total = results[0].total;
      const correct = results[0].correct || 0;
      const score = total > 0 ? ((correct / total) * 100).toFixed(2) : 0;

      // Atualizar simulado
      await pool.query(
        `UPDATE simulados 
        SET completed_at = NOW(), 
            duration = ?, 
            correct_answers = ?, 
            score = ?
        WHERE id = ?`,
        [duration, correct, score, simuladoId],
      );

      // Buscar estatísticas detalhadas
      const [stats] = await pool.query(
        `SELECT 
          q.subject,
          COUNT(*) as total,
          SUM(CASE WHEN sq.is_correct = 1 THEN 1 ELSE 0 END) as correct
        FROM simulado_questions sq
        JOIN questions q ON sq.question_id = q.id
        WHERE sq.simulado_id = ?
        GROUP BY q.subject`,
        [simuladoId],
      );

      res.json({
        success: true,
        message: 'Simulado finalizado',
        data: {
          total_questions: total,
          correct_answers: correct,
          score: parseFloat(score),
          duration: duration,
          stats_by_subject: stats,
        },
      });
    } catch (error) {
      console.error('Erro ao finalizar simulado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao finalizar simulado',
        error: error.message,
      });
    }
  },

  // Obter resultado detalhado
  obterResultado: async (req, res) => {
    try {
      const { simuladoId } = req.params;

      // Buscar simulado
      const [simulados] = await pool.query(
        'SELECT * FROM simulados WHERE id = ?',
        [simuladoId],
      );

      if (simulados.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Simulado não encontrado',
        });
      }

      // Buscar questões com respostas
      const [questoes] = await pool.query(
        `SELECT 
          q.*,
          sq.user_answer,
          sq.is_correct
        FROM simulado_questions sq
        JOIN questions q ON sq.question_id = q.id
        WHERE sq.simulado_id = ?
        ORDER BY sq.id`,
        [simuladoId],
      );

      // Estatísticas por matéria
      const [statsBySubject] = await pool.query(
        `SELECT 
          q.subject,
          COUNT(*) as total,
          SUM(CASE WHEN sq.is_correct = 1 THEN 1 ELSE 0 END) as correct,
          ROUND((SUM(CASE WHEN sq.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as percentage
        FROM simulado_questions sq
        JOIN questions q ON sq.question_id = q.id
        WHERE sq.simulado_id = ?
        GROUP BY q.subject`,
        [simuladoId],
      );

      // Estatísticas por dificuldade
      const [statsByDifficulty] = await pool.query(
        `SELECT 
          q.difficulty,
          COUNT(*) as total,
          SUM(CASE WHEN sq.is_correct = 1 THEN 1 ELSE 0 END) as correct
        FROM simulado_questions sq
        JOIN questions q ON sq.question_id = q.id
        WHERE sq.simulado_id = ?
        GROUP BY q.difficulty`,
        [simuladoId],
      );

      res.json({
        success: true,
        data: {
          simulado: simulados[0],
          questoes: questoes,
          stats_by_subject: statsBySubject,
          stats_by_difficulty: statsByDifficulty,
        },
      });
    } catch (error) {
      console.error('Erro ao obter resultado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter resultado',
        error: error.message,
      });
    }
  },

  // Estatísticas gerais do usuário
  obterEstatisticas: async (req, res) => {
    try {
      const userId = req.params.userId;

      // Total de simulados
      const [totalSimulados] = await pool.query(
        'SELECT COUNT(*) as total FROM simulados WHERE user_id = ? AND completed_at IS NOT NULL',
        [userId],
      );

      // Média geral
      const [mediaGeral] = await pool.query(
        'SELECT AVG(score) as media FROM simulados WHERE user_id = ? AND completed_at IS NOT NULL',
        [userId],
      );

      // Melhor nota
      const [melhorNota] = await pool.query(
        'SELECT MAX(score) as melhor FROM simulados WHERE user_id = ? AND completed_at IS NOT NULL',
        [userId],
      );

      // Total de questões respondidas
      const [totalQuestoes] = await pool.query(
        `SELECT COUNT(*) as total 
        FROM simulado_questions sq
        JOIN simulados s ON sq.simulado_id = s.id
        WHERE s.user_id = ? AND sq.user_answer IS NOT NULL`,
        [userId],
      );

      // Acertos por matéria
      const [acertosPorMateria] = await pool.query(
        `SELECT 
          q.subject,
          COUNT(*) as total,
          SUM(CASE WHEN sq.is_correct = 1 THEN 1 ELSE 0 END) as correct,
          ROUND((SUM(CASE WHEN sq.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as percentage
        FROM simulado_questions sq
        JOIN questions q ON sq.question_id = q.id
        JOIN simulados s ON sq.simulado_id = s.id
        WHERE s.user_id = ? AND sq.user_answer IS NOT NULL
        GROUP BY q.subject
        ORDER BY percentage DESC`,
        [userId],
      );

      // Evolução (últimos 10 simulados)
      const [evolucao] = await pool.query(
        `SELECT 
          id,
          title,
          score,
          DATE_FORMAT(completed_at, '%d/%m') as data
        FROM simulados
        WHERE user_id = ? AND completed_at IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT 10`,
        [userId],
      );

      res.json({
        success: true,
        data: {
          total_simulados: totalSimulados[0].total,
          media_geral: parseFloat(mediaGeral[0].media || 0).toFixed(2),
          melhor_nota: parseFloat(melhorNota[0].melhor || 0).toFixed(2),
          total_questoes: totalQuestoes[0].total,
          acertos_por_materia: acertosPorMateria,
          evolucao: evolucao.reverse(),
        },
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error.message,
      });
    }
  },
};

module.exports = simuladosController;
