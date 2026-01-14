# 🔐 Closet.IA - Documentação de Segurança

## Visão Geral

Este documento descreve as funcionalidades de segurança implementadas no Closet.IA, incluindo autenticação JWT, proteção CSRF e outras medidas de segurança.

## 🛡️ Funcionalidades de Segurança

### 1. Autenticação e Autorização

#### JWT Tokens
- **Access Tokens**: Tokens de curta duração (30 minutos padrão) para autenticação de requisições
- **Refresh Tokens**: Tokens de longa duração (7 dias padrão) para renovação automática
- **Session Management**: Rastreamento de sessões ativas por usuário
- **Token Revocation**: Capacidade de invalidar tokens específicos

#### Estrutura do Token JWT
```json
{
  "sub": "user_id",
  "exp": 1234567890,
  "iat": 1234567890,
  "jti": "unique_token_id",
  "type": "access"
}
```

### 2. Proteção CSRF

#### CSRF Tokens
- **Geração**: Token único gerado para cada sessão de usuário
- **Validação**: Verificado em todas as requisições que modificam estado (POST, PUT, DELETE, PATCH)
- **Expiração**: Tokens expiram após 1 hora (configurável)
- **HMAC**: Assinatura HMAC-SHA256 para prevenir adulteração

#### Fluxo de Proteção CSRF
1. Cliente faz login e recebe CSRF token
2. Cliente inclui token no header `X-CSRF-Token` em requisições
3. Backend valida token antes de processar requisição
4. Token é renovado periodicamente

#### Implementação no Frontend
```javascript
// Incluir CSRF token em requisições
axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
```

### 3. Segurança de Requisições

#### Rate Limiting
- **Limite**: 60 requisições por minuto por IP (configurável)
- **Implementação**: Rate limiter em memória (desenvolvimento)
- **Produção**: Recomendado usar Redis ou similar

#### Validação de Origem
- **Origin Check**: Verifica header `Origin` e `Referer`
- **CORS**: Configurado para aceitar apenas origens permitidas
- **Whitelist**: Lista de origens permitidas em variáveis de ambiente

#### Headers de Segurança
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 4. Proteção de Dados

#### Hash de Senhas
- **Algoritmo**: bcrypt com salt automático
- **Rounds**: 12 rounds (padrão)
- **Truncamento**: Senhas limitadas a 72 bytes (limitação do bcrypt)

```python
def get_password_hash(password: str) -> str:
    encoded = password.encode('utf-8')[:72]
    return pwd_context.hash(encoded)
```

#### Prevenção de SQL Injection
- **ORM**: SQLAlchemy com queries parametrizadas
- **Validação**: Pydantic para validação de entrada
- **Sanitização**: Escape automático de caracteres especiais

#### Segurança de Upload
- **Validação de Tipo**: Apenas imagens permitidas (JPEG, PNG, WebP, GIF)
- **Validação de Tamanho**: Limite de 10MB por arquivo
- **Nome de Arquivo**: UUID gerado para evitar path traversal
- **Processamento**: Validação adicional via Pillow

## 🔧 Configuração

### Variáveis de Ambiente

#### Backend (.env)
```env
# Chaves de segurança (ALTERAR EM PRODUÇÃO!)
SECRET_KEY=<chave-jwt-secreta>
CSRF_SECRET_KEY=<chave-csrf-secreta>

# Banco de dados
DATABASE_URL=sqlite:///./closset.db

# Segurança
DEBUG=false
CORS_ORIGINS=["https://closset.ia"]

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
```

### Gerar Chaves Seguras

```bash
# Gerar chave JWT
openssl rand -hex 32

# Gerar chave CSRF
openssl rand -hex 32
```

## 🚀 Checklist de Segurança para Produção

### Antes do Deploy

- [ ] Alterar todas as chaves secretas padrão
- [ ] Habilitar HTTPS (SSL/TLS)
- [ ] Configurar `DEBUG=false`
- [ ] Configurar origens CORS corretas
- [ ] Usar banco de dados PostgreSQL/MySQL
- [ ] Configurar rate limiting com Redis
- [ ] Habilitar logging de segurança
- [ ] Configurar monitoramento e alertas
- [ ] Realizar audit de segurança
- [ ] Configurar backups automáticos

### Configuração SSL/TLS

#### Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name closset.ia;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

