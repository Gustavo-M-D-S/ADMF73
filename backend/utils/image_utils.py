from PIL import Image, ImageOps
import numpy as np
import colorsys
import io
import base64
import rembg

class ImageProcessor:
    @staticmethod
    def remove_background(image_data):
        """Remove fundo da imagem usando rembg"""
        try:
            output = rembg.remove(image_data)
            return output
        except Exception as e:
            print(f"Erro ao remover fundo: {e}")
            return image_data  # Retorna original se falhar
    
    @staticmethod
    def extract_dominant_color(image_path, num_colors=5):
        """Extrai cores dominantes da imagem"""
        img = Image.open(image_path)
        img = img.convert("RGB")
        
        # Reduzir resolução para processamento mais rápido
        img.thumbnail((100, 100))
        
        # Converter para array numpy
        pixels = np.array(img)
        pixels = pixels.reshape(-1, 3)
        
        # Usar k-means simplificado para agrupar cores
        from sklearn.cluster import KMeans
        
        kmeans = KMeans(n_clusters=num_colors, n_init=10)
        kmeans.fit(pixels)
        
        # Pegar cores dos centróides
        colors = kmeans.cluster_centers_.astype(int)
        
        # Converter para hex
        hex_colors = []
        for color in colors:
            hex_color = '#%02x%02x%02x' % tuple(color)
            hex_colors.append(hex_color)
        
        return hex_colors
    
    @staticmethod
    def create_thumbnail(image_data, size=(200, 200)):
        """Cria thumbnail da imagem"""
        img = Image.open(io.BytesIO(image_data))
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Converter para base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG", quality=85)
        return base64.b64encode(buffered.getvalue()).decode()
    
    @staticmethod
    def detect_category_by_aspect(image_path):
        """Detecta categoria baseada na proporção da imagem"""
        img = Image.open(image_path)
        width, height = img.size
        aspect_ratio = width / height
        
        if aspect_ratio > 1.8:
            return "pants", "bottom"
        elif aspect_ratio > 1.2:
            return "top", "top"
        elif aspect_ratio < 0.7:
            return "dress", "dress"
        elif 0.9 < aspect_ratio < 1.1:
            return "shoes", "shoes"
        else:
            return "accessory", "accessories"