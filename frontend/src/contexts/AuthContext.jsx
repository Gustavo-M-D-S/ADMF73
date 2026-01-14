import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, fetchCSRFToken } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  // Inicializar CSRF token
  useEffect(() => {
    const initCSRF = async () => {
      await fetchCSRFToken();
    };
    initCSRF();
  }, []);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Buscar dados do usuário
          const response = await api.get('/api/profile');
          setUser(response.data);

          // Buscar sessões ativas
          const sessionsResponse = await authService.getSessions();
          setSessions(sessionsResponse.sessions || []);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Limpar tokens inválidos
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('csrf_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);

      // Buscar dados do usuário
      const userResponse = await api.get('/api/profile');
      setUser(userResponse.data);

      // Buscar sessões
      const sessionsResponse = await authService.getSessions();
      setSessions(sessionsResponse.sessions || []);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao fazer login'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const data = await authService.register(username, email, password);

      // Buscar dados do usuário
      const userResponse = await api.get('/api/profile');
      setUser(userResponse.data);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao registrar'
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSessions([]);
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      await authService.revokeSession(sessionId);
      // Atualizar lista de sessões
      const sessionsResponse = await authService.getSessions();
      setSessions(sessionsResponse.sessions || []);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/profile', profileData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao atualizar perfil'
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      sessions,
      loading,
      login,
      register,
      logout,
      revokeSession,
      updateProfile,
      isAuthenticated: !!localStorage.getItem('access_token')
    }}>
      {children}
    </AuthContext.Provider>
  );
};