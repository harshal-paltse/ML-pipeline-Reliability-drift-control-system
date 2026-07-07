"""
Background Scheduler - Runs health and drift monitoring checks at a configurable interval.
"""
import logging
import os
import threading
import time
from typing import Optional

from database.connection import SessionLocal
from database.models import Model
from services.health_monitor import health_monitor

logger = logging.getLogger(__name__)


class MonitoringScheduler:
    """
    Daemon thread that periodically runs health and alert checks
    for all active ML models.

    Interval is read from the ``MONITORING_INTERVAL_MINUTES`` environment
    variable (default: 5 minutes).
    """

    def __init__(self, interval_minutes: Optional[int] = None) -> None:
        self.interval_minutes: int = interval_minutes or int(
            os.getenv("MONITORING_INTERVAL_MINUTES", 5)
        )
        self._running = False
        self._thread: Optional[threading.Thread] = None

    # ── Public API ────────────────────────────────────────────────────────────

    def start(self) -> None:
        """Start the background monitoring thread (idempotent)."""
        if self._running:
            logger.debug("MonitoringScheduler already running — ignoring start().")
            return
        self._running = True
        self._thread = threading.Thread(
            target=self._loop,
            name="MonitoringScheduler",
            daemon=True,
        )
        self._thread.start()
        logger.info(
            "Background monitoring started — interval: %d min.", self.interval_minutes
        )

    def stop(self) -> None:
        """Signal the monitoring loop to stop and wait for it to exit."""
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=10)
        logger.info("Background monitoring stopped.")

    @property
    def is_running(self) -> bool:
        return self._running and bool(self._thread and self._thread.is_alive())

    def __repr__(self) -> str:
        return (
            f"MonitoringScheduler(interval={self.interval_minutes}m, "
            f"running={self.is_running})"
        )

    # ── Internal loop ─────────────────────────────────────────────────────────

    def _loop(self) -> None:
        """Main monitoring loop — runs until ``_running`` is set to False."""
        logger.info("Monitoring loop started.")
        while self._running:
            try:
                self._run_checks()
            except Exception:
                logger.exception("Unhandled error in monitoring check cycle.")
            time.sleep(self.interval_minutes * 60)
        logger.info("Monitoring loop exited.")

    def _run_checks(self) -> None:
        """
        Query all active models and run health + alert checks for each.
        Opens its own DB session and ensures it is closed afterwards.
        """
        db = SessionLocal()
        try:
            active_models = db.query(Model).filter(Model.is_active == 1).all()
            if not active_models:
                logger.warning("No active models found — skipping monitoring cycle.")
                return

            for model in active_models:
                logger.info(
                    "Running checks for model '%s' v%s (id=%d).",
                    model.name, model.version, model.id,
                )
                health = health_monitor.calculate_health_score(model.id, db)
                logger.info(
                    "Health → status=%s score=%s issues=%d",
                    health.get("status", "?"),
                    health.get("score", "?"),
                    len(health.get("issues", [])),
                )
                alerts_created = health_monitor.check_and_alert(model.id, db)
                if alerts_created:
                    logger.warning("Alerts created: %s", alerts_created)
        finally:
            db.close()


# Module-level singleton — started by the FastAPI lifespan handler
monitoring_scheduler = MonitoringScheduler()
