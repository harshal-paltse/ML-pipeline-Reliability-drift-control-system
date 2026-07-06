"""
Database configuration and table definitions using SQLAlchemy.
Auto-falls back to SQLite when PostgreSQL is unavailable.
"""
import os
import logging
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, Float, String,
    DateTime, Boolean, Text, JSON, text
)
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://mluser:mlpassword@db:5432/mlpipeline")


def _make_engine():
    if DATABASE_URL.startswith("postgresql"):
        try:
            import psycopg2  # noqa
            eng = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20, echo=False)
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Connected to PostgreSQL.")
            return eng
        except Exception as e:
            logger.warning(f"PostgreSQL unavailable ({e}). Falling back to SQLite.")
    sqlite_path = os.path.join(os.path.dirname(__file__), "ml_platform.db")
    logger.info(f"Using SQLite: {sqlite_path}")
    return create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False}, echo=False)


engine       = _make_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


# ── Tables ────────────────────────────────────────────────────────────────────

class User(Base):
    """Platform users with role-based access."""
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(80), unique=True, index=True, nullable=False)
    email         = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role          = Column(String(20), default="analyst")   # admin | analyst | viewer
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    last_login    = Column(DateTime, nullable=True)


class ApiKey(Base):
    """Live API keys for external model prediction access."""
    __tablename__ = "api_keys"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, nullable=False)
    name          = Column(String(100), nullable=False)
    key_hash      = Column(String(255), unique=True, nullable=False)
    key_prefix    = Column(String(12), nullable=False)   # shown in UI e.g. "mlk_abc123"
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    last_used     = Column(DateTime, nullable=True)
    request_count = Column(Integer, default=0)


class UploadedModel(Base):
    """Externally uploaded .joblib / .pkl models."""
    __tablename__ = "uploaded_models"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    version       = Column(String(50), unique=True, index=True)
    filename      = Column(String(255), nullable=False)
    file_path     = Column(String(500), nullable=False)
    scaler_path   = Column(String(500), nullable=True)
    feature_names = Column(JSON, nullable=False)          # list of feature names
    model_type    = Column(String(50), nullable=True)     # RandomForest, XGBoost, etc.
    uploaded_by   = Column(Integer, nullable=True)
    uploaded_at   = Column(DateTime, default=datetime.utcnow)
    is_active     = Column(Boolean, default=False)
    accuracy      = Column(Float, nullable=True)
    notes         = Column(Text, nullable=True)


class PredictionLog(Base):
    __tablename__ = "prediction_logs"
    id               = Column(Integer, primary_key=True, index=True)
    timestamp        = Column(DateTime, default=datetime.utcnow, index=True)
    age              = Column(Float)
    income           = Column(Float)
    credit_score     = Column(Float)
    employment_years = Column(Float)
    loan_amount      = Column(Float)
    prediction       = Column(Integer)
    confidence       = Column(Float)
    model_version    = Column(String(50))
    is_drift_injected = Column(Boolean, default=False)
    api_key_id       = Column(Integer, nullable=True)    # which API key was used


class MonitoringMetric(Base):
    __tablename__ = "monitoring_metrics"
    id               = Column(Integer, primary_key=True, index=True)
    timestamp        = Column(DateTime, default=datetime.utcnow, index=True)
    health_score     = Column(Float)
    drift_score      = Column(Float)
    failure_score    = Column(Float)
    confidence_score = Column(Float)
    importance_score = Column(Float)
    prediction_count = Column(Integer)
    drift_details    = Column(JSON)
    feature_failures = Column(JSON)


class Alert(Base):
    __tablename__ = "alerts"
    id        = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    level     = Column(String(20))
    category  = Column(String(50))
    message   = Column(Text)
    resolved  = Column(Boolean, default=False)


class ModelRegistry(Base):
    __tablename__ = "model_registry"
    id            = Column(Integer, primary_key=True, index=True)
    version       = Column(String(50), unique=True, index=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    accuracy      = Column(Float)
    f1_score      = Column(Float)
    training_rows = Column(Integer)
    is_active     = Column(Boolean, default=False)
    model_path    = Column(String(255))
    notes         = Column(Text)


class PipelineAnalysis(Base):
    """
    Stores the full analysis report for an uploaded model:
    bugs found, conflicts, quality score, and the rewritten pipeline code.
    Like a GitHub commit — every upload gets a full analysis snapshot.
    """
    __tablename__ = "pipeline_analyses"
    id              = Column(Integer, primary_key=True, index=True)
    uploaded_model_id = Column(Integer, nullable=False, index=True)
    created_at      = Column(DateTime, default=datetime.utcnow, index=True)
    created_by      = Column(Integer, nullable=True)          # user id

    # Scores (0–100)
    overall_score   = Column(Float, default=0.0)
    code_quality    = Column(Float, default=0.0)
    data_quality    = Column(Float, default=0.0)
    model_health    = Column(Float, default=0.0)
    pipeline_score  = Column(Float, default=0.0)

    # Issues
    bugs            = Column(JSON, default=list)       # list of {severity, category, title, detail, fix}
    conflicts       = Column(JSON, default=list)       # list of {type, description, resolution}
    warnings        = Column(JSON, default=list)       # list of {category, message}
    suggestions     = Column(JSON, default=list)       # list of {priority, title, detail}

    # Model introspection
    model_type      = Column(String(100))
    hyperparameters = Column(JSON, default=dict)
    feature_stats   = Column(JSON, default=dict)       # per-feature stats
    class_balance   = Column(JSON, default=dict)

    # Rewritten pipeline
    rewritten_code  = Column(Text)                     # full Python pipeline code
    rewrite_summary = Column(Text)                     # human-readable summary of changes
    diff_lines      = Column(JSON, default=list)       # list of {type: add/remove/keep, line}

    # Status
    status          = Column(String(20), default="pending")  # pending|running|done|failed
    error_message   = Column(Text, nullable=True)


class PipelineVersion(Base):
    """
    Git-like version history for pipeline code.
    Every rewrite creates a new version entry.
    """
    __tablename__ = "pipeline_versions"
    id            = Column(Integer, primary_key=True, index=True)
    analysis_id   = Column(Integer, nullable=False, index=True)
    model_id      = Column(Integer, nullable=False, index=True)
    version_tag   = Column(String(50), nullable=False)   # e.g. "v1.0", "v1.1-fix"
    commit_hash   = Column(String(16), nullable=False)   # short hash
    commit_msg    = Column(String(255))
    author        = Column(String(80))
    created_at    = Column(DateTime, default=datetime.utcnow, index=True)
    code          = Column(Text)
    is_latest     = Column(Boolean, default=True)
    parent_hash   = Column(String(16), nullable=True)    # previous version hash
    changes_count = Column(Integer, default=0)           # lines changed


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialised.")
