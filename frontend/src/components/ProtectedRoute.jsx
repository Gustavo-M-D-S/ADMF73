import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchCSRFToken } from '../services/api';

const ProtectedRoute = ({ children, requireCSRF = true }) => {
  const { isAuthenticated, loading } = useAuth();
  const [csrfReady, setCsrfReady] = useState(!requireCSRF);

  useEffect(() => {
    const initCSRF = async () => {
      if (requireCSRF && isAuthenticated) {
        try {
          await fetchCSRFToken();
          setCsrfReady(true);
        } catch (error) {
          console.error('Failed to initialize CSRF:', error);
          setCsrfReady(false);
        }
      }
    };

    initCSRF();
  }, [isAuthenticated, requireCSRF]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireCSRF && !csrfReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando segurança...</p>
          <p className="text-sm text-gray-500">Por favor, aguarde</p>
        </div>
      </div>
    );
  }

  return children || <Outlet />;
};

export default ProtectedRoute;