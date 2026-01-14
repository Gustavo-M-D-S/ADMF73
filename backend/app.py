from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os
import shutil
import json

from config import settings
from database import SessionLocal, engine, Base, init_db, get_db
from models import User, ClothingItem, Outfit, StyleProfile, ChatMessage, generate_uuid, UserSession
from services.recommendation_engine import engine as recommendation_engine
from security import (
    TokenSecurity,
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_access_token,
    verify_refresh_token,
    generate_csrf_token,
    validate_csrf_token,
    validate_request_origin,
    generate_session_id,
    get_security_headers,
    rate_limiter
)
from pydantic import BaseModel, EmailStr, validator
import secrets

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API para plataforma de personal styling baseada em IA",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token", "X-Request-ID"]
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "closset.ia", "*.closset.ia"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

token_security = TokenSecurity()

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('A senha deve ter pelo menos 8 caracteres')
        if not any(c.isupper() for c in v):
            raise ValueError('A senha deve conter pelo menos uma letra maiúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('A senha deve conter pelo menos um número')
        return v

    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Nome de usuário deve ter pelo menos 3 caracteres')
        if not v.isalnum():
            raise ValueError('Nome de usuário deve conter apenas letras e números')
        return v

class UserLogin(BaseModel):
    email: str
    password: str
    csrf_token: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    csrf_token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

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
    last_login: Optional[datetime]

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

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)

    security_headers = get_security_headers()
    for header, value in security_headers.items():
        response.headers[header] = value

    request_id = request.headers.get("X-Request-ID", secrets.token_urlsafe(16))
    response.headers["X-Request-ID"] = request_id

    return response

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    if request.url.path in ["/api/docs", "/api/redoc", "/api/health", "/api/auth/csrf"]:
        return await call_next(request)

    if not validate_request_origin(request):
        return Response(
            content=json.dumps({"detail": "Origem da requisição não permitida"}),
            status_code=status.HTTP_403_FORBIDDEN,
            media_type="application/json"
        )

    client_ip = request.client.host
    if not rate_limiter.is_allowed(client_ip):
        return Response(
            content=json.dumps({"detail": "Muitas requisições. Tente novamente mais tarde."}),
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            media_type="application/json"
        )

    return await call_next(request)

async def get_current_user(
    token_data: Dict = Depends(token_security),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        user_id = token_data.get("sub")
        if user_id is None:
            raise credentials_exception

        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise credentials_exception

        session = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.token_jti == token_data.get("jti"),
            UserSession.is_active == True
        ).first()

        if not session:
            raise credentials_exception

        return user

    except Exception:
        raise credentials_exception

def get_csrf_token(user: User = Depends(get_current_user)):
    return generate_csrf_token(user.id)

@app.get("/api/auth/csrf")
async def get_csrf_token_public():
    """Endpoint para obter CSRF token inicial (para login/register)"""
    temp_user_id = f"temp_{secrets.token_urlsafe(16)}"
    csrf_token = generate_csrf_token(temp_user_id)

    return {
        "csrf_token": csrf_token,
        "expires_in": settings.CSRF_TOKEN_EXPIRE_SECONDS
    }