## 🐛 Testes de Segurança

### Testes Manuais

#### 1. Proteção CSRF
```bash
# Tentar submeter formulário sem CSRF token
curl -X POST http://localhost:8000/api/profile \
  -H "Authorization: Bearer <token>" \
  -d '{"style_preference": "modern"}'
# Esperado: 403 Forbidden
```

#### 2. Rate Limiting
```bash
# Enviar múltiplas requisições rápidas
for i in {1..100}; do
  curl http://localhost:8000/api/profile
done
# Esperado: 429 Too Many Requests após limite
```

#### 3. XSS Prevention
```bash
# Tentar injetar script em campo de entrada
curl -X POST http://localhost:8000/api/profile \
  -H "Authorization: Bearer <token>" \
  -H "X-CSRF-Token: <csrf>" \
  -d '{"gender": "<script>alert(1)</script>"}'
# Esperado: Input sanitizado ou rejeitado
```

### Testes Automatizados

```bash
# Instalar ferramentas de teste
pip install bandit safety pytest

# Executar análise de segurança
bandit -r backend/

# Verificar vulnerabilidades em dependências
safety check

# Executar testes de segurança
pytest backend/tests/test_security.py
```

### Auditoria Frontend

```bash
# Audit de dependências npm
npm audit

# Fix vulnerabilidades automáticas
npm audit fix
```

## 📞 Resposta a Incidentes de Segurança

### Template de Relatório

```
1. Resumo do Incidente
   - Descrição breve do problema

2. Data/Hora da Descoberta
   - Quando o incidente foi identificado

3. Sistemas Afetados
   - Quais componentes foram impactados

4. Avaliação de Impacto
   - Severidade: Crítico/Alto/Médio/Baixo
   - Dados comprometidos
   - Usuários afetados

5. Ações Imediatas Tomadas
   - Medidas de contenção

6. Análise de Causa Raiz
   - Como o incidente ocorreu

7. Passos de Remediação
   - Como o problema foi corrigido

8. Medidas de Prevenção
   - Como prevenir recorrência
```

### Contatos de Emergência

- **Equipe de Segurança**: security@closset.ia
- **Infraestrutura**: infra@closset.ia
- **Jurídico**: legal@closset.ia

## 📚 Conformidade e Padrões

### OWASP Top 10 (2021)

| Risco | Proteção Implementada |
|-------|----------------------|
| A01: Broken Access Control | JWT + Session management |
| A02: Cryptographic Failures | bcrypt + HTTPS |
| A03: Injection | SQLAlchemy ORM + validação |
| A04: Insecure Design | Security by design |
| A05: Security Misconfiguration | Defaults seguros |
| A06: Vulnerable Components | Dependências atualizadas |
| A07: Authentication Failures | JWT + MFA ready |
| A08: Data Integrity Failures | CSRF + HMAC |
| A09: Logging Failures | Logging estruturado |
| A10: SSRF | Validação de URLs |

### Conformidade com Leis

#### LGPD (Lei Geral de Proteção de Dados)
- ✅ Consentimento explícito para coleta de dados
- ✅ Direito ao esquecimento (deleção de conta)
- ✅ Portabilidade de dados (export JSON)
- ✅ Criptografia de dados sensíveis
- ✅ Notificação de incidentes

#### GDPR (General Data Protection Regulation)
- ✅ Minimização de dados coletados
- ✅ Pseudonimização de dados
- ✅ Direito de acesso aos dados
- ✅ Direito de retificação
- ✅ Privacy by design

## 🔄 Manutenção de Segurança

### Atualizações Regulares

```bash
# Backend - atualizar dependências
pip list --outdated
pip install --upgrade <package>

# Frontend - atualizar dependências
npm outdated
npm update
```

### Monitoramento Contínuo

- **Logs de Acesso**: Monitorar tentativas de login
- **Logs de Erro**: Identificar padrões suspeitos
- **Métricas**: Tempo de resposta, taxa de erro
- **Alertas**: Configurar alertas para eventos críticos

### Revisão de Código

- **Code Review**: Revisão por pares obrigatória
- **Security Review**: Revisão de segurança trimestral
- **Penetration Testing**: Testes de penetração anuais

## 📖 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [LGPD](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [GDPR](https://gdpr.eu/)

---

**Última atualização**: Janeiro 2026  
**Versão**: 1.0.0
