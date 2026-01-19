const { pool } = require('../config/database');

class Question {
  // Buscar questões com filtros
  static async findWithFilters(filters = {}, limit = 20, offset = 0) {
    try {
      let query = 'SELECT * FROM questions WHERE 1=1';
      const params = [];

      // Filtro por vestibular
      if (filters.vestibular) {
        query += ' AND vestibular = ?';
        params.push(filters.vestibular);
      }

      // Filtro por matéria
      if (filters.subject) {
        query += ' AND subject = ?';
        params.push(filters.subject);
      }

      // Filtro por tópico
      if (filters.topic) {
        query += ' AND topic LIKE ?';
        params.push(`%${filters.topic}%`);
      }

      // Filtro por ano
      if (filters.year) {
        query += ' AND year = ?';
        params.push(filters.year);
      }

      // Filtro por dificuldade
      if (filters.difficulty) {
        query += ' AND difficulty = ?';
        params.push(filters.difficulty);
      }

      // Busca por texto
      if (filters.search) {
        query += ' AND (question_text LIKE ? OR topic LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // Ordenação
      query += ' ORDER BY RAND()'; // Aleatório para variedade

      // Paginação
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Contar questões com filtros
  static async countWithFilters(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM questions WHERE 1=1';
      const params = [];

      if (filters.vestibular) {
        query += ' AND vestibular = ?';
        params.push(filters.vestibular);
      }

      if (filters.subject) {
        query += ' AND subject = ?';
        params.push(filters.subject);
      }

      if (filters.topic) {
        query += ' AND topic LIKE ?';
        params.push(`%${filters.topic}%`);
      }

      if (filters.year) {
        query += ' AND year = ?';
        params.push(filters.year);
      }

      if (filters.difficulty) {
        query += ' AND difficulty = ?';
        params.push(filters.difficulty);
      }

      if (filters.search) {
        query += ' AND (question_text LIKE ? OR topic LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Buscar questão por ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM questions WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Listar matérias únicas
  static async getSubjects(vestibular = null) {
    try {
      let query = 'SELECT DISTINCT subject FROM questions';
      const params = [];

      if (vestibular) {
        query += ' WHERE vestibular = ?';
        params.push(vestibular);
      }

      query += ' ORDER BY subject';

      const [rows] = await pool.execute(query, params);
      return rows.map((row) => row.subject);
    } catch (error) {
      throw error;
    }
  }

  // Listar tópicos únicos
  static async getTopics(subject = null, vestibular = null) {
    try {
      let query = 'SELECT DISTINCT topic FROM questions WHERE 1=1';
      const params = [];

      if (vestibular) {
        query += ' AND vestibular = ?';
        params.push(vestibular);
      }

      if (subject) {
        query += ' AND subject = ?';
        params.push(subject);
      }

      query += ' ORDER BY topic LIMIT 50';

      const [rows] = await pool.execute(query, params);
      return rows.map((row) => row.topic);
    } catch (error) {
      throw error;
    }
  }

  // Listar anos disponíveis
  static async getYears(vestibular = null) {
    try {
      let query = 'SELECT DISTINCT year FROM questions';
      const params = [];

      if (vestibular) {
        query += ' WHERE vestibular = ?';
        params.push(vestibular);
      }

      query += ' ORDER BY year DESC';

      const [rows] = await pool.execute(query, params);
      return rows.map((row) => row.year);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Question;
