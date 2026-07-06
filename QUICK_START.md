# 🚀 QUICK START GUIDE - Model Upload & Predictions

## 5-Minute Setup

### Step 1: Create Sample Model & Dataset (2 minutes)

**Terminal 1:**
```bash
cd "c:\Users\harsh\Desktop\ML Monitoring System"

# Create sample model
python scripts/create_sample_model.py

# Create sample datasets
python scripts/create_sample_dataset.py
```

**Expected Output:**
```
============================================================
Creating Sample Fraud Detection Model
============================================================

1. Generating synthetic training data...
   - Training samples: 1600
   - Test samples: 400
   - Features: 10

2. Training Random Forest model...
   ✓ Model training complete

3. Evaluating model performance...
   - Accuracy:  0.9450
   - Precision: 0.8923
   - Recall:    0.8156
   - F1-Score:  0.8523

4. Saving model to backend/uploaded_models/fraud_detection_model.joblib...
   ✓ Model saved successfully

✅ Sample model created successfully!
```

### Step 2: Start Backend (30 seconds)

**Terminal 2:**
```bash
cd "c:\Users\harsh\Desktop\ML Monitoring System\backend"
python main.py
```

**Verify it's running:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Check health:**
- Open http://localhost:8000/health in browser
- Should see: `{"status": "healthy", "api": "running"}`

### Step 3: Start Frontend (30 seconds)

**Terminal 3:**
```bash
cd "c:\Users\harsh\Desktop\ML Monitoring System\frontend"
npm start
```

**Verify it's running:**
- App opens automatically at http://localhost:3000
- Should see Dashboard with metrics

---

## Using the Feature (2 minutes)

### Manual Prediction

1. Click on **Prediction** page in navigation
2. Click **"Manual Prediction"** tab (should be selected)
3. Upload Model:
   - Click "Upload ML Model" area
   - Select: `backend/uploaded_models/fraud_detection_model.joblib`
   - Wait for success message ✓

4. Enter Transaction Details:
   - Amount: `500`
   - Merchant Category: `E-commerce`
   - Time of Day: `Evening`
   - User History: `45` days

5. Click **"Get Prediction"** button
6. See result:
   ```
   ✅ Prediction: Approved
   📊 Confidence: 87.34%
   📈 Probability: 87.34% Approved, 12.66% Rejected
   ⚠️ Risk Score: 12.66/100
   💡 Recommendation: Strong
   ```

### Batch Prediction

1. Click **"Batch Prediction"** tab
2. Upload Model (same as above)
3. Upload Dataset:
   - Click "Upload Dataset" area
   - Select: `backend/uploaded_datasets/transactions_sample.csv`
   - Wait for success message ✓

4. Click **"Run Batch Prediction"** button
5. See prediction table with 100 transactions:
   - Transaction ID, Amount, Category, Prediction, Confidence, Risk Score, Status
6. Click **"Download Results as CSV"** to export

---

## 🎯 What's Happening Behind the Scenes

### File Flow

```
1. Frontend (React)
   ↓ [Select file in browser]
   ↓ [Create FormData]
   ↓ [Send via axios POST]
   
2. Backend (FastAPI)
   ↓ [Receive file]
   ↓ [Validate file type]
   ↓ [Save to disk in backend/uploaded_models/ or backend/uploaded_datasets/]
   ↓ [Create database record with metadata]
   ↓ [Return model_id or dataset_id]
   ↓ [Send response back to frontend]
   
3. Frontend receives response
   ↓ [Store model_id in state]
   ↓ [Display model info card]
   ↓ [Enable prediction buttons]
```

### Prediction Flow

```
Manual Prediction:
1. User fills form → Clicks "Get Prediction"
2. Frontend sends POST to /api/predictions/manual with:
   {model_id, amount, merchant_type, time_of_day, user_history}
3. Backend:
   - Loads model from database
   - Generates prediction using ML model
   - Logs to inference_logs table
   - Returns prediction result
4. Frontend displays result with confidence, probabilities, risk score

Batch Prediction:
1. User uploads dataset → Clicks "Run Batch Prediction"
2. Frontend sends POST to /api/predictions/batch with:
   {model_id, dataset_id}
3. Backend:
   - Loads model and dataset files
   - Iterates through each row
   - Generates prediction for each row
   - Stores all predictions in database
   - Returns array of predictions
4. Frontend displays table with all predictions
5. User can download as CSV
```

---

## 📊 API Endpoints Quick Reference

### Upload Endpoints

