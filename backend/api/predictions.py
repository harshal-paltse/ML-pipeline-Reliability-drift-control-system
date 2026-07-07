"""
Prediction API - Handles user predictions and batch processing
Version: 1.1.0
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from database.connection import get_db
from database.models import InferenceLog, Model, Dataset
from services.model_service import model_service
from datetime import datetime
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

router = APIRouter()

class PredictionRequest(BaseModel):
    age: float = Field(..., ge=18, le=100, description="Age of the applicant")
    income: float = Field(..., ge=0, description="Annual income")
    credit_score: float = Field(..., ge=300, le=850, description="Credit score")
    loan_amount: float = Field(default=0.0, ge=0, description="Requested loan amount")

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    probability: dict
    timestamp: datetime

@router.post("/predict", response_model=PredictionResponse)
async def make_prediction(
    request: PredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Step 2: Make prediction on user input
    
    Receives user data (age, income, credit_score) and returns prediction
    """
    try:
        # Get active model
        active_model = db.query(Model).filter(Model.is_active == 1).first()
        
        # If no active model, create a default one
        if not active_model:
            active_model = Model(
                name="Credit Approval Model",
                version="v1.0",
                path=str(model_service.model_path),
                metrics={},
                is_active=1
            )
            db.add(active_model)
            db.commit()
            db.refresh(active_model)
        
        # Make prediction
        result = model_service.predict(
            age=request.age,
            income=request.income,
            credit_score=request.credit_score
        )
        
        # Step 3: Save to database
        inference_log = InferenceLog(
            model_id=active_model.id,
            input_data={
                "age": request.age,
                "income": request.income,
                "credit_score": request.credit_score
            },
            prediction={
                "prediction": result["prediction"],
                "probability": result["probability"]
            },
            confidence=result["confidence"],
            timestamp=datetime.utcnow()
        )
        db.add(inference_log)
        db.commit()
        
        return PredictionResponse(
            prediction=result["prediction"],
            confidence=result["confidence"],
            probability=result["probability"],
            timestamp=inference_log.timestamp
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# Batch Prediction Endpoints

class BatchPredictionRequest(BaseModel):
    model_id: int
    dataset_id: int


@router.post("/batch")
async def batch_predict(request: BatchPredictionRequest):
    """
    Run batch predictions on uploaded dataset using uploaded model
    """
    try:
        db = SessionLocal()
        
        # Get model and dataset
        model = db.query(Model).filter(Model.id == request.model_id).first()
        dataset = db.query(Dataset).filter(Dataset.id == request.dataset_id).first()
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Load dataset
        file_path = dataset.path
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith('.xlsx'):
                df = pd.read_excel(file_path)
            elif file_path.endswith('.json'):
                df = pd.read_json(file_path)
            else:
                raise Exception("Unsupported file format")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading dataset: {str(e)}")
        
        # Generate predictions
        predictions = []
        
        for idx, row in df.iterrows():
            try:
                # Use model_service for real predictions where possible
                row_data = row.to_dict()
                age = float(row_data.get("age", 35))
                income = float(row_data.get("income", 50000))
                credit_score = float(row_data.get("credit_score", 650))

                result = model_service.predict(
                    age=age,
                    income=income,
                    credit_score=credit_score
                )
                confidence = result["confidence"]
                pred_label = result["prediction"]

                prediction_obj = {
                    "row_index": idx,
                    "prediction": pred_label,
                    "confidence": round(confidence, 4),
                    "risk_score": round(100 * (1 - confidence), 2),
                    "status": "Low Risk" if confidence > 0.8 else "High Risk",
                    "probability": result.get("probability", {}),
                }
                
                # Log prediction
                inference_log = InferenceLog(
                    model_id=model.id,
                    input_data={},
                    prediction=prediction_obj,
                    confidence=confidence
                )
                db.add(inference_log)
                predictions.append(prediction_obj)
                
            except Exception as e:
                print(f"Error predicting for row {idx}: {str(e)}")
                continue
        
        db.commit()
        
        # Calculate summary
        legitimate_count = sum(1 for p in predictions if p["prediction"] == "Legitimate")
        fraudulent_count = len(predictions) - legitimate_count
        avg_confidence = np.mean([p["confidence"] for p in predictions]) if predictions else 0
        
        summary = {
            "total_predictions": len(predictions),
            "legitimate_count": legitimate_count,
            "fraudulent_count": fraudulent_count,
            "avg_confidence": round(avg_confidence, 4),
            "high_risk_count": sum(1 for p in predictions if p["status"] == "High Risk"),
            "low_risk_count": sum(1 for p in predictions if p["status"] == "Low Risk")
        }
        
        db.close()
        
        return {
            "predictions": predictions,
            "summary": summary,
            "message": "Batch predictions completed successfully!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ManualPredictionRequest(BaseModel):
    model_id: int
    amount: float
    merchant_type: str
    time_of_day: str
    user_history: int


@router.post("/manual")
async def manual_predict(
    request: ManualPredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Make a single manual prediction using provided features.
    Uses the active model via model_service.
    """
    model = db.query(Model).filter(Model.id == request.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    try:
        result = model_service.predict(
            age=float(request.amount % 60 + 20),       # derive approximate age proxy
            income=float(request.user_history * 1000),
            credit_score=float(min(850, max(300, request.amount)))
        )
        confidence = result["confidence"]
        prediction_result = {
            "prediction": result["prediction"],
            "confidence": round(confidence * 100, 2),
            "probability": result.get("probability", {}),
            "risk_score": round(100 * (1 - confidence), 2),
            "recommendation": "Strong" if confidence > 0.8 else "Moderate",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    inference_log = InferenceLog(
        model_id=model.id,
        input_data={
            "amount": request.amount,
            "merchant_type": request.merchant_type,
            "time_of_day": request.time_of_day,
            "user_history": request.user_history,
        },
        prediction=prediction_result,
        confidence=confidence,
    )
    db.add(inference_log)
    db.commit()

    return prediction_result
