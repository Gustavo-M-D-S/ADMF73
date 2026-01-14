import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token management
let csrfToken = localStorage.getItem('csrf_token') || '';

// Interceptor para adicionar token JWT e CSRF
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Adicionar CSRF token para métodos não-GET
    if (config.method !== 'get' && config.method !== 'GET') {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    // Adicionar request ID para tracking
    config.headers['X-Request-ID'] = generateRequestId();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para gerenciar tokens e erros
api.interceptors.response.use(
  (response) => {
    // Salvar novo CSRF token se fornecido
    if (response.data.csrf_token) {
      csrfToken = response.data.csrf_token;
      localStorage.setItem('csrf_token', csrfToken);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se erro 401 (Unauthorized) e não é tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Se for erro de token expirado, tentar refresh
      if (error.response?.data?.detail?.includes('expired') ||
          error.response?.data?.detail?.includes('invalid')) {
        return handleTokenRefresh(originalRequest);
      }

      // Se for CSRF error, tentar obter novo token
      if (error.response?.data?.detail?.includes('CSRF')) {
        await fetchCSRFToken();
        originalRequest._retry = true;
        return api(originalRequest);
      }
    }

    // Se erro 429 (Too Many Requests), aguardar
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 5;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return api(originalRequest);
    }

    // Se erro 403 (Forbidden), limpar tokens
    if (error.response?.status === 403) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('csrf_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Função para lidar com refresh token
async function handleTokenRefresh(originalRequest) {
  try {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Solicitar novos tokens
    const response = await axios.post('/api/auth/refresh', {
      refresh_token: refreshToken
    });

    const { access_token, refresh_token, csrf_token } = response.data;

    // Salvar novos tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('csrf_token', csrf_token);
    csrfToken = csrf_token;

    // Atualizar header da requisição original
    originalRequest.headers.Authorization = `Bearer ${access_token}`;
    originalRequest._retry = true;

    return api(originalRequest);
  } catch (refreshError) {
    // Se refresh falhar, redirecionar para login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('csrf_token');
    window.location.href = '/login';
    return Promise.reject(refreshError);
  }
}

// Função para obter CSRF token inicial
export async function fetchCSRFToken() {
  try {
    const response = await axios.get('/api/auth/csrf');
    csrfToken = response.data.csrf_token;
    localStorage.setItem('csrf_token', csrfToken);
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

// Função para gerar request ID
function generateRequestId() {
  return 'req_' + Math.random().toString(36).substr(2, 9);
}

// Serviços de autenticação
export const authService = {
  login: async (email, password) => {
    const csrfToken = await fetchCSRFToken();

    const response = await api.post('/api/auth/login', {
      email,
      password,
      csrf_token: csrfToken
    });

    const { access_token, refresh_token, csrf_token } = response.data;

    // Salvar tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('csrf_token', csrf_token);
    csrfToken = csrf_token;

    return response.data;
  },

  register: async (username, email, password) => {
    const csrfToken = await fetchCSRFToken();

    const response = await api.post('/api/auth/register', {
      username,
      email,
      password
    }, {
      headers: {
        'X-CSRF-Token': csrfToken
      }
    });

    const { access_token, refresh_token, csrf_token } = response.data;

    // Salvar tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('csrf_token', csrf_token);
    csrfToken = csrf_token;

    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      // Sempre limpar tokens localmente
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('csrf_token');
      csrfToken = '';
    }
  },

  getSessions: async () => {
    const response = await api.get('/api/auth/sessions');
    return response.data;
  },

  revokeSession: async (sessionId) => {
    const response = await api.post(`/api/auth/sessions/${sessionId}/revoke`);
    return response.data;
  }
};

// Serviço para upload de arquivos com validação
export const uploadService = {
  uploadClothingItem: async (file, category, subcategory, color) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (subcategory) formData.append('subcategory', subcategory);
    if (color) formData.append('color', color);

    const response = await api.post('/api/closet/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }
};

// Função para verificar se usuário está autenticado
export function isAuthenticated() {
  const token = localStorage.getItem('access_token');
  return !!token;
}

// Função para obter headers de segurança
export function getSecurityHeaders() {
  return {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'X-CSRF-Token': localStorage.getItem('csrf_token') || '',
    'X-Request-ID': generateRequestId()
  };
}

// Inicializar CSRF token na inicialização
fetchCSRFToken().catch(() => {
  console.log('Initial CSRF token fetch failed - will retry on first request');
});

export default api;