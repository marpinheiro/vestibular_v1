// ============================================
// backend/src/models/Progresso.js (Funções auxiliares)
// ============================================

const { pool } = require('../config/database');

class Progresso {
  // Inicializar conquistas padrão (executar uma vez)
  static async initializeAchievements() {
    const achievements = [
      {
        key: 'first_task',
        name: 'Primeira Conquista',
        description: 'Complete sua primeira tarefa',
        icon: '🎯',
        xp: 50,
        type: 'tasks',
        value: 1,
      },
      {
        key: 'streak_7',
        name: 'Sequência de 7 dias',
        description: 'Mantenha uma sequência de 7 dias',
        icon: '🔥',
        xp: 100,
        type: 'streak',
        value: 7,
      },
      {
        key: 'level_10',
        name: 'Nível 10',
        description: 'Alcance o nível 10',
        icon: '⭐',
        xp: 200,
        type: 'level',
        value: 10,
      },
      {
        key: 'tasks_100',
        name: 'Mestre da Produtividade',
        description: 'Complete 100 tarefas',
        icon: '👑',
        xp: 500,
        type: 'tasks',
        value: 100,
      },
      {
        key: 'streak_30',
        name: 'Sequência de 30 dias',
        description: 'Mantenha uma sequência de 30 dias',
        icon: '💎',
        xp: 1000,
        type: 'streak',
        value: 30,
      },
      {
        key: 'level_20',
        name: 'Nível 20',
        description: 'Alcance o nível 20',
        icon: '🏆',
        xp: 500,
        type: 'level',
        value: 20,
      },
      {
        key: 'questions_500',
        name: 'Estudioso',
        description: 'Responda 500 questões',
        icon: '📚',
        xp: 300,
        type: 'questions',
        value: 500,
      },
      {
        key: 'accuracy_90',
        name: 'Precisão Absoluta',
        description: 'Mantenha 90% de acertos',
        icon: '🎓',
        xp: 400,
        type: 'accuracy',
        value: 90,
      },
    ];

    try {
      for (const ach of achievements) {
        await pool.execute(
          `
          INSERT IGNORE INTO achievements 
          (achievement_key, name, description, icon, xp_reward, condition_type, condition_value)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [
            ach.key,
            ach.name,
            ach.description,
            ach.icon,
            ach.xp,
            ach.type,
            ach.value,
          ],
        );
      }

      console.log('✅ Conquistas inicializadas com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar conquistas:', error);
      return false;
    }
  }

  // Buscar conquistas de um usuário
  static async getUserAchievements(userId) {
    try {
      const [achievements] = await pool.execute(
        `
        SELECT a.*, ua.unlocked_at,
               CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as unlocked
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
        ORDER BY a.id
      `,
        [userId],
      );

      return achievements;
    } catch (error) {
      throw error;
    }
  }

  // Buscar metas de um usuário
  static async getUserGoals(userId) {
    try {
      const [goals] = await pool.execute(
        `
        SELECT * FROM user_goals 
        WHERE user_id = ? 
        ORDER BY completed ASC, created_at DESC
      `,
        [userId],
      );

      return goals;
    } catch (error) {
      throw error;
    }
  }

  // Buscar progresso por matéria
  static async getSubjectProgress(userId) {
    try {
      const [subjects] = await pool.execute(
        `
        SELECT * FROM subject_progress 
        WHERE user_id = ? 
        ORDER BY last_activity DESC
      `,
        [userId],
      );

      return subjects;
    } catch (error) {
      throw error;
    }
  }

  // Buscar atividades diárias
  static async getDailyActivities(userId, days = 30) {
    try {
      const [activities] = await pool.execute(
        `
        SELECT * FROM daily_activities 
        WHERE user_id = ? 
          AND activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ORDER BY activity_date DESC
      `,
        [userId, days],
      );

      return activities;
    } catch (error) {
      throw error;
    }
  }

  // Buscar histórico de XP
  static async getXPHistory(userId, limit = 50) {
    try {
      const [history] = await pool.execute(
        `
        SELECT * FROM xp_history 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `,
        [userId, limit],
      );

      return history;
    } catch (error) {
      throw error;
    }
  }

  // Deletar meta
  static async deleteGoal(goalId, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM user_goals WHERE id = ? AND user_id = ?',
        [goalId, userId],
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Progresso;
