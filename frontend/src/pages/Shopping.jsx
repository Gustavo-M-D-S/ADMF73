import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { 
  FiShoppingBag, 
  FiFilter, 
  FiTrendingUp,
  FiDollarSign,
  FiLeaf,
  FiTag,
  FiAlertCircle
} from 'react-icons/fi';

const Shopping = () => {
  const { showToast } = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    price: 'all',
    sustainable: false,
    brand: 'all'
  });

  const brands = [
    'Todas', 'Zara', 'H&M', 'Renner', 'C&A', 'Shein', 'Nike', 'Adidas', 'Local'
  ];

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/shopping/recommendations');
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      showToast('Erro ao carregar recomendações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filters.price !== 'all') {
      const priceRange = filters.price.split('-');
      const minPrice = parseInt(priceRange[0]);
      const maxPrice = priceRange[1] === 'plus' ? Infinity : parseInt(priceRange[1]);
      // Simular preço
      const simulatedPrice = Math.floor(Math.random() * 500) + 50;
      if (simulatedPrice < minPrice || simulatedPrice > maxPrice) return false;
    }
    
    if (filters.sustainable && !rec.is_sustainable) return false;
    
    if (filters.brand !== 'all' && rec.brand !== filters.brand) return false;
    
    return true;
  });

  const getSimulatedPrice = () => {
    return Math.floor(Math.random() * 500) + 50;
  };

  const getSustainabilityScore = () => {
    return Math.floor(Math.random() * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
        <div className="flex items-center">
          <FiShoppingBag className="text-3xl mr-4" />
          <div>
            <h1 className="text-3xl font-bold">Compras Inteligentes</h1>
            <p className="text-primary-100 mt-2">
              Recomendações baseadas nas lacunas do seu guarda-roupa
            </p>
          </div>
        </div>
      </div>

      {/* Transparent Warning */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <FiAlertCircle className="text-blue-600 mr-3 mt-1 flex-shrink-0" />
          <div>
            <p className="text-blue-800 font-medium mb-2">
              Consumo consciente ativado
            </p>
            <p className="text-blue-700">
              <span className="font-semibold">Recomendação baseada no seu guarda-roupa atual.</span>
              {' '}Evitamos sugerir peças similares às que você já possui.
            </p>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          O que vale a pena comprar agora
        </h2>
        <div className="flex items-center text-gray-600">
          <FiFilter className="mr-2" />
          <span>Filtros</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center">
                <FiDollarSign className="mr-2" />
                Preço
              </div>
            </label>
            <div className="space-y-2">
              {[
                { id: 'all', label: 'Todos os preços' },
                { id: '0-100', label: 'Até R$ 100' },
                { id: '100-300', label: 'R$ 100 - 300' },
                { id: '300-500', label: 'R$ 300 - 500' },
                { id: '500-plus', label: 'Acima de R$ 500' }
              ].map(option => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`price-${option.id}`}
                    name="price"
                    value={option.id}
                    checked={filters.price === option.id}
                    onChange={(e) => handleFilterChange('price', e.target.value)}
                    className="h-4 w-4 text-primary-600"
                  />
                  <label htmlFor={`price-${option.id}`} className="ml-2 text-gray-700">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sustainability Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center">
                <FiLeaf className="mr-2" />
                Sustentabilidade
              </div>
            </label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sustainable"
                  checked={filters.sustainable}
                  onChange={(e) => handleFilterChange('sustainable', e.target.checked)}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="sustainable" className="ml-2 text-gray-700">
                  Apenas marcas sustentáveis
                </label>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  Marcas sustentáveis possuem processos ecológicos e condições de trabalho justas
                </p>
              </div>
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center">
                <FiTag className="mr-2" />
                Marcas
              </div>
            </label>
            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="input-field"
            >
              {brands.map(brand => (
                <option key={brand} value={brand === 'Todas' ? 'all' : brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Recomendações Personalizadas ({filteredRecommendations.length})
          </h3>
          <div className="text-sm text-gray-600">
            Ordenado por: <span className="font-semibold">Relevância</span>
          </div>
        </div>

        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiTrendingUp className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma recomendação encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              Ajuste os filtros ou adicione mais peças ao seu guarda-roupa
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecommendations.map((rec, index) => {
              const price = getSimulatedPrice();
              const sustainabilityScore = getSustainabilityScore();
              const newOutfits = rec.estimated_new_outfits || Math.floor(Math.random() * 10) + 1;
              
              return (
                <div key={index} className="card group hover:shadow-lg transition">
                  {/* Recommendation Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {rec.item || 'Peça Recomendada'}
                      </h4>
                      <p className="text-sm text-gray-600 capitalize">{rec.category}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs font-semibold">
                        Alta Prioridade
                      </div>
                    </div>
                  </div>

                  {/* Value Proposition */}
                  <div className="p-4 bg-blue-50 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Essa peça criaria {newOutfits} novos looks</span>
                      <br />
                      {rec.reason || 'Combina com várias peças do seu guarda-roupa'}
                    </p>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Preço estimado</span>
                      <span className="font-semibold text-gray-900">
                        R$ {price.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sustentabilidade</span>
                      <div className="flex items-center">
                        <FiLeaf className={`mr-1 ${sustainabilityScore > 70 ? 'text-green-600' : 'text-yellow-600'}`} />
                        <span className={`font-semibold ${sustainabilityScore > 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {sustainabilityScore}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Marca sugerida</span>
                      <span className="font-medium text-gray-900">
                        {brands[Math.floor(Math.random() * (brands.length - 1)) + 1]}
                      </span>
                    </div>
                  </div>

                  {/* Compatibility */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Compatibilidade com seu estilo</span>
                      <span className="font-semibold text-gray-900">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: '92%' }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex space-x-3">
                    <button className="btn-primary flex-1">
                      Ver em Lojas Parceiras
                    </button>
                    <button className="btn-secondary">
                      Salvar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* E-commerce Integration */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Lojas Parceiras</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {['Zara', 'H&M', 'Renner', 'Shein', 'Nike', 'Amazon'].map((store, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition text-center"
            >
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <span className="font-bold text-gray-700">{store.charAt(0)}</span>
              </div>
              <p className="font-medium text-gray-900">{store}</p>
              <p className="text-xs text-gray-500">Até 20% off para usuários Closet.IA</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seu Consumo Este Mês</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Economia com recomendações</span>
              <span className="font-semibold text-green-600">R$ 320,00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Compras evitadas</span>
              <span className="font-semibold text-blue-600">8 itens</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Novos looks criados</span>
              <span className="font-semibold text-purple-600">24 combinações</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Passos</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-700">Complete suas peças básicas primeiro</p>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-700">Invista em qualidade, não quantidade</p>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-700">Considere o custo por uso de cada peça</p>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-700">Prefira marcas com transparência</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Shopping;