import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { FiUpload, FiCamera, FiCheck, FiGrid, FiList } from 'react-icons/fi';

const Closet = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload form state
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('top');
  const [subcategory, setSubcategory] = useState('');
  const [color, setColor] = useState('');

  const categories = [
    { id: 'all', name: 'Todas as Peças' },
    { id: 'top', name: 'Partes de Cima' },
    { id: 'bottom', name: 'Partes de Baixo' },
    { id: 'dress', name: 'Vestidos' },
    { id: 'shoes', name: 'Calçados' },
    { id: 'accessory', name: 'Acessórios' },
    { id: 'outerwear', name: 'Agasalhos' },
  ];

  const subcategories = {
    top: ['Blusa', 'Camisa', 'Camiseta', 'Cropped', 'Suéter'],
    bottom: ['Calça', 'Shorts', 'Saia', 'Jeans', 'Legging'],
    dress: ['Vestido Casual', 'Vestido de Festa', 'Vestido de Trabalho'],
    shoes: ['Tênis', 'Sapato', 'Sandália', 'Bota', 'Chinelo'],
    accessory: ['Bolsa', 'Cinto', 'Lenço', 'Chapéu', 'Joia'],
    outerwear: ['Jaqueta', 'Casaco', 'Blazer', 'Moletom'],
  };

  const colors = [
    'Preto', 'Branco', 'Cinza', 'Azul', 'Vermelho', 
    'Verde', 'Amarelo', 'Rosa', 'Roxo', 'Marrom', 'Bege'
  ];

  useEffect(() => {
    fetchClosetItems();
  }, []);

  const fetchClosetItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/closet');
      setItems(response.data);
    } catch (error) {
      showToast('Erro ao carregar guarda-roupa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Verifica se é imagem
    if (!selectedFile.type.startsWith('image/')) {
      showToast('Por favor, selecione uma imagem', 'error');
      return;
    }

    setFile(selectedFile);
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Selecione uma imagem primeiro', 'error');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('subcategory', subcategory);
      if (color) formData.append('color', color);

      const response = await axios.post('/api/closet/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showToast(response.data.message, 'success');
      setShowUploadModal(false);
      setFile(null);
      setCategory('top');
      setSubcategory('');
      setColor('');
      
      fetchClosetItems(); // Atualiza lista
      
    } catch (error) {
      showToast(error.response?.data?.detail || 'Erro ao fazer upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Tem certeza que deseja remover esta peça?')) return;

    try {
      await axios.delete(`/api/closet/${itemId}`);
      showToast('Peça removida com sucesso', 'success');
      fetchClosetItems();
    } catch (error) {
      showToast('Erro ao remover peça', 'error');
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const getCategoryCount = (catId) => {
    return items.filter(item => item.category === catId).length;
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Guarda-Roupa</h1>
          <p className="text-gray-600 mt-2">
            {items.length} peças digitalizadas • {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        <div className="flex space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md transition ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
              }`}
            >
              <FiGrid className="text-lg" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md transition ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
              }`}
            >
              <FiList className="text-lg" />
            </button>
          </div>

          {/* Upload Button */}
          <label className="btn-primary cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex items-center">
              <FiUpload className="mr-2" />
              Adicionar Roupas
            </div>
          </label>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Adicionar Nova Peça</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                {/* Preview */}
                {file && (
                  <div className="flex justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Como deseja adicionar?
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <div className="flex items-center">
                          <FiUpload className="text-xl text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium">Enviar Fotos</p>
                            <p className="text-sm text-gray-500">Upload múltiplo de fotos</p>
                          </div>
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => showToast('Funcionalidade em desenvolvimento', 'info')}
                        className="w-full flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500"
                      >
                        <FiCamera className="text-xl text-gray-400 mr-3" />
                        <div className="text-left">
                          <p className="font-medium">Tirar Foto</p>
                          <p className="text-sm text-gray-500">Usar câmera do celular</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoria
                      </label>
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setSubcategory('');
                        }}
                        className="input-field"
                      >
                        {categories.slice(1).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                      </label>
                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="input-field"
                      >
                        <option value="">Selecione...</option>
                        {subcategories[category]?.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cor (Opcional)
                      </label>
                      <select
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="input-field"
                      >
                        <option value="">Selecione...</option>
                        {colors.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* IA Features Info */}
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-800">
                    <span className="font-semibold">Função IA ativada:</span>
                    {' '}Remoção automática de fundo e classificação da peça (tipo, cor, tecido, ocasião)
                  </p>
                </div>

                {/* Submit */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="btn-primary flex items-center"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <FiCheck className="mr-2" />
                        Adicionar Peça
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex overflow-x-auto pb-2 space-x-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full transition ${
              selectedCategory === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {cat.name}
            <span className="ml-2 text-xs opacity-75">
              {cat.id !== 'all' && `(${getCategoryCount(cat.id)})`}
            </span>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {file && !showUploadModal && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiCheck className="text-green-600 mr-2" />
            <p className="text-green-800 font-medium">
              5 peças adicionadas com sucesso!
            </p>
            <button className="ml-auto text-green-700 hover:text-green-800 font-semibold">
              Organizar Closet
            </button>
          </div>
        </div>
      )}

      {/* Items Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FiUpload className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Seu guarda-roupa está vazio
          </h3>
          <p className="text-gray-600 mb-6">
            Comece adicionando suas peças para a IA analisar
          </p>
          <label className="btn-primary inline-flex items-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FiUpload className="mr-2" />
            Adicionar Primeira Peça
          </label>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="aspect-square relative">
                <img
                  src={item.image_url || '/placeholder.jpg'}
                  alt={item.category}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-600 p-1.5 rounded-full"
                >
                  &times;
                </button>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {item.subcategory || item.category}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">{item.color}</p>
                  </div>
                  {item.color_hex && (
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: item.color_hex }}
                      title={item.color_hex}
                    />
                  )}
                </div>
                {item.brand && (
                  <p className="text-xs text-gray-500">{item.brand}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peça
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.category}
                          className="h-10 w-10 rounded object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {item.subcategory || item.category}
                        </div>
                        {item.brand && (
                          <div className="text-sm text-gray-500">{item.brand}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                        style={{ backgroundColor: item.color_hex }}
                      />
                      <span className="text-sm text-gray-900 capitalize">{item.color}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Organization */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Organização por Categorias
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(1).map(cat => (
            <div
              key={cat.id}
              className="bg-white p-4 rounded-lg text-center hover:shadow-md transition"
            >
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {getCategoryCount(cat.id)}
              </div>
              <div className="text-sm text-gray-600">{cat.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Closet;