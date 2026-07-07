"""
Performance Monitor - Computes classification and regression metrics
from stored inference logs.
"""
import logging
from typing import Dict, Literal

import numpy as np
from sqlalchemy.orm import Session

from database.models import InferenceLog

logger = logging.getLogger(__name__)

TaskType = Literal["classification", "regression"]


def monitor_model_performance(
    model_id: int,
    db: Session,
    task_type: TaskType = "classification",
    lookback_limit: int = 1000,
) -> Dict:
    """
    Compute performance metrics for a model using its most recent inference logs.

    Only rows that contain a ground-truth ``actual`` value are included in
    supervised metric calculations, so partial feedback data is handled
    gracefully without crashing scikit-learn.

    Args:
        model_id:       Database ID of the model to evaluate.
        db:             Active SQLAlchemy session.
        task_type:      ``"classification"`` or ``"regression"``.
        lookback_limit: Maximum number of recent logs to analyse (default 1 000).

    Returns:
        Dictionary of metric names → values, or ``{"error": "..."}`` on failure.
    """
    try:
        logs = (
            db.query(InferenceLog)
            .filter(InferenceLog.model_id == model_id)
            .order_by(InferenceLog.timestamp.desc())
            .limit(lookback_limit)
            .all()
        )

        if not logs:
            logger.warning("No inference logs found for model_id=%d.", model_id)
            return {"error": "No inference logs found for this model."}

        predictions_all, actuals_all, confidences = [], [], []

        for log in logs:
            pred = log.prediction.get("prediction")
            actual = log.prediction.get("actual")
            if pred is not None:
                predictions_all.append(pred)
                actuals_all.append(actual)
            confidences.append(log.confidence)

        metrics: Dict = {}

        # ── Supervised metrics (only where ground-truth exists) ────────────
        labeled_pairs = [
            (p, a) for p, a in zip(predictions_all, actuals_all) if a is not None
        ]
        if labeled_pairs:
            preds_labeled = [p for p, _ in labeled_pairs]
            actuals_labeled = [a for _, a in labeled_pairs]

            if task_type == "classification":
                from sklearn.metrics import (
                    accuracy_score, f1_score, precision_score, recall_score,
                )
                metrics.update({
                    "accuracy":  round(accuracy_score(actuals_labeled, preds_labeled), 4),
                    "precision": round(precision_score(actuals_labeled, preds_labeled, average="weighted", zero_division=0), 4),
                    "recall":    round(recall_score(actuals_labeled, preds_labeled, average="weighted", zero_division=0), 4),
                    "f1_score":  round(f1_score(actuals_labeled, preds_labeled, average="weighted", zero_division=0), 4),
                    "labeled_sample_size": len(labeled_pairs),
                })
            else:
                from sklearn.metrics import (
                    mean_absolute_error, mean_squared_error, r2_score,
                )
                metrics.update({
                    "mse": round(mean_squared_error(actuals_labeled, preds_labeled), 6),
                    "mae": round(mean_absolute_error(actuals_labeled, preds_labeled), 6),
                    "r2":  round(r2_score(actuals_labeled, preds_labeled), 4),
                    "labeled_sample_size": len(labeled_pairs),
                })
        else:
            logger.info(
                "No ground-truth labels found for model_id=%d — skipping supervised metrics.",
                model_id,
            )
            metrics["labeled_sample_size"] = 0

        # ── Confidence metrics (always available) ──────────────────────────
        if confidences:
            metrics.update({
                "total_predictions":    len(logs),
                "avg_confidence":       round(float(np.mean(confidences)), 4),
                "confidence_std":       round(float(np.std(confidences)), 4),
                "min_confidence":       round(float(np.min(confidences)), 4),
                "max_confidence":       round(float(np.max(confidences)), 4),
                "low_confidence_ratio": round(
                    sum(c < 0.5 for c in confidences) / len(confidences), 4
                ),
            })

        logger.info(
            "Performance metrics computed for model_id=%d (%d logs).",
            model_id, len(logs),
        )
        return metrics

    except Exception:
        logger.exception("Failed to compute performance metrics for model_id=%d.", model_id)
        return {"error": "Failed to compute performance metrics. See server logs."}
