# Changelog

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.3.0] — 2024-07-08

### Security
- `config/settings.env` removed from git tracking — was exposing placeholder DB/email/Slack config publicly; added to `.gitignore`
- `backend/error.log` removed from git tracking — log files should never be committed
- `.vscode/` IDE config removed from git tracking — developer-specific, added to `.gitignore`
- `Desktop/GIT MODULE/` stray folder removed from git tracking
- `frontend/src/firebase.js` — replaced all hardcoded mock credentials with `process.env.REACT_APP_FIREBASE_*` variables; Firebase only initialises when config is present
- `config/settings.env.example` added as safe committed template
- `SECURITY.md` expanded with full 10-point credential checklist
- `.env.example` updated with all Firebase environment variable keys

---

## [1.2.0] — 2024-07-07

### Added
- `backend/tests/test_monitoring.py` — unit tests for `performance_monitor` labeled/unlabeled handling and drift fallback
- `frontend/src/config/api.js` — `REQUEST_TIMEOUT_MS`, `HTTP_STATUS` constants, batch/manual/upload endpoints

### Fixed
- `services/scheduler.py` — replaced all `print()` with `logging`, `MONITORING_INTERVAL_MINUTES` env var, checks all active models, idempotent `start()`
- `monitoring/performance_monitor.py` — skip rows without ground-truth labels to prevent sklearn crash; added `zero_division=0` guard, `min_confidence`, `max_confidence`
- `docker/docker-compose.yml` — replaced hardcoded DB password with `${POSTGRES_PASSWORD}`, `restart: unless-stopped` on all services, fixed backend port to 8001, added Redis healthcheck

---



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
