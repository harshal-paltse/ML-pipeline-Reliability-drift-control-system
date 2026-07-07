# Changelog

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.0] — 2024-07-07

### Added
- `CONTRIBUTING.md` with branching strategy and commit conventions
- `SECURITY.md` with vulnerability reporting process
- `.env.example` with all required environment variables documented
- `.github/workflows/ci.yml` — GitHub Actions CI (lint, test, security audit)
- `backend/tests/test_predictions.py` — unit tests for prediction API and ModelService
- MIT License

### Fixed
- `database/connection.py` — `check_same_thread` now only applied for SQLite; PostgreSQL compatible
- `database/connection.py` — added `db.rollback()` on exception in session generator
- `monitoring/drift_detector.py` — removed hardcoded `feature1`/`feature2` column names; now auto-detects all numerical columns
- `api/predictions.py` — replaced fake `np.random` predictions in `/batch` and `/manual` with real `model_service` calls
- `api/predictions.py` — `/manual` endpoint now uses `get_db` dependency instead of raw `SessionLocal()`
- `alerts/alert_manager.py` — removed hardcoded `ml-team@company.com` recipient; now reads from `ALERT_RECIPIENTS` env var
- `alerts/alert_manager.py` — replaced `print()` statements with `logging`; SMTP now uses context manager

### Changed
- `main.py` — full overhaul: lifespan handler, all routers registered with `/api/v1` prefix, env-driven CORS, proper versioning
- `requirements.txt` — removed duplicate `python-multipart`, organised into sections, pinned `numpy` and auth deps

---

## [1.0.0] — 2024-06-01

### Added
- Initial project upload
- FastAPI backend with prediction, monitoring, alerts, health, models, data, and upload endpoints
- React frontend with Dashboard, Alerts, Metrics, Prediction, and Settings pages
- SQLAlchemy ORM with SQLite default and PostgreSQL support
- Evidently AI drift detection
- JWT + API key authentication
- Docker Compose with PostgreSQL, Redis, Kafka
- Credit approval ML model (RandomForest) with auto-create fallback
