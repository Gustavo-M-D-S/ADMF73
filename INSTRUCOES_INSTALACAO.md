# 📦 Instruções de Instalação - Closet.IA

## 🎯 Visão Geral

Este arquivo contém as instruções completas para instalar e executar o projeto **Closet.IA**, uma plataforma de personal styling com inteligência artificial que implementa autenticação JWT e proteção CSRF.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **npm** ou **yarn** - Incluído com Node.js
- **Git** (opcional) - Para clonar o repositório

## 🚀 Instalação Rápida (Recomendado)

### Passo 1: Extrair o Arquivo ZIP

```bash
# Extrair o arquivo closet-ia-final.zip
unzip closet-ia-final.zip
cd closet-ia
```

### Passo 2: Executar Script de Instalação

```bash
# Tornar o script executável (Linux/Mac)
chmod +x setup.sh

# Executar o script
./setup.sh
```

O script automaticamente:
- ✅ Cria ambiente virtual Python
- ✅ Instala dependências do backend
- ✅ Instala dependências do frontend
- ✅ Gera chaves secretas seguras
- ✅ Configura arquivos .env

## 🔧 Instalação Manual

Se preferir instalar manualmente ou o script automático não funcionar:

### Backend

```bash
# Navegar para o diretório do backend
cd backend

# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Copiar arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# IMPORTANTE: Editar o arquivo .env e alterar as chaves secretas
# Gerar chaves seguras com:
openssl rand -hex 32  # Para SECRET_KEY
openssl rand -hex 32  # Para CSRF_SECRET_KEY
```

### Frontend

```bash
# Navegar para o diretório do frontend
cd frontend

# Instalar dependências
npm install

# Copiar arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# Editar .env se necessário (padrão já está configurado)
```

## ▶️ Executando a Aplicação

### Opção 1: Executar Backend e Frontend Separadamente

#### Terminal 1 - Backend

```bash
cd closet-ia/backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```

O backend estará disponível em:
- **API**: http://localhost:8000
- **Documentação**: http://localhost:8000/api/docs

#### Terminal 2 - Frontend

```bash
cd closet-ia/frontend
npm run dev
```

O frontend estará disponível em:
- **Aplicação**: http://localhost:5173

### Opção 2: Usar Docker (Recomendado para Produção)

```bash
# Na raiz do projeto
docker-compose up --build

# Para parar
docker-compose down
```

## 🔐 Configuração de Segurança

### Variáveis de Ambiente Importantes

#### Backend (.env)

```env
# ALTERAR EM PRODUÇÃO!
SECRET_KEY=<sua-chave-jwt-secreta-aqui>
CSRF_SECRET_KEY=<sua-chave-csrf-secreta-aqui>

# Banco de dados
DATABASE_URL=sqlite:///./closset.db

# Modo debug (false em produção)
DEBUG=true

# Origens permitidas (ajustar conforme necessário)
CORS_ORIGINS=["http://localhost:5173"]
```

#### Frontend (.env)

```env
# URL da API
VITE_API_URL=http://localhost:8000

# Nome da aplicação
VITE_APP_NAME=Closet.IA
```

### Gerar Chaves Seguras

```bash
# Gerar SECRET_KEY
openssl rand -hex 32

# Gerar CSRF_SECRET_KEY
openssl rand -hex 32
```

Copie as chaves geradas e cole no arquivo `.env` do backend.

## 🧪 Testando a Aplicação

### 1. Acessar a Aplicação

Abra o navegador e acesse: http://localhost:5173

### 2. Criar uma Conta

- Clique em "Criar conta gratuitamente"
- Preencha os dados:
  - Nome de usuário
  - E-mail
  - Senha (mínimo 8 caracteres)
- Clique em "Criar conta"

### 3. Fazer Login

Use as credenciais criadas para fazer login.

### 4. Explorar as Funcionalidades

Após o login, você terá acesso às 7 telas principais:

1. **Dashboard** - Visão geral
2. **Meu Guarda-Roupa** - Upload e gerenciamento de roupas
3. **Looks Inteligentes** - Sugestões de looks baseadas em IA
4. **Chat com IA** - Assistente de estilo conversacional
5. **Compras Inteligentes** - Recomendações de compras
6. **Minhas Cores** - Análise de paleta pessoal
7. **Perfil** - Configurações e preferências

## 📁 Estrutura do Projeto

```
closet-ia/
├── backend/                    # Backend FastAPI
│   ├── app.py                 # Aplicação principal
│   ├── config.py              # Configurações
│   ├── database.py            # Configuração do banco
│   ├── models.py              # Modelos de dados
│   ├── security.py            # JWT e CSRF
│   ├── requirements.txt       # Dependências Python
│   ├── services/
│   │   └── recommendation_engine.py  # Engine de IA
│   └── uploads/               # Diretório de uploads
├── frontend/                   # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── contexts/          # Contextos React
│   │   └── services/          # Serviços (API)
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml         # Configuração Docker
├── setup.sh                   # Script de instalação
├── README.md                  # Documentação principal
└── README_SECURITY.md         # Documentação de segurança
```

## 🐛 Resolução de Problemas

### Erro: "Port 8000 already in use"

```bash
# Encontrar processo usando a porta
lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# Matar o processo ou usar outra porta
# Editar app.py e alterar a porta
```

### Erro: "Module not found"

```bash
# Reinstalar dependências do backend
cd backend
pip install -r requirements.txt

# Reinstalar dependências do frontend
cd frontend
npm install
```

### Erro: "CSRF token missing"

Certifique-se de que:
1. O backend está rodando
2. As variáveis de ambiente estão configuradas
3. O CSRF_SECRET_KEY está definido no .env

### Erro: "Database locked"

```bash
# Remover banco de dados e recriar
cd backend
rm closset.db
python app.py  # Recria automaticamente
```

## 📚 Documentação Adicional

- **README.md** - Documentação completa do projeto
- **README_SECURITY.md** - Guia de segurança detalhado
- **API Docs** - http://localhost:8000/api/docs (quando o backend estiver rodando)

## 🔗 Recursos Úteis

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 💡 Dicas

### Desenvolvimento

- Use `DEBUG=true` no .env do backend para ver logs detalhados
- Acesse http://localhost:8000/api/docs para testar a API interativamente
- Use React DevTools para debugar o frontend

### Produção

- Configure `DEBUG=false`
- Use PostgreSQL ou MySQL ao invés de SQLite
- Configure HTTPS com certificados SSL
- Use um servidor de produção (Gunicorn, Nginx)
- Configure rate limiting com Redis

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do backend e frontend
2. Consulte a documentação de segurança
3. Verifique se todas as dependências estão instaladas
4. Certifique-se de que as portas 8000 e 5173 estão livres

## ✅ Checklist de Instalação

- [ ] Python 3.8+ instalado
- [ ] Node.js 16+ instalado
- [ ] Arquivo ZIP extraído
- [ ] Dependências do backend instaladas
- [ ] Dependências do frontend instaladas
- [ ] Arquivos .env configurados
- [ ] Chaves secretas alteradas
- [ ] Backend rodando na porta 8000
- [ ] Frontend rodando na porta 5173
- [ ] Conta de usuário criada
- [ ] Login realizado com sucesso

---

**Closet.IA** - Inteligência que veste você 👔✨

Versão: 1.0.0  
Data: Janeiro 2026
