@echo off
echo.
echo 🚀 Iniciando setup do Closset.IA MVP...
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado. Instale Python 3.8+ em: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado. Instale Node.js 18+ em: https://nodejs.org/
    pause
    exit /b 1
)

echo 📦 Configurando backend...
echo.

REM Criar ambiente virtual do Python
cd backend
if not exist "venv" (
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Erro ao criar ambiente virtual
        pause
        exit /b 1
    )
)

REM Ativar venv e instalar dependências
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Erro ao ativar ambiente virtual
    pause
    exit /b 1
)

pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências do Python
    pause
    exit /b 1
)

REM Criar pasta de uploads
if not exist "uploads" mkdir uploads
if not exist "processed" mkdir processed

REM Inicializar banco de dados
python -c "from database import init_db; init_db(); print('✅ Banco de dados inicializado')"

deactivate
cd ..

echo.
echo 🌐 Configurando frontend web...
echo.

cd frontend\web-app
npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências do Node.js
    pause
    exit /b 1
)
cd ..\..

echo.
echo ✅ Setup concluído com sucesso!
echo.
echo =====================================================
echo Para iniciar o sistema:
echo.
echo 1. Iniciar Backend:
echo    cd backend
echo    venv\Scripts\activate
echo    python app.py
echo.
echo 2. Iniciar Frontend Web:
echo    cd frontend\web-app
echo    npm run dev
echo.
echo 3. Acessar aplicação:
echo    🌐 http://localhost:3000
echo    🔗 API: http://localhost:8000/docs
echo =====================================================
echo.
pause