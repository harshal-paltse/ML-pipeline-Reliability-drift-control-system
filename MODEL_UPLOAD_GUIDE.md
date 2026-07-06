# ML Model Upload & Prediction System - Complete Setup Guide

## Overview
This guide explains how to use the model upload and batch prediction features in your ML Monitoring System. The system allows you to upload trained ML models and datasets, then generate predictions through both single-record and batch processing.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)                   │
│                    - Prediction.js Component                     │
│                    - Manual & Batch Prediction Tabs             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP Requests (Axios)
                             │ 
┌────────────────────────────┴────────────────────────────────────┐
│                  FastAPI Backend (Port 8000)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ /api/uploads/                                            │  │
│  │   - POST /model        → Save model file & metadata      │  │
│  │   - POST /dataset      → Save dataset file & metadata    │  │
│  │   - GET /model/{id}    → Retrieve model info             │  │
│  │   - GET /dataset/{id}  → Retrieve dataset info           │  │
│  │   - GET /models/list   → List all uploaded models        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ /api/predictions/                                        │  │
│  │   - POST /manual       → Single prediction               │  │
│  │   - POST /batch        → Batch predictions               │  │
│  │   - GET /inference-logs/{model_id}  → View logs          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQLAlchemy ORM
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    SQLite Database                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ models           │  │ datasets         │  │ predictions │  │
│  │ - id (PK)        │  │ - id (PK)        │  │ - id (PK)   │  │
│  │ - name           │  │ - name           │  │ - model_id  │  │
│  │ - version        │  │ - path           │  │ - input     │  │
│  │ - path           │  │ - metadata       │  │ - output    │  │
│  │ - metrics (JSON) │  │ - created_at     │  │ - confidence│  │
│  │ - is_active      │  └──────────────────┘  └─────────────┘  │
│  └──────────────────┘                                           │
└────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Start the Backend Server

### Prerequisites
- Python 3.8+
- All dependencies installed from `requirements.txt`

### Starting Backend

```bash
# Navigate to backend folder
cd backend

# Option 1: Run using Python directly
python main.py

# Option 2: Using the batch file (Windows)
start_backend.bat

# Option 3: Using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Verify Backend is Running:**
- Open browser: http://localhost:8000/health
- Should see: `{"status": "healthy", "api": "running"}`
- API docs available at: http://localhost:8000/docs

---

## Step 2: Start the Frontend Server

```bash
# In another terminal, navigate to frontend folder
cd frontend

# Run development server
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view the app in your browser at http://localhost:3000
```

---

## Step 3: Understanding File Formats

### Supported Model Formats

| Format | Extension | Framework | Usage |
|--------|-----------|-----------|-------|
| Pickle | `.pkl` | scikit-learn | Commonly used, human-readable |
| Joblib | `.joblib` | scikit-learn | Preferred for large models |
| HDF5 | `.h5` | TensorFlow/Keras | Deep learning models |
| PyTorch | `.pth` | PyTorch | Neural network models |
| ONNX | `.onnx` | Multi-framework | Cross-platform compatibility |

### Supported Dataset Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| CSV | `.csv` | Most common, comma-separated values |
| Excel | `.xlsx` | Spreadsheet format |
| JSON | `.json` | Hierarchical data format |

---

## Step 4: Create Test Model & Dataset

### Creating a Sample Model (Python scikit-learn)

```python
# save_model.py
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
import joblib

