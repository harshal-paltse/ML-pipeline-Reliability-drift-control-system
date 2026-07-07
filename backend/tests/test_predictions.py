"""
Unit tests for the predictions API endpoints.
Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# Minimal app fixture — avoids loading full DB / ML model in CI
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    """Create a TestClient for the FastAPI app."""
    from main import app
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Root / health
# ---------------------------------------------------------------------------

def test_root_returns_200(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert data["status"] == "running"


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# ---------------------------------------------------------------------------
# Prediction schema validation
# ---------------------------------------------------------------------------

def test_predict_missing_fields(client):
    """Should return 422 when required fields are missing."""
    response = client.post("/api/v1/predictions/predict", json={})
    assert response.status_code == 422


def test_predict_invalid_credit_score(client):
    """Credit score below 300 should fail validation."""
    response = client.post(
        "/api/v1/predictions/predict",
        json={"age": 30, "income": 60000, "credit_score": 100},
    )
    assert response.status_code == 422


def test_predict_invalid_age_too_young(client):
    """Age below 18 should fail validation."""
    response = client.post(
        "/api/v1/predictions/predict",
        json={"age": 15, "income": 60000, "credit_score": 700},
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Model service unit test (isolated, no DB)
# ---------------------------------------------------------------------------

def test_model_service_predict_approved():
    """High credit score + income should predict Approved."""
    from services.model_service import ModelService
    svc = ModelService()
    result = svc.predict(age=35, income=100000, credit_score=800)
    assert result["prediction"] in ("Approved", "Rejected")
    assert 0.0 <= result["confidence"] <= 1.0
    assert "approved" in result["probability"]
    assert "rejected" in result["probability"]
    assert abs(result["probability"]["approved"] + result["probability"]["rejected"] - 1.0) < 1e-6


def test_model_service_predict_rejected():
    """Very low credit score should predict Rejected."""
    from services.model_service import ModelService
    svc = ModelService()
    result = svc.predict(age=22, income=15000, credit_score=310)
    assert result["prediction"] == "Rejected"
