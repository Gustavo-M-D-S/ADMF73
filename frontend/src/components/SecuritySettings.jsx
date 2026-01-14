import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  FiShield,
  FiLogOut,
  FiGlobe,
  FiClock,
  FiCheck,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';
import { format } from 'date-fns';

const SecuritySettings = () => {
  const { sessions, revokeSession } = useAuth();
  const { showToast } = useToast();
  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    if (sessions) {
      const active = sessions.filter(s => s.is_active);
      setActiveSessions(active);
    }
  }, [sessions]);

  const handleRevokeSession = async (sessionId) => {
    const result = await revokeSession(sessionId);
    if (result.success) {
      showToast('Sessão revogada com sucesso', 'success');
    } else {
      showToast(result.error, 'error');
    }
  };

  const getDeviceInfo = (session) => {
    const ua = session.user_agent || '';
    if (ua.includes('Mobile')) return 'Celular';
    if (ua.includes('Tablet')) return 'Tablet';
    return 'Computador';
  };

  const getLocationInfo = (session) => {
    return session.location || 'Localização não disponível';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center mb-6">
        <FiShield className="text-2xl text-primary-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Segurança da Conta</h2>
      </div>

      {/* Sessões Ativas */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sessões Ativas</h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {activeSessions.length} ativa(s)
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FiGlobe className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma sessão ativa</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-2">
                      <FiGlobe className="text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">
                        {getDeviceInfo(session)}
                      </span>
                      {session.ip_address === window.location.hostname && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                          Esta sessão
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiClock className="mr-2" />
                        <span>Iniciada: {formatDateTime(session.created_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <FiGlobe className="mr-2" />
                        <span>IP: {session.ip_address}</span>
                      </div>
                      <div>
                        <span>Localização: {getLocationInfo(session)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {session.ip_address !== window.location.hostname && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition flex items-center"
                      >
                        <FiLogOut className="mr-1" />
                        Revogar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações de Segurança */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Segurança</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <FiShield className="text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-900">Proteção CSRF</h4>
            </div>
            <p className="text-sm text-blue-700">
              Tokens CSRF são gerados para cada sessão e validados em todas as requisições.
            </p>
            <div className="flex items-center mt-2">
              <FiCheck className="text-green-600 mr-1" />
              <span className="text-sm text-green-700">Ativo</span>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-2">
              <FiShield className="text-green-600 mr-2" />
              <h4 className="font-medium text-green-900">Tokens JWT</h4>
            </div>
            <p className="text-sm text-green-700">
              Tokens de acesso com expiração curta e tokens de refresh para renovação.
            </p>
            <div className="flex items-center mt-2">
              <FiCheck className="text-green-600 mr-1" />
              <span className="text-sm text-green-700">Ativo</span>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center mb-2">
              <FiShield className="text-purple-600 mr-2" />
              <h4 className="font-medium text-purple-900">Rate Limiting</h4>
            </div>
            <p className="text-sm text-purple-700">
              Limite de requisições por minuto para prevenir ataques de força bruta.
            </p>
            <div className="flex items-center mt-2">
              <FiCheck className="text-green-600 mr-1" />
              <span className="text-sm text-green-700">Ativo</span>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center mb-2">
              <FiAlertTriangle className="text-yellow-600 mr-2" />
              <h4 className="font-medium text-yellow-900">Validação de Origem</h4>
            </div>
            <p className="text-sm text-yellow-700">
              Verificação de origem das requisições para prevenir ataques CSRF.
            </p>
            <div className="flex items-center mt-2">
              <FiCheck className="text-green-600 mr-1" />
              <span className="text-sm text-green-700">Ativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dicas de Segurança */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Dicas de Segurança</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <FiCheck className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Revogue sessões em dispositivos que você não reconhece</span>
          </li>
          <li className="flex items-start">
            <FiCheck className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Use senhas fortes e únicas para sua conta</span>
          </li>
          <li className="flex items-start">
            <FiCheck className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Faça logout sempre que usar dispositivos compartilhados</span>
          </li>
          <li className="flex items-start">
            <FiCheck className="text-green-600 mr-2 mt=0.5 flex-shrink-0" />
            <span>Mantenha seu navegador e sistema operacional atualizados</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SecuritySettings;