from sqlalchemy import Column, String, Integer, JSON, DateTime, Boolean, Float, Text, ForeignKey
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

    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    gender = Column(String, nullable=True)
    body_type = Column(String, nullable=True)
    style_preference = Column(String, default="casual")
    skin_tone = Column(String, nullable=True)
    skin_undertone = Column(String, nullable=True)
    color_season = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    password_reset_token = Column(String, nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True)

    access_token_jti = Column(String, index=True)  # JWT ID do access token
    refresh_token_jti = Column(String, index=True)  # JWT ID do refresh token

    ip_address = Column(String)
    user_agent = Column(Text)
    device_info = Column(JSON, nullable=True)
    location = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True)

    category = Column(String)
    subcategory = Column(String, nullable=True)

    color = Column(String)
    color_hex = Column(String)
    fabric = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    occasion = Column(JSON)
    season = Column(JSON)

    image_url = Column(String)
    processed_features = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_worn = Column(DateTime, nullable=True)
    wear_count = Column(Integer, default=0)

    is_sustainable = Column(Boolean, default=False)
    origin = Column(String, nullable=True)

class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    name = Column(String, default="Look do Dia")

    item_ids = Column(JSON)

    occasion = Column(String)
    weather = Column(String)
    temperature = Column(Integer, nullable=True)
    style = Column(String)

    rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    saved_at = Column(DateTime, default=datetime.utcnow)
    last_worn = Column(DateTime, nullable=True)

class StyleProfile(Base):
    __tablename__ = "style_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, index=True)

    preferred_colors = Column(JSON)
    avoided_colors = Column(JSON)
    preferred_styles = Column(JSON)
    preferred_fabrics = Column(JSON)

    color_season = Column(String)
    color_palette = Column(JSON)

    shopping_habits = Column(JSON)
    budget_range = Column(JSON)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True)

    content = Column(Text)
    is_user = Column(Boolean)
    message_type = Column(String)

    ai_response = Column(JSON, nullable=True)

    ip_address = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

class SecurityAudit(Base):
    __tablename__ = "security_audit"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=True)

    event_type = Column(String)  # login_success, login_failed, logout, password_change, etc.
    description = Column(Text)

    ip_address = Column(String)
    user_agent = Column(Text)
    endpoint = Column(String)
    method = Column(String)

    is_success = Column(Boolean)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
2. ATUALIZAÇÕES NO FRONTEND