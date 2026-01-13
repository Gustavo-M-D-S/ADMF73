import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ClothingItemCard from '../components/ClothingItemCard';
import OutfitRecommendation from '../components/OutfitRecommendation';
import ImageUploader from '../components/ImageUploader';
import { 
  Plus, Filter, Grid, List, Calendar, TrendingUp, 
  PieChart, RefreshCw, ChevronRight 
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('closet');
  const [closetItems, setClosetItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    categories: {},
    mostWorn: null,
    recentAdditions: []
  });
  
  // Buscar dados iniciais
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simular API calls
      const closetRes = await fetch('/api/closet');
      const recRes = await fetch('/api/recommendations');
      const statsRes = await fetch('/api/stats');
      
      const closetData = await closetRes.json();
      const recData = await recRes.json();
      const statsData = await statsRes.json();
      
      setClosetItems(closetData.items || []);
      setRecommendations(recData.recommendations || []);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meu Guarda-Roupa Digital</h1>
        <p className="text-gray-600 mt-2">Gerencie suas peças e descubra novas combinações</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de peças</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <Grid className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categorias</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.categories).length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <PieChart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Looks sugeridos</p>
              <p className="text-2xl font-bold text-gray-900">{recommendations.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Próximos eventos</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'closet', label: 'Guarda-Roupa', icon: Grid },
              { id: 'recommendations', label: 'Recomendações', icon: TrendingUp },
              { id: 'upload', label: 'Adicionar Peça', icon: Plus },
              { id: 'calendar', label: 'Calendário', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${activeTab === tab.id 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Conteúdo das Tabs */}
      <div className="space-y-8">
        {activeTab === 'closet' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Minhas peças</h2>
              <div className="flex space-x-2">
                <button className="p-2 rounded-lg border hover:bg-gray-50">
                  <Filter className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg border hover:bg-gray-50">
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {closetItems.map((item) => (
                <ClothingItemCard
                  key={item.id}
                  item={item}
                  onSelect={() => router.push(`/item/${item.id}`)}
                />
              ))}
              
              {closetItems.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-4xl mb-4">👕</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Guarda-roupa vazio</h3>
                  <p className="text-gray-600 mb-6">Comece adicionando suas peças favoritas</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar primeira peça
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'recommendations' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Looks sugeridos para você</h2>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Atualizar</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((outfit, index) => (
                <OutfitRecommendation
                  key={index}
                  outfit={outfit}
                  onSave={(outfit) => {
                    console.log('Salvar outfit:', outfit);
                  }}
                  onWear={(outfit) => {
                    console.log('Usar outfit:', outfit);
                  }}
                />
              ))}
              
              {recommendations.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-4xl mb-4">🎨</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma recomendação ainda</h3>
                  <p className="text-gray-600 mb-6">Adicione mais peças ao seu guarda-roupa para receber sugestões</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar mais peças
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Adicionar nova peça</h2>
              <p className="text-gray-600 mb-8">Faça upload de uma foto da sua roupa para adicioná-la ao guarda-roupa digital</p>
              
              <ImageUploader 
                onUpload={handleUpload}
                category="top"
                loading={false}
              />
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select className="w-full p-3 border rounded-lg">
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="dress">Vestido</option>
                    <option value="outerwear">Casaco</option>
                    <option value="shoes">Calçados</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor principal
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: Azul marinho"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <button className="px-6 py-3 border rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Adicionar ao guarda-roupa
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Dica: Tire fotos com fundo neutro para melhor reconhecimento
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}