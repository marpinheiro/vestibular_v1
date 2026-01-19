// ============================================
// backend/src/controllers/progressoController.js
// VERSÃO DEFINITIVA - USANDO FUNÇÕES STANDALONE
// ============================================

const { pool } = require('../config/database');
const User = require('../models/User');

// ============================================
// FUNÇÕES AUXILIARES (FORA DA CLASSE)
// ============================================

async function addXP(userId, xpAmount, source, connection) {
  const [user] = await connection.execute(
    'SELECT level, xp FROM users WHERE id = ?',
    [userId],
  );

  if (!user[0]) throw new Error('Usuário não encontrado');

  let { level, xp } = user[0];
  xp += xpAmount;

  // Verificar level up
  let xpToNextLevel = level * 250;
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = level * 250;
  }

  // Atualizar usuário
  await connection.execute('UPDATE users SET level = ?, xp = ? WHERE id = ?', [
    level,
    xp,
    userId,
  ]);

  // Registrar histórico de XP
  await connection.execute(
    'INSERT INTO xp_history (user_id, xp_amount, source_type) VALUES (?, ?, ?)',
    [userId, xpAmount, source],
  );
}

async function checkAchievements(userId, connection) {
  // Buscar dados atuais do usuário
  const [user] = await connection.execute(
    `
    SELECT u.level, u.streak_days, u.xp,
           COALESCE(SUM(da.tasks_completed), 0) as total_tasks,
           COALESCE(SUM(da.questions_answered), 0) as total_questions,
           COALESCE(SUM(da.correct_answers), 0) as total_correct
    FROM users u
    LEFT JOIN daily_activities da ON da.user_id = u.id
    WHERE u.id = ?
    GROUP BY u.id
  `,
    [userId],
  );

  if (!user[0]) return [];

  const userData = user[0];
  const accuracy =
    userData.total_questions > 0
      ? (userData.total_correct / userData.total_questions) * 100
      : 0;

  // Buscar conquistas ainda não desbloqueadas
  const [achievements] = await connection.execute(
    `
    SELECT a.* 
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
    WHERE ua.id IS NULL
  `,
    [userId],
  );

  const newAchievements = [];

  for (const achievement of achievements) {
    let shouldUnlock = false;

    switch (achievement.condition_type) {
      case 'level':
        shouldUnlock = userData.level >= achievement.condition_value;
        break;
      case 'tasks':
        shouldUnlock = userData.total_tasks >= achievement.condition_value;
        break;
      case 'streak':
        shouldUnlock = userData.streak_days >= achievement.condition_value;
        break;
      case 'questions':
        shouldUnlock = userData.total_questions >= achievement.condition_value;
        break;
      case 'accuracy':
        shouldUnlock = accuracy >= achievement.condition_value;
        break;
    }

    if (shouldUnlock) {
      // Desbloquear conquista
      await connection.execute(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
        [userId, achievement.id],
      );

      // Dar XP da conquista
      await addXP(userId, achievement.xp_reward, 'achievement', connection);

      newAchievements.push({
        id: achievement.achievement_key,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xp: achievement.xp_reward,
      });
    }
  }

  return newAchievements;
}

async function updateGoals(userId, connection) {
  const [user] = await connection.execute(
    `
    SELECT u.level, u.streak_days,
           COALESCE(SUM(da.tasks_completed), 0) as total_tasks,
           COALESCE(SUM(da.questions_answered), 0) as total_questions,
           COALESCE(SUM(da.correct_answers), 0) as total_correct,
           COALESCE(SUM(da.study_time_minutes), 0) as total_study_time
    FROM users u
    LEFT JOIN daily_activities da ON da.user_id = u.id
    WHERE u.id = ?
    GROUP BY u.id
  `,
    [userId],
  );

  if (!user[0]) return;

  const userData = user[0];
  const accuracy =
    userData.total_questions > 0
      ? (userData.total_correct / userData.total_questions) * 100
      : 0;

  const [goals] = await connection.execute(
    'SELECT * FROM user_goals WHERE user_id = ? AND completed = FALSE',
    [userId],
  );

  for (const goal of goals) {
    let currentValue = 0;

    switch (goal.goal_type) {
      case 'level':
        currentValue = userData.level;
        break;
      case 'tasks':
        currentValue = userData.total_tasks;
        break;
      case 'streak':
        currentValue = userData.streak_days;
        break;
      case 'questions':
        currentValue = userData.total_questions;
        break;
      case 'study_time':
        currentValue = userData.total_study_time;
        break;
      case 'accuracy':
        currentValue = Math.floor(accuracy);
        break;
    }

    const completed = currentValue >= goal.target_value;

    await connection.execute(
      `
      UPDATE user_goals 
      SET current_value = ?, completed = ?, completed_at = ?
      WHERE id = ?
    `,
      [currentValue, completed, completed ? new Date() : null, goal.id],
    );

    // Se completou a meta, dar bônus de XP
    if (completed && !goal.completed) {
      await addXP(userId, 500, 'goal', connection);
    }
  }
}

