# from evidently import ColumnMapping
# from evidently.report import Report
# from evidently.metrics import ClassificationQualityMetric, RegressionQualityMetric
import pandas as pd
from sqlalchemy.orm import Session
from database.models import InferenceLog
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import numpy as np

def monitor_model_performance(model_id: int, db: Session = None, task_type: str = "classification"):
    """
    Monitor model performance using Evidently and custom metrics
    """
    try:
        # Get recent inference logs
        logs = db.query(InferenceLog).filter(InferenceLog.model_id == model_id)\
            .order_by(InferenceLog.timestamp.desc()).limit(1000).all()

        if not logs:
            return {"error": "No inference logs found for model"}

        # Prepare data
        predictions = []
        actuals = []
        confidences = []

        for log in logs:
            predictions.append(log.prediction.get('prediction'))
            actuals.append(log.prediction.get('actual'))  # Assuming actuals are stored
            confidences.append(log.confidence)

        # Calculate basic metrics
        metrics = {}
        if task_type == "classification":
            metrics.update({
                'accuracy': accuracy_score(actuals, predictions),
                'precision': precision_score(actuals, predictions, average='weighted'),
                'recall': recall_score(actuals, predictions, average='weighted'),
                'f1_score': f1_score(actuals, predictions, average='weighted')
            })
        else:
            # Regression metrics
            from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
            metrics.update({
                'mse': mean_squared_error(actuals, predictions),
                'mae': mean_absolute_error(actuals, predictions),
                'r2': r2_score(actuals, predictions)
            })

        # Confidence decay analysis
        metrics['avg_confidence'] = np.mean(confidences)
        metrics['confidence_std'] = np.std(confidences)
        metrics['low_confidence_ratio'] = sum(c < 0.5 for c in confidences) / len(confidences)

        # Performance trend (compare with previous period)
        # This would require storing historical metrics

        return metrics

    except Exception as e:
        return {"error": str(e)}