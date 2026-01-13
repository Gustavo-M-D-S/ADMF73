import { useState } from 'react';
import { Heart, Star, Calendar, Tag, MoreVertical } from 'lucide-react';

export default function ClothingItemCard({ item, onSelect, onFavorite }) {
  const [isFavorite, setIsFavorite] = useState(item.is_favorite || false);
  
  const handleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (onFavorite) {
      onFavorite(item.id, !isFavorite);
    }
  };
  
  const getWearStatus = (wearCount) => {
    if (wearCount === 0) return { text: 'Nunca usado', color: 'bg-yellow-100 text-yellow-800' };
    if (wearCount < 5) return { text: 'Pouco usado', color: 'bg-green-100 text-green-800' };
    return { text: 'Bem usado', color: 'bg-blue-100 text-blue-800' };
  };
  
  const wearStatus = getWearStatus(item.wear_count || 0);
  
  return (
    <div 
      onClick={() => onSelect && onSelect(item)}
      className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      {/* Imagem */}
      <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name || item.category}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: item.color || '#ccc' }}
          >
            <span className="text-white font-medium capitalize">
              {item.category?.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      {/* Informações */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900 capitalize">
              {item.name || item.category}
            </h3>
            <p className="text-sm text-gray-500 capitalize">
              {item.brand || 'Sem marca'}
            </p>
          </div>
          
          <button
            onClick={handleFavorite}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
            {item.color}
          </span>
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 capitalize">
            {item.category}
          </span>
          {item.season && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
              {item.season}
            </span>
          )}
        </div>
        
        {/* Status de uso */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className={`text-xs px-2 py-1 rounded-full ${wearStatus.color}`}>
              {wearStatus.text}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium">{item.wear_count || 0}</span>
          </div>
        </div>
      </div>
      
      {/* Overlay de ações */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1 bg-white/80 backdrop-blur-sm rounded hover:bg-white">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}