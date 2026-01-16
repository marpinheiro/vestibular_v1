@echo off
echo ========================================
echo  SETUP VESTIPREP - Iniciando...
echo ========================================
echo.

REM Navegar até o diretório de Projetos
cd /d D:\Estudos\Projetos

REM Criar a estrutura de pastas do projeto
echo [1/10] Criando estrutura de pastas...
mkdir vestibular 2>nul
cd vestibular
mkdir frontend 2>nul
mkdir backend 2>nul

REM ========================================
REM SETUP FRONTEND
REM ========================================
echo.
echo [2/10] Criando projeto React no frontend...
cd frontend
call npx create-react-app . -y

echo.
echo [3/10] Instalando dependencias adicionais do frontend...
call npm install react-router-dom axios

echo.
echo [4/10] Criando estrutura de pastas do frontend...
cd src
mkdir components 2>nul
mkdir pages 2>nul
mkdir services 2>nul
mkdir context 2>nul
mkdir assets 2>nul
mkdir styles 2>nul
cd ..

REM ========================================
REM SETUP BACKEND
REM ========================================
cd ..\backend

echo.
echo [5/10] Inicializando Node.js no backend...
call npm init -y

echo.
echo [6/10] Instalando dependencias do backend...
call npm install express mysql2 dotenv cors bcryptjs jsonwebtoken nodemailer express-validator

echo.
echo [7/10] Instalando dependencias de desenvolvimento...
call npm install --save-dev nodemon

echo.
echo [8/10] Criando estrutura de pastas do backend...
mkdir src 2>nul
cd src
mkdir config 2>nul
mkdir controllers 2>nul
mkdir routes 2>nul
mkdir middleware 2>nul
mkdir models 2>nul
mkdir utils 2>nul
cd ..

echo.
echo [9/10] Criando arquivos de configuracao...

REM Criar .env
(
echo # Server
echo PORT=5000
echo NODE_ENV=development
echo.
echo # Database
echo DB_HOST=localhost
echo DB_USER=root
echo DB_PASSWORD=
echo DB_NAME=vestiprep_db
echo DB_PORT=3306
echo.
echo # JWT
echo JWT_SECRET=seu_secret_key_aqui_mude_isso
echo JWT_EXPIRE=7d
echo.
echo # Email Configuration
echo EMAIL_SERVICE=gmail
echo EMAIL_USER=marpinheirosilva@gmail.com
echo EMAIL_PASSWORD=
echo.
echo # OpenAI API
echo OPENAI_API_KEY=
echo.
echo # Frontend URL
echo FRONTEND_URL=http://localhost:3000
echo.
echo # Logs
echo LOG_LEVEL=info
) > .env

REM Criar .gitignore
(
echo node_modules/
echo .env
echo *.log
echo .DS_Store
echo build/
echo dist/
) > .gitignore

echo.
echo [10/10] Atualizando package.json do backend...

REM Criar server.js basico
(
echo const express = require^('express'^);
echo const cors = require^('cors'^);
echo const dotenv = require^('dotenv'^);
echo.
echo dotenv.config^(^);
echo.
echo const app = express^(^);
echo const PORT = process.env.PORT ^|^| 5000;
echo.
echo // Middlewares
echo app.use^(cors^(^)^);
echo app.use^(express.json^(^)^);
echo.
echo // Rota de teste
echo app.get^('/api/health', ^(req, res^) =^> {
echo   res.json^({ message: 'VestiPrep API funcionando!' }^);
echo }^);
echo.
echo // Iniciar servidor
echo app.listen^(PORT, ^(^) =^> {
echo   console.log^(`Servidor rodando na porta ${PORT}`^);
echo }^);
) > server.js

cd ..\..

echo.
echo ========================================
echo  SETUP CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Estrutura criada em: D:\Estudos\Projetos\vestibular
echo.
echo Proximos passos:
echo 1. Editar backend\.env com suas credenciais
echo 2. Iniciar backend: cd backend ^&^& npm run dev
echo 3. Iniciar frontend: cd frontend ^&^& npm start
echo.
echo Pressione qualquer tecla para sair...
pause >nul