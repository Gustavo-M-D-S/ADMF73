from typing import List, Dict
import random
from datetime import datetime

class RecommendationEngine:
    def __init__(self):
        self.color_compatibility_rules = {
            "neutral": ["black", "white", "gray", "beige", "navy", "brown"],
            "warm": ["red", "orange", "yellow", "pink"],
            "cool": ["blue", "green", "purple", "teal"]
        }
        
        self.occasion_rules = {
            "casual": ["t-shirt", "jeans", "sneakers", "hoodie"],
            "work": ["blouse", "dress_pants", "blazer", "dress_shoes"],
            "formal": ["dress", "suit", "heels", "tie"],
            "sport": ["leggings", "tank_top", "sports_shoes"]
        }
        
        self.weather_rules = {
            "hot": ["light_fabric", "shorts", "tank_top"],
            "cold": ["sweater", "jacket", "long_pants"],
            "rainy": ["waterproof", "boots"]
        }
    
    def generate_outfits(self, user_items: List[Dict], occasion: str, weather: str, limit: int = 5):
        """Gera combinações de outfits baseado em regras simples"""
        
        # Filtrar itens por categoria
        categories = {}
        for item in user_items:
            cat = item.get("category")
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(item)
        
        # Garantir categorias essenciais existem
        essential_cats = ["top", "bottom"]
        for cat in essential_cats:
            if cat not in categories:
                categories[cat] = []
        
        outfits = []
        
        # Gerar combinações top+bottom
        tops = categories.get("top", [])
        bottoms = categories.get("bottom", [])
        
        for top in tops[:10]:  # Limitar para performance
            for bottom in bottoms[:10]:
                if self.validate_combo(top, bottom, occasion, weather):
                    outfits.append({
                        "type": "top_bottom",
                        "items": [top, bottom],
                        "confidence": self.calculate_confidence(top, bottom),
                        "description": self.generate_description([top, bottom]),
                        "occasion": occasion,
                        "weather_suitable": weather
                    })
        
        # Gerar outfits com vestidos
        dresses = categories.get("dress", [])
        for dress in dresses[:5]:
            if self.validate_dress(dress, occasion, weather):
                outfits.append({
                    "type": "dress",
                    "items": [dress],
                    "confidence": 0.9,
                    "description": self.generate_description([dress]),
                    "occasion": occasion,
                    "weather_suitable": weather
                })
        
        # Ordenar por confiança
        outfits.sort(key=lambda x: x["confidence"], reverse=True)
        
        return outfits[:limit]
    
    def validate_combo(self, top: Dict, bottom: Dict, occasion: str, weather: str) -> bool:
        """Valida se top e bottom combinam"""
        
        # Validar cores
        if not self.color_match(top.get("color"), bottom.get("color")):
            return False
        
        # Validar ocasião
        top_category = top.get("category", "").lower()
        bottom_category = bottom.get("category", "").lower()
        
        occasion_allowed = self.occasion_rules.get(occasion, [])
        if not any(cat in occasion_allowed for cat in [top_category, bottom_category]):
            return False
        
        # Validar clima
        top_tags = top.get("tags", [])
        bottom_tags = bottom.get("tags", [])
        weather_tags = self.weather_rules.get(weather, [])
        
        if not any(tag in weather_tags for tag in top_tags + bottom_tags):
            return False
        
        return True
    
    def color_match(self, color1: str, color2: str) -> bool:
        """Valida compatibilidade de cores simplificada"""
        # Em produção, usar um algoritmo mais sofisticado
        color_groups = {
            "black": ["white", "gray", "red", "blue", "green", "yellow"],
            "white": ["black", "navy", "red", "green", "blue", "pink"],
            "blue": ["white", "gray", "beige", "navy", "black"],
            "beige": ["black", "white", "navy", "brown", "green"],
            "gray": ["black", "white", "pink", "blue", "red"]
        }
        
        color1_lower = color1.lower()
        color2_lower = color2.lower()
        
        # Cores neutras combinam com tudo
        neutrals = ["black", "white", "gray", "beige", "navy"]
        if color1_lower in neutrals or color2_lower in neutrals:
            return True
        
        # Verificar combinações predefinidas
        if color1_lower in color_groups:
            return color2_lower in color_groups[color1_lower]
        
        return True  # Fallback
    
    def calculate_confidence(self, top: Dict, bottom: Dict) -> float:
        """Calcula confiança na combinação"""
        confidence = 0.5
        
        # Bônus por cores que combinam bem
        if self.color_match(top.get("color"), bottom.get("color")):
            confidence += 0.2
        
        # Bônus por itens pouco usados
        top_wear = top.get("wear_count", 0)
        bottom_wear = bottom.get("wear_count", 0)
        
        if top_wear < 5:
            confidence += 0.1
        if bottom_wear < 5:
            confidence += 0.1
        
        # Penalidade por usar muito a mesma combinação
        # (implementar histórico no futuro)
        
        return min(confidence, 1.0)
    
    def generate_description(self, items: List[Dict]) -> str:
        """Gera descrição do outfit"""
        categories = [item.get("category", "").capitalize() for item in items]
        colors = [item.get("color", "").capitalize() for item in items]
        
        if len(items) == 1:
            return f"{colors[0]} {categories[0]}"
        else:
            return f"{colors[0]} {categories[0]} + {colors[1]} {categories[1]}"