import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { 
  FiUpload, 
  FiStar, 
  FiShoppingBag, 
  FiMessageSquare,
  FiTrendingUp,
  FiCalendar,
  FiSun
} from 'react-icons/fi';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [dailyOutfit, setDailyOutfit] = useState(null);
  const [weather, setWeather] = useState({ temp: 24, condition: 'Ensolarado' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Busca estatísticas
      const statsResponse = await axios.get('/api/stats');
      setStats(statsResponse.data);

      // Busca look do dia
      const outfitResponse = await axios.get('/api/outfits/daily');
      setDailyOutfit(outfitResponse.data);

    } catch (error) {
      showToast('Erro ao carregar dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Adicionar Roupas',
      description: 'Digitalize novas peças',
      icon: <FiUpload className="text-2xl" />,
      link: '/closet',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Looks Salvos',
      description: 'Veja suas combinações',
      icon: <FiStar className="text-2xl" />,
      link: '/looks',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Compras Inteligentes',
      description: 'Recomendações personalizadas',
      icon: <FiShoppingBag className="text-2xl" />,
      link: '/shopping',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Chat com IA',
      description: 'Peça dicas à stylist',
      icon: <FiMessageSquare className="text-2xl" />,
      link: '/chat',
      color: 'bg-pink-50 text-pink-600'
    }
  ];

  const clothingCategories = [
    { name: 'Partes de Cima', count: stats?.categories?.top || 0, color: 'bg-blue-500' },
    { name: 'Partes de Baixo', count: stats?.categories?.bottom || 0, color: 'bg-green-500' },
    { name: 'Vestidos', count: stats?.categories?.dress || 0, color: 'bg-purple-500' },
    { name: 'Calçados', count: stats?.categories?.shoes || 0, color: 'bg-yellow-500' },
    { name: 'Acessórios', count: stats?.categories?.accessory || 0, color: 'bg-pink-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com Saudação */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Bom dia, {user?.username || 'usuário'}!
            </h1>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center">
                <FiSun className="mr-2" />
                <span>Hoje faz {weather.temp}°C</span>
              </div>
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                <span>{format(new Date(), 'EEEE, d MMMM')}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-sm">Você tem {stats?.saved_outfits || 0} looks salvos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="card hover:scale-[1.02] transition-transform"
            >
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Look do Dia */}
      {dailyOutfit && dailyOutfit.outfits.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Look do Dia</h2>
              <p className="text-gray-600">
                Sugerido para {dailyOutfit.occasion} no clima {dailyOutfit.weather}
              </p>
            </div>
            <button className="btn-primary">
              Ver Alternativo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Look Principal */}
            <div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Look Sugerido</h3>
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {dailyOutfit.outfits[0].items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.category}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-gray-400">Imagem</div>
                        )}
                      </div>
                      <p className="text-xs text-center mt-2">{item.category}</p>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-3 mt-6">
                  <button className="btn-primary flex-1">
                    Salvar Look
                  </button>
                  <button className="btn-secondary flex-1">
                    Ver Peças
                  </button>
                </div>
              </div>
            </div>

            {/* Filtros Rápidos */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Filtros Rápidos</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clima</label>
                  <select className="input-field">
                    <option>Ensolarado</option>
                    <option>Chuvoso</option>
                    <option>Frio</option>
                    <option>Quente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ocasião</label>
                  <select className="input-field">
                    <option>Trabalho</option>
                    <option>Casual</option>
                    <option>Festa</option>
                    <option>Esporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
                  <select className="input-field">
                    <option>Casual</option>
                    <option>Formal</option>
                    <option>Esportivo</option>
                    <option>Criativo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resumo do Guarda-Roupa */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Seu Guarda-Roupa</h2>
          <div className="space-y-4">
            {clothingCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${category.color} mr-3`}></div>
                  <span className="text-gray-700">{category.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">{category.count}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${(category.count / (stats?.total_items || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total de peças</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_items || 0}</p>
              </div>
              <Link to="/closet" className="text-primary-600 hover:text-primary-700 font-semibold">
                Gerenciar →
              </Link>
            </div>
          </div>
        </div>

        {/* Insights da IA */}
        <div className="card">
          <div className="flex items-center mb-4">
            <FiTrendingUp className="text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Insights da IA</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Você usa apenas 40% do seu guarda-roupa.</span>
                {' '}Que tal experimentar novas combinações?
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Economizou R$ 320 este mês</span>
                {' '}evitando compras por impulso.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <span className="font-semibold">5 peças similares detectadas.</span>
                {' '}Considere diversificar seu estilo.
              </p>
            </div>
          </div>
          <button className="w-full mt-6 btn-secondary">
            Ver Análise Completa
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;