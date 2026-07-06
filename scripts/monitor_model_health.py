#!/usr/bin/env python3
"""
Model Health Monitoring Script

Monitors model performance, confidence decay, and feature importance changes.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.monitoring.performance_monitor import monitor_model_performance
from backend.alerts.alert_manager import alert_manager
from backend.database.connection import SessionLocal
from backend.database.models import Alert, Model
import logging
import json
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/model_health_monitor.log'),
        logging.StreamHandler()
    ]
)

def main():
    logging.info("Starting model health monitoring check")

    try:
        db = SessionLocal()

        # Get active model
        active_model = db.query(Model).filter(Model.is_active == 1).first()
        if not active_model:
            logging.warning("No active model found")
            return

        logging.info(f"Monitoring model: {active_model.name} v{active_model.version}")

        # Monitor performance
        performance_metrics = monitor_model_performance(active_model.id, db)

        if "error" in performance_metrics:
            logging.error(f"Failed to monitor performance: {performance_metrics['error']}")
            return

        # Check for performance degradation
        accuracy = performance_metrics.get('accuracy', 1.0)
        baseline_accuracy = active_model.metrics.get('accuracy', 0.9)  # From deployment

        degradation_threshold = 0.05  # 5% degradation
        if accuracy < baseline_accuracy - degradation_threshold:
            logging.warning(f"Performance degradation detected: {accuracy:.3f} vs baseline {baseline_accuracy:.3f}")

            alert = Alert(
                type="performance",
                severity="high",
                message=f"Model performance degraded by {(baseline_accuracy - accuracy)*100:.1f}%",
                details={
                    "current_accuracy": accuracy,
                    "baseline_accuracy": baseline_accuracy,
                    "degradation": baseline_accuracy - accuracy,
                    "model_id": active_model.id
                }
            )
            db.add(alert)
            db.commit()

            alert_manager.handle_alert(
                "performance",
                "high",
                {
                    "model_name": active_model.name,
                    "current_accuracy": accuracy,
                    "baseline_accuracy": baseline_accuracy
                }
            )

        # Check confidence decay
        avg_confidence = performance_metrics.get('avg_confidence', 1.0)
        low_confidence_ratio = performance_metrics.get('low_confidence_ratio', 0.0)

        if low_confidence_ratio > 0.3:  # 30% of predictions have low confidence
            logging.warning(f"High ratio of low confidence predictions: {low_confidence_ratio:.2%}")

            alert = Alert(
                type="confidence_decay",
                severity="medium",
                message=f"High ratio of low confidence predictions: {low_confidence_ratio:.1%}",
                details={
                    "avg_confidence": avg_confidence,
                    "low_confidence_ratio": low_confidence_ratio,
                    "model_id": active_model.id
                }
            )
            db.add(alert)
            db.commit()

        logging.info(f"Model health check completed. Metrics: {json.dumps(performance_metrics, indent=2)}")

        db.close()

    except Exception as e:
        logging.error(f"Error during model health monitoring: {str(e)}")
        alert_manager.handle_alert(
            "monitoring_failure",
            "critical",
            {"error": str(e), "component": "model_health_monitor"}
        )

if __name__ == "__main__":
    main()