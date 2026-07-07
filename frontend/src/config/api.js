/**
 * API Configuration
 * Centralised API base URL and endpoint definitions.
 *
 * All components should import from this file — never hardcode URLs.
 * Set REACT_APP_API_URL in your .env file to override the default.
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001';

/** Default axios-compatible request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** HTTP status codes used for consistent error handling across the app. */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
};

export const API_ENDPOINTS = {
  // Predictions
  PREDICT: `${API_BASE_URL}/api/v1/predictions/predict`,
  BATCH_PREDICT: `${API_BASE_URL}/api/v1/predictions/batch`,
  MANUAL_PREDICT: `${API_BASE_URL}/api/v1/predictions/manual`,

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

  // Uploads
  UPLOAD_MODEL: `${API_BASE_URL}/api/v1/uploads/model`,
  UPLOAD_DATASET: `${API_BASE_URL}/api/v1/uploads/dataset`,
};

export default API_BASE_URL;
