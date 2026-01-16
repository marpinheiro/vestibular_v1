const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Gerar JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, vestibular } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios',
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    // Validar senha
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter no mínimo 6 caracteres',
      });
    }

    // Verificar se email já existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado',
      });
    }

    // Criar usuário
    const user = await User.create({ name, email, password, vestibular });

    // Gerar token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          vestibular: user.vestibular,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cadastrar usuário',
      error: error.message,
    });
  }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe email e senha',
      });
    }

    // Buscar usuário
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos',
      });
    }

    // Validar senha
    const isPasswordValid = await User.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos',
      });
    }

    // Gerar token
    const token = generateToken(user.id);

    // Remover senha do retorno
    delete user.password;

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          vestibular: user.vestibular,
          level: user.level,
          xp: user.xp,
          coins: user.coins,
          streak_days: user.streak_days,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login',
      error: error.message,
    });
  }
};

// @desc    Obter dados do usuário logado
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário',
      error: error.message,
    });
  }
};
