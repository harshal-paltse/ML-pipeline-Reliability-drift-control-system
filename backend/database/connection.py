from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base
import os
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ml_monitoring.db")

# SQLite requires check_same_thread=False; other databases don't support it
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Yield a database session and ensure it's closed after use."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def create_tables():
    """Create all database tables from ORM models."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")