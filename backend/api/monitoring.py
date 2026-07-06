from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Metric, Alert
from monitoring.drift_detector import detect_data_drift
from monitoring.performance_monitor import monitor_model_performance
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/drift")
async def get_drift_metrics(db: Session = Depends(get_db)):
    """Get current data drift metrics"""
    # Run drift detection
    drift_results = detect_data_drift()

    # Store metrics
    for metric_name, value in drift_results.items():
        metric = Metric(name=f"drift_{metric_name}", value=value)
        db.add(metric)

    db.commit()

    return drift_results

@router.get("/performance/{model_id}")
async def get_model_performance(model_id: int, db: Session = Depends(get_db)):
    """Get model performance metrics"""
    performance_metrics = monitor_model_performance(model_id, db=db)

    # Store metrics
    for metric_name, value in performance_metrics.items():
        metric = Metric(name=f"perf_{metric_name}", value=value, model_id=model_id)
        db.add(metric)

    db.commit()

    return performance_metrics

@router.post("/check")
async def run_monitoring_checks(db: Session = Depends(get_db)):
    """Run all monitoring checks and create alerts if needed"""
    alerts_created = []

    # Check data drift
    drift_metrics = detect_data_drift()
    if drift_metrics.get('drift_detected', False):
        alert = Alert(
            type="drift",
            severity="high",
            message="Data drift detected",
            details=drift_metrics
        )
        db.add(alert)
        alerts_created.append("drift")

    # Check model performance (for active models)
    # This would need to be implemented based on your specific metrics

    db.commit()

    return {"alerts_created": alerts_created, "message": "Monitoring checks completed"}