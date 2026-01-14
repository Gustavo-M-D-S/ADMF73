from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = "sqlite:///./closset.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
1.3 backend/models.py
python
Copy
Download
from sqlalchemy import Column, String, Integer, JSON, DateTime, Boolean, Float, Text
from datetime import datetime
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Informações pessoais
    height = Column(Float, nullable=True)  # em cm
    weight = Column(Float, nullable=True)  # em kg
    gender = Column(String, nullable=True)
    body_type = Column(String, nullable=True)
    style_preference = Column(String, default="casual")
    skin_tone = Column(String, nullable=True)
    skin_undertone = Column(String, nullable=True)
    color_season = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ClothingItem(Base):
    __tablename__ = "clothing_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True)
    
    # Categoria
    category = Column(String)  # top, bottom, dress, shoes, accessory, outerwear
    subcategory = Column(String, nullable=True)  # t-shirt, blouse, jeans, etc.
    
    # Atributos
    color = Column(String)
    color_hex = Column(String)
    fabric = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    occasion = Column(JSON)  # Lista de ocasiões
    season = Column(JSON)  # Lista de estações
    
    # Imagem
    image_url = Column(String)
    processed_features = Column(JSON)
    
    # Metadados
    created_at = Column(DateTime, default=datetime.utcnow)
    last_worn = Column(DateTime, nullable=True)
    wear_count = Column(Integer, default=0)
    
    # Sustentabilidade
    is_sustainable = Column(Boolean, default=False)
    origin = Column(String, nullable=True)

class Outfit(Base):
    __tablename__ = "outfits"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True)
    name = Column(String, default="Look do Dia")
    
    # Itens
    item_ids = Column(JSON)  # Lista de IDs de ClothingItem
    
    # Contexto
    occasion = Column(String)
    weather = Column(String)
    temperature = Column(Integer, nullable=True)
    style = Column(String)
    
    # Avaliação
    rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Metadados
    saved_at = Column(DateTime, default=datetime.utcnow)
    last_worn = Column(DateTime, nullable=True)

class StyleProfile(Base):
    __tablename__ = "style_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, unique=True, index=True)
    
    # Preferências
    preferred_colors = Column(JSON)
    avoided_colors = Column(JSON)
    preferred_styles = Column(JSON)  # ['classic', 'casual', 'modern']
    preferred_fabrics = Column(JSON)
    
    # Análise de cores
    color_season = Column(String)  # winter, summer, autumn, spring
    color_palette = Column(JSON)
    
    # Hábitos
    shopping_habits = Column(JSON)
    budget_range = Column(JSON)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True)
    
    # Mensagem
    content = Column(Text)
    is_user = Column(Boolean)  # True se for do usuário, False se for da IA
    message_type = Column(String)  # text, outfit_suggestion, shopping_recommendation
    
    # Resposta da IA
    ai_response = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