**Upload Model:**
```bash
curl -X POST http://localhost:8000/api/uploads/model \
  -F "file=@fraud_detection_model.joblib"
```

**Response:**
```json
{
  "model_id": 1,
  "name": "fraud_detection_model.joblib",
  "size": 2.45,
  "type": "scikit-learn",
  "accuracy": 0.9456,
  "version": "v20260130_143022",
  "upload_date": "2026-01-30T14:30:22",
  "status": "ready"
}
```

**Upload Dataset:**
```bash
curl -X POST http://localhost:8000/api/uploads/dataset \
  -F "file=@transactions_sample.csv"
```

**Response:**
```json
{
  "dataset_id": 1,
  "name": "transactions_sample.csv",
  "rows": 100,
  "columns": ["transaction_id", "amount", "merchant_type", ...],
  "upload_date": "2026-01-30T14:35:10",
  "status": "processing_complete"
}
```

### Prediction Endpoints

**Manual Prediction:**
```bash
curl -X POST http://localhost:8000/api/predictions/manual \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": 1,
    "amount": 500,
    "merchant_type": "E-commerce",
    "time_of_day": "Evening",
    "user_history": 45
  }'
```

**Batch Prediction:**
```bash
curl -X POST http://localhost:8000/api/predictions/batch \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": 1,
    "dataset_id": 1
  }'
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Please upload a model first!" | Upload model before making prediction |
| Connection refused (port 8000) | Start backend: `python backend/main.py` |
| CORS error | Ensure backend CORS middleware is enabled |
| File not uploaded | Check file format, try smaller file |
| Empty predictions table | Verify dataset has data, check backend logs |
| Port 3000 already in use | Kill existing npm process or use different port |

---

## 📁 File Locations

After running scripts, files will be at:

```
backend/
  ├── uploaded_models/
  │   ├── fraud_detection_model.joblib         ← Model file
  │   └── fraud_detection_model_metadata.json
  └── uploaded_datasets/
      ├── transactions_sample.csv              ← Small dataset (100 rows)
      └── transactions_large.csv               ← Large dataset (1000 rows)

frontend/
  └── (React files - no changes needed)

Database:
  backend/ml_monitoring.db                     ← SQLite database
  - models table
  - datasets table
  - inference_logs table
```

---

## 🔍 Monitoring & Debugging

### Check what's uploaded

**List all models:**
```bash
curl http://localhost:8000/api/uploads/models/list
```

**Get model details:**
```bash
curl http://localhost:8000/api/uploads/model/1
```

**Get dataset details:**
```bash
curl http://localhost:8000/api/uploads/dataset/1
```

### View Database Records

```bash
cd backend
sqlite3 ml_monitoring.db

# Check models
SELECT * FROM models;

# Check datasets
SELECT * FROM datasets;

# Check predictions
SELECT * FROM inference_logs LIMIT 5;
```

### View Backend Logs

The terminal running `python main.py` shows:
- All HTTP requests/responses
- File upload confirmations
- Prediction calculations
- Database operations
- Any errors

---

## 💾 Next: Advanced Features

After getting this working:

1. **Use Real ML Model:**
   - Train your own model
   - Save as .pkl or .joblib
   - Upload through the system

2. **Use Real Data:**
   - Prepare your CSV dataset
   - Upload through batch prediction
   - Get actual predictions

3. **Monitor Performance:**
   - View all past predictions at `/api/predictions/inference-logs/1`
   - Track accuracy over time
   - Monitor model drift

4. **Integrate with Dashboard:**
   - Predictions automatically logged
   - View prediction history in dashboard
   - Get alerts on anomalies

---

## ✅ Verification Checklist

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Sample model created in backend/uploaded_models/
- [ ] Sample datasets created in backend/uploaded_datasets/
- [ ] Model uploads successfully to Prediction page
- [ ] Dataset uploads successfully to Batch Prediction
- [ ] Manual prediction returns result with confidence
- [ ] Batch prediction returns table with predictions
- [ ] Results can be downloaded as CSV
- [ ] All data logged in database

---

## 📞 Help & Support

**Having issues?** Check:
1. Both servers are running (port 8000 and 3000)
2. Sample scripts ran without errors
3. Files exist in backend/uploaded_models/ and backend/uploaded_datasets/
4. Browser console shows no CORS errors
5. Backend terminal shows successful file saves

**For detailed setup:** See [MODEL_UPLOAD_GUIDE.md](./MODEL_UPLOAD_GUIDE.md)

