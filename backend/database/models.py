from sqlalchemy import Column, Integer, String, DateTime, Float, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String)  # 'training' or 'inference'
    path = Column(String)  # Path to Parquet file
    created_at = Column(DateTime, default=datetime.utcnow)
    dataset_metadata = Column(JSON)  # Additional metadata

class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    version = Column(String, unique=True, index=True)
    path = Column(String)  # Path to model artifact
    metrics = Column(JSON)  # Performance metrics
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Integer, default=0)  # 1 for active, 0 for inactive

class InferenceLog(Base):
    __tablename__ = "inference_logs"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"))
    input_data = Column(JSON)
    prediction = Column(JSON)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    model = relationship("Model")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # 'drift', 'performance', 'data_quality'
    severity = Column(String)  # 'low', 'medium', 'high', 'critical'
    message = Column(Text)
    details = Column(JSON)
    status = Column(String, default="active")  # 'active', 'resolved'
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    value = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True)

    model = relationship("Model")