import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, 
  FiGrid, 
  FiStar, 
  FiMessageSquare,
  FiShoppingBag,
  FiPalette,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiHome /> },
    { name: 'Meu Guarda-Roupa', path: '/closet', icon: <FiGrid /> },
    { name: 'Looks Inteligentes', path: '/looks', icon: <FiStar /> },
    { name: 'Chat com IA', path: '/chat', icon: <FiMessageSquare /> },
    { name: 'Compras Inteligentes', path: '/shopping', icon: <FiShoppingBag /> },
    { name: 'Minhas Cores', path: '/colors', icon: <FiPalette /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="font-bold text-gray-900">Closet.IA</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <FiX className="text-gray-500" />
              </button>
            </div>
            <nav className="p-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg mb-2 ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3 font-medium">{item.name}</span>
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t">
                <div className="flex items-center px-4 py-3">
                  <FiUser className="text-gray-400" />
                  <span className="ml-3 text-gray-700 font-medium">{user?.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <FiLogOut className="mr-3" />
                  Sair
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold">C</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Closet.IA</h1>
              <p className="text-xs text-gray-500">inteligência que veste você</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition ${
                  location.pathname === item.path
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center px-4 py-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 mt-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <FiLogOut className="mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 lg:hidden bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 h-16">
            <button onClick={() => setMobileMenuOpen(true)}>
              <FiMenu className="text-gray-500 text-xl" />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="font-bold text-gray-900">Closet.IA</span>
            </div>
            <div className="w-8"></div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
