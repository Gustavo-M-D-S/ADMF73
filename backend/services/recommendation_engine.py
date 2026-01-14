from typing import List, Dict, Tuple
import colorsys
from PIL import Image
import os
import json
from datetime import datetime
import random

class RecommendationEngine:
    def __init__(self):
        self.color_seasons = {
            "winter": ["#FFFFFF", "#000000", "#4169E1", "#8B0000", "#800080"],
            "summer": ["#F0F8FF", "#ADD8E6", "#FFB6C1", "#98FB98", "#DDA0DD"],
            "autumn": ["#8B4513", "#D2691E", "#FF8C00", "#556B2F", "#8B7355"],
            "spring": ["#FFE4B5", "#FFD700", "#98FB98", "#87CEEB", "#FF69B4"]
        }

    async def process_clothing_image(self, image_path: str) -> Dict:
        """Processa imagem para extrair características"""
        try:
            img = Image.open(image_path)
            img.thumbnail((300, 300))

            colors = img.getcolors(maxcolors=10000)
            if colors:
                dominant_color = max(colors, key=lambda x: x[0])[1]
                hex_color = '#%02x%02x%02x' % dominant_color[:3]

                palette = img.convert('P', palette=Image.ADAPTIVE, colors=5)
                palette_colors = palette.getpalette()
                color_palette = []
                for i in range(0, len(palette_colors), 3):
                    if i + 2 < len(palette_colors):
                        color_palette.append(f"#{palette_colors[i]:02x}{palette_colors[i+1]:02x}{palette_colors[i+2]:02x}")

            else:
                hex_color = "#808080"
                color_palette = [hex_color]

            width, height = img.size
            aspect_ratio = width / height

            if aspect_ratio < 0.7:
                category = "dress"
                subcategory = "dress"
            elif aspect_ratio < 0.9:
                category = "top"
                subcategory = "blouse" if aspect_ratio > 0.8 else "t-shirt"
            elif aspect_ratio < 1.2:
                category = "top"
                subcategory = "shirt"
            elif aspect_ratio < 1.5:
                category = "bottom"
                subcategory = "skirt"
            else:
                category = "bottom"
                subcategory = "pants"

            return {
                "color": hex_color,
                "color_palette": color_palette[:5],
                "category": category,
                "subcategory": subcategory,
                "size": {"width": width, "height": height},
                "aspect_ratio": aspect_ratio,
                "dominant_colors": color_palette[:3]
            }

        except Exception as e:
            print(f"Erro ao processar imagem: {e}")
            return {
                "color": "#808080",
                "color_palette": ["#808080"],
                "category": "uncategorized",
                "subcategory": "uncategorized",
                "size": {"width": 0, "height": 0},
                "aspect_ratio": 1.0,
                "error": str(e)
            }

    def color_compatibility(self, color1_hex: str, color2_hex: str) -> Tuple[bool, float]:
        """Verifica compatibilidade de cores e retorna score"""
        try:
            c1 = color1_hex.lstrip('#')
            c2 = color2_hex.lstrip('#')

            r1, g1, b1 = int(c1[0:2], 16), int(c1[2:4], 16), int(c1[4:6], 16)
            r2, g2, b2 = int(c2[0:2], 16), int(c2[2:4], 16), int(c2[4:6], 16)

            h1, s1, v1 = colorsys.rgb_to_hsv(r1/255, g1/255, b1/255)
            h2, s2, v2 = colorsys.rgb_to_hsv(r2/255, g2/255, b2/255)

            is_neutral1 = s1 < 0.1 or (abs(r1 - g1) < 30 and abs(g1 - b1) < 30)
            is_neutral2 = s2 < 0.1 or (abs(r2 - g2) < 30 and abs(g2 - b2) < 30)

            if is_neutral1 or is_neutral2:
                return True, 0.9

            hue_diff = abs(h1 - h2)
            if hue_diff > 0.5:
                hue_diff = 1 - hue_diff

            if 0.4 < hue_diff < 0.6 or hue_diff < 0.2:
                return True, 0.8

            compatibility_score = 1.0 - hue_diff

            return compatibility_score > 0.6, compatibility_score

        except:
            return True, 0.7  # Fallback

    def generate_daily_outfit(self, items: List[Dict], weather: str, occasion: str, temperature: int) -> List[Dict]:
        """Gera looks para o dia"""
        if not items:
            return []

        tops = [i for i in items if i.get("category") in ["top", "blouse", "shirt", "t-shirt"]]
        bottoms = [i for i in items if i.get("category") in ["bottom", "pants", "skirt", "jeans"]]
        dresses = [i for i in items if i.get("category") == "dress"]
        outerwear = [i for i in items if i.get("category") == "outerwear"]
        shoes = [i for i in items if i.get("category") == "shoes"]
        accessories = [i for i in items if i.get("category") == "accessory"]

        outfits = []

        for dress in dresses[:2]:
            compatible_shoes = self.find_compatible_items(dress, shoes)
            compatible_accessories = self.find_compatible_items(dress, accessories)

            if compatible_shoes:
                outfit = {
                    "type": "dress_outfit",
                    "items": [dress, compatible_shoes[0]] + compatible_accessories[:2],
                    "confidence": 0.85,
                    "description": f"Vestido {dress.get('color', '')} para {occasion}",
                    "weather_suitable": self.check_weather_suitability([dress], weather, temperature)
                }
                outfits.append(outfit)

        for top in tops[:3]:
            for bottom in bottoms[:3]:
                compatible, score = self.color_compatibility(
                    top.get("color_hex", "#000000"),
                    bottom.get("color_hex", "#FFFFFF")
                )

                if compatible and score > 0.7:
                    compatible_shoes = self.find_compatible_items(top, shoes)
                    compatible_accessories = self.find_compatible_items(bottom, accessories)

                    items_list = [top, bottom]
                    if compatible_shoes:
                        items_list.append(compatible_shoes[0])
                    if compatible_accessories:
                        items_list.append(compatible_accessories[0])

                    outfit = {
                        "type": "top_bottom_outfit",
                        "items": items_list,
                        "confidence": score,
                        "description": f"{top.get('subcategory', 'Top')} + {bottom.get('subcategory', 'Bottom')}",
                        "weather_suitable": self.check_weather_suitability(items_list, weather, temperature)
                    }
                    outfits.append(outfit)

        outfits.sort(key=lambda x: x["confidence"], reverse=True)
        return outfits[:5]

    def find_compatible_items(self, base_item: Dict, item_list: List[Dict], min_score: float = 0.7) -> List[Dict]:
        """Encontra itens compatíveis com um item base"""
        compatible = []
        base_color = base_item.get("color_hex", "#000000")

        for item in item_list:
            compatible, score = self.color_compatibility(base_color, item.get("color_hex", "#FFFFFF"))
            if compatible and score >= min_score:
                item["compatibility_score"] = score
                compatible.append(item)

        compatible.sort(key=lambda x: x.get("compatibility_score", 0), reverse=True)
        return compatible

    def check_weather_suitability(self, items: List[Dict], weather: str, temperature: int) -> bool:
        """Verifica se os itens são adequados para o clima"""
        if weather == "rainy":
            waterproof_items = [i for i in items if i.get("fabric") in ["nylon", "polyester", "waterproof"]]
            return len(waterproof_items) > 0

        if weather == "cold" or temperature < 15:
            warm_items = [i for i in items if i.get("category") in ["outerwear", "sweater"]]
            return len(warm_items) > 0

        if weather == "hot" or temperature > 28:
            light_fabrics = ["cotton", "linen", "silk"]
            light_items = [i for i in items if i.get("fabric") in light_fabrics]
            return len(light_items) > 0

        return True

    def analyze_color_season(self, skin_tone: str, eye_color: str, hair_color: str) -> Dict:
        """Analisa a temporada de cores do usuário"""
        if skin_tone in ["fair", "light"]:
            if hair_color in ["blonde", "light brown"]:
                season = "spring"
            else:
                season = "summer"
        elif skin_tone in ["medium", "olive"]:
            if eye_color in ["brown", "hazel"]:
                season = "autumn"
            else:
                season = "spring"
        else:
            season = "winter"

        return {
            "season": season,
            "recommended_colors": self.color_seasons.get(season, []),
            "colors_to_avoid": self.get_complementary_palette(season),
            "analysis": f"Baseado no seu tom de pele {skin_tone}, sua temporada é {season}."
        }

    def get_complementary_palette(self, season: str) -> List[str]:
        """Retorna paleta complementar (cores a evitar)"""
        complementary_map = {
            "winter": ["#D2691E", "#8B4513", "#556B2F"],  # Evitar cores outono
            "summer": ["#FF8C00", "#8B0000", "#2F4F4F"],  # Evitar cores inverno/outono
            "autumn": ["#4169E1", "#800080", "#00CED1"],  # Evitar cores inverno/verão
            "spring": ["#8B0000", "#4B0082", "#2F4F4F"]   # Evitar cores inverno
        }
        return complementary_map.get(season, [])

    def generate_shopping_recommendations(self, user_items: List[Dict], gaps: List[str]) -> List[Dict]:
        """Gera recomendações de compras baseadas em gaps no guarda-roupa"""
        recommendations = []

        basic_items = {
            "white_shirt": {"category": "top", "subcategory": "shirt", "color": "white"},
            "black_pants": {"category": "bottom", "subcategory": "pants", "color": "black"},
            "blue_jeans": {"category": "bottom", "subcategory": "jeans", "color": "blue"},
            "little_black_dress": {"category": "dress", "subcategory": "dress", "color": "black"},
            "neutral_blazer": {"category": "outerwear", "subcategory": "blazer", "color": "neutral"}
        }

        for item_name, item_specs in basic_items.items():
            has_similar = False
            for user_item in user_items:
                if (user_item.get("category") == item_specs["category"] and
                    user_item.get("color") == item_specs["color"]):
                    has_similar = True
                    break

            if not has_similar:
                recommendations.append({
                    "item": item_name.replace("_", " ").title(),
                    "category": item_specs["category"],
                    "reason": f"Item básico que combina com {len([i for i in user_items if i.get('color') != item_specs['color']])} peças do seu guarda-roupa",
                    "priority": "alta",
                    "estimated_new_outfits": random.randint(3, 8)
                })

        return recommendations[:5]

engine = RecommendationEngine()