import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.connection import get_db, create_tables
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Test database
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def test_client():
    # Create test database tables
    create_tables()
    client = TestClient(app)
    yield client
    # Clean up
    os.remove("./test.db")

def test_health_check(test_client):
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_list_models_empty(test_client):
    response = test_client.get("/api/v1/models/")
    assert response.status_code == 200
    assert response.json() == []

def test_create_alert(test_client):
    alert_data = {
        "type": "test",
        "severity": "low",
        "message": "Test alert",
        "details": {"test": True}
    }
    response = test_client.post("/api/v1/alerts/", json=alert_data)
    assert response.status_code == 200

def test_get_alerts(test_client):
    response = test_client.get("/api/v1/alerts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)