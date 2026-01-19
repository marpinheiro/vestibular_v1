const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Criar novo usuário
  static async create(userData) {
    const { name, email, password, vestibular = 'enem' } = userData;

    try {
      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const query = `
        INSERT INTO users (name, email, password, vestibular, current_plan_id, hours_per_day, level, xp, coins, streak_days)
        VALUES (?, ?, ?, ?, 1, 4, 1, 0, 0, 0)
      `;

      const [result] = await pool.execute(query, [
        name,
        email,
        hashedPassword,
        vestibular,
      ]);

      return {
        id: result.insertId,
        name,
        email,
        vestibular,
      };
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ?';
      const [rows] = await pool.query(query, [email]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuário por ID
  static async findById(id) {
    try {
      const query = `
        SELECT id, name, email, vestibular, current_plan_id, hours_per_day, 
               avatar, level, xp, coins, streak_days, last_study_date, created_at
        FROM users 
        WHERE id = ?
      `;
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Validar senha
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Atualizar último dia de estudo
  static async updateLastStudyDate(userId) {
    try {
      const query = 'UPDATE users SET last_study_date = CURDATE() WHERE id = ?';
      await pool.execute(query, [userId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar streak
  static async updateStreak(userId) {
    try {
      const user = await this.findById(userId);
      const today = new Date().toISOString().split('T')[0];
      const lastStudy = user.last_study_date;

      if (!lastStudy) {
        // Primeiro dia de estudo
        const query =
          'UPDATE users SET streak_days = 1, last_study_date = CURDATE() WHERE id = ?';
        await pool.execute(query, [userId]);
      } else {
        const lastDate = new Date(lastStudy);
        const currentDate = new Date(today);
        const diffTime = currentDate - lastDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Dia consecutivo
          const query =
            'UPDATE users SET streak_days = streak_days + 1, last_study_date = CURDATE() WHERE id = ?';
          await pool.execute(query, [userId]);
        } else if (diffDays > 1) {
          // Quebrou a sequência
          const query =
            'UPDATE users SET streak_days = 1, last_study_date = CURDATE() WHERE id = ?';
          await pool.execute(query, [userId]);
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
