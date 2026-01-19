const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password, vestibular } = req.body;

      // Validações
      if (!name || !email || !password || !vestibular) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios',
        });
      }

      // Verificar se email já existe
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [email],
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email já cadastrado',
        });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Inserir usuário
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password, vestibular) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, vestibular],
      );

      // Buscar usuário criado
      const [users] = await pool.query(
        `SELECT 
          id, name, email, vestibular, 
          subscription_status, subscription_plan_id, subscription_expires_at,
          current_plan_id, level, xp, coins, streak_days
        FROM users WHERE id = ?`,
        [result.insertId],
      );

      const user = users[0];

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'seu-secret-aqui',
        { expiresIn: '7d' },
      );

      res.json({
        success: true,
        data: {
          token,
          user,
        },
      });
    } catch (error) {
      console.error('Erro ao registrar:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar usuário',
      });
    }
  },

  login: async (req, res) => {
    try {
      console.log('🔐 Tentativa de login:', req.body.email);

      const { email, password } = req.body;

      if (!email || !password) {
        console.log('❌ Email ou senha faltando');
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios',
        });
      }

      // Buscar usuário
      console.log('🔍 Buscando usuário no banco:', email);

      const [users] = await pool.query(
        `SELECT 
          id, name, email, password, vestibular,
          subscription_status, subscription_plan_id, subscription_expires_at,
          current_plan_id, level, xp, coins, streak_days,
          hours_per_day, last_study_date, avatar
        FROM users 
        WHERE email = ?`,
        [email],
      );

      if (users.length === 0) {
        console.log('❌ Usuário não encontrado:', email);
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos',
        });
      }

      const user = users[0];
      console.log('✅ Usuário encontrado:', user.id, user.name);

      // Verificar senha
      console.log('🔐 Verificando senha...');
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        console.log('❌ Senha incorreta para:', email);
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos',
        });
      }

      console.log('✅ Senha correta!');

      // Remover senha do objeto
      delete user.password;

      // Gerar token
      console.log('🎫 Gerando token JWT...');
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'seu-secret-aqui',
        { expiresIn: '7d' },
      );

      console.log('✅ Login bem-sucedido! User ID:', user.id);
      console.log('📊 Status do usuário:', {
        id: user.id,
        name: user.name,
        subscription_status: user.subscription_status,
        subscription_plan_id: user.subscription_plan_id,
      });

      res.json({
        success: true,
        data: {
          token,
          user,
        },
      });
    } catch (error) {
      console.error('❌ ERRO NO LOGIN:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer login',
        error: error.message,
      });
    }
  },

  // ✅ NOVO MÉTODO - Retorna dados atualizados do usuário
  getMe: async (req, res) => {
    try {
      const userId = req.user.id;

      console.log('🔍 Buscando dados atualizados do usuário:', userId);

      // Buscar dados completos do banco
      const [users] = await pool.query(
        `SELECT 
          u.id,
          u.name,
          u.email,
          u.vestibular,
          u.subscription_status,
          u.subscription_plan_id,
          u.subscription_expires_at,
          u.current_plan_id,
          u.level,
          u.xp,
          u.coins,
          u.streak_days,
          u.last_study_date,
          u.avatar,
          u.hours_per_day,
          p.name as plan_name,
          p.slug as plan_slug
        FROM users u
        LEFT JOIN plans p ON u.subscription_plan_id = p.id
        WHERE u.id = ?`,
        [userId],
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      const user = users[0];

      console.log('✅ Dados do usuário:', {
        id: user.id,
        name: user.name,
        subscription_status: user.subscription_status,
        subscription_plan_id: user.subscription_plan_id,
        subscription_expires_at: user.subscription_expires_at,
      });

      // Verificar se a assinatura expirou
      if (user.subscription_expires_at) {
        const expiresAt = new Date(user.subscription_expires_at);
        const now = new Date();

        if (expiresAt < now && user.subscription_status === 'premium') {
          console.log('⚠️ Assinatura expirada, atualizando status...');

          await pool.query(
            `UPDATE users 
            SET subscription_status = 'free',
                subscription_plan_id = 1
            WHERE id = ?`,
            [userId],
          );

          user.subscription_status = 'free';
          user.subscription_plan_id = 1;
        }
      }

      // Buscar assinatura ativa
      const [subscriptions] = await pool.query(
        `SELECT 
          s.id,
          s.status,
          s.expires_at,
          s.billing_type,
          s.auto_renew,
          p.name as plan_name
        FROM subscriptions s
        LEFT JOIN plans p ON s.plan_id = p.id
        WHERE s.user_id = ? AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1`,
        [userId],
      );

      res.json({
        success: true,
        data: {
          user: user,
          subscription: subscriptions[0] || null,
        },
      });
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados do usuário',
        error: error.message,
      });
    }
  },
};

module.exports = authController;
