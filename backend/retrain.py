"""
Retraining pipeline:
  - Loads training_data.parquet + any live inference parquet files
  - Trains a new model version
  - Registers it in the model_registry table
  - Activates it as the current model
"""
import os
import logging
import glob
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session

from database import ModelRegistry
from models.ml_model import train_model, FEATURES

logger = logging.getLogger(__name__)

PARQUET_DIR = os.getenv("PARQUET_DIR", "./parquet_data")


def load_all_data() -> pd.DataFrame:
    """
    Merge training_data.parquet with all live_inference_*.parquet files.
    Returns a clean DataFrame ready for training.
    """
    frames = []

    # Base training data
    base_path = os.path.join(PARQUET_DIR, "training_data.parquet")
    if os.path.exists(base_path):
        frames.append(pd.read_parquet(base_path))
        logger.info(f"Loaded base training data: {base_path}")

    # Live inference data (only rows where we have a label)
    pattern = os.path.join(PARQUET_DIR, "live_inference_*.parquet")
    for path in sorted(glob.glob(pattern)):
        df = pd.read_parquet(path)
        if "approved" in df.columns:
            frames.append(df[FEATURES + ["approved"]])
            logger.info(f"Loaded live data: {path} ({len(df)} rows)")

    if not frames:
        raise FileNotFoundError("No training data found in parquet_data/")

    combined = pd.concat(frames, ignore_index=True)
    combined = combined.dropna(subset=FEATURES + ["approved"])
    logger.info(f"Total training rows after merge: {len(combined)}")
    return combined


def run_retraining(db: Session) -> dict:
    """
    Full retraining pipeline.
    Returns metrics dict for the new model version.
    """
    # Generate version string
    version = datetime.utcnow().strftime("v%Y%m%d_%H%M%S")

    # Load data
    df = load_all_data()

    # Train
    metrics = train_model(df, version)

    # Deactivate all existing models
    db.query(ModelRegistry).update({"is_active": False})
    db.commit()

    # Register new model
    model_path = os.path.join(os.getenv("MODEL_DIR", "./saved_models"), f"model_{version}.joblib")
    entry = ModelRegistry(
        version       = version,
        accuracy      = metrics["accuracy"],
        f1_score      = metrics["f1_score"],
        training_rows = metrics["training_rows"],
        is_active     = True,
        model_path    = model_path,
        notes         = f"Auto-retrained on {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC"
    )
    db.add(entry)
    db.commit()

    logger.info(f"Retraining complete. New active model: {version}")
    return {**metrics, "model_path": model_path}


def rollback_to_version(db: Session, target_version: str) -> dict:
    """
    Deactivate current model and activate the specified version.
    """
    target = db.query(ModelRegistry).filter(
        ModelRegistry.version == target_version
    ).first()

    if not target:
        raise ValueError(f"Model version '{target_version}' not found in registry.")

    # Deactivate all
    db.query(ModelRegistry).update({"is_active": False})
    db.commit()

    # Activate target
    target.is_active = True
    db.commit()

    logger.info(f"Rolled back to model version: {target_version}")
    return {
        "success":        True,
        "rolled_back_to": target_version,
        "message":        f"Successfully rolled back to model version {target_version}"
    }
