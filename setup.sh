#!/bin/bash

# Setup script for Closet.IA with enhanced security

echo "🚀 Setting up Closet.IA with CSRF and JWT Security..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Create project structure
echo "📁 Creating project structure..."
mkdir -p closset-ia/{backend/{services,uploads},frontend/src/{components,pages,contexts,services}}

# Backend setup
echo "🔧 Setting up backend..."
cd closset-ia/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
echo "🔐 Creating .env file..."
cat > .env << EOL
# Backend Environment Variables
SECRET_KEY=$(openssl rand -hex 32)
CSRF_SECRET_KEY=$(openssl rand -hex 32)

# Database
DATABASE_URL=sqlite:///./closset.db

# Security
DEBUG=true
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Tokens
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CSRF_TOKEN_EXPIRE_SECONDS=3600

# Upload
MAX_UPLOAD_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif

# Rate Limiting
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_PERIOD=60
EOL

echo "✅ Backend setup complete!"

# Frontend setup
echo "🔧 Setting up frontend..."
cd ../frontend

# Initialize npm project
npm init -y

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install react react-dom react-router-dom axios react-icons date-fns
npm install -D @types/react @types/react-dom @vitejs/plugin-react autoprefixer eslint postcss tailwindcss vite

# Create .env file
echo "🔐 Creating frontend .env file..."
cat > .env << EOL
# Frontend Environment Variables
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Closet.IA
VITE_APP_VERSION=1.0.0

# Security
VITE_ENABLE_HTTPS=false
VITE_STRICT_TRANSPORT_SECURITY=true
VITE_CONTENT_SECURITY_POLICY=true

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
EOL

echo "✅ Frontend setup complete!"

# Generate SSL certificates for HTTPS (optional)
echo "🔐 Generating SSL certificates for development..."
cd ../backend
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=Closet.IA/CN=localhost"

echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd closset-ia/backend && source venv/bin/activate && python app.py"
echo "2. Frontend: cd closset-ia/frontend && npm run dev"
echo ""
echo "Access the application at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/api/docs"
echo ""
echo "Demo credentials:"
echo "   Email: demo@closset.com"
echo "   Password: Demo@123"