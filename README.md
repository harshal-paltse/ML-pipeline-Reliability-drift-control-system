# ML Pipeline Reliability & Drift Control System

[![CI](https://github.com/harshal-paltse/ML-pipeline-Reliability-drift-control-system/actions/workflows/ci.yml/badge.svg)](https://github.com/harshal-paltse/ML-pipeline-Reliability-drift-control-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)

A production-grade ML monitoring platform that tracks model performance, detects data drift, fires intelligent alerts, and provides a real-time dashboard — all in one system.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Docker Setup](#docker-setup)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

As ML models age in production, their predictions degrade silently. This system gives you **full visibility** into:

- **Data drift** — when your incoming data no longer matches training distribution
- **Model confidence** — early warning before accuracy tanks
- **Performance metrics** — accuracy, F1, precision, recall tracked over time
- **Health scores** — composite 0–100 score per model with root-cause breakdown
- **Automated alerts** — email + Slack notifications with configurable thresholds

---

## Features

| Feature | Description |
|---|---|
| 📊 **Real-time Dashboard** | Live metrics, charts, and KPIs via React + Recharts |
| 🔍 **Drift Detection** | Evidently AI-powered statistical drift analysis |
| 🧠 **Prediction API** | Single, batch, and manual prediction endpoints |
| 🚨 **Alert System** | Severity-based alerts (info → warning → critical) |
| 🏥 **Health Monitor** | Composite health score with issue diagnosis |
| 📁 **Model Upload** | Upload `.pkl`/`.joblib` models and datasets via UI |
| 🔐 **Authentication** | JWT Bearer tokens + API Key support |
| 🐳 **Docker Ready** | Full docker-compose with Postgres, Redis, Kafka |
| ⚙️ **CI/CD** | GitHub Actions for lint, test, and security audit |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│         Dashboard · Alerts · Metrics · Predictions          │
└────────────────────────┬────────────────────────────────────┘
                         │  REST API (HTTP)
┌────────────────────────▼────────────────────────────────────┐
│                    FastAPI Backend                           │
│  /predictions  /monitoring  /alerts  /health  /models       │
├──────────────┬──────────────┬──────────────────────────────┤
│  Model       │  Drift       │  Health          Alert       │
│  Service     │  Detector    │  Monitor         Manager     │
│  (joblib)    │  (Evidently) │  (scoring)       (email/     │
│              │              │                  Slack)      │
└──────────────┴──────┬───────┴──────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   PostgreSQL       Redis         Kafka
   (SQLAlchemy)   (caching)   (streaming)
```

---

## Project Structure

```
ML Monitoring System/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline
├── backend/
│   ├── api/                     # FastAPI route handlers
│   │   ├── alerts.py            # Alert CRUD endpoints
│   │   ├── data.py              # Inference log endpoints
│   │   ├── health.py            # Health score endpoints
│   │   ├── models.py            # Model management endpoints
│   │   ├── monitoring.py        # Drift & performance endpoints
│   │   ├── predictions.py       # Predict / batch / manual
│   │   ├── routes.py            # Router aggregation
│   │   └── uploads.py           # File upload endpoints
│   ├── alerts/
│   │   └── alert_manager.py     # Email + Slack alert dispatch
│   ├── database/
│   │   ├── connection.py        # SQLAlchemy engine & session
│   │   └── models.py            # ORM table definitions
│   ├── models/                  # Saved ML model artifacts
│   │   ├── credit_model.pkl
│   │   └── scaler.pkl
│   ├── monitoring/
│   │   ├── drift_detector.py    # Evidently drift analysis
│   │   └── performance_monitor.py # Accuracy / F1 / recall
│   ├── services/
│   │   ├── health_monitor.py    # Composite health scoring
│   │   ├── model_service.py     # Model load + predict
│   │   └── scheduler.py        # Background job scheduler
│   ├── auth.py                  # JWT + API key auth
│   ├── main.py                  # FastAPI app entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── config/
│       │   └── api.js           # Centralized API endpoints
│       ├── context/
│       │   └── ThemeContext.js  # Light/dark theme provider
│       ├── pages/
│       │   ├── Dashboard.js     # Main overview page
│       │   ├── Alerts.js        # Alert management
│       │   ├── Metrics.js       # Performance charts
│       │   ├── Prediction.js    # Make predictions
│       │   └── Settings.js      # Configuration
│       ├── App.js
│       └── index.css
├── docker/
│   └── docker-compose.yml       # Full stack orchestration
├── data/
│   ├── training/                # Reference datasets (.parquet)
│   └── inference/               # Live inference data
├── config/
│   └── settings.env
├── .env.example                 # Environment variable template
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### 1. Clone

```bash
git clone https://github.com/harshal-paltse/ML-pipeline-Reliability-drift-control-system.git
cd ML-pipeline-Reliability-drift-control-system
```

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env          # edit with your values
uvicorn main:app --reload --port 8001
```

API docs available at: `http://localhost:8001/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Dashboard available at: `http://localhost:3000`

---

## Docker Setup

```bash
# Copy and configure environment
cp .env.example .env

# Start all services (backend, frontend, postgres, redis, kafka)
docker compose -f docker/docker-compose.yml up --build

# Stop all services
docker compose -f docker/docker-compose.yml down
```

Services:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001 |
| API Docs (Swagger) | http://localhost:8001/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| Kafka | localhost:9092 |

---

## API Reference

Full interactive docs: `http://localhost:8001/docs`

### Predictions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/predictions/predict` | Single prediction |
| `POST` | `/api/v1/predictions/batch` | Batch prediction from dataset |
| `POST` | `/api/v1/predictions/manual` | Manual feature input prediction |

### Monitoring

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/monitoring/drift` | Current drift metrics |
| `GET` | `/api/v1/monitoring/performance/{model_id}` | Model performance metrics |
| `GET` | `/api/v1/monitoring/check` | Run full monitoring check |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health/score` | Model health score (0–100) |
| `GET` | `/api/v1/health/status` | System health status |

### Alerts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/alerts/` | List all alerts |
| `POST` | `/api/v1/alerts/{id}/resolve` | Resolve an alert |
| `GET` | `/api/v1/alerts/summary` | Alert summary stats |

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list. Key variables:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./ml_monitoring.db` | DB connection string |
| `SECRET_KEY` | *(required)* | JWT signing secret — **change in production** |
| `REACT_APP_API_URL` | `http://localhost:8001` | Backend URL for frontend |
| `SLACK_WEBHOOK_URL` | *(optional)* | Slack alert webhook |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection |

---

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit with conventional commits: `feat: add your feature`
4. Push and open a PR

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

<p align="center">Built with ❤️ by <a href="https://github.com/harshal-paltse">Harshal Paltse</a></p>
