from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Dataset, InferenceLog
import pandas as pd
import os
from datetime import datetime

router = APIRouter()

@router.post("/training")
async def upload_training_data(
    file: UploadFile = File(...),
    dataset_name: str = None,
    db: Session = Depends(get_db)
):
    """Upload training data as Parquet file"""
    if not file.filename.endswith('.parquet'):
        raise HTTPException(status_code=400, detail="File must be Parquet format")

    # Save file
    file_path = f"data/training/{dataset_name or file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Store metadata in DB
    dataset = Dataset(
        name=dataset_name or file.filename,
        type="training",
        path=file_path,
        dataset_metadata={"size": len(content), "uploaded_at": datetime.utcnow().isoformat()}
    )
    db.add(dataset)
    db.commit()

    return {"message": "Training data uploaded successfully", "dataset_id": dataset.id}

@router.post("/inference")
async def log_inference(
    input_data: dict,
    prediction: dict,
    confidence: float,
    model_id: int,
    db: Session = Depends(get_db)
):
    """Log inference data"""
    log = InferenceLog(
        model_id=model_id,
        input_data=input_data,
        prediction=prediction,
        confidence=confidence
    )
    db.add(log)
    db.commit()

    return {"message": "Inference logged successfully", "log_id": log.id}

@router.get("/inference/{model_id}")
async def get_inference_logs(
    model_id: int,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get recent inference logs for a model"""
    logs = db.query(InferenceLog).filter(InferenceLog.model_id == model_id)\
        .order_by(InferenceLog.timestamp.desc()).limit(limit).all()

    return [{"id": log.id, "input": log.input_data, "prediction": log.prediction,
             "confidence": log.confidence, "timestamp": log.timestamp} for log in logs]