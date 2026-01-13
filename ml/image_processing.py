import cv2
import numpy as np
from PIL import Image, ImageOps
import rembg
import io

class ClothingProcessor:
    def __init__(self):
        self.categories = {
            "top": ["shirt", "t-shirt", "blouse", "sweater"],
            "bottom": ["pants", "jeans", "skirt", "shorts"],
            "dress": ["dress", "jumpsuit"],
            "outerwear": ["jacket", "coat", "blazer"],
            "shoes": ["shoes", "sneakers", "heels"],
            "accessories": ["bag", "hat", "scarf"]
        }
    
    def remove_background(self, image_path):
        """Remove fundo da imagem usando rembg"""
        with open(image_path, "rb") as f:
            input_image = f.read()
        
        output_image = rembg.remove(input_image)
        
        # Salvar imagem sem fundo
        output_path = image_path.replace(".", "_nobg.")
        with open(output_path, "wb") as f:
            f.write(output_image)
        
        return output_path
    
    def extract_features(self, image_path):
        """Extrai características da peça de roupa"""
        img = cv2.imread(image_path)
        
        # Converter para RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Cor dominante
        pixels = img_rgb.reshape(-1, 3)
        unique_colors, counts = np.unique(pixels, axis=0, return_counts=True)
        dominant_color = unique_colors[np.argmax(counts)]
        
        # Padrão simples (listrado, liso, estampado)
        pattern = self.detect_pattern(img_rgb)
        
        # Categoria (simplificado por CNN no futuro)
        category = self.predict_category(img_rgb)
        
        return {
            "dominant_color": dominant_color.tolist(),
            "hex_color": self.rgb_to_hex(dominant_color),
            "pattern": pattern,
            "category": category,
            "size": img.shape[:2]
        }
    
    def detect_pattern(self, image):
        """Detecta padrão básico da roupa"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Calcular variância como indicador de textura
        variance = np.var(gray)
        
        if variance < 50:
            return "solid"
        elif variance < 200:
            return "striped"
        else:
            return "patterned"
    
    def predict_category(self, image):
        """Previsão simplificada de categoria"""
        height, width = image.shape[:2]
        aspect_ratio = width / height
        
        if aspect_ratio > 1.5:
            return "top"
        elif aspect_ratio < 0.8:
            return "dress"
        elif 0.9 < aspect_ratio < 1.1:
            return "shoes"
        else:
            return "bottom"
    
    def rgb_to_hex(self, rgb):
        return '#%02x%02x%02x' % tuple(rgb)