"""
Core monitoring logic:
  - Data drift detection (KS test + mean difference)
  - Feature failure detection (null rate, unique value count)
  - Prediction confidence tracking
  - Model Health Score calculation
  - Alert generation
"""
import logging
import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, List, Tuple, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from database import PredictionLog, MonitoringMetric, Alert

logger = logging.getLogger(__name__)

FEATURES = ["age", "income", "credit_score", "employment_years", "loan_amount"]

# Health score weights (must sum to 1.0)
WEIGHT_DRIFT      = 0.40
WEIGHT_FAILURE    = 0.30
WEIGHT_CONFIDENCE = 0.20
WEIGHT_IMPORTANCE = 0.10

DRIFT_THRESHOLD   = 0.05   # KS p-value below this = drift detected
NULL_THRESHOLD    = 0.40   # >40% nulls = feature failure
UNIQUE_THRESHOLD  = 2      # <2 unique values = feature failure
MIN_SAMPLES       = 30     # minimum live samples needed for drift test


def detect_drift(
    reference: pd.DataFrame,
    live: pd.DataFrame
) -> Tuple[float, List[Dict]]:
    """
    Run KS test on each feature between reference (training) and live (recent) data.
    Returns (aggregate_drift_score 0-1, per_feature_details).
    drift_score = fraction of features that are drifted.
    """
    results = []
    drifted = 0

    for feat in FEATURES:
        ref_vals  = reference[feat].dropna().values
        live_vals = live[feat].dropna().values

        if len(live_vals) < MIN_SAMPLES:
            # Not enough data yet – report no drift
            results.append({
                "feature":      feat,
                "ks_statistic": 0.0,
                "p_value":      1.0,
                "mean_diff":    0.0,
                "is_drifted":   False
            })
            continue

        ks_stat, p_val = stats.ks_2samp(ref_vals, live_vals)
        mean_diff = abs(float(np.mean(live_vals)) - float(np.mean(ref_vals)))
        is_drifted = p_val < DRIFT_THRESHOLD

        if is_drifted:
            drifted += 1

        results.append({
            "feature":      feat,
            "ks_statistic": round(float(ks_stat), 4),
            "p_value":      round(float(p_val), 4),
            "mean_diff":    round(mean_diff, 4),
            "is_drifted":   is_drifted
        })

    drift_score = drifted / len(FEATURES)   # 0 = no drift, 1 = all features drifted
    return drift_score, results


def detect_feature_failures(live: pd.DataFrame) -> Tuple[float, Dict[str, bool]]:
    """
    Check each feature for:
      - null rate > 40%
      - unique values < 2
    Returns (failure_score 0-1, per_feature_flags).
    """
    failures = {}
    failed_count = 0

    for feat in FEATURES:
        col = live[feat]
        null_rate    = col.isnull().mean()
        unique_count = col.nunique()

        is_failed = (null_rate > NULL_THRESHOLD) or (unique_count < UNIQUE_THRESHOLD)
        failures[feat] = bool(is_failed)
        if is_failed:
            failed_count += 1

    failure_score = failed_count / len(FEATURES)
    return failure_score, failures


def compute_confidence_score(db: Session, window_minutes: int = 60) -> float:
    """
    Average prediction confidence over the last `window_minutes`.
    Returns a score 0-1 (higher = better).
    """
    cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
    rows = (
        db.query(PredictionLog.confidence)
        .filter(PredictionLog.timestamp >= cutoff)
        .all()
    )
    if not rows:
        return 1.0   # no data yet → assume healthy
    avg_conf = float(np.mean([r.confidence for r in rows]))
    return avg_conf


def compute_importance_score(
    current_importances: Dict[str, float],
    baseline_importances: Dict[str, float]
) -> float:
    """
    Measure how much feature importances have shifted from baseline.
    Returns a score 0-1 (1 = no shift, 0 = complete reversal).
    Uses cosine similarity between importance vectors.
    """
    feats = FEATURES
    curr = np.array([current_importances.get(f, 0.0) for f in feats])
    base = np.array([baseline_importances.get(f, 0.0) for f in feats])

    norm_curr = np.linalg.norm(curr)
    norm_base = np.linalg.norm(base)

    if norm_curr == 0 or norm_base == 0:
        return 1.0

    cosine_sim = float(np.dot(curr, base) / (norm_curr * norm_base))
    return max(0.0, cosine_sim)   # clamp to [0, 1]