# Create sample data
X, y = make_classification(n_samples=1000, n_features=10, n_classes=2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model
joblib.dump(model, "fraud_detection_model.joblib")
print("Model saved as fraud_detection_model.joblib")
```

**Run to create model:**
```bash
python save_model.py
```

### Creating a Sample Dataset (Python pandas)

```python
# create_dataset.py
import pandas as pd
import numpy as np

# Create sample data
data = {
    'amount': np.random.uniform(10, 5000, 100),
    'merchant_type': np.random.choice(['Online', 'Retail', 'Gas', 'Restaurant'], 100),
    'time_of_day': np.random.choice(['Morning', 'Afternoon', 'Evening', 'Night'], 100),
    'user_history': np.random.randint(1, 365, 100)
}

df = pd.DataFrame(data)
df.to_csv("transactions.csv", index=False)
print("Dataset saved as transactions.csv")
```

**Run to create dataset:**
```bash
python create_dataset.py
```

---

## Step 5: Using the Model Upload Feature

### Tab 1: Manual Prediction

**Step-by-step:**

1. **Navigate to Prediction page** in your app
2. **Click on "Manual Prediction" tab**
3. **Upload Model:**
   - Click "Upload ML Model" section
   - Drag & drop your `.joblib`, `.pkl`, or `.h5` file
   - Wait for success message
   - You'll see model info: name, size, accuracy, version

4. **Enter Transaction Details:**
   - **Transaction Amount:** Enter amount (e.g., 250)
   - **Merchant Category:** Select from dropdown
   - **Time of Day:** Select when transaction occurred
   - **User History:** Enter days as customer

5. **Get Prediction:**
   - Click "Get Prediction" button
   - Result shows:
     - ✅ **Prediction:** Approved/Rejected
     - 📊 **Confidence:** Percentage confidence
     - 📈 **Probability Breakdown:** Approved vs Rejected probabilities
     - ⚠️ **Risk Score:** 0-100 score
     - 💡 **Recommendation:** Strong/Moderate

**Example Response:**
```json
{
  "prediction": "Approved",
  "confidence": 84.52,
  "probability": {
    "approved": 0.8452,
    "rejected": 0.1548
  },
  "risk_score": 15.48,
  "recommendation": "Strong"
}
```

---

### Tab 2: Batch Prediction

**Step-by-step:**

1. **Navigate to Prediction page** → "Batch Prediction" tab

2. **Model Management (Left Column):**
   - Upload your trained model
   - System displays:
     - Model name and file size
     - Model type (scikit-learn/PyTorch/etc)
     - Model accuracy
     - Upload timestamp
   - Status: "Ready"

3. **Dataset Upload (Right Column):**
   - Upload your CSV/Excel/JSON dataset
   - System displays:
     - Number of rows
     - Upload status: "Processed"
     - Upload timestamp

4. **Run Batch Prediction:**
   - Once both files uploaded, button activates
   - Click "Run Batch Prediction"
   - System processes your dataset

5. **View Results:**
   - Table shows all predictions:
     - Transaction ID
     - Amount
     - Merchant Category
     - Time of Day
     - Prediction (Legitimate/Fraudulent)
     - Confidence %
     - Risk Score
     - Status (Low/High Risk)

6. **Download Results:**
   - Click "Download Results as CSV"
   - Get CSV with all predictions

**Summary Statistics:**
- Total Predictions
- Legitimate count
- Fraudulent count
- Average Confidence

---

## Step 6: Backend API Endpoints Reference

### Upload Endpoints

#### Upload Model
```
POST /api/uploads/model
Content-Type: multipart/form-data

Request:
- file: (binary model file)

Response:
{
  "model_id": 1,
  "name": "fraud_model.joblib",
  "size": 2.45,
  "type": "scikit-learn",
  "accuracy": 0.9456,
  "version": "v20260130_143022",
  "upload_date": "2026-01-30T14:30:22.123456",
  "status": "ready",
  "message": "Model uploaded successfully!"
}
```

#### Upload Dataset
```
POST /api/uploads/dataset
Content-Type: multipart/form-data

Request:
- file: (binary dataset file)

Response:
{
  "dataset_id": 1,
  "name": "transactions.csv",
  "rows": 1000,
  "columns": ["amount", "merchant_type", "time_of_day", "user_history"],
  "upload_date": "2026-01-30T14:35:10.654321",
  "status": "processing_complete",
  "message": "Dataset uploaded successfully!"
}
```

### Prediction Endpoints

#### Manual Prediction
```
POST /api/predictions/manual

Request Body:
{
  "model_id": 1,
  "amount": 250.00,
  "merchant_type": "E-commerce",
  "time_of_day": "Evening",
  "user_history": 45
}

Response:
{
  "prediction": "Approved",
  "confidence": 87.34,
  "probability": {
    "approved": 0.8734,
    "rejected": 0.1266
  },
  "risk_score": 12.66,
  "recommendation": "Strong"
}
```

#### Batch Prediction
```
POST /api/predictions/batch

Request Body:
{
  "model_id": 1,
  "dataset_id": 1
}

Response:
{
  "predictions": [
    {
      "transaction_id": "TXN000001",
      "amount": "1234.56",
      "merchant_category": "E-commerce",
      "time_of_day": "Morning",
      "prediction": "Legitimate",
      "confidence": 0.9123,
      "risk_score": 8.77,
      "status": "Low Risk"
    },
    // ... more predictions
  ],
  "summary": {
    "total_predictions": 100,
    "legitimate_count": 85,
    "fraudulent_count": 15,
    "avg_confidence": 0.8956,
    "high_risk_count": 12,
    "low_risk_count": 88
  },
  "message": "Batch predictions completed successfully!"
}
```

---

## Step 7: Troubleshooting

### Issue: "Please upload a model first!"
**Solution:** 
- Ensure model file is uploaded before making predictions
- Wait for upload success message
- Check file format is supported (.pkl, .joblib, .h5, .pth, .onnx)

### Issue: "Failed to upload model: Connection refused"
**Solution:**
- Verify backend is running on port 8000
- Check: http://localhost:8000/health
- Start backend if not running: `python backend/main.py`

### Issue: "CORS error" in browser console
**Solution:**
- Ensure CORS middleware is enabled in backend/main.py
- Already fixed in updated code
- Check frontend is on `http://localhost:3000`
- Backend should be on `http://localhost:8000`

### Issue: Model file not found after upload
**Solution:**
- Check `backend/uploaded_models/` directory exists
- If not, backend will create it automatically
- Verify disk space available
- Check file permissions

### Issue: Dataset shows 0 rows
**Solution:**
- Ensure CSV/Excel file has proper format
- File should have headers in first row
- Check file encoding (UTF-8 recommended)
- Try opening file in Excel/Pandas first to verify

### Issue: Predictions table empty after batch processing
**Solution:**
- Check model_id and dataset_id are correct
- Verify both files uploaded successfully
- Check backend logs for errors
- Try smaller dataset first (< 100 rows)

---

## Step 8: Database Schema

### Models Table
```sql
CREATE TABLE models (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  version VARCHAR UNIQUE,
  path VARCHAR,
  metrics JSON,
  created_at DATETIME,
  is_active INTEGER
);
```

### Datasets Table
```sql
CREATE TABLE datasets (
  id INTEGER PRIMARY KEY,
  name VARCHAR UNIQUE,
  type VARCHAR,
  path VARCHAR,
  created_at DATETIME,
  dataset_metadata JSON
);
```

### Inference Logs Table
```sql
CREATE TABLE inference_logs (
  id INTEGER PRIMARY KEY,
  model_id INTEGER FOREIGN KEY,
  input_data JSON,
  prediction JSON,
  confidence FLOAT,
  timestamp DATETIME
);
```

---

## Step 9: Production Deployment Checklist

- [ ] Change `allow_origins` in main.py to your domain
- [ ] Use environment variables for API URLs
- [ ] Set `reload=False` in production
- [ ] Use proper database (PostgreSQL instead of SQLite)
- [ ] Implement authentication/authorization
- [ ] Add input validation and sanitization
- [ ] Implement rate limiting
- [ ] Add error logging and monitoring
- [ ] Use HTTPS/SSL certificates
- [ ] Implement model versioning
- [ ] Add backup strategy for uploaded files
- [ ] Setup monitoring dashboards

---

## Complete Workflow Example

### Scenario: Fraud Detection System

1. **Train and Save Model:**
   ```bash
   python scripts/train_model.py
   # Outputs: fraud_model.joblib
   ```

2. **Prepare Test Data:**
   ```bash
   python scripts/prepare_test_data.py
   # Outputs: test_transactions.csv
   ```

3. **Start Servers:**
   ```bash
   # Terminal 1
   cd backend && python main.py
   
   # Terminal 2 (wait 2 seconds for backend to start)
   cd frontend && npm start
   ```

4. **Use Application:**
   - Open http://localhost:3000
   - Go to Prediction page
   - Upload fraud_model.joblib
   - For single transaction: Fill manual prediction form
   - For multiple transactions: Upload test_transactions.csv for batch

5. **View Results:**
   - Manual: See immediate prediction for single transaction
   - Batch: See table of all predictions, download CSV

6. **Monitor:**
   - Backend logs show all API calls
   - Database stores all predictions for audit
   - Check `/api/predictions/inference-logs/{model_id}` for history

---

## Quick Reference Commands

```bash
# Backend
cd backend && python main.py                    # Start backend
curl http://localhost:8000/health               # Check health
python save_model.py                            # Create test model
python create_dataset.py                        # Create test dataset

# Frontend
cd frontend && npm start                        # Start frontend
npm run build                                   # Production build
npm test                                        # Run tests

# Database
sqlite3 backend/ml_monitoring.db                # Access database
.tables                                         # List tables
SELECT COUNT(*) FROM models;                    # Check models count
SELECT COUNT(*) FROM inference_logs;            # Check prediction logs
```

---

## Next Steps

1. **Integrate Real Models:** Replace mock predictions with actual model inference
2. **Add Monitoring:** Track prediction accuracy over time
3. **Implement Retraining:** Auto-retrain when drift detected
4. **Add Authentication:** Secure API endpoints
5. **Scale Infrastructure:** Move to production-grade database
6. **Enable Model Versioning:** Track multiple model versions
7. **Add Notifications:** Alert on prediction anomalies

---

## Support & Resources

- FastAPI Docs: https://fastapi.tiangolo.com/
- SQLAlchemy: https://sqlalchemy.org/
- scikit-learn: https://scikit-learn.org/
- React Docs: https://react.dev/
- Ant Design: https://ant.design/

