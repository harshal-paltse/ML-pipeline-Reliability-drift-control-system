"""
Health Monitor Service - Calculates model health scores and triggers alerts
"""
from sqlalchemy.orm import Session
from database.models import Model, InferenceLog, Alert, Metric
from monitoring.drift_detector import detect_data_drift
from monitoring.performance_monitor import monitor_model_performance
from datetime import datetime, timedelta
from typing import Dict, Optional
import pandas as pd
import numpy as np

class HealthMonitor:
    def __init__(self):
        self.health_thresholds = {
            "good": {
                "drift_score": 0.2,
                "confidence_threshold": 0.7,
                "low_confidence_ratio": 0.1
            },
            "warning": {
                "drift_score": 0.4,
                "confidence_threshold": 0.6,
                "low_confidence_ratio": 0.2
            },
            "critical": {
                "drift_score": 0.6,
                "confidence_threshold": 0.5,
                "low_confidence_ratio": 0.3
            }
        }
    
    def calculate_health_score(self, model_id: int, db: Session) -> Dict:
        """
        Step 5: Calculate health score based on all checks
        
        Returns:
            {
                "status": "good" | "warning" | "critical",
                "score": float (0-100),
                "metrics": {...},
                "issues": [...]
            }
        """
        issues = []
        metrics = {}
        
        # Get active model
        model = db.query(Model).filter(Model.id == model_id).first()
        if not model:
            return {
                "status": "critical",
                "score": 0,
                "message": "Model not found"
            }
        
        # 1. Check recent inference logs
        recent_logs = db.query(InferenceLog).filter(
            InferenceLog.model_id == model_id,
            InferenceLog.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).all()
        
        if not recent_logs:
            return {
                "status": "warning",
                "score": 50,
                "message": "No recent predictions to analyze"
            }
        
        # 2. Calculate average confidence
        confidences = [log.confidence for log in recent_logs]
        avg_confidence = np.mean(confidences) if confidences else 0
        low_confidence_ratio = sum(1 for c in confidences if c < 0.6) / len(confidences) if confidences else 0
        
        metrics["avg_confidence"] = float(avg_confidence)
        metrics["low_confidence_ratio"] = float(low_confidence_ratio)
        
        # Check confidence issues
        if avg_confidence < self.health_thresholds["warning"]["confidence_threshold"]:
            issues.append(f"Low average confidence: {avg_confidence:.2f}")
        if low_confidence_ratio > self.health_thresholds["warning"]["low_confidence_ratio"]:
            issues.append(f"High ratio of low-confidence predictions: {low_confidence_ratio:.2%}")
        
        # 3. Check data drift (simplified - using recent data distribution)
        try:
            # Get recent input data
            recent_inputs = [log.input_data for log in recent_logs[-100:]]  # Last 100 predictions
            
            if len(recent_inputs) >= 10:
                # Calculate drift score based on feature distributions
                df_recent = pd.DataFrame(recent_inputs)
                
                # Simple drift detection: check if feature ranges are unusual
                drift_scores = {}
                for col in df_recent.columns:
                    if df_recent[col].dtype in [np.number]:
                        # Check if values are outside expected ranges
                        mean_val = df_recent[col].mean()
                        std_val = df_recent[col].std()
                        # Simple heuristic: if many values are >3 std away, drift detected
                        outliers = ((df_recent[col] - mean_val).abs() > 3 * std_val).sum()
                        drift_scores[col] = outliers / len(df_recent)
                
                overall_drift = max(drift_scores.values()) if drift_scores else 0
                metrics["drift_score"] = float(overall_drift)
                
                if overall_drift > self.health_thresholds["warning"]["drift_score"]:
                    issues.append(f"Data drift detected: {overall_drift:.2f}")
        except Exception as e:
            metrics["drift_score"] = 0
            issues.append(f"Could not calculate drift: {str(e)}")
        
        # 4. Check for missing features
        sample_input = recent_inputs[0] if recent_inputs else {}
        required_features = ["age", "income", "credit_score"]
        missing_features = [f for f in required_features if f not in sample_input]
        if missing_features:
            issues.append(f"Missing features: {', '.join(missing_features)}")
        
        # 5. Calculate overall health score
        score = 100
        
        # Deduct points for issues
        if avg_confidence < self.health_thresholds["critical"]["confidence_threshold"]:
            score -= 40
        elif avg_confidence < self.health_thresholds["warning"]["confidence_threshold"]:
            score -= 20
        
        if metrics.get("drift_score", 0) > self.health_thresholds["warning"]["drift_score"]:
            score -= 30
        
        if low_confidence_ratio > self.health_thresholds["warning"]["low_confidence_ratio"]:
            score -= 20
        
        if missing_features:
            score -= 30
        
        score = max(0, min(100, score))
        
        # Determine status
        if score >= 80:
            status = "good"
        elif score >= 50:
            status = "warning"
        else:
            status = "critical"
        
        return {
            "status": status,
            "score": score,
            "metrics": metrics,
            "issues": issues,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def check_and_alert(self, model_id: int, db: Session) -> list:
        """
        Step 6: Check health and create alerts if problems found
        
        Returns list of created alerts
        """
        health = self.calculate_health_score(model_id, db)
        alerts_created = []
        
        if health["status"] == "critical":
            # Check if alert already exists
            existing = db.query(Alert).filter(
                Alert.type == "health",
                Alert.status == "active",
                Alert.severity == "critical"
            ).first()
            
            if not existing:
                alert = Alert(
                    type="health",
                    severity="critical",
                    message=f"Model health is CRITICAL (Score: {health['score']})",
                    details={
                        "health_score": health["score"],
                        "status": health["status"],
                        "issues": health["issues"],
                        "metrics": health["metrics"]
                    }
                )
                db.add(alert)
                alerts_created.append("critical_health")
        
        elif health["status"] == "warning":
            existing = db.query(Alert).filter(
                Alert.type == "health",
                Alert.status == "active",
                Alert.severity == "high"
            ).first()
            
            if not existing:
                alert = Alert(
                    type="health",
                    severity="high",
                    message=f"Model health WARNING (Score: {health['score']})",
                    details={
                        "health_score": health["score"],
                        "status": health["status"],
                        "issues": health["issues"],
                        "metrics": health["metrics"]
                    }
                )
                db.add(alert)
                alerts_created.append("warning_health")
        
        # Check for drift
        if health["metrics"].get("drift_score", 0) > self.health_thresholds["warning"]["drift_score"]:
            existing = db.query(Alert).filter(
                Alert.type == "drift",
                Alert.status == "active"
            ).first()
            
            if not existing:
                alert = Alert(
                    type="drift",
                    severity="high",
                    message=f"Data drift detected (Score: {health['metrics']['drift_score']:.2f})",
                    details=health["metrics"]
                )
                db.add(alert)
                alerts_created.append("drift")
        
        # Check for low confidence
        if health["metrics"].get("avg_confidence", 1) < self.health_thresholds["warning"]["confidence_threshold"]:
            existing = db.query(Alert).filter(
                Alert.type == "performance",
                Alert.status == "active",
                Alert.message.like("%confidence%")
            ).first()
            
            if not existing:
                alert = Alert(
                    type="performance",
                    severity="medium",
                    message=f"Low model confidence detected (Avg: {health['metrics']['avg_confidence']:.2f})",
                    details=health["metrics"]
                )
                db.add(alert)
                alerts_created.append("low_confidence")
        
        db.commit()
        return alerts_created

# Global health monitor instance
health_monitor = HealthMonitor()
