"""
ML model management: training, loading, saving, prediction.
Uses RandomForestClassifier from scikit-learn.
"""
import os
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Dict, Optional

logger = logging.getLogger(__name__)

FEATURES = ["age", "income", "credit_score", "employment_years", "loan_amount"]
MODEL_DIR = os.getenv("MODEL_DIR", "./saved_models")


def get_model_path(version: str) -> str:
    return os.path.join(MODEL_DIR, f"model_{version}.joblib")


def get_scaler_path(version: str) -> str:
    return os.path.join(MODEL_DIR, f"scaler_{version}.joblib")


def train_model(df: pd.DataFrame, version: str) -> Dict:
    """
    Train a RandomForest on the provided dataframe.
    Returns metrics dict.
    """
    os.makedirs(MODEL_DIR, exist_ok=True)

    X = df[FEATURES].values
    y = df["approved"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scale features
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    # Train
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train_s, y_train)

    # Evaluate
    y_pred = clf.predict(X_test_s)
    acc = float(accuracy_score(y_test, y_pred))
    f1  = float(f1_score(y_test, y_pred))

    # Persist
    joblib.dump(clf,    get_model_path(version))
    joblib.dump(scaler, get_scaler_path(version))

    logger.info(f"Model {version} trained — acc={acc:.4f}, f1={f1:.4f}, rows={len(df)}")

    return {
        "version":       version,
        "accuracy":      acc,
        "f1_score":      f1,
        "training_rows": len(df),
        "feature_importances": dict(zip(FEATURES, clf.feature_importances_.tolist()))
    }


def load_model(version: str) -> Tuple[RandomForestClassifier, StandardScaler]:
    """Load a saved model + scaler by version string."""
    clf    = joblib.load(get_model_path(version))
    scaler = joblib.load(get_scaler_path(version))
    return clf, scaler


def predict(
    clf: RandomForestClassifier,
    scaler: StandardScaler,
    features: Dict[str, float]
) -> Tuple[int, float, Dict[str, float]]:
    """
    Run inference on a single sample.
    Returns (prediction, confidence, explanation).
    Explanation = per-feature contribution via mean decrease impurity.
    """
    row = np.array([[features[f] for f in FEATURES]])
    row_s = scaler.transform(row)

    pred       = int(clf.predict(row_s)[0])
    proba      = clf.predict_proba(row_s)[0]
    confidence = float(max(proba))

    # Simple explanation: feature importance × normalised feature value
    importances = clf.feature_importances_
    row_norm    = (row_s[0] - row_s[0].min()) / (row_s[0].max() - row_s[0].min() + 1e-9)
    contributions = {
        f: round(float(importances[i] * row_norm[i]), 4)
        for i, f in enumerate(FEATURES)
    }

    return pred, confidence, contributions


def list_saved_versions() -> list:
    """Return sorted list of saved model version strings."""
    if not os.path.exists(MODEL_DIR):
        return []
    files = os.listdir(MODEL_DIR)
    versions = [
        f.replace("model_", "").replace(".joblib", "")
        for f in files if f.startswith("model_") and f.endswith(".joblib")
    ]
    return sorted(versions)