1.4 backend/services/recommendation_engine.py
python
Copy
Download
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
            
            # Análise de cores
            colors = img.getcolors(maxcolors=10000)
            if colors:
                dominant_color = max(colors, key=lambda x: x[0])[1]
                hex_color = '#%02x%02x%02x' % dominant_color[:3]
                
                # Paleta de cores da imagem
                palette = img.convert('P', palette=Image.ADAPTIVE, colors=5)
                palette_colors = palette.getpalette()
                color_palette = []
                for i in range(0, len(palette_colors), 3):
                    if i + 2 < len(palette_colors):
                        color_palette.append(f"#{palette_colors[i]:02x}{palette_colors[i+1]:02x}{palette_colors[i+2]:02x}")
                
            else:
                hex_color = "#808080"
                color_palette = [hex_color]
            
            # Análise de forma
            width, height = img.size
            aspect_ratio = width / height
            
            # Classificação por aspecto
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
            # Remove #
            c1 = color1_hex.lstrip('#')
            c2 = color2_hex.lstrip('#')
            
            # Converte para RGB
            r1, g1, b1 = int(c1[0:2], 16), int(c1[2:4], 16), int(c1[4:6], 16)
            r2, g2, b2 = int(c2[0:2], 16), int(c2[2:4], 16), int(c2[4:6], 16)
            
            # Converte para HSV
            h1, s1, v1 = colorsys.rgb_to_hsv(r1/255, g1/255, b1/255)
            h2, s2, v2 = colorsys.rgb_to_hsv(r2/255, g2/255, b2/255)
            
            # Cores neutras
            is_neutral1 = s1 < 0.1 or (abs(r1 - g1) < 30 and abs(g1 - b1) < 30)
            is_neutral2 = s2 < 0.1 or (abs(r2 - g2) < 30 and abs(g2 - b2) < 30)
            
            # Se uma cor for neutra, são compatíveis
            if is_neutral1 or is_neutral2:
                return True, 0.9
            
            # Diferença de matiz (hue)
            hue_diff = abs(h1 - h2)
            if hue_diff > 0.5:
                hue_diff = 1 - hue_diff
            
            # Cores complementares (diferença ~0.5) ou análogas (diferença pequena)
            if 0.4 < hue_diff < 0.6 or hue_diff < 0.2:
                return True, 0.8
            
            # Score baseado na diferença de matiz
            compatibility_score = 1.0 - hue_diff
            
            return compatibility_score > 0.6, compatibility_score
            
        except:
            return True, 0.7  # Fallback
    
    def generate_daily_outfit(self, items: List[Dict], weather: str, occasion: str, temperature: int) -> List[Dict]:
        """Gera looks para o dia"""
        if not items:
            return []
        
        # Filtra por categoria
        tops = [i for i in items if i.get("category") in ["top", "blouse", "shirt", "t-shirt"]]
        bottoms = [i for i in items if i.get("category") in ["bottom", "pants", "skirt", "jeans"]]
        dresses = [i for i in items if i.get("category") == "dress"]
        outerwear = [i for i in items if i.get("category") == "outerwear"]
        shoes = [i for i in items if i.get("category") == "shoes"]
        accessories = [i for i in items if i.get("category") == "accessory"]
        
        outfits = []
        
        # Look com vestido
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
        
        # Look top + bottom
        for top in tops[:3]:
            for bottom in bottoms[:3]:
                compatible, score = self.color_compatibility(
                    top.get("color_hex", "#000000"),
                    bottom.get("color_hex", "#FFFFFF")
                )
                
                if compatible and score > 0.7:
                    # Encontra itens complementares
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
        
        # Ordena por confiança
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
        
        # Ordena por score
        compatible.sort(key=lambda x: x.get("compatibility_score", 0), reverse=True)
        return compatible
    
    def check_weather_suitability(self, items: List[Dict], weather: str, temperature: int) -> bool:
        """Verifica se os itens são adequados para o clima"""
        if weather == "rainy":
            # Verifica se há itens impermeáveis
            waterproof_items = [i for i in items if i.get("fabric") in ["nylon", "polyester", "waterproof"]]
            return len(waterproof_items) > 0
        
        if weather == "cold" or temperature < 15:
            # Verifica se há itens quentes
            warm_items = [i for i in items if i.get("category") in ["outerwear", "sweater"]]
            return len(warm_items) > 0
        
        if weather == "hot" or temperature > 28:
            # Verifica se há itens leves
            light_fabrics = ["cotton", "linen", "silk"]
            light_items = [i for i in items if i.get("fabric") in light_fabrics]
            return len(light_items) > 0
        
        return True
    
    def analyze_color_season(self, skin_tone: str, eye_color: str, hair_color: str) -> Dict:
        """Analisa a temporada de cores do usuário"""
        # Lógica simplificada para MVP
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
        
        # Análise de gaps básicos
        basic_items = {
            "white_shirt": {"category": "top", "subcategory": "shirt", "color": "white"},
            "black_pants": {"category": "bottom", "subcategory": "pants", "color": "black"},
            "blue_jeans": {"category": "bottom", "subcategory": "jeans", "color": "blue"},
            "little_black_dress": {"category": "dress", "subcategory": "dress", "color": "black"},
            "neutral_blazer": {"category": "outerwear", "subcategory": "blazer", "color": "neutral"}
        }
        
        for item_name, item_specs in basic_items.items():
            # Verifica se o usuário já tem um item similar
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

# Instância global
engine = RecommendationEngine()
1.5 backend/app.py
python
Copy
Download
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os
import shutil
import json

