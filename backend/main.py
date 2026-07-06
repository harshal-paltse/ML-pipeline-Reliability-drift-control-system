from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.uploads import router as uploads_router
from api.predictions import router as predictions_router

app = FastAPI(
    title="ML Monitoring System API",
    description="API for monitoring ML model performance and data quality",
    version="1.0.0"
)

# CORS middleware - ENABLED for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(uploads_router)
app.include_router(predictions_router)

@app.get("/")
async def root():
    return {"message": "ML Monitoring System API - Ready for model uploads and predictions"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "api": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)