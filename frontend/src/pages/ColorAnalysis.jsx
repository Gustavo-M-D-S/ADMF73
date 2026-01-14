import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { 
  FiPalette, 
  FiCamera, 
  FiHeart,
  FiX,
  FiUnlock,
  FiCheck
} from 'react-icons/fi';

const ColorAnalysis = () => {
  const { showToast } = useToast();
  const [colorAnalysis, setColorAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlockModal, setUnlockModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('winter');

  const seasons = [
    { id: 'winter', name: 'Inverno', colors: ['#FFFFFF', '#000000', '#4169E1', '#8B0000', '#800080'] },
    { id: 'summer', name: 'Verão', colors: ['#F0F8FF', '#ADD8E6', '#FFB6C1', '#98FB98', '#DDA0DD'] },
    { id: 'autumn', name: 'Outono', colors: ['#8B4513', '#D2691E', '#FF8C00', '#556B2F', '#8B7355'] },
    { id: 'spring', name: 'Primavera', colors: ['#FFE4B5', '#FFD700', '#98FB98', '#87CEEB', '#FF69B4'] }
  ];

  useEffect(() => {
    fetchColorAnalysis();
  }, []);

  const fetchColorAnalysis = async () => {
    try {
      setLoading(true);
      // Busca análise existente ou faz uma nova
      const response = await axios.post('/api/colors/analyze', {
        skin_tone: 'medium',
        eye_color: 'brown',
        hair_color: 'brown'
      });
      setColorAnalysis(response.data.analysis);
      setSelectedSeason(response.data.analysis?.season || 'winter');
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVirtualTryOn = () => {
    showToast('Prova virtual em desenvolvimento', 'info');
  };

  const handleUnlockConsultancy = () => {
    setUnlockModal(true);
  };

  const selectedSeasonData = seasons.find(s => s.id === selectedSeason) || seasons[0];

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
          <FiPalette className="text-3xl mr-4" />
          <div>
            <h1 className="text-3xl font-bold">Descubra suas Cores</h1>
            <p className="text-primary-100 mt-2">
              Análise personalizada baseada na sua temporada de cores
            </p>
          </div>
        </div>
      </div>

      {/* Color Season Selection */}
      <div className="card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sua Temporada de Cores</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {seasons.map(season => (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.id)}
              className={`p-4 rounded-xl border-2 transition ${
                selectedSeason === season.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  {season.name}
                </div>
                <div className="flex justify-center space-x-1">
                  {season.colors.slice(0, 3).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                {colorAnalysis?.season === season.id && (
                  <div className="mt-2">
                    <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      <FiCheck className="mr-1" />
                      Sua temporada
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Analysis Result */}
        {colorAnalysis && (
          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Resultado da Análise</h3>
            <p className="text-gray-700 mb-6">{colorAnalysis.analysis}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Cores que Valorizam</h4>
                <div className="flex flex-wrap gap-2">
                  {colorAnalysis.recommended_colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 rounded-lg border border-gray-300 flex flex-col items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <FiHeart className="text-white text-sm" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Cores para Evitar</h4>
                <div className="flex flex-wrap gap-2">
                  {colorAnalysis.colors_to_avoid.map((color, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 rounded-lg border border-gray-300 flex flex-col items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <FiX className="text-white text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Palette */}
      <div className="card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Suas Melhores Cores - {selectedSeasonData.name}
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
          {selectedSeasonData.colors.map((color, index) => (
            <div key={index} className="text-center">
              <div
                className="w-full aspect-square rounded-xl mb-2 border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <p className="text-sm font-medium text-gray-900">
                {color.toUpperCase()}
              </p>
              <p className="text-xs text-gray-600">
                {getColorName(color)}
              </p>
            </div>
          ))}
        </div>

        {/* Color Harmony Explanation */}
        <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-3">Por que essas cores funcionam?</h3>
          <p className="text-gray-700">
            As cores da temporada {selectedSeasonData.name} harmonizam com seu tom de pele, 
            criando contraste natural que realça seus traços. Elas equilibram sua aparência 
            e fazem você parecer mais descansado e vibrante.
          </p>
        </div>
      </div>

      {/* Virtual Try-On */}
      <div className="card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Prova Virtual</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Try-On Interface */}
          <div>
            <div className="bg-gray-100 rounded-xl aspect-video flex items-center justify-center mb-4">
              <div className="text-center">
                <FiCamera className="text-4xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Simulação de looks no corpo</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visualizar cor diferente na mesma peça
                </label>
                <div className="flex flex-wrap gap-2">
                  {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map((color, idx) => (
                    <button
                      key={idx}
                      className="w-10 h-10 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                      onClick={handleVirtualTryOn}
                    />
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleVirtualTryOn}
                className="w-full btn-primary flex items-center justify-center"
              >
                <FiCamera className="mr-2" />
                Experimentar Virtualmente
              </button>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Dicas de Aplicação</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Use cores da sua paleta perto do rosto</p>
                  <p className="text-sm text-gray-600 mt-1">Blusas, camisas e acessórios faciais</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Combine com neutros da sua temporada</p>
                  <p className="text-sm text-gray-600 mt-1">Preto, branco, marrom e bege específicos</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Evite cores da paleta oposta</p>
                  <p className="text-sm text-gray-600 mt-1">Elas podem deixar você pálido ou cansado</p>
                </div>
              </li>
            </ul>

            {/* Premium CTA */}
            <div className="mt-8 p-6 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl text-white">
              <div className="flex items-start">
                <FiUnlock className="text-2xl mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-lg mb-2">Consultoria Avançada</h4>
                  <p className="text-primary-100 mb-4">
                    Análise profissional completa com consultor de cores certificado
                  </p>
                  <button
                    onClick={handleUnlockConsultancy}
                    className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition"
                  >
                    Desbloquear Consultoria Avançada
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wardrobe Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cores no seu Guarda-Roupa</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Cores da sua temporada</span>
              <span className="font-semibold text-green-600">42%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '42%' }} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Cores para evitar</span>
              <span className="font-semibold text-red-600">18%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full" style={{ width: '18%' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximas Compras</h3>
          <p className="text-gray-700 mb-4">
            Baseado na sua análise, priorize peças nestas cores:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSeasonData.colors.slice(0, 4).map((color, index) => (
              <div
                key={index}
                className="flex items-center px-3 py-2 bg-gray-50 rounded-lg"
              >
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-900">{getColorName(color)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unlock Modal */}
      {unlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-4">
                  <FiUnlock className="text-2xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Consultoria Avançada
                </h3>
                <p className="text-gray-600">
                  Desbloqueie análise profissional completa
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <FiCheck className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">Análise pessoal com consultor certificado</p>
                </div>
                <div className="flex items-start">
                  <FiCheck className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">Paleta completa com 32 cores</p>
                </div>
                <div className="flex items-start">
                  <FiCheck className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">Guia de compras personalizado</p>
                </div>
                <div className="flex items-start">
                  <FiCheck className="text-green-600 mt=1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">Sessão de styling virtual 1:1</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900">R$ 97</div>
                <p className="text-gray-600">Pagamento único • 7 dias de garantia</p>
              </div>

              <div className="space-y-3">
                <button className="w-full btn-primary">
                  Desbloquear Agora
                </button>
                <button
                  onClick={() => setUnlockModal(false)}
                  className="w-full btn-secondary"
                >
                  Talvez depois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get color names
const getColorName = (hex) => {
  const colors = {
    '#FFFFFF': 'Branco',
    '#000000': 'Preto',
    '#4169E1': 'Azul Real',
    '#8B0000': 'Vermelho Escuro',
    '#800080': 'Roxo',
    '#F0F8FF': 'Azul Alice',
    '#ADD8E6': 'Azul Claro',
    '#FFB6C1': 'Rosa Claro',
    '#98FB98': 'Verde Claro',
    '#DDA0DD': 'Ameixa',
    '#8B4513': 'Marrom Sela',
    '#D2691E': 'Chocolate',
    '#FF8C00': 'Laranja Escuro',
    '#556B2F': 'Verde Oliva',
    '#8B7355': 'Bege',
    '#FFE4B5': 'Mocassim',
    '#FFD700': 'Dourado',
    '#87CEEB': 'Azul Céu',
    '#FF69B4': 'Rosa Quente'
  };
  
  return colors[hex] || hex;
};

export default ColorAnalysis;