from database import SessionLocal, engine, Base, init_db, get_db
from models import User, ClothingItem, Outfit, StyleProfile, ChatMessage, generate_uuid
from services.recommendation_engine import engine as recommendation_engine
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt

# Configuração do FastAPI
app = FastAPI(
    title="Closet.IA API",
    version="1.0.0",
    description="API para plataforma de personal styling baseada em IA"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

# Configuração de segurança
SECRET_KEY = "closset-ia-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Modelos Pydantic
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    gender: Optional[str] = None
    body_type: Optional[str] = None
    style_preference: Optional[str] = None
    skin_tone: Optional[str] = None
    skin_undertone: Optional[str] = None

class ClothingItemCreate(BaseModel):
    category: str
    subcategory: Optional[str] = None
    color: str
    fabric: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    occasion: Optional[List[str]] = None
    season: Optional[List[str]] = None
    is_sustainable: Optional[bool] = False

class OutfitCreate(BaseModel):
    name: Optional[str] = "Look do Dia"
    item_ids: List[str]
    occasion: str
    weather: str
    temperature: Optional[int] = None
    style: str
    notes: Optional[str] = None

class ChatMessageCreate(BaseModel):
    content: str
    message_type: str = "text"

class ColorAnalysisRequest(BaseModel):
    skin_tone: str
    eye_color: Optional[str] = None
    hair_color: Optional[str] = None

# Resposta Models
class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    height: Optional[float]
    weight: Optional[float]
    gender: Optional[str]
    style_preference: Optional[str]
    skin_tone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ClothingItemResponse(BaseModel):
    id: str
    category: str
    subcategory: Optional[str]
    color: str
    color_hex: Optional[str]
    image_url: str
    brand: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Funções de utilidade
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Corrige o erro do bcrypt limitando a 72 bytes
    encoded_password = password.encode('utf-8')
    if len(encoded_password) > 72:
        encoded_password = encoded_password[:72]
    return pwd_context.hash(encoded_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# Rotas de Autenticação
@app.post("/api/auth/register", response_model=Token)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Verifica se usuário já existe
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já registrado")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Nome de usuário já existe")
    
    # Cria usuário
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Cria perfil de estilo
    style_profile = StyleProfile(
        user_id=new_user.id,
        preferred_styles=["casual"],
        preferred_colors=[],
        avoided_colors=[],
        color_palette=[]
    )
    db.add(style_profile)
    db.commit()
    
    # Gera token
    access_token = create_access_token(data={"sub": new_user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@app.post("/api/auth/login", response_model=Token)
def login_user(login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login.email).first()
    if not user or not verify_password(login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# Rotas do Perfil
@app.get("/api/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/api/profile")
def update_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Atualiza campos
    for field, value in profile_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Perfil atualizado com sucesso", "user": current_user}

# Rotas do Guarda-Roupa
@app.post("/api/closet/upload")
async def upload_clothing_item(
    file: UploadFile = File(...),
    category: str = Form("uncategorized"),
    subcategory: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Cria diretório de uploads
    upload_dir = "backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Gera nome único para o arquivo
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    item_id = generate_uuid()
    file_name = f"{item_id}.{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    # Salva arquivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Processa imagem com IA
    processed_data = await recommendation_engine.process_clothing_image(file_path)
    
    # Cria item no banco
    clothing_item = ClothingItem(
        id=item_id,
        user_id=current_user.id,
        category=category,
        subcategory=subcategory or processed_data.get("subcategory", "uncategorized"),
        color=color or processed_data.get("color", "unknown"),
        color_hex=processed_data.get("color", "#808080"),
        image_url=f"/uploads/{file_name}",
        processed_features=processed_data,
        created_at=datetime.utcnow()
    )
    
    db.add(clothing_item)
    db.commit()
    db.refresh(clothing_item)
    
    return {
        "message": "Peça adicionada com sucesso",
        "item": clothing_item,
        "analysis": processed_data
    }

@app.get("/api/closet", response_model=List[ClothingItemResponse])
def get_closet_items(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id)
    
    if category:
        query = query.filter(ClothingItem.category == category)
    
    items = query.order_by(ClothingItem.created_at.desc()).all()
    return items

@app.delete("/api/closet/{item_id}")
def delete_clothing_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ClothingItem).filter(
        ClothingItem.id == item_id,
        ClothingItem.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    # Remove arquivo de imagem
    if item.image_url:
        image_path = item.image_url.replace("/uploads/", "backend/uploads/")
        if os.path.exists(image_path):
            os.remove(image_path)
    
    db.delete(item)
    db.commit()
    
    return {"message": "Item removido com sucesso"}

# Rotas de Looks
@app.get("/api/outfits/daily")
def get_daily_outfits(
    weather: str = Query("moderate"),
    occasion: str = Query("casual"),
    temperature: int = Query(24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Busca itens do usuário
    items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()
    
    if not items:
        return {"outfits": [], "message": "Adicione peças ao seu guarda-roupa primeiro"}
    
    # Converte para dicionários
    items_dict = []
    for item in items:
        item_dict = {
            "id": item.id,
            "category": item.category,
            "subcategory": item.subcategory,
            "color": item.color,
            "color_hex": item.color_hex,
            "image_url": item.image_url,
            "fabric": item.fabric,
            "brand": item.brand
        }
        items_dict.append(item_dict)
    
    # Gera looks
    outfits = recommendation_engine.generate_daily_outfit(
        items_dict, weather, occasion, temperature
    )
    
    return {
        "outfits": outfits,
        "weather": weather,
        "occasion": occasion,
        "temperature": temperature,
        "greeting": f"Bom dia, {current_user.username}. Hoje faz {temperature}°C"
    }

@app.post("/api/outfits/save")
def save_outfit(
    outfit_data: OutfitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    outfit = Outfit(
        id=generate_uuid(),
        user_id=current_user.id,
        name=outfit_data.name,
        item_ids=outfit_data.item_ids,
        occasion=outfit_data.occasion,
        weather=outfit_data.weather,
        temperature=outfit_data.temperature,
        style=outfit_data.style,
        notes=outfit_data.notes,
        saved_at=datetime.utcnow()
    )
    
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    
    return {"message": "Look salvo com sucesso", "outfit": outfit}

@app.get("/api/outfits/saved")
def get_saved_outfits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    outfits = db.query(Outfit).filter(
        Outfit.user_id == current_user.id
    ).order_by(Outfit.saved_at.desc()).all()
    
    return {"outfits": outfits}

# Rotas de Chat com IA
@app.post("/api/chat/message")
async def send_chat_message(
    message: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Salva mensagem do usuário
    user_message = ChatMessage(
        id=generate_uuid(),
        user_id=current_user.id,
        content=message.content,
        is_user=True,
        message_type=message.message_type,
        created_at=datetime.utcnow()
    )
    db.add(user_message)
    
    # Gera resposta da IA baseada no tipo de mensagem
    ai_response_content = ""
    ai_response_data = None
    
    if "entrevista" in message.content.lower():
        ai_response_content = "Para uma entrevista, recomendo um look profissional: camisa social clara, calça social escura e sapatos fechados. Evite cores muito vibrantes e prefira um visual discreto e elegante."
        ai_response_data = {
            "type": "outfit_suggestion",
            "items": ["camisa_branca", "calça_preta", "sapato_social"],
            "confidence": 0.9
        }
    elif "combina" in message.content.lower():
        ai_response_content = "Essa peça combina com cores neutras como preto, branco, bege e azul marinho. Sugiro também experimentar com texturas diferentes para criar contraste."
        ai_response_data = {
            "type": "styling_tip",
            "suggestions": ["cores_neutras", "texturas", "acessorios_minimalistas"]
        }
    elif "comprar" in message.content.lower():
        # Analisa gaps no guarda-roupa
        user_items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()
        items_dict = [{"category": item.category, "color": item.color} for item in user_items]
        
        recommendations = recommendation_engine.generate_shopping_recommendations(items_dict, [])
        
        ai_response_content = "Baseado no seu guarda-roupa atual, recomendo investir em:"
        for rec in recommendations:
            ai_response_content += f"\n• {rec['item']} - {rec['reason']}"
        
        ai_response_data = {
            "type": "shopping_recommendation",
            "recommendations": recommendations
        }
    else:
        ai_response_content = "Olá! Sou sua stylist virtual. Posso ajudar você a:\n1. Montar looks para ocasiões específicas\n2. Sugerir combinações para suas peças\n3. Identificar gaps no seu guarda-roupa\n4. Dar dicas de estilo personalizadas\n\nComo posso ajudar você hoje?"
        ai_response_data = {
            "type": "greeting",
            "options": ["montar_look", "combinar_peças", "analisar_guarda_roupa", "dicas_estilo"]
        }
    
    # Salva resposta da IA
    ai_message = ChatMessage(
        id=generate_uuid(),
        user_id=current_user.id,
        content=ai_response_content,
        is_user=False,
        message_type="ai_response",
        ai_response=ai_response_data,
        created_at=datetime.utcnow()
    )
    db.add(ai_message)
    
    db.commit()
    
    return {
        "user_message": user_message,
        "ai_response": ai_message
    }

@app.get("/api/chat/history")
def get_chat_history(
    limit: int = Query(20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc()).limit(limit).all()
    
    # Ordena do mais antigo para o mais recente
    messages.reverse()
    
    return {"messages": messages}

# Rotas de Análise de Cores
@app.post("/api/colors/analyze")
def analyze_colors(
    analysis_request: ColorAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    analysis = recommendation_engine.analyze_color_season(
        analysis_request.skin_tone,
        analysis_request.eye_color,
        analysis_request.hair_color
    )
    
    return {
        "analysis": analysis,
        "user_id": current_user.id,
        "analyzed_at": datetime.utcnow()
    }

@app.get("/api/colors/palette/{season}")
def get_color_palette(season: str):
    palette = recommendation_engine.color_seasons.get(season, [])
    complementary = recommendation_engine.get_complementary_palette(season)
    
    return {
        "season": season,
        "recommended_colors": palette,
        "colors_to_avoid": complementary,
        "color_count": len(palette)
    }

# Rotas de Recomendações de Compras
@app.get("/api/shopping/recommendations")
def get_shopping_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()
    
    if not user_items:
        return {"recommendations": [], "message": "Adicione peças ao seu guarda-roupa para receber recomendações"}
    
    items_dict = []
    for item in user_items:
        item_dict = {
            "id": item.id,
            "category": item.category,
            "subcategory": item.subcategory,
            "color": item.color,
            "color_hex": item.color_hex,
            "brand": item.brand,
            "price": item.price
        }
        items_dict.append(item_dict)
    
    recommendations = recommendation_engine.generate_shopping_recommendations(items_dict, [])
    
    return {
        "recommendations": recommendations,
        "total_items": len(user_items),
        "analysis_date": datetime.utcnow()
    }

# Rotas de Estatísticas
@app.get("/api/stats")
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Conta itens por categoria
    items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()
    
    categories = {}
    for item in items:
        cat = item.category
        categories[cat] = categories.get(cat, 0) + 1
    
    # Conta looks salvos
    saved_outfits = db.query(Outfit).filter(Outfit.user_id == current_user.id).count()
    
    # Conta mensagens no chat
    chat_messages = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).count()
    
    # Calcula valor total estimado
    total_value = sum(item.price for item in items if item.price)
    
    return {
        "total_items": len(items),
        "categories": categories,
        "saved_outfits": saved_outfits,
        "chat_messages": chat_messages,
        "total_value": total_value,
        "member_since": current_user.created_at
    }

# Rota de saúde
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "service": "Closet.IA API"
    }

# Inicialização do banco de dados
@app.on_event("startup")
def on_startup():
    init_db()
    
    # Cria usuário de demonstração
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@closset.com").first()
        if not demo_user:
            hashed_password = get_password_hash("demo123")
            demo_user = User(
                username="demo",
                email="demo@closset.com",
                hashed_password=hashed_password,
                style_preference="casual",
                skin_tone="medium"
            )
            db.add(demo_user)
            db.commit()
            
            # Cria perfil de estilo
            style_profile = StyleProfile(
                user_id=demo_user.id,
                preferred_styles=["casual", "modern"],
                preferred_colors=["#4169E1", "#8B0000", "#FFFFFF"],
                avoided_colors=["#FFD700", "#00FF00"],
                color_palette=["#FFFFFF", "#000000", "#4169E1", "#8B0000"]
            )
            db.add(style_profile)
            db.commit()
            
            print("Usuário de demonstração criado: demo@closset.com / demo123")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)