import axios from 'axios'
import type { MonitoringData, AlertItem, ModelVersion, PredictionLog, PredictionStats, UploadedModel, ApiKey, ApiKeyCreated } from '../types'

const BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: BASE })

// Inject auth token on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ml_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auth
export const registerUser  = (data: object) => api.post('/auth/register', data).then(r => r.data)
export const loginUser     = (data: object) => api.post('/auth/login', data).then(r => r.data)
export const getMe         = ()             => api.get('/auth/me').then(r => r.data)
export const updateProfile = (data: object) => api.put('/auth/me', data).then(r => r.data)
export const listUsers     = ()             => api.get('/auth/users').then(r => r.data)

// API Keys
export const createApiKey  = (name: string): Promise<ApiKeyCreated> =>
  api.post('/api-keys', { name }).then(r => r.data)
export const listApiKeys   = (): Promise<ApiKey[]> => api.get('/api-keys').then(r => r.data)
export const revokeApiKey  = (id: number) => api.delete(`/api-keys/${id}`).then(r => r.data)

// Prediction
export const predictLoan   = (data: { features: Record<string, number>; inject_drift?: boolean }) =>
  api.post('/predict', data).then(r => r.data)
export const fetchRecentPredictions = (limit = 5): Promise<PredictionLog[]> =>
  api.get(`/predictions/recent?limit=${limit}`).then(r => r.data)

// Monitoring
export const fetchMetrics  = (): Promise<MonitoringData> => api.get('/metrics').then(r => r.data)
export const fetchAlerts   = (): Promise<AlertItem[]>    => api.get('/alerts').then(r => r.data)
export const resolveAlert  = (id: number) => api.post(`/alerts/${id}/resolve`).then(r => r.data)

// Models
export const fetchModels   = (): Promise<ModelVersion[]> => api.get('/models').then(r => r.data)
export const forceRetrain  = () => api.post('/retrain').then(r => r.data)
export const rollbackModel = (version: string) => api.post(`/rollback/${version}`).then(r => r.data)
export const injectDrift   = () => api.post('/inject-drift').then(r => r.data)

// Uploaded models
export const fetchUploadedModels = (): Promise<UploadedModel[]> =>
  api.get('/models/uploaded').then(r => r.data)
export const activateUploadedModel = (id: number) =>
  api.post(`/models/uploaded/${id}/activate`).then(r => r.data)
export const deleteUploadedModel = (id: number) =>
  api.delete(`/models/uploaded/${id}`).then(r => r.data)
export const predictWithUploadedModel = (id: number, features: Record<string, number>) =>
  api.post(`/models/uploaded/${id}/predict`, { features }).then(r => r.data)

export const uploadModel = (formData: FormData) =>
  api.post('/models/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)

// Analytics
export const fetchStats = (days = 7): Promise<PredictionStats> =>
  api.get(`/analytics/stats?days=${days}`).then(r => r.data)
export const fetchFeatureImportance = () =>
  api.get('/analytics/feature-importance').then(r => r.data)

// Pipeline Analysis
export const triggerAnalysis    = (modelId: number) =>
  api.post(`/pipeline/analyze/${modelId}`).then(r => r.data)
export const getAnalysis        = (analysisId: number) =>
  api.get(`/pipeline/analysis/${analysisId}`).then(r => r.data)
export const getAnalysisCode    = (analysisId: number) =>
  api.get(`/pipeline/analysis/${analysisId}/code`).then(r => r.data)
export const listModelAnalyses  = (modelId: number) =>
  api.get(`/pipeline/model/${modelId}/analyses`).then(r => r.data)
export const listVersions       = (modelId: number) =>
  api.get(`/pipeline/model/${modelId}/versions`).then(r => r.data)
export const getVersionCode     = (versionId: number) =>
  api.get(`/pipeline/version/${versionId}/code`).then(r => r.data)
export const getLatestCode      = (modelId: number) =>
  api.get(`/pipeline/model/${modelId}/latest-code`).then(r => r.data)
export const getPipelineSummary = () =>
  api.get('/pipeline/summary').then(r => r.data)
