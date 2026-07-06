"""
ML Model Service - Handles model loading and predictions
"""
import pickle
import os
import numpy as np
from pathlib import Path
from typing import Dict, Optional
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pandas as pd

class ModelService:
    def __init__(self, models_dir: str = "models"):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(exist_ok=True)
        self.model = None
        self.scaler = None
        self.model_path = self.models_dir / "credit_model.pkl"
        self.scaler_path = self.models_dir / "scaler.pkl"
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Load existing model or create a new one"""
        if self.model_path.exists() and self.scaler_path.exists():
            try:
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                print(f"✅ Loaded model from {self.model_path}")
            except Exception as e:
                print(f"⚠️ Error loading model: {e}. Creating new model...")
                self._create_sample_model()
        else:
            print("📦 No model found. Creating sample model...")
            self._create_sample_model()
    
    def _create_sample_model(self):
        """Create a sample credit approval model"""
        # Generate synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        # Features: age, income, credit_score
        age = np.random.randint(18, 80, n_samples)
        income = np.random.randint(20000, 150000, n_samples)
        credit_score = np.random.randint(300, 850, n_samples)
        
        # Create target: approve if credit_score > 600 and income > 40000
        target = ((credit_score > 600) & (income > 40000)).astype(int)
        
        # Add some noise
        target = target ^ (np.random.random(n_samples) < 0.1).astype(int)
        
        X = np.column_stack([age, income, credit_score])
        y = target
        
        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_scaled, y)
        
        # Save model
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        print(f"✅ Created and saved model to {self.model_path}")
    
    def predict(self, age: float, income: float, credit_score: float) -> Dict:
        """
        Make prediction on user input
        
        Returns:
            {
                "prediction": "Approved" or "Rejected",
                "confidence": float (0-1),
                "probability": {"approved": float, "rejected": float}
            }
        """
        if self.model is None or self.scaler is None:
            raise RuntimeError("Model not loaded")
        
        # Prepare input
        X = np.array([[age, income, credit_score]])
        X_scaled = self.scaler.transform(X)
        
        # Get prediction probabilities
        probabilities = self.model.predict_proba(X_scaled)[0]
        
        # Get prediction
        prediction_class = self.model.predict(X_scaled)[0]
        
        # Calculate confidence (max probability)
        confidence = float(np.max(probabilities))
        
        # Map class to label
        prediction_label = "Approved" if prediction_class == 1 else "Rejected"
        
        return {
            "prediction": prediction_label,
            "confidence": confidence,
            "probability": {
                "approved": float(probabilities[1]),
                "rejected": float(probabilities[0])
            }
        }
    
    def get_model_info(self) -> Dict:
        """Get information about the current model"""
        return {
            "model_path": str(self.model_path),
            "model_exists": self.model_path.exists(),
            "model_loaded": self.model is not None
        }

# Global model service instance
model_service = ModelService()
