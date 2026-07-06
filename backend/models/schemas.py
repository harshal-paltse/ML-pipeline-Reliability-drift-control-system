"""Pydantic v2 schemas — uses model_config throughout, no inner Config class."""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# Shared config for ORM models (replaces class Config: from_attributes = True)
_orm = ConfigDict(from_attributes=True, protected_namespaces=())


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=80)
    email: str
    password: str = Field(..., min_length=6)
    role: str = Field("analyst", pattern="^(admin|analyst|viewer)$")


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str


class UserResponse(BaseModel):
    model_config = _orm
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class UpdateProfileRequest(BaseModel):
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


# ── API Keys ──────────────────────────────────────────────────────────────────

class CreateApiKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ApiKeyResponse(BaseModel):
    model_config = _orm
    id: int
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime
    last_used: Optional[datetime] = None
    request_count: int


class ApiKeyCreatedResponse(BaseModel):
    id: int
    name: str
    key: str        # full raw key — shown ONCE only
    key_prefix: str
    created_at: datetime


# ── Prediction ────────────────────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    """
    Flexible prediction request.
    Pass any features your uploaded model expects.
    All monetary values should be in INR (Rs).
    """
    features: Dict[str, float] = Field(
        ...,
        description="Feature name to value mapping matching your model's expected features",
        examples=[{
            "age": 35,
            "annual_income_inr": 600000,
            "cibil_score": 720,
            "employment_years": 8,
            "loan_amount_inr": 500000,
            "existing_loans": 1,
            "loan_tenure_months": 60
        }]
    )
    inject_drift: bool = False

    def features_dict(self) -> Dict[str, float]:
        return dict(self.features)


class PredictionResponse(BaseModel):
    model_config = _orm
    prediction: int
    label: str
    confidence: float
    model_version: str
    explanation: Dict[str, float]
    timestamp: datetime
    risk_level: str
    risk_factors: List[str]


# ── Uploaded Model ────────────────────────────────────────────────────────────

class UploadedModelResponse(BaseModel):
    model_config = _orm
    id: int
    name: str
    version: str
    filename: str
    feature_names: List[str]
    model_type: Optional[str] = None
    uploaded_at: datetime
    is_active: bool
    accuracy: Optional[float] = None
    notes: Optional[str] = None


class UploadedModelPredictRequest(BaseModel):
    features: Dict[str, float] = Field(
        ..., description="Feature name to value mapping"
    )


# ── Monitoring ────────────────────────────────────────────────────────────────

class FeatureDrift(BaseModel):
    feature: str
    ks_statistic: float
    p_value: float
    mean_diff: float
    is_drifted: bool


class MonitoringResponse(BaseModel):
    health_score: float
    drift_score: float
    failure_score: float
    confidence_score: float
    importance_score: float
    prediction_count: int
    feature_drifts: List[FeatureDrift]
    feature_failures: Dict[str, bool]
    health_history: List[Dict[str, Any]]
    timestamp: datetime


class AlertResponse(BaseModel):
    model_config = _orm
    id: int
    timestamp: datetime
    level: str
    category: str
    message: str
    resolved: bool


class ModelVersionResponse(BaseModel):
    model_config = _orm
    id: int
    version: str
    created_at: datetime
    accuracy: float
    f1_score: float
    training_rows: int
    is_active: bool
    notes: Optional[str] = None


class RetrainResponse(BaseModel):
    success: bool
    new_version: str
    accuracy: float
    f1_score: float
    training_rows: int
    message: str


class RollbackResponse(BaseModel):
    success: bool
    rolled_back_to: str
    message: str


# ── Analytics ─────────────────────────────────────────────────────────────────

class PredictionStatsResponse(BaseModel):
    total_predictions: int
    approved_count: int
    rejected_count: int
    approval_rate: float
    avg_confidence: float
    avg_credit_score: float
    avg_income: float
    avg_loan_amount: float
    predictions_by_hour: List[Dict[str, Any]]
    confidence_distribution: List[Dict[str, Any]]
