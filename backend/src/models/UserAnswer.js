const { pool } = require('../config/database');

class UserAnswer {
  // Salvar resposta do usuário
  static async create(answerData) {
    const {
      user_id,
      question_id,
      user_answer,
      is_correct,
      time_spent = null,
    } = answerData;

    try {
      const query = `
        INSERT INTO user_answers (user_id, question_id, user_answer, is_correct, time_spent)
        VALUES (?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute(query, [
        user_id,
        question_id,
        user_answer,
        is_correct ? 1 : 0,
        time_spent,
      ]);

      return {
        id: result.insertId,
        ...answerData,
      };
    } catch (error) {
      throw error;
    }
  }

  // Verificar se usuário já respondeu
  static async hasAnswered(userId, questionId) {
    try {
      const query = `
        SELECT id FROM user_answers
        WHERE user_id = ? AND question_id = ?
      `;

      const [rows] = await pool.execute(query, [userId, questionId]);
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Contar respostas no mês atual
  static async countThisMonth(userId) {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM user_answers
        WHERE user_id = ?
        AND MONTH(answered_at) = MONTH(CURRENT_DATE())
        AND YEAR(answered_at) = YEAR(CURRENT_DATE())
      `;

      const [rows] = await pool.execute(query, [userId]);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Estatísticas gerais do usuário
  static async getStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_answered,
          SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as total_correct,
          ROUND((SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as accuracy
        FROM user_answers
        WHERE user_id = ?
      `;

      const [rows] = await pool.execute(query, [userId]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Estatísticas por matéria
  static async getStatsBySubject(userId) {
    try {
      const query = `
        SELECT 
          q.subject,
          COUNT(*) as total,
          SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
          ROUND((SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as accuracy
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        WHERE ua.user_id = ?
        GROUP BY q.subject
        ORDER BY total DESC
      `;

      const [rows] = await pool.execute(query, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Histórico recente
  static async getRecent(userId, limit = 10) {
    try {
      const query = `
        SELECT 
          ua.id,
          ua.user_answer,
          ua.is_correct,
          ua.answered_at,
          q.id as question_id,
          q.subject,
          q.topic,
          q.vestibular,
          q.year,
          q.correct_answer
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        WHERE ua.user_id = ?
        ORDER BY ua.answered_at DESC
        LIMIT ?
      `;

      const [rows] = await pool.execute(query, [userId, limit]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserAnswer;
