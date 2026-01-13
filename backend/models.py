from sqlalchemy import Column, String, Integer, JSON, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    style_preferences = Column(JSON, default={})
    is_active = Column(Boolean, default=True)

class ClothingItem(Base):
    __tablename__ = "clothing_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True)
    name = Column(String, nullable=True)
    category = Column(String, index=True)
    subcategory = Column(String, nullable=True)
    color = Column(String)
    brand = Column(String, nullable=True)
    size = Column(String, nullable=True)
    season = Column(String, default="all")
    tags = Column(JSON, default=[])
    image_url = Column(String)
    thumbnail_url = Column(String, nullable=True)
    features = Column(JSON, default={})
    wear_count = Column(Integer, default=0)
    last_worn = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Outfit(Base):
    __tablename__ = "outfits"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True)
    name = Column(String, nullable=True)
    occasion = Column(String, default="casual")
    weather = Column(String, default="moderate")
    items = Column(JSON)  # Lista de IDs das peças
    rating = Column(Integer, nullable=True)  # 1-5
    worn_count = Column(Integer, default=0)
    last_worn = Column(DateTime, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)