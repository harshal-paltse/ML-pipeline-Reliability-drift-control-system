"""
APScheduler background jobs:
  - Monitoring cycle every 60 seconds
  - Parquet flush every 5 minutes
"""
import os
import logging
import pandas as pd
from datetime import datetime, date
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

PARQUET_DIR      = os.getenv("PARQUET_DIR", "./parquet_data")
MONITOR_INTERVAL = int(os.getenv("MONITORING_INTERVAL", "60"))

# These are set by main.py after startup
_app_state = {}


def set_app_state(state: dict):
    """Called from main.py to inject shared app state into scheduler jobs."""
    global _app_state
    _app_state = state


def _monitoring_job():
    """Run the full monitoring cycle."""
    from database import SessionLocal
    from monitoring import run_monitoring_cycle

    state = _app_state
    if not state.get("reference_df") is not None:
        logger.debug("Monitoring job: reference_df not ready yet.")
        return

    db = SessionLocal()
    try:
        run_monitoring_cycle(
            db                   = db,
            reference_df         = state["reference_df"],
            active_model_version = state.get("active_version", "unknown"),
            baseline_importances = state.get("baseline_importances", {}),
            current_importances  = state.get("current_importances", {})
        )
    except Exception as e:
        logger.error(f"Monitoring job error: {e}", exc_info=True)
    finally:
        db.close()


def _parquet_flush_job():
    """
    Flush recent in-memory predictions to a daily Parquet file.
    """
    state = _app_state
    buffer: list = state.get("prediction_buffer", [])

    if not buffer:
        return

    os.makedirs(PARQUET_DIR, exist_ok=True)
    today = date.today().strftime("%Y_%m_%d")
    path  = os.path.join(PARQUET_DIR, f"live_inference_{today}.parquet")

    df_new = pd.DataFrame(buffer)

    if os.path.exists(path):
        df_existing = pd.read_parquet(path)
        df_combined = pd.concat([df_existing, df_new], ignore_index=True)
    else:
        df_combined = df_new

    df_combined.to_parquet(path, index=False)
    state["prediction_buffer"] = []   # clear buffer
    logger.info(f"Flushed {len(df_new)} rows to {path}")


def create_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="UTC")

    scheduler.add_job(
        _monitoring_job,
        trigger=IntervalTrigger(seconds=MONITOR_INTERVAL),
        id="monitoring",
        name="ML Monitoring Cycle",
        replace_existing=True
    )

    scheduler.add_job(
        _parquet_flush_job,
        trigger=IntervalTrigger(seconds=300),   # every 5 minutes
        id="parquet_flush",
        name="Parquet Flush",
        replace_existing=True
    )

    return scheduler