@app.post("/api/auth/register", response_model=TokenResponse)
def register_user(
    user: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    csrf_token = request.headers.get("X-CSRF-Token")
    if not csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token necessário"
        )

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado"
        )

    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome de usuário já existe"
        )

    hashed_password = get_password_hash(user.password)
    new_user = User(
        id=generate_uuid(),
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        created_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    style_profile = StyleProfile(
        id=generate_uuid(),
        user_id=new_user.id,
        preferred_styles=["casual"],
        preferred_colors=[],
        avoided_colors=[],
        color_palette=[]
    )
    db.add(style_profile)

    access_token = create_access_token(data={"sub": new_user.id})
    refresh_token = create_refresh_token(data={"sub": new_user.id})

    access_token_data = verify_access_token(access_token)
    refresh_token_data = verify_refresh_token(refresh_token)

    session = UserSession(
        id=generate_uuid(),
        user_id=new_user.id,
        access_token_jti=access_token_data.get("jti"),
        refresh_token_jti=refresh_token_data.get("jti"),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        is_active=True,
        created_at=datetime.utcnow(),
        last_activity=datetime.utcnow()
    )
    db.add(session)

    db.commit()

    csrf_token = generate_csrf_token(new_user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token
    }

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(
    login: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    if not login.csrf_token:
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token necessário"
            )

    client_ip = request.client.host
    login_key = f"login_attempts_{client_ip}"

    if not rate_limiter.is_allowed(f"login_{client_ip}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUISITIONS,
            detail="Muitas tentativas de login. Tente novamente em alguns minutos."
        )

    user = db.query(User).filter(User.email == login.email).first()
    if not user or not verify_password(login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )

    user.last_login = datetime.utcnow()


    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    access_token_data = verify_access_token(access_token)
    refresh_token_data = verify_refresh_token(refresh_token)

    session = UserSession(
        id=generate_uuid(),
        user_id=user.id,
        access_token_jti=access_token_data.get("jti"),
        refresh_token_jti=refresh_token_data.get("jti"),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        is_active=True,
        created_at=datetime.utcnow(),
        last_activity=datetime.utcnow()
    )
    db.add(session)

    db.commit()

    csrf_token = generate_csrf_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token
    }

@app.post("/api/auth/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_request: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    token_data = verify_refresh_token(refresh_request.refresh_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado"
        )

    user_id = token_data.get("sub")
    token_jti = token_data.get("jti")

    session = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.refresh_token_jti == token_jti,
        UserSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token não encontrado na sessão"
        )

    session.is_active = False
    session.ended_at = datetime.utcnow()

    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})

    access_token_data = verify_access_token(access_token)
    refresh_token_data = verify_refresh_token(refresh_token)

    new_session = UserSession(
        id=generate_uuid(),
        user_id=user_id,
        access_token_jti=access_token_data.get("jti"),
        refresh_token_jti=refresh_token_data.get("jti"),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        is_active=True,
        created_at=datetime.utcnow(),
        last_activity=datetime.utcnow()
    )
    db.add(new_session)

    db.commit()

    csrf_token = generate_csrf_token(user_id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token
    }

@app.post("/api/auth/logout")
def logout_user(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).update({
        "is_active": False,
        "ended_at": datetime.utcnow()
    })

    db.commit()

    return {"message": "Logout realizado com sucesso"}

@app.get("/api/auth/sessions")
def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna todas as sessões ativas do usuário"""
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).order_by(UserSession.created_at.desc()).all()

    return {"sessions": sessions}

@app.post("/api/auth/sessions/{session_id}/revoke")
def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoga uma sessão específica"""
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sessão não encontrada"
        )

    session.is_active = False
    session.ended_at = datetime.utcnow()

    db.commit()

    return {"message": "Sessão revogada com sucesso"}

@app.get("/api/profile", response_model=UserResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    csrf_token: str = Depends(get_csrf_token)
):
    response = UserResponse.from_orm(current_user)
    return response

@app.put("/api/profile")
def update_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    for field, value in profile_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {"message": "Perfil atualizado com sucesso", "user": current_user}

