import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { 
  FiSun, 
  FiCloud, 
  FiCloudRain, 
  FiWind,
  FiCalendar,
  FiStar,
  FiEdit2,
  FiEye
} from 'react-icons/fi';

const SmartLooks = () => {
  const { showToast } = useToast();
  const [outfits, setOutfits] = useState([]);
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Filtros
  const [weather, setWeather] = useState('sunny');
  const [occasion, setOccasion] = useState('work');
  const [style, setStyle] = useState('casual');
  const [temperature, setTemperature] = useState(24);

  const weatherOptions = [
    { id: 'sunny', label: 'Ensolarado', icon: <FiSun /> },
    { id: 'cloudy', label: 'Nublado', icon: <FiCloud /> },
    { id: 'rainy', label: 'Chuvoso', icon: <FiCloudRain /> },
    { id: 'windy', label: 'Ventoso', icon: <FiWind /> },
  ];

  const occasionOptions = [
    { id: 'work', label: 'Trabalho' },
    { id: 'casual', label: 'Casual' },
    { id: 'party', label: 'Festa' },
    { id: 'date', label: 'Encontro' },
    { id: 'sport', label: 'Esporte' },
  ];

  const styleOptions = [
    { id: 'classic', label: 'Clássico' },
    { id: 'casual', label: 'Casual' },
    { id: 'modern', label: 'Moderno' },
    { id: 'creative', label: 'Criativo' },
    { id: 'minimalist', label: 'Minimalista' },
  ];

  useEffect(() => {
    fetchDailyOutfits();
  }, []);

  const fetchDailyOutfits = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/outfits/daily', {
        params: { weather, occasion, temperature }
      });
      
      setOutfits(response.data.outfits || []);
      setGreeting(response.data.greeting || '');
      
    } catch (error) {
      showToast('Erro ao carregar looks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateNewOutfits = async () => {
    try {
      setGenerating(true);
      await fetchDailyOutfits();
      showToast('Novos looks gerados com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao gerar looks', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const saveOutfit = async (outfit) => {
    try {
      const outfitData = {
        name: `Look para ${occasion}`,
        item_ids: outfit.items.map(item => item.id),
        occasion,
        weather,
        temperature,
        style,
        description: outfit.description
      };

      await axios.post('/api/outfits/save', outfitData);
      showToast('Look salvo com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao salvar look', 'error');
    }
  };

  const getWeatherIcon = (weatherType) => {
    const option = weatherOptions.find(w => w.id === weatherType);
    return option ? option.icon : <FiSun />;
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
      {/* Header com Saudação */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {greeting || 'Bom dia! Aqui estão seus looks inteligentes'}
            </h1>
            <div className="flex items-center mt-4 space-x-6">
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                <span>Reunião às 14:00</span>
              </div>
              <div className="flex items-center">
                {getWeatherIcon(weather)}
                <span className="ml-2">{temperature}°C</span>
              </div>
            </div>
          </div>
          <button
            onClick={generateNewOutfits}
            disabled={generating}
            className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            {generating ? 'Gerando...' : 'Gerar Novos Looks'}
          </button>
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Filtros Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clima */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center">
                <FiSun className="mr-2" />
                Clima
              </div>
            </label>
            <div className="flex flex-wrap gap-2">
              {weatherOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setWeather(option.id)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition ${
                    weather === option.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {option.icon}
                  <span className="ml-2">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ocasião */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                Ocasião
              </div>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {occasionOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setOccasion(option.id)}
                  className={`px-3 py-2 rounded-lg border text-sm transition ${
                    occasion === option.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estilo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Estilo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {styleOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setStyle(option.id)}
                  className={`px-3 py-2 rounded-lg border text-sm transition ${
                    style === option.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperatura: {temperature}°C
          </label>
          <input
            type="range"
            min="10"
            max="40"
            value={temperature}
            onChange={(e) => setTemperature(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10°C</span>
            <span>25°C</span>
            <span>40°C</span>
          </div>
        </div>
      </div>

      {/* Looks Sugeridos */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Looks Inteligentes</h2>
          <div className="text-sm text-gray-600">
            {outfits.length} sugestões encontradas
          </div>
        </div>

        {outfits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiCalendar className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum look encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Ajuste os filtros ou adicione mais peças ao seu guarda-roupa
            </p>
            <button
              onClick={generateNewOutfits}
              className="btn-primary"
            >
              Gerar Looks
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Look do Dia (Principal) */}
            {outfits[0] && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Look do Dia</h3>
                    <p className="text-gray-600">{outfits[0].description}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mr-3">
                      {Math.round(outfits[0].confidence * 100)}% compatível
                    </div>
                    <button
                      onClick={() => saveOutfit(outfits[0])}
                      className="flex items-center text-primary-600 hover:text-primary-700"
                    >
                      <FiStar className="mr-1" />
                      Salvar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Itens do Look */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-4">Peças do Look</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {outfits[0].items.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="aspect-square bg-gray-200 rounded-md overflow-hidden mb-2">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.category}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                Imagem
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {item.subcategory || item.category}
                          </p>
                          <p className="text-xs text-gray-600 capitalize">{item.color}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button className="btn-primary flex-1">
                        <FiEye className="mr-2" />
                        Ver Peças Usadas
                      </button>
                      <button className="btn-secondary flex-1">
                        <FiEdit2 className="mr-2" />
                        Editar Combinação
                      </button>
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-4">Detalhes</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Perfeito para:</span> {occasionOptions.find(o => o.id === occasion)?.label}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <span className="font-semibold">Adequado ao clima:</span> {weatherOptions.find(w => w.id === weather)?.label} ({temperature}°C)
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-800">
                          <span className="font-semibold">Estilo:</span> {styleOptions.find(s => s.id === style)?.label}
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-semibold">Dica da IA:</span> Complete com acessórios minimalistas para um toque elegante
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Look Alternativo */}
            {outfits[1] && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Look Alternativo</h3>
                    <p className="text-gray-600">{outfits[1].description}</p>
                  </div>
                  <button
                    onClick={() => saveOutfit(outfits[1])}
                    className="flex items-center text-primary-600 hover:text-primary-700"
                  >
                    <FiStar className="mr-1" />
                    Salvar
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {outfits[1].items.map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-2">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.category}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Imagem
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 capitalize">
                        {item.subcategory || item.category}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outros Looks (Grid) */}
            {outfits.length > 2 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Mais Sugestões</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {outfits.slice(2).map((outfit, index) => (
                    <div key={index} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{outfit.description}</h4>
                          <div className="flex items-center mt-1">
                            <div className="w-3 h-3 rounded-full mr-2" style={{
                              backgroundColor: outfit.weather_suitable ? '#10B981' : '#EF4444'
                            }} />
                            <span className="text-sm text-gray-600">
                              {outfit.weather_suitable ? 'Adequado ao clima' : 'Ajustar para clima'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => saveOutfit(outfit)}
                          className="text-gray-400 hover:text-primary-600"
                        >
                          <FiStar />
                        </button>
                      </div>

                      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                        {outfit.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex-shrink-0 w-16 h-16">
                            <div className="w-full h-full bg-gray-200 rounded-md overflow-hidden">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.category}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                        {outfit.items.length > 3 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                            <span className="text-gray-500 text-sm">
                              +{outfit.items.length - 3}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {outfit.items.length} peças
                        </span>
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contexto e Dicas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contexto do Dia</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                <span className="font-semibold">Agenda:</span> Você tem uma reunião importante às 14:00.
                Recomendamos looks mais formais para transmitir profissionalismo.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800">
                <span className="font-semibold">Clima:</span> Previsão de chuva à tarde.
                Considere incluir um casaco impermeável ou guarda-chuva.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-800">
                <span className="font-semibold">Estilo Pessoal:</span> Baseado no seu perfil,
                essas combinações respeitam sua preferência por estilo {style}.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dicas Rápidas</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-700">Misture texturas diferentes para criar interesse visual</p>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-700">Use uma peça de cor como ponto focal</p>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-700">Acessórios podem transformar um look casual em sofisticado</p>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
              <p className="text-sm text-gray-700">Verifique o conforto da roupa para atividades do dia</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SmartLooks;