from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ML Monitoring System API",
    description="API for monitoring ML model performance and data quality",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "ML Monitoring System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/v1/models/")
async def list_models():
    return [{"id": 1, "name": "Sample Model", "version": "v1.0", "is_active": True}]

@app.get("/api/v1/alerts/")
async def get_alerts():
    return [{"id": 1, "type": "info", "message": "System is running", "severity": "low", "status": "active"}]

@app.get("/api/v1/monitoring/drift")
async def get_drift():
    return {"drift_detected": False, "drift_score": 0.1}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)