const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./src/config/database');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Rotas
console.log('📌 Carregando rotas de autenticação...');
try {
  const authRoutes = require('./src/routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✅ Rotas de autenticação carregadas');
} catch (error) {
  console.error('❌ Erro ao carregar rotas:', error.message);
}

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SempreAprender API está funcionando!',
    timestamp: new Date().toISOString(),
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Testar conexão com banco
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
