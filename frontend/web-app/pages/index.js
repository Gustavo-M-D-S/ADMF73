import { useState, useRef } from 'react';
import axios from 'axios';

export default function ClossetMVP() {
  const [closetItems, setClosetItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('top');

  const categories = [
    { value: 'top', label: 'Top (Camisetas, Blusas)' },
    { value: 'bottom', label: 'Bottom (Calças, Saias)' },
    { value: 'dress', label: 'Vestido' },
    { value: 'outerwear', label: 'Casaco/Jaqueta' },
    { value: 'shoes', label: 'Calçados' },
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', selectedCategory);
    formData.append('user_id', 'demo_user');

    try {
      const response = await axios.post('http://localhost:8000/api/upload-clothing', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setClosetItems([...closetItems, response.data.data]);
        alert('Item adicionado com sucesso!');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao processar imagem');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/recommend-outfit', {
        params: {
          user_id: 'demo_user',
          occasion: 'casual',
          weather: 'moderate'
        }
      });
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
    }
  };

  const getClosetSummary = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/closet/demo_user');
      setClosetItems(Object.values(response.data.items_by_category).flat());
    } catch (error) {
      console.error('Erro ao buscar closet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 p-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-purple-800 mb-4">🧥 Closset.IA</h1>
        <p className="text-gray-600 text-lg">Seu guarda-roupa inteligente e personalizado</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Painel Esquerdo - Upload */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-purple-700 mb-6">📸 Adicionar Peça</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Categoria</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div 
              className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:bg-purple-50 transition"
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-600">Clique ou arraste para upload</p>
              <p className="text-sm text-gray-500 mt-2">PNG, JPG até 5MB</p>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Processando imagem...</p>
              </div>
            )}
          </div>

          <button
            onClick={getClosetSummary}
            className="w-full mt-6 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Atualizar Meu Guarda-Roupa
          </button>
        </div>

        {/* Painel Central - Guarda-Roupa */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-purple-700 mb-6">👕 Meu Guarda-Roupa</h2>
          
          <div className="mb-4 flex justify-between items-center">
            <span className="text-gray-600">
              {closetItems.length} peças cadastradas
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              Demo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
            {closetItems.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">👚</div>
                <p>Nenhuma peça cadastrada ainda</p>
                <p className="text-sm">Adicione peças usando o painel ao lado</p>
              </div>
            ) : (
              closetItems.map((item, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-3 hover:shadow-md transition"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                    <div 
                      className="w-full h-full rounded"
                      style={{ backgroundColor: item.color || '#ccc' }}
                    ></div>
                  </div>
                  <p className="font-medium text-sm capitalize">{item.category}</p>
                  <p className="text-xs text-gray-500">{item.color}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Painel Direito - Recomendações */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-purple-700 mb-6">✨ Recomendações</h2>
          
          <button
            onClick={getRecommendations}
            disabled={closetItems.length < 2}
            className={`w-full py-3 rounded-lg font-semibold mb-6 transition ${
              closetItems.length < 2 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
            }`}
          >
            {closetItems.length < 2 
              ? 'Adicione mais peças' 
              : 'Gerar Looks Sugeridos'}
          </button>

          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🎨</div>
                <p>Clique no botão acima para gerar recomendações</p>
              </div>
            ) : (
              recommendations.map((outfit, index) => (
                <div key={index} className="border border-purple-200 rounded-xl p-4 bg-purple-50">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-purple-800">Look #{index + 1}</h3>
                    <span className="bg-white text-purple-700 text-xs px-2 py-1 rounded-full">
                      {Math.round(outfit.confidence * 100)}% match
                    </span>
                  </div>
                  
                  <div className="flex space-x-2 mb-3">
                    {outfit.items.map((item, i) => (
                      <div 
                        key={i}
                        className="w-12 h-12 rounded-lg border"
                        style={{ backgroundColor: item.color }}
                        title={item.category}
                      ></div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{outfit.description}</p>
                  
                  <button className="w-full bg-white text-purple-700 border border-purple-300 py-2 rounded-lg text-sm hover:bg-purple-50 transition">
                    Salvar Look
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Closset.IA MVP - Protótipo de desenvolvimento</p>
        <p className="mt-2">
          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full">
            Status: {closetItems.length > 0 ? '🟢 Ativo' : '🟡 Aguardando dados'}
          </span>
        </p>
      </footer>
    </div>
  );
}