"""
Health API - Returns model health scores
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Model
from services.health_monitor import health_monitor

router = APIRouter()

@router.get("/score")
async def get_health_score(db: Session = Depends(get_db)):
    """
    Get current model health score
    
    Returns:
        {
            "status": "good" | "warning" | "critical",
            "score": float (0-100),
            "metrics": {...},
            "issues": [...]
        }
    """
    # Get active model
    active_model = db.query(Model).filter(Model.is_active == 1).first()
    
    if not active_model:
        raise HTTPException(status_code=404, detail="No active model found")
    
    health = health_monitor.calculate_health_score(active_model.id, db)
    return health

@router.get("/status")
async def get_health_status(db: Session = Depends(get_db)):
    """Get simplified health status"""
    active_model = db.query(Model).filter(Model.is_active == 1).first()
    
    if not active_model:
        return {"status": "no_model", "message": "No active model"}
    
    health = health_monitor.calculate_health_score(active_model.id, db)
    
    return {
        "status": health["status"],
        "score": health["score"],
        "message": f"Model health is {health['status'].upper()}"
    }
