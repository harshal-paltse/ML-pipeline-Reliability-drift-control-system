from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Model
import os
from datetime import datetime

router = APIRouter()

@router.post("/deploy")
async def deploy_model(
    name: str,
    version: str,
    metrics: dict,
    model_path: str,
    db: Session = Depends(get_db)
):
    """Deploy a new model version"""
    # Check if model exists
    existing = db.query(Model).filter(Model.version == version).first()
    if existing:
        raise HTTPException(status_code=400, detail="Model version already exists")

    # Deactivate current active model
    active_model = db.query(Model).filter(Model.is_active == 1).first()
    if active_model:
        active_model.is_active = 0

    # Create new model
    model = Model(
        name=name,
        version=version,
        path=model_path,
        metrics=metrics,
        is_active=1
    )
    db.add(model)
    db.commit()

    return {"message": "Model deployed successfully", "model_id": model.id}

@router.post("/rollback/{model_id}")
async def rollback_model(model_id: int, db: Session = Depends(get_db)):
    """Rollback to a previous model version"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Deactivate current active model
    active_model = db.query(Model).filter(Model.is_active == 1).first()
    if active_model:
        active_model.is_active = 0

    # Activate target model
    model.is_active = 1
    db.commit()

    return {"message": f"Rolled back to model {model.version}"}

@router.get("/")
async def list_models(db: Session = Depends(get_db)):
    """List all models"""
    models = db.query(Model).all()
    return [{"id": m.id, "name": m.name, "version": m.version,
             "is_active": bool(m.is_active), "created_at": m.created_at} for m in models]

@router.get("/active")
async def get_active_model(db: Session = Depends(get_db)):
    """Get currently active model"""
    model = db.query(Model).filter(Model.is_active == 1).first()
    if not model:
        raise HTTPException(status_code=404, detail="No active model found")

    return {"id": model.id, "name": model.name, "version": model.version,
            "metrics": model.metrics}