// ============================================
// CONTROLLER
// ============================================

class ProgressoController {
  // @desc    Obter progresso completo do usuário
  // @route   GET /api/progresso/:userId
  // @access  Private
  async getProgresso(req, res) {
    try {
      const { userId } = req.params;

      // Buscar dados do usuário
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      // Buscar conquistas desbloqueadas
      const [conquistas] = await pool.execute(
        `
        SELECT a.*, ua.unlocked_at 
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
        ORDER BY a.id
      `,
        [userId],
      );

      // Buscar metas
      const [metas] = await pool.execute(
        `
        SELECT * FROM user_goals 
        WHERE user_id = ? 
        ORDER BY completed ASC, created_at DESC
      `,
        [userId],
      );

      // Buscar progresso por matéria
      const [materias] = await pool.execute(
        `
        SELECT * FROM subject_progress 
        WHERE user_id = ? 
        ORDER BY last_activity DESC
      `,
        [userId],
      );

      // Calcular XP para próximo nível
      const xpToNextLevel = user.level * 250;

      // Calcular total de XP
      const [xpTotal] = await pool.execute(
        `
        SELECT COALESCE(SUM(xp_amount), 0) as total_xp
        FROM xp_history 
        WHERE user_id = ?
      `,
        [userId],
      );

      // Buscar total de tarefas completadas
      const [tasksResult] = await pool.execute(
        `
        SELECT COALESCE(SUM(tasks_completed), 0) as total_tasks
        FROM daily_activities
        WHERE user_id = ?
      `,
        [userId],
      );

      // Buscar totais de questões
      const [questionsResult] = await pool.execute(
        `
        SELECT 
          COALESCE(SUM(questions_answered), 0) as total_questions,
          COALESCE(SUM(correct_answers), 0) as total_correct,
          COALESCE(SUM(study_time_minutes), 0) as total_study_time
        FROM daily_activities
        WHERE user_id = ?
      `,
        [userId],
      );

      // Calcular taxa de acerto geral
      const taxaAcertoGeral =
        questionsResult[0].total_questions > 0
          ? (questionsResult[0].total_correct /
              questionsResult[0].total_questions) *
            100
          : 0;

      const progresso = {
        level: user.level,
        xp: user.xp,
        totalXP: xpTotal[0].total_xp || user.xp,
        xpToNextLevel,
        streak: user.streak_days,
        maxStreak: user.streak_days,
        completedTasks: tasksResult[0].total_tasks,
        totalQuestoes: questionsResult[0].total_questions,
        totalAcertos: questionsResult[0].total_correct,
        totalStudyTime: questionsResult[0].total_study_time,
        conquistas: conquistas.map((c) => ({
          id: c.achievement_key,
          name: c.name,
          description: c.description,
          icon: c.icon,
          xp: c.xp_reward,
          unlocked: !!c.unlocked_at,
          unlockedAt: c.unlocked_at,
        })),
        metas: metas.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          type: m.goal_type,
          current: m.current_value,
          target: m.target_value,
          completed: m.completed,
          completedAt: m.completed_at,
        })),
        progressoPorMateria: materias.map((m) => ({
          materiaNome: m.subject_name,
          questoesRespondidas: m.questions_answered,
          acertos: m.correct_answers,
          taxaAcerto: m.accuracy_rate,
          tempoEstudo: m.study_time_minutes,
          ultimaAtividade: m.last_activity,
        })),
        stats: {
          tasksThisWeek: 0,
          tasksThisMonth: 0,
          averageDaily: 0,
          productivity: 85,
          taxaAcertoGeral: taxaAcertoGeral,
        },
      };

      res.json({
        success: true,
        data: progresso,
      });
    } catch (error) {
      console.error('Erro ao obter progresso:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter progresso',
        error: error.message,
      });
    }
  }

  // @desc    Adicionar tarefa completada
  // @route   POST /api/progresso/:userId/task
  // @access  Private
  async addTask(req, res) {
    try {
      const { userId } = req.params;
      const { xp = 50, type = 'small' } = req.body;

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Atualizar streak
        await User.updateStreak(userId);

        // Adicionar XP ao usuário
        await addXP(userId, xp, 'task', connection);

        // Registrar atividade diária
        await connection.execute(
          `
          INSERT INTO daily_activities (user_id, activity_date, tasks_completed, xp_gained)
          VALUES (?, CURDATE(), 1, ?)
          ON DUPLICATE KEY UPDATE 
            tasks_completed = tasks_completed + 1,
            xp_gained = xp_gained + ?
        `,
          [userId, xp, xp],
        );

        // Verificar e desbloquear conquistas
        const newAchievements = await checkAchievements(userId, connection);

        await connection.commit();

        // Buscar usuário atualizado
        const userAtualizado = await User.findById(userId);

        res.json({
          success: true,
          message: 'Tarefa completada com sucesso!',
          xpGanho: xp,
          level: userAtualizado.level,
          xp: userAtualizado.xp,
          newAchievements,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar tarefa',
        error: error.message,
      });
    }
  }

  // @desc    Registrar atividade de estudo (questões)
  // @route   POST /api/progresso/:userId/atividade
  // @access  Private
  async registrarAtividade(req, res) {
    try {
      const { userId } = req.params;
      const { subjectName, questionsAnswered, correctAnswers, studyTime } =
        req.body;

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Atualizar streak
        await User.updateStreak(userId);

        // Calcular XP baseado no desempenho
        const accuracy = (correctAnswers / questionsAnswered) * 100;
        let xp = questionsAnswered * 10;

        if (accuracy >= 90) xp = Math.floor(xp * 1.5);
        else if (accuracy >= 70) xp = Math.floor(xp * 1.2);

        // Adicionar XP
        await addXP(userId, xp, 'question', connection);

        // Registrar atividade diária
        await connection.execute(
          `
          INSERT INTO daily_activities (
            user_id, activity_date, questions_answered, 
            correct_answers, study_time_minutes, xp_gained
          )
          VALUES (?, CURDATE(), ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            questions_answered = questions_answered + VALUES(questions_answered),
            correct_answers = correct_answers + VALUES(correct_answers),
            study_time_minutes = study_time_minutes + VALUES(study_time_minutes),
            xp_gained = xp_gained + VALUES(xp_gained)
        `,
          [userId, questionsAnswered, correctAnswers, studyTime, xp],
        );

        // Atualizar progresso por matéria
        await connection.execute(
          `
          INSERT INTO subject_progress (
            user_id, subject_name, questions_answered, 
            correct_answers, study_time_minutes
          )
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            questions_answered = questions_answered + VALUES(questions_answered),
            correct_answers = correct_answers + VALUES(correct_answers),
            accuracy_rate = (correct_answers + VALUES(correct_answers)) / 
                           (questions_answered + VALUES(questions_answered)) * 100,
            study_time_minutes = study_time_minutes + VALUES(study_time_minutes),
            last_activity = CURRENT_TIMESTAMP
        `,
          [userId, subjectName, questionsAnswered, correctAnswers, studyTime],
        );

        // Verificar conquistas
        const newAchievements = await checkAchievements(userId, connection);

        // Atualizar metas
        await updateGoals(userId, connection);

        await connection.commit();

        // Buscar usuário atualizado
        const userAtualizado = await User.findById(userId);

        res.json({
          success: true,
          message: 'Atividade registrada com sucesso',
          xpGanho: xp,
          newAchievements,
          level: userAtualizado.level,
          xp: userAtualizado.xp,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar atividade',
        error: error.message,
      });
    }
  }

  // @desc    Criar nova meta
  // @route   POST /api/progresso/:userId/meta
  // @access  Private
  async criarMeta(req, res) {
    try {
      const { userId } = req.params;
      const { name, description, type, target } = req.body;

      const [result] = await pool.execute(
        `
        INSERT INTO user_goals (user_id, name, description, goal_type, target_value)
        VALUES (?, ?, ?, ?, ?)
      `,
        [userId, name, description, type, target],
      );

      res.json({
        success: true,
        data: {
          id: result.insertId,
          name,
          description,
          type,
          target,
        },
      });
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar meta',
        error: error.message,
      });
    }
  }

  // @desc    Obter estatísticas por período
  // @route   GET /api/progresso/:userId/stats?period=week
  // @access  Private
  async getStats(req, res) {
    try {
      const { userId } = req.params;
      const { period = 'week' } = req.query;

      let dateFilter = '';
      if (period === 'week') {
        dateFilter = 'AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      } else if (period === 'month') {
        dateFilter =
          'AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      }

      // Buscar atividades do período
      const [atividades] = await pool.execute(
        `
        SELECT 
          activity_date as date,
          tasks_completed as tasks,
          questions_answered as questoesRespondidas,
          correct_answers as acertos,
          study_time_minutes as studyTime,
          xp_gained as xp
        FROM daily_activities
        WHERE user_id = ? ${dateFilter}
        ORDER BY activity_date DESC
      `,
        [userId],
      );

      // Calcular totais
      const totals = atividades.reduce(
        (acc, day) => ({
          totalQuestoes: acc.totalQuestoes + day.questoesRespondidas,
          totalAcertos: acc.totalAcertos + day.acertos,
          totalXP: acc.totalXP + day.xp,
          totalStudyTime: acc.totalStudyTime + day.studyTime,
        }),
        { totalQuestoes: 0, totalAcertos: 0, totalXP: 0, totalStudyTime: 0 },
      );

      const taxaAcerto =
        totals.totalQuestoes > 0
          ? (totals.totalAcertos / totals.totalQuestoes) * 100
          : 0;

      res.json({
        success: true,
        data: {
          period,
          atividades,
          ...totals,
          taxaAcerto,
          averageDaily:
            atividades.length > 0
              ? totals.totalQuestoes / atividades.length
              : 0,
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
  }
}

// Exportar instância única
module.exports = new ProgressoController();
