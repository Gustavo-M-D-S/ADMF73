from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.declarative import declarative_base
import os

# SQLite para desenvolvimento
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./closset.db")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=True  # Mostra SQL no console (útil para debug)
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
    # Importar todos os modelos aqui para garantir que sejam registrados
    from models import User, ClothingItem, Outfit
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas criadas com sucesso")