@app.post("/api/closet/upload")
async def upload_clothing_item(
    file: UploadFile = File(...),
    category: str = Form("uncategorized"),
    subcategory: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    file.file.seek(0, 2)  # Vai para o final do arquivo
    file_size = file.file.tell()
    file.file.seek(0)  # Volta para o início

    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Arquivo muito grande. Tamanho máximo: {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
        )

    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipo de arquivo não suportado. Tipos permitidos: {', '.join(allowed_types)}"
        )

    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    item_id = generate_uuid()

    safe_filename = f"{item_id}.{file_extension}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    processed_data = await recommendation_engine.process_clothing_image(file_path)

    clothing_item = ClothingItem(
        id=item_id,
        user_id=current_user.id,
        category=category,
        subcategory=subcategory or processed_data.get("subcategory", "uncategorized"),
        color=color or processed_data.get("color", "unknown"),
        color_hex=processed_data.get("color", "#808080"),
        image_url=f"/uploads/{safe_filename}",
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
    csrf_token: str = Depends(get_csrf_token)
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

    if item.image_url:
        image_path = item.image_url.replace("/uploads/", f"{settings.UPLOAD_DIR}/")
        if os.path.exists(image_path):
            os.remove(image_path)

    db.delete(item)
    db.commit()

    return {"message": "Item removido com sucesso"}

@app.get("/api/outfits/daily")
def get_daily_outfits(
    weather: str = Query("moderate"),
    occasion: str = Query("casual"),
    temperature: int = Query(24),
    current_user: User = Depends(get_current_user),
    csrf_token: str = Depends(get_csrf_token),
    db: Session = Depends(get_db)
):
    items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()

    if not items:
        return {"outfits": [], "message": "Adicione peças ao seu guarda-roupa primeiro"}

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

    outfits = recommendation_engine.generate_daily_outfit(
        items_dict, weather, occasion, temperature
    )

    return {
        "outfits": outfits,
        "weather": weather,
        "occasion": occasion,
        "temperature": temperature,
        "greeting": f"Bom dia, {current_user.username}. Hoje faz {temperature}°C",
        "csrf_token": csrf_token  # Novo token para próxima requisição
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

@app.post("/api/chat/message")
async def send_chat_message(
    message: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    user_message = ChatMessage(
        id=generate_uuid(),
        user_id=current_user.id,
        content=message.content,
        is_user=True,
        message_type=message.message_type,
        created_at=datetime.utcnow()
    )
    db.add(user_message)

    ai_response_content = "Olá! Sou sua stylist virtual. Como posso ajudar você hoje?"
    ai_response_data = {
        "type": "greeting",
        "options": ["montar_look", "combinar_peças", "analisar_guarda_roupa", "dicas_estilo"]
    }

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

@app.get("/api/shopping/recommendations")
def get_shopping_recommendations(
    current_user: User = Depends(get_current_user),
    csrf_token: str = Depends(get_csrf_token),
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
        "analysis_date": datetime.utcnow(),
        "csrf_token": csrf_token
    }

@app.get("/api/stats")
def get_user_stats(
    current_user: User = Depends(get_current_user),
    csrf_token: str = Depends(get_csrf_token),
    db: Session = Depends(get_db)
):
    items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()

    categories = {}
    for item in items:
        cat = item.category
        categories[cat] = categories.get(cat, 0) + 1

    saved_outfits = db.query(Outfit).filter(Outfit.user_id == current_user.id).count()

    chat_messages = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).count()

    total_value = sum(item.price for item in items if item.price)

    active_sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).count()

    return {
        "total_items": len(items),
        "categories": categories,
        "saved_outfits": saved_outfits,
        "chat_messages": chat_messages,
        "total_value": total_value,
        "active_sessions": active_sessions,
        "member_since": current_user.created_at,
        "csrf_token": csrf_token
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "security": {
            "csrf_enabled": True,
            "jwt_enabled": True,
            "rate_limiting": True
        }
    }

@app.on_event("startup")
def on_startup():
    init_db()

    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@closset.com").first()
        if not demo_user:
            hashed_password = get_password_hash("Demo@123")  # Senha mais segura
            demo_user = User(
                id=generate_uuid(),
                username="demo",
                email="demo@closset.com",
                hashed_password=hashed_password,
                style_preference="casual",
                skin_tone="medium",
                created_at=datetime.utcnow()
            )
            db.add(demo_user)
            db.commit()

            style_profile = StyleProfile(
                id=generate_uuid(),
                user_id=demo_user.id,
                preferred_styles=["casual", "modern"],
                preferred_colors=["#4169E1", "#8B0000", "#FFFFFF"],
                avoided_colors=["#FFD700", "#00FF00"],
                color_palette=["#FFFFFF", "#000000", "#4169E1", "#8B0000"]
            )
            db.add(style_profile)
            db.commit()

            print("Usuário de demonstração criado: demo@closset.com / Demo@123")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="key.pem" if os.path.exists("key.pem") else None,
        ssl_certfile="cert.pem" if os.path.exists("cert.pem") else None
    )