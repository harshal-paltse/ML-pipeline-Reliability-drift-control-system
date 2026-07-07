"""
ML Pipeline Reliability & Drift Control System
FastAPI application entry point.
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.uploads import router as uploads_router
from api.predictions import router as predictions_router
from api.monitoring import router as monitoring_router
from api.alerts import router as alerts_router
from api.health import router as health_router
from api.models import router as models_router
from api.data import router as data_router
from database.connection import create_tables

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup and shutdown logic."""
    logger.info("Starting ML Monitoring System...")
    create_tables()
    logger.info("Database tables ready.")
    yield
    logger.info("Shutting down ML Monitoring System.")


app = FastAPI(
    title="ML Pipeline Reliability & Drift Control System",
    description=(
        "Production-grade ML monitoring platform. "
        "Track model performance, detect data drift, and fire intelligent alerts."
    ),
    version="1.1.0",
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(predictions_router, prefix=f"{API_PREFIX}/predictions", tags=["Predictions"])
app.include_router(monitoring_router,  prefix=f"{API_PREFIX}/monitoring",  tags=["Monitoring"])
app.include_router(alerts_router,      prefix=f"{API_PREFIX}/alerts",      tags=["Alerts"])
app.include_router(health_router,      prefix=f"{API_PREFIX}/health",      tags=["Health"])
app.include_router(models_router,      prefix=f"{API_PREFIX}/models",      tags=["Models"])
app.include_router(data_router,        prefix=f"{API_PREFIX}/data",        tags=["Data"])
app.include_router(uploads_router,     prefix=f"{API_PREFIX}/uploads",     tags=["Uploads"])


# ── Root endpoints ────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "ML Pipeline Reliability & Drift Control System",
        "version": "1.1.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["Root"])
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("BACKEND_HOST", "0.0.0.0"),
        port=int(os.getenv("BACKEND_PORT", 8001)),
        reload=os.getenv("APP_ENV", "development") == "development",
    )
