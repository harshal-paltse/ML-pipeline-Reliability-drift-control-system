from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Alert
from datetime import datetime

router = APIRouter()

@router.get("/")
async def get_alerts(
    status: str = "active",
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get alerts"""
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

    return [{"id": a.id, "type": a.type, "severity": a.severity,
             "message": a.message, "status": a.status,
             "created_at": a.created_at} for a in alerts]

@router.put("/{alert_id}/resolve")
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Resolve an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "resolved"
    alert.resolved_at = datetime.utcnow()
    db.commit()

    return {"message": "Alert resolved"}

@router.get("/summary")
async def get_alerts_summary(db: Session = Depends(get_db)):
    """Get alerts summary"""
    total = db.query(Alert).count()
    active = db.query(Alert).filter(Alert.status == "active").count()
    critical = db.query(Alert).filter(Alert.severity == "critical", Alert.status == "active").count()

    return {
        "total_alerts": total,
        "active_alerts": active,
        "critical_alerts": critical
    }