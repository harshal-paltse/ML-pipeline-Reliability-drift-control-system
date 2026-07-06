from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from database.connection import create_tables
from api.routes import (
    data_router,
    monitoring_router,
    models_router,
    alerts_router,
    predictions_router,
    health_router
)
from services.scheduler import monitoring_scheduler

# Create FastAPI app
app = FastAPI(
    title="ML Monitoring System API",
    description="API for monitoring ML model performance and data quality",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables
@app.on_event("startup")
async def startup_event():
    print("🔧 Initializing database...")
    create_tables()
    print("✅ Database initialized")
    
    # Start background monitoring scheduler
    print("🔄 Starting background monitoring...")
    monitoring_scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    print("⏹️ Shutting down...")
    monitoring_scheduler.stop()

# Include routers
app.include_router(predictions_router, prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(health_router, prefix="/api/v1/health", tags=["Health"])
app.include_router(models_router, prefix="/api/v1/models", tags=["Models"])
app.include_router(alerts_router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(monitoring_router, prefix="/api/v1/monitoring", tags=["Monitoring"])
app.include_router(data_router, prefix="/api/v1/data", tags=["Data"])

@app.get("/")
async def root():
    return {
        "message": "ML Monitoring System API",
        "version": "1.0.0",
        "endpoints": {
            "predictions": "/api/v1/predictions/predict",
            "health": "/api/v1/health/score",
            "models": "/api/v1/models/",
            "alerts": "/api/v1/alerts/",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    print("🚀 Starting ML Monitoring System API...")
    print("📍 Backend URL: http://127.0.0.1:8001")
    print("📊 API Docs: http://127.0.0.1:8001/docs")
    print("❤️  Health Check: http://127.0.0.1:8001/health")
    print("🔮 Predictions: http://127.0.0.1:8001/api/v1/predictions/predict")
    print("📈 Health Score: http://127.0.0.1:8001/api/v1/health/score")
    print("Press Ctrl+C to stop the server")
    uvicorn.run(app, host="127.0.0.1", port=8001)