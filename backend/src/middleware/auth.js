const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rotas
exports.protect = async (req, res, next) => {
  let token;

  // Verificar se o token está no header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar se o token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acesso não autorizado. Token não fornecido.',
    });
  }

  try {
    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado',
    });
  }
};
