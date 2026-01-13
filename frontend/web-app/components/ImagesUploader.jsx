import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';

export default function ImageUploader({ onUpload, category, loading }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem.');
      return;
    }
    
    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Chamar callback de upload
    if (onUpload) {
      onUpload(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: loading
  });

  const handleRemove = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 bg-primary-100 rounded-full">
              <Upload className="w-6 h-6 text-primary-600" />
            </div>
            
            <div>
              <p className="font-medium text-gray-700">
                {isDragActive ? 'Solte a imagem aqui' : 'Arraste e solte uma imagem'}
              </p>
              <p className="text-sm text-gray-500 mt-1">ou clique para selecionar</p>
            </div>
            
            <div className="text-xs text-gray-400 space-y-1">
              <p>PNG, JPG, WEBP até 5MB</p>
              {category && (
                <p className="text-primary-600 font-medium">
                  Categoria: {category}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-48 object-cover"
            />
          </div>
          
          {!loading && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {loading && !preview && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-primary-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processando imagem...</span>
        </div>
      )}
    </div>
  );
}