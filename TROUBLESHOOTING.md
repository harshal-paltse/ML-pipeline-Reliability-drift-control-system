# Troubleshooting Connection Issues

## Common Issues and Solutions

### 1. Backend Server Not Running

**Symptoms:**
- Connection failed errors in browser console
- "ECONNREFUSED" or "Network Error" messages
- Frontend cannot fetch data from API

**Solution:**
1. Navigate to the `backend` folder
2. Run: `python run_server.py`
   - Or use: `start_backend.bat` (Windows)
3. Verify the server is running by visiting: http://127.0.0.1:8001/health
4. You should see: `{"status": "healthy"}`

### 2. Port Already in Use

**Symptoms:**
- Error: "Address already in use"
- Port 8001 is already occupied

**Solution:**
- Find and kill the process using port 8001:
  ```bash
  # Windows PowerShell
  netstat -ano | findstr :8001
  taskkill /PID <PID> /F
  ```
- Or change the port in `run_server.py`:
  ```python
  uvicorn.run(app, host="127.0.0.1", port=8002)  # Change to different port
  ```

### 3. CORS Errors

**Symptoms:**
- Browser console shows CORS policy errors
- Requests blocked by browser

**Solution:**
- Ensure CORS middleware is enabled in `run_server.py`
- Check that frontend origin is in allowed origins:
  ```python
  allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]
  ```

### 4. Missing Dependencies

**Symptoms:**
- Import errors when starting backend
- ModuleNotFoundError

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### 5. Database Connection Issues

**Symptoms:**
- Database errors
- Tables not created

**Solution:**
- The system uses SQLite by default (no setup needed)
- Database file: `backend/ml_monitoring.db`
- Tables are created automatically on first startup

### 6. Frontend Cannot Connect to Backend

**Symptoms:**
- API calls fail
- 404 or connection refused errors

**Solution:**
1. Verify backend is running: http://127.0.0.1:8001/health
2. Check API configuration in `frontend/src/config/api.js`
3. Ensure proxy in `package.json` points to correct port:
   ```json
   "proxy": "http://127.0.0.1:8001"
   ```
4. Restart frontend after changing proxy:
   ```bash
   cd frontend
   npm start
   ```

## Quick Start Checklist

- [ ] Backend server running on http://127.0.0.1:8001
- [ ] Backend health check returns: `{"status": "healthy"}`
- [ ] Frontend running on http://localhost:3000
- [ ] No CORS errors in browser console
- [ ] API endpoints accessible (check Network tab in browser DevTools)

## Testing the Connection

1. **Test Backend:**
   ```bash
   curl http://127.0.0.1:8001/health
   # Should return: {"status":"healthy"}
   ```

2. **Test API Endpoint:**
   ```bash
   curl http://127.0.0.1:8001/api/v1/health/score
   # Should return health score JSON (may need active model first)
   ```

3. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try making a prediction
   - Check if requests are being sent to correct URL

## Still Having Issues?

1. Check backend logs for errors
2. Check browser console for detailed error messages
3. Verify firewall is not blocking ports 8001 or 3000
4. Try accessing backend directly: http://127.0.0.1:8001/docs
