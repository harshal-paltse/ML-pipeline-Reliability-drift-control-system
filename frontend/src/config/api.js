/**
 * API Configuration
 * Centralized API base URL configuration
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001';

export const API_ENDPOINTS = {
  // Predictions
  PREDICT: `${API_BASE_URL}/api/v1/predictions/predict`,
  
  // Health
  HEALTH_SCORE: `${API_BASE_URL}/api/v1/health/score`,
  HEALTH_STATUS: `${API_BASE_URL}/api/v1/health/status`,
  
  // Alerts
  ALERTS: `${API_BASE_URL}/api/v1/alerts/`,
  ALERT_RESOLVE: (id) => `${API_BASE_URL}/api/v1/alerts/${id}/resolve`,
  ALERTS_SUMMARY: `${API_BASE_URL}/api/v1/alerts/summary`,
  
  // Models
  MODELS: `${API_BASE_URL}/api/v1/models/`,
  ACTIVE_MODEL: `${API_BASE_URL}/api/v1/models/active`,
  
  // Monitoring
  DRIFT: `${API_BASE_URL}/api/v1/monitoring/drift`,
  PERFORMANCE: (modelId) => `${API_BASE_URL}/api/v1/monitoring/performance/${modelId}`,
  MONITORING_CHECK: `${API_BASE_URL}/api/v1/monitoring/check`,
  
  // Data
  INFERENCE_LOGS: (modelId) => `${API_BASE_URL}/api/v1/data/inference/${modelId}`,
};

export default API_BASE_URL;
