import { useState } from 'react';
import { Star, Heart, Share2, Calendar, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OutfitRecommendation({ outfit, onSave, onWear }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const handleSave = () => {
    setIsSaved(true);
    if (onSave) {
      onSave(outfit);
    }
  };
  
  const handleLike = () => {
    setIsLiked(!isLiked);
  };
  
  const handleWearToday = () => {
    if (onWear) {
      onWear(outfit);
    }
  };
  
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-900">
            {outfit.description || `Look ${outfit.type}`}
          </h3>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs text-white rounded-full ${getConfidenceColor(outfit.confidence)}`}>
              {Math.round(outfit.confidence * 100)}% match
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full capitalize">
            {outfit.occasion}
          </span>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {outfit.weather_suitable}
          </span>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
            {outfit.items.length} peças
          </span>
        </div>
      </div>
      
      {/* Itens do outfit */}
      <div className="p-4">
        <div className="flex overflow-x-auto pb-2 space-x-3">
          {outfit.items.map((item, index) => (
            <div 
              key={index} 
              className="flex-shrink-0 w-24 flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 mb-2">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.category}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{ backgroundColor: item.color || '#ccc' }}
                  ></div>
                )}
              </div>
              <span className="text-xs text-gray-600 capitalize truncate w-full text-center">
                {item.category}
              </span>
              <span className="text-xs text-gray-400">
                {item.color}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Ações */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <button
              onClick={handleLike}
              className={`p-2 rounded-lg ${isLiked ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            </button>
            
            <button
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleWearToday}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Usar hoje</span>
            </button>
            
            <button
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                isSaved 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" />
                  <span>Salvar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}