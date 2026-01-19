const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const configurationsController = {
  // Obter dados do usuário
  obterPerfil: async (req, res) => {
    try {
      const userId = req.params.userId;

      const [users] = await pool.query(
        `SELECT 
          id, name, email, vestibular, avatar, 
          level, xp, coins, streak_days,
          email_notifications, theme, 
          hours_per_day, study_days,
          created_at
        FROM users 
        WHERE id = ?`,
        [userId],
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      const user = users[0];

      // Parse JSON fields
      if (user.study_days) {
        try {
          user.study_days = JSON.parse(user.study_days);
        } catch (e) {
          user.study_days = [];
        }
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter perfil',
        error: error.message,
      });
    }
  },

  // Atualizar perfil
  atualizarPerfil: async (req, res) => {
    try {
      const userId = req.params.userId;
      const { name, email, vestibular, avatar } = req.body;

      // Verificar se email já existe (se mudou)
      if (email) {
        const [existingUsers] = await pool.query(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId],
        );

        if (existingUsers.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Este email já está em uso',
          });
        }
      }

      // Construir query dinamicamente
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (email !== undefined) {
        updates.push('email = ?');
        values.push(email);
      }
      if (vestibular !== undefined) {
        updates.push('vestibular = ?');
        values.push(vestibular);
      }
      if (avatar !== undefined) {
        updates.push('avatar = ?');
        values.push(avatar);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar',
        });
      }

      values.push(userId);

      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values,
      );

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar perfil',
        error: error.message,
      });
    }
  },

  // Alterar senha
  alterarSenha: async (req, res) => {
    try {
      const userId = req.params.userId;
      const { senhaAtual, novaSenha } = req.body;

      if (!senhaAtual || !novaSenha) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual e nova senha são obrigatórias',
        });
      }

      if (novaSenha.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha deve ter no mínimo 6 caracteres',
        });
      }

      // Buscar senha atual
      const [users] = await pool.query(
        'SELECT password FROM users WHERE id = ?',
        [userId],
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      // Verificar senha atual
      const senhaCorreta = await bcrypt.compare(senhaAtual, users[0].password);

      if (!senhaCorreta) {
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta',
        });
      }

      // Hash da nova senha
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(novaSenha, salt);

      // Atualizar senha
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [
        senhaHash,
        userId,
      ]);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao alterar senha',
        error: error.message,
      });
    }
  },

  // Atualizar preferências
  atualizarPreferencias: async (req, res) => {
    try {
      const userId = req.params.userId;
      const { emailNotifications, theme, hoursPerDay, studyDays } = req.body;

      const updates = [];
      const values = [];

      if (emailNotifications !== undefined) {
        updates.push('email_notifications = ?');
        values.push(emailNotifications ? 1 : 0);
      }
      if (theme !== undefined) {
        updates.push('theme = ?');
        values.push(theme);
      }
      if (hoursPerDay !== undefined) {
        updates.push('hours_per_day = ?');
        values.push(hoursPerDay);
      }
      if (studyDays !== undefined) {
        updates.push('study_days = ?');
        values.push(JSON.stringify(studyDays));
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhuma preferência para atualizar',
        });
      }

      values.push(userId);

      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values,
      );

      res.json({
        success: true,
        message: 'Preferências atualizadas com sucesso',
      });
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar preferências',
        error: error.message,
      });
    }
  },

  // Exportar dados do usuário
  exportarDados: async (req, res) => {
    try {
      const userId = req.params.userId;

      // Buscar todos os dados do usuário
      const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [
        userId,
      ]);

      const [simulados] = await pool.query(
        'SELECT * FROM simulados WHERE user_id = ?',
        [userId],
      );

      const [planos] = await pool.query(
        'SELECT * FROM study_plans WHERE user_id = ?',
        [userId],
      );

      const dadosExportacao = {
        usuario: users[0],
        simulados: simulados,
        planosEstudo: planos,
        dataExportacao: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: dadosExportacao,
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar dados',
        error: error.message,
      });
    }
  },

  // Excluir conta
  excluirConta: async (req, res) => {
    try {
      const userId = req.params.userId;
      const { senha, confirmacao } = req.body;

      if (confirmacao !== 'EXCLUIR MINHA CONTA') {
        return res.status(400).json({
          success: false,
          message: 'Confirmação incorreta',
        });
      }

      // Verificar senha
      const [users] = await pool.query(
        'SELECT password FROM users WHERE id = ?',
        [userId],
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      const senhaCorreta = await bcrypt.compare(senha, users[0].password);

      if (!senhaCorreta) {
        return res.status(401).json({
          success: false,
          message: 'Senha incorreta',
        });
      }

      // Excluir conta (CASCADE vai deletar dados relacionados)
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);

      res.json({
        success: true,
        message: 'Conta excluída com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir conta',
        error: error.message,
      });
    }
  },
};

module.exports = configurationsController;
