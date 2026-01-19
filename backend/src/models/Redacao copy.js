const { pool } = require('../config/database');

class Redacao {
  // Criar nova redação
  static async create(redacaoData) {
    const {
      user_id,
      titulo,
      texto,
      tema,
      competencia1,
      competencia2,
      competencia3,
      competencia4,
      competencia5,
      nota_total,
      feedback_geral,
      sugestoes,
    } = redacaoData;

    try {
      const query = `
        INSERT INTO redacoes (
          user_id, theme, content, score,
          competence_1, competence_2, competence_3, competence_4, competence_5,
          feedback, corrected
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `;

      const feedbackCompleto = JSON.stringify({
        feedback_geral,
        sugestoes,
        titulo,
        tema,
      });

      const [result] = await pool.execute(query, [
        user_id,
        tema,
        texto,
        nota_total,
        competencia1,
        competencia2,
        competencia3,
        competencia4,
        competencia5,
        feedbackCompleto,
      ]);

      return {
        id: result.insertId,
        ...redacaoData,
      };
    } catch (error) {
      throw error;
    }
  }

  // Buscar redações do usuário
  static async findByUserId(userId, limit = 10) {
    try {
      const query = `
        SELECT id, theme as tema, score as nota_total, corrected, submitted_at as created_at
        FROM redacoes
        WHERE user_id = ?
        ORDER BY submitted_at DESC
        LIMIT ?
      `;

      const [rows] = await pool.execute(query, [userId, limit]);

      // Adicionar título do feedback
      const rowsComTitulo = rows.map((row) => {
        try {
          const feedback =
            typeof row.feedback === 'string' ? JSON.parse(row.feedback) : {};
          return {
            ...row,
            titulo: feedback.titulo || 'Sem título',
            status: row.corrected ? 'corrigida' : 'pendente',
          };
        } catch {
          return {
            ...row,
            titulo: 'Sem título',
            status: row.corrected ? 'corrigida' : 'pendente',
          };
        }
      });

      return rowsComTitulo;
    } catch (error) {
      throw error;
    }
  }

  // Buscar redação por ID
  static async findById(id, userId) {
    try {
      const query = `
        SELECT 
          id,
          user_id,
          theme as tema,
          content as texto,
          score as nota_total,
          competence_1 as competencia1,
          competence_2 as competencia2,
          competence_3 as competencia3,
          competence_4 as competencia4,
          competence_5 as competencia5,
          feedback,
          corrected,
          submitted_at as created_at
        FROM redacoes
        WHERE id = ? AND user_id = ?
      `;

      const [rows] = await pool.execute(query, [id, userId]);

      if (rows.length === 0) return null;

      const redacao = rows[0];

      // Parse do feedback
      try {
        const feedbackData =
          typeof redacao.feedback === 'string'
            ? JSON.parse(redacao.feedback)
            : redacao.feedback;

        redacao.titulo = feedbackData.titulo || 'Sem título';
        redacao.feedback_geral = feedbackData.feedback_geral || '';
        redacao.sugestoes = feedbackData.sugestoes || [];
      } catch {
        redacao.titulo = 'Sem título';
        redacao.feedback_geral = '';
        redacao.sugestoes = [];
      }

      return redacao;
    } catch (error) {
      throw error;
    }
  }

  // Contar redações do usuário no mês atual
  static async countThisMonth(userId) {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM redacoes
        WHERE user_id = ?
        AND MONTH(submitted_at) = MONTH(CURRENT_DATE())
        AND YEAR(submitted_at) = YEAR(CURRENT_DATE())
      `;

      const [rows] = await pool.execute(query, [userId]);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Deletar redação
  static async delete(id, userId) {
    try {
      const query = 'DELETE FROM redacoes WHERE id = ? AND user_id = ?';
      const [result] = await pool.execute(query, [id, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Estatísticas do usuário
  static async getStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_redacoes,
          AVG(score) as media_geral,
          AVG(competence_1) as media_comp1,
          AVG(competence_2) as media_comp2,
          AVG(competence_3) as media_comp3,
          AVG(competence_4) as media_comp4,
          AVG(competence_5) as media_comp5
        FROM redacoes
        WHERE user_id = ? AND corrected = 1
      `;

      const [rows] = await pool.execute(query, [userId]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Redacao;
