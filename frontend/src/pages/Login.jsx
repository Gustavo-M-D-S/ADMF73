import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaLinkedin } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      showToast('Login realizado com sucesso!', 'success');
      navigate('/dashboard');
    } else {
      showToast(result.error, 'error');
    }

    setLoading(false);
  };

  const handleSocialLogin = (provider) => {
    showToast(`Login com ${provider} em desenvolvimento`, 'info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white">Closet.IA</h1>
          <p className="text-primary-100 mt-2">inteligência que veste você</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou continue com</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-4">
            <button
              onClick={() => handleSocialLogin('Google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <FcGoogle className="text-xl" />
              <span>Continuar com Google</span>
            </button>

            <button
              onClick={() => handleSocialLogin('Apple')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <FaApple className="text-xl text-gray-800" />
              <span>Continuar com Apple</span>
            </button>

            <button
              onClick={() => handleSocialLogin('LinkedIn')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <FaLinkedin className="text-xl text-blue-700" />
              <span>Continuar com LinkedIn</span>
            </button>
          </div>

          {/* Value Proposition */}
          <div className="mt-8 p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-800 text-center">
              <span className="font-semibold">Organize seu guarda-roupa,</span><br />
              crie looks inteligentes e compre melhor.
            </p>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Não tem conta?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Criar conta gratuitamente
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;