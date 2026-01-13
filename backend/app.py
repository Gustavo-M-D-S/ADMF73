from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
import shutil
import os
from datetime import datetime

# Importar funções do seu projeto
from database import get_db, init_db
from models import User, ClothingItem, Outfit, Base
from services.recommendation_engine import RecommendationEngine
from utils.image_utils import ImageProcessor

app = FastAPI(title="Closset.IA API", version="1.0.0")

# Inicializar engines
recommendation_engine = RecommendationEngine()
image_processor = ImageProcessor()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar banco de dados na inicialização
@app.on_event("startup")
def startup_event():
    init_db()
    print("✅ Banco de dados inicializado")

# Models Pydantic para validação
class ClothingItemCreate(BaseModel):
    name: Optional[str] = None
    category: str
    color: str
    brand: Optional[str] = None
    size: Optional[str] = None
    season: str = "all"
    tags: List[str] = []

class OutfitCreate(BaseModel):
    name: Optional[str] = None
    occasion: str = "casual"
    weather: str = "moderate"
    items: List[str]  # IDs das peças
    is_favorite: bool = False

# Endpoints

@app.get("/")
def read_root():
    return {"message": "Closset.IA API - MVP", "status": "online", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/upload-clothing")
async def upload_clothing_item(
    file: UploadFile = File(...),
    category: str = "unknown",
    user_id: str = "demo",
    db: Session = Depends(get_db)
):
    """Endpoint para upload de peças de roupa"""
    try:
        # Validar tipo de arquivo
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")
        
        # Gerar ID único
        item_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        
        # Criar pasta uploads se não existir
        os.makedirs("uploads", exist_ok=True)
        
        # Salvar imagem temporariamente
        temp_path = f"uploads/temp_{item_id}.{file_extension}"
        
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Processar imagem (remover fundo, extrair características)
        try:
            # Ler imagem para processamento
            with open(temp_path, "rb") as f:
                image_data = f.read()
            
            # Remover fundo
            processed_image = image_processor.remove_background(image_data)
            
            # Salvar imagem sem fundo
            processed_path = f"uploads/processed_{item_id}.png"
            with open(processed_path, "wb") as f:
                f.write(processed_image)
            
            # Extrair características
            features = image_processor.extract_dominant_color(processed_path)
            detected_category, main_category = image_processor.detect_category_by_aspect(processed_path)
            
            # Usar categoria detectada se não especificada
            if category == "unknown":
                category = main_category
            
            # Determinar cor dominante
            dominant_color = features[0] if features else "#808080"
            
        except Exception as img_error:
            print(f"Erro no processamento de imagem: {img_error}")
            # Usar valores padrão se o processamento falhar
            processed_path = temp_path
            dominant_color = "#808080"
            detected_category = category
        
        # Criar item no banco de dados
        db_item = ClothingItem(
            id=item_id,
            user_id=user_id,
            name=f"{detected_category.capitalize()} {dominant_color}",
            category=category,
            color=dominant_color,
            image_url=f"/uploads/{item_id}.{file_extension}",
            processed_url=processed_path,
            features={
                "colors": features,
                "detected_category": detected_category,
                "original_filename": file.filename
            }
        )
        
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        
        # Limpar arquivo temporário original
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return {
            "success": True,
            "item_id": item_id,
            "message": "Item cadastrado com sucesso",
            "data": {
                "id": db_item.id,
                "name": db_item.name,
                "category": db_item.category,
                "color": db_item.color,
                "image_url": db_item.image_url,
                "created_at": db_item.created_at.isoformat() if db_item.created_at else None
            }
        }
        
    except Exception as e:
        # Limpar arquivos temporários em caso de erro
        for path in [temp_path, processed_path]:
            if 'path' in locals() and path and os.path.exists(path):
                os.remove(path)
        
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

@app.get("/api/closet/{user_id}")
def get_user_closet(user_id: str, db: Session = Depends(get_db)):
    """Retorna todas as peças do guarda-roupa do usuário"""
    user_items = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id,
        ClothingItem.is_active == True
    ).all()
    
    # Converter para dict
    items_data = []
    for item in user_items:
        items_data.append({
            "id": item.id,
            "user_id": item.user_id,
            "name": item.name,
            "category": item.category,
            "subcategory": item.subcategory,
            "color": item.color,
            "brand": item.brand,
            "size": item.size,
            "season": item.season,
            "tags": item.tags or [],
            "image_url": item.image_url,
            "thumbnail_url": item.thumbnail_url,
            "wear_count": item.wear_count,
            "last_worn": item.last_worn.isoformat() if item.last_worn else None,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "is_favorite": item.is_favorite if hasattr(item, 'is_favorite') else False
        })
    
    # Agrupar por categoria
    categorized = {}
    for item in items_data:
        cat = item.get("category", "uncategorized")
        if cat not in categorized:
            categorized[cat] = []
        categorized[cat].append(item)
    
    return {
        "user_id": user_id,
        "total_items": len(items_data),
        "items": items_data,
        "items_by_category": categorized
    }

@app.get("/api/recommend-outfit")
def recommend_outfit(
    user_id: str,
    occasion: str = "casual",
    weather: str = "moderate",
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Gera recomendações de looks"""
    # Buscar itens do usuário
    user_items = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id,
        ClothingItem.is_active == True
    ).all()
    
    if len(user_items) < 2:
        return {
            "user_id": user_id,
            "message": "Adicione pelo menos 2 itens ao seu guarda-roupa",
            "recommendations": []
        }
    
    # Converter para dict
    items_dict = []
    for item in user_items:
        items_dict.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "color": item.color,
            "brand": item.brand,
            "tags": item.tags or [],
            "season": item.season,
            "wear_count": item.wear_count,
            "image_url": item.image_url,
            "is_favorite": item.is_favorite if hasattr(item, 'is_favorite') else False
        })
    
    # Gerar recomendações
    recommendations = recommendation_engine.generate_outfits(
        items_dict, occasion, weather, limit
    )
    
    return {
        "user_id": user_id,
        "occasion": occasion,
        "weather": weather,
        "total_recommendations": len(recommendations),
        "recommendations": recommendations
    }

@app.post("/api/save-outfit")
def save_outfit(outfit: OutfitCreate, user_id: str = "demo", db: Session = Depends(get_db)):
    """Salva um outfit favorito"""
    outfit_id = str(uuid.uuid4())
    
    # Verificar se todos os itens existem
    for item_id in outfit.items:
        item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {item_id} não encontrado")
    
    # Criar outfit no banco
    db_outfit = Outfit(
        id=outfit_id,
        user_id=user_id,
        name=outfit.name,
        occasion=outfit.occasion,
        weather=outfit.weather,
        items=outfit.items,
        is_favorite=outfit.is_favorite
    )
    
    db.add(db_outfit)
    db.commit()
    db.refresh(db_outfit)
    
    return {
        "success": True,
        "outfit_id": outfit_id,
        "message": "Outfit salvo com sucesso",
        "data": {
            "id": db_outfit.id,
            "name": db_outfit.name,
            "occasion": db_outfit.occasion,
            "items": db_outfit.items,
            "created_at": db_outfit.created_at.isoformat() if db_outfit.created_at else None
        }
    }

@app.get("/api/outfits/{user_id}")
def get_user_outfits(user_id: str, db: Session = Depends(get_db)):
    """Retorna todos os outfits do usuário"""
    outfits = db.query(Outfit).filter(
        Outfit.user_id == user_id
    ).order_by(Outfit.created_at.desc()).all()
    
    outfits_data = []
    for outfit in outfits:
        # Buscar detalhes dos itens
        items_details = []
        for item_id in outfit.items:
            item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
            if item:
                items_details.append({
                    "id": item.id,
                    "name": item.name,
                    "category": item.category,
                    "color": item.color,
                    "image_url": item.image_url
                })
        
        outfits_data.append({
            "id": outfit.id,
            "name": outfit.name,
            "occasion": outfit.occasion,
            "weather": outfit.weather,
            "items": items_details,
            "rating": outfit.rating,
            "worn_count": outfit.worn_count,
            "last_worn": outfit.last_worn.isoformat() if outfit.last_worn else None,
            "is_favorite": outfit.is_favorite,
            "created_at": outfit.created_at.isoformat() if outfit.created_at else None
        })
    
    return {
        "user_id": user_id,
        "total_outfits": len(outfits_data),
        "outfits": outfits_data
    }

@app.get("/api/stats/{user_id}")
def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    """Retorna estatísticas do usuário"""
    total_items = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id,
        ClothingItem.is_active == True
    ).count()
    
    # Itens por categoria
    categories_result = db.query(
        ClothingItem.category,
        func.count(ClothingItem.id)
    ).filter(
        ClothingItem.user_id == user_id,
        ClothingItem.is_active == True
    ).group_by(ClothingItem.category).all()
    
    categories = {cat: count for cat, count in categories_result}
    
    # Item mais usado
    most_worn_item = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id,
        ClothingItem.is_active == True
    ).order_by(ClothingItem.wear_count.desc()).first()
    
    # Últimas adições
    recent_additions = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id,
        ClothingItem.is_active == True
    ).order_by(ClothingItem.created_at.desc()).limit(5).all()
    
    recent_items = []
    for item in recent_additions:
        recent_items.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "color": item.color,
            "created_at": item.created_at.isoformat() if item.created_at else None
        })
    
    # Total de outfits
    total_outfits = db.query(Outfit).filter(Outfit.user_id == user_id).count()
    
    # Outfits mais usados
    favorite_outfits = db.query(Outfit).filter(
        Outfit.user_id == user_id,
        Outfit.is_favorite == True
    ).limit(3).all()
    
    favorite_outfits_data = []
    for outfit in favorite_outfits:
        favorite_outfits_data.append({
            "id": outfit.id,
            "name": outfit.name,
            "occasion": outfit.occasion,
            "worn_count": outfit.worn_count
        })
    
    return {
        "user_id": user_id,
        "stats": {
            "total_items": total_items,
            "total_outfits": total_outfits,
            "categories": categories,
            "most_worn": {
                "id": most_worn_item.id if most_worn_item else None,
                "name": most_worn_item.name if most_worn_item else None,
                "wear_count": most_worn_item.wear_count if most_worn_item else 0,
                "category": most_worn_item.category if most_worn_item else None
            },
            "recent_additions": recent_items,
            "favorite_outfits": favorite_outfits_data,
            "most_common_color": "A definir",  # Pode implementar depois
            "usage_rate": f"{(total_items / 100) * 100:.1f}%" if total_items > 0 else "0%"
        }
    }

@app.post("/api/wear/{item_id}")
def mark_item_worn(item_id: str, db: Session = Depends(get_db)):
    """Marca um item como usado hoje"""
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    item.wear_count = (item.wear_count or 0) + 1
    item.last_worn = datetime.utcnow()
    
    db.commit()
    db.refresh(item)
    
    return {
        "success": True,
        "item_id": item_id,
        "wear_count": item.wear_count,
        "last_worn": item.last_worn.isoformat() if item.last_worn else None
    }

@app.post("/api/wear-outfit/{outfit_id}")
def mark_outfit_worn(outfit_id: str, db: Session = Depends(get_db)):
    """Marca um outfit como usado hoje"""
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit não encontrado")
    
    outfit.worn_count = (outfit.worn_count or 0) + 1
    outfit.last_worn = datetime.utcnow()
    
    # Atualizar contador de uso para cada item do outfit
    for item_id in outfit.items:
        item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
        if item:
            item.wear_count = (item.wear_count or 0) + 1
            item.last_worn = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "outfit_id": outfit_id,
        "worn_count": outfit.worn_count,
        "last_worn": outfit.last_worn.isoformat() if outfit.last_worn else None
    }

@app.delete("/api/item/{item_id}")
def delete_item(item_id: str, db: Session = Depends(get_db)):
    """Remove um item do guarda-roupa (soft delete)"""
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    # Soft delete
    item.is_active = False
    
    db.commit()
    
    return {
        "success": True,
        "message": "Item removido com sucesso",
        "item_id": item_id
    }

@app.get("/api/shopping-suggestions/{user_id}")
def get_shopping_suggestions(user_id: str, db: Session = Depends(get_db)):
    """Retorna sugestões de compra baseadas no guarda-roupa"""
    user_items = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id,
        ClothingItem.is_active == True
    ).all()
    
    if not user_items:
        return {
            "user_id": user_id,
            "message": "Adicione itens ao seu guarda-roupa para receber sugestões",
            "suggestions": []
        }
    
    # Análise do guarda-roupa
    categories = {}
    colors = {}
    
    for item in user_items:
        # Contar categorias
        cat = item.category
        categories[cat] = categories.get(cat, 0) + 1
        
        # Contar cores
        color = item.color
        colors[color] = colors.get(color, 0) + 1
    
    suggestions = []
    
    # Sugerir itens básicos que faltam
    basic_items = [
        {"name": "Camiseta branca básica", "category": "top", "color": "#FFFFFF", "priority": "high"},
        {"name": "Jeans azul escuro", "category": "bottom", "color": "#1E3A8A", "priority": "high"},
        {"name": "Blazer preto", "category": "outerwear", "color": "#000000", "priority": "medium"},
        {"name": "Vestido preto básico", "category": "dress", "color": "#000000", "priority": "medium"},
        {"name": "Tênis branco", "category": "shoes", "color": "#FFFFFF", "priority": "high"}
    ]
    
    for basic in basic_items:
        exists = False
        for item in user_items:
            if (item.category == basic["category"] and 
                item.color.lower() == basic["color"].lower()):
                exists = True
                break
        
        if not exists:
            suggestions.append({
                "type": "basic_item",
                "item": basic["name"],
                "category": basic["category"],
                "color": basic["color"],
                "reason": "Item básico essencial para qualquer guarda-roupa",
                "priority": basic["priority"]
            })
    
    # Sugerir complementos para peças pouco utilizadas
    for item in user_items:
        if item.wear_count < 3:  # Peças pouco usadas
            suggestions.append({
                "type": "complement",
                "for_item": item.name,
                "suggestion": f"Acessórios para combinar com {item.color}",
                "reason": f"Esta peça foi usada apenas {item.wear_count} vezes",
                "priority": "low"
            })
    
    return {
        "user_id": user_id,
        "total_suggestions": len(suggestions),
        "wardrobe_analysis": {
            "total_items": len(user_items),
            "categories": categories,
            "top_colors": dict(sorted(colors.items(), key=lambda x: x[1], reverse=True)[:5])
        },
        "suggestions": suggestions[:10]  # Limitar a 10 sugestões
    }

# Endpoint para servir imagens
@app.get("/uploads/{filename}")
def serve_image(filename: str):
    """Serve imagens do diretório de uploads"""
    file_path = f"uploads/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Imagem não encontrada")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)