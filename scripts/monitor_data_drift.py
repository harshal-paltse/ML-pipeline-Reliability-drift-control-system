#!/usr/bin/env python3
"""
Data Drift Monitoring Script

This script runs periodic checks for data drift and feature failures.
It should be scheduled to run regularly (e.g., via cron or Airflow).
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.monitoring.drift_detector import detect_data_drift
from backend.alerts.alert_manager import alert_manager
from backend.database.connection import SessionLocal
from backend.database.models import Alert
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/drift_monitor.log'),
        logging.StreamHandler()
    ]
)

def main():
    logging.info("Starting data drift monitoring check")

    try:
        # Detect data drift
        drift_results = detect_data_drift()

        if drift_results.get('drift_detected'):
            logging.warning("Data drift detected!")

            # Create alert in database
            db = SessionLocal()
            alert = Alert(
                type="drift",
                severity="high",
                message="Data drift detected in production data",
                details=drift_results
            )
            db.add(alert)
            db.commit()
            db.close()

            # Send notifications
            alert_manager.handle_alert(
                "drift",
                "high",
                drift_results
            )

        else:
            logging.info("No data drift detected")

        # Log results
        logging.info(f"Drift check completed. Results: {json.dumps(drift_results, indent=2)}")

    except Exception as e:
        logging.error(f"Error during drift monitoring: {str(e)}")
        # Send critical alert for monitoring failure
        alert_manager.handle_alert(
            "monitoring_failure",
            "critical",
            {"error": str(e), "component": "drift_monitor"}
        )

if __name__ == "__main__":
    main()