def compute_health_score(
    drift_score: float,
    failure_score: float,
    confidence_score: float,
    importance_score: float
) -> float:
    """
    Weighted health score formula:
      health = 100 × (1 - (0.4×drift + 0.3×failure + 0.2×(1-conf) + 0.1×(1-imp)))
    Range: 0 – 100.
    """
    penalty = (
        WEIGHT_DRIFT      * drift_score
        + WEIGHT_FAILURE    * failure_score
        + WEIGHT_CONFIDENCE * (1.0 - confidence_score)
        + WEIGHT_IMPORTANCE * (1.0 - importance_score)
    )
    health = max(0.0, min(100.0, (1.0 - penalty) * 100.0))
    return round(health, 2)


def create_alert(
    db: Session,
    level: str,
    category: str,
    message: str
) -> None:
    """Persist an alert to the database."""
    alert = Alert(
        level=level,
        category=category,
        message=message
    )
    db.add(alert)
    db.commit()
    logger.warning(f"ALERT [{level.upper()}] {category}: {message}")


def run_monitoring_cycle(
    db: Session,
    reference_df: pd.DataFrame,
    active_model_version: str,
    baseline_importances: Dict[str, float],
    current_importances: Dict[str, float]
) -> Dict[str, Any]:
    """
    Full monitoring cycle:
      1. Pull recent live predictions
      2. Detect drift + failures
      3. Compute health score
      4. Persist metric snapshot
      5. Fire alerts if needed
    Returns the monitoring result dict.
    """
    # ── 1. Fetch recent live data (last 500 predictions) ──────────────────────
    recent = (
        db.query(PredictionLog)
        .order_by(PredictionLog.timestamp.desc())
        .limit(500)
        .all()
    )

    if not recent:
        logger.info("No live predictions yet – skipping monitoring cycle.")
        return {}

    live_df = pd.DataFrame([{
        "age":              r.age,
        "income":           r.income,
        "credit_score":     r.credit_score,
        "employment_years": r.employment_years,
        "loan_amount":      r.loan_amount,
        "confidence":       r.confidence
    } for r in recent])

    # ── 2. Drift detection ────────────────────────────────────────────────────
    drift_score, drift_details = detect_drift(reference_df, live_df)

    # ── 3. Feature failure detection ─────────────────────────────────────────
    failure_score, feature_failures = detect_feature_failures(live_df)

    # ── 4. Confidence score ───────────────────────────────────────────────────
    confidence_score = compute_confidence_score(db)

    # ── 5. Importance shift ───────────────────────────────────────────────────
    importance_score = compute_importance_score(current_importances, baseline_importances)

    # ── 6. Health score ───────────────────────────────────────────────────────
    health_score = compute_health_score(
        drift_score, failure_score, confidence_score, importance_score
    )

    # ── 7. Persist snapshot ───────────────────────────────────────────────────
    metric = MonitoringMetric(
        health_score     = health_score,
        drift_score      = round(drift_score, 4),
        failure_score    = round(failure_score, 4),
        confidence_score = round(confidence_score, 4),
        importance_score = round(importance_score, 4),
        prediction_count = len(recent),
        drift_details    = drift_details,
        feature_failures = feature_failures
    )
    db.add(metric)
    db.commit()

    # ── 8. Alerts ─────────────────────────────────────────────────────────────
    if health_score < 50:
        create_alert(db, "critical", "health",
                     f"Model health score dropped to {health_score:.1f} — immediate action required.")

    for d in drift_details:
        if d["is_drifted"]:
            create_alert(db, "warning", "drift",
                         f"Data drift detected on feature '{d['feature']}' "
                         f"(KS={d['ks_statistic']:.3f}, p={d['p_value']:.4f}).")

    for feat, failed in feature_failures.items():
        if failed:
            create_alert(db, "warning", "failure",
                         f"Feature failure on '{feat}': insufficient variance or high null rate.")

    if confidence_score < 0.60:
        create_alert(db, "warning", "confidence",
                     f"Average prediction confidence dropped to {confidence_score*100:.1f}%.")

    result = {
        "health_score":     health_score,
        "drift_score":      drift_score,
        "failure_score":    failure_score,
        "confidence_score": confidence_score,
        "importance_score": importance_score,
        "prediction_count": len(recent),
        "drift_details":    drift_details,
        "feature_failures": feature_failures,
        "timestamp":        datetime.utcnow().isoformat()
    }

    logger.info(
        f"Monitoring cycle complete — health={health_score:.1f}, "
        f"drift={drift_score:.2f}, failures={failure_score:.2f}"
    )
    return result
