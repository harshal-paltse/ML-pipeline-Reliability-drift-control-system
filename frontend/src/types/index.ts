export interface User {
  id: number
  username: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface ApiKey {
  id: number
  name: string
  key_prefix: string
  is_active: boolean
  created_at: string
  last_used: string | null
  request_count: number
}

export interface ApiKeyCreated extends ApiKey {
  key: string   // full raw key — shown once
}

export interface PredictionRequest {
  age: number
  income: number
  credit_score: number
  employment_years: number
  loan_amount: number
  inject_drift?: boolean
}

export interface PredictionResponse {
  prediction: number
  label: string
  confidence: number
  model_version: string
  explanation: Record<string, number>
  timestamp: string
  risk_level: string
  risk_factors: string[]
}

export interface FeatureDrift {
  feature: string
  ks_statistic: number
  p_value: number
  mean_diff: number
  is_drifted: boolean
}

export interface MonitoringData {
  health_score: number
  drift_score: number
  failure_score: number
  confidence_score: number
  importance_score: number
  prediction_count: number
  feature_drifts: FeatureDrift[]
  feature_failures: Record<string, boolean>
  health_history: HealthPoint[]
  timestamp: string
}

export interface HealthPoint {
  timestamp: string
  health_score: number
  drift_score: number
  failure_score: number
}

export interface AlertItem {
  id: number
  timestamp: string
  level: string
  category: string
  message: string
  resolved: boolean
}

export interface ModelVersion {
  id: number
  version: string
  created_at: string
  accuracy: number
  f1_score: number
  training_rows: number
  is_active: boolean
  notes: string | null
}

export interface UploadedModel {
  id: number
  name: string
  version: string
  filename: string
  feature_names: string[]
  model_type: string | null
  uploaded_at: string
  is_active: boolean
  accuracy: number | null
  notes: string | null
}

export interface PredictionLog {
  id: number
  timestamp: string
  age: number
  income: number
  credit_score: number
  employment_years: number
  loan_amount: number
  prediction: number
  label: string
  confidence: number
  model_version: string
  is_drift_injected: boolean
}

export interface PredictionStats {
  total_predictions: number
  approved_count: number
  rejected_count: number
  approval_rate: number
  avg_confidence: number
  avg_credit_score: number
  avg_income: number
  avg_loan_amount: number
  predictions_by_hour: Array<{ hour: string; approved: number; rejected: number }>
  confidence_distribution: Array<{ range: string; count: number }>
}

export interface FeatureImportance {
  feature: string
  importance: number
}

// ── Pipeline Analysis ─────────────────────────────────────────────────────────

export interface PipelineBug {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  detail: string
  fix: string
}

export interface PipelineConflict {
  type: string
  description: string
  resolution: string
}

export interface PipelineWarning {
  category: string
  message: string
}

export interface PipelineSuggestion {
  priority: 'high' | 'medium' | 'low'
  title: string
  detail: string
}

export interface PipelineAnalysis {
  id: number
  model_id: number
  status: 'pending' | 'running' | 'done' | 'failed'
  error_message?: string
  created_at: string
  overall_score: number
  code_quality: number
  data_quality: number
  model_health: number
  pipeline_score: number
  model_type: string
  hyperparameters: Record<string, any>
  feature_stats: Record<string, number>
  bugs: PipelineBug[]
  conflicts: PipelineConflict[]
  warnings: PipelineWarning[]
  suggestions: PipelineSuggestion[]
  rewrite_summary: string
  diff_lines: Array<{ type: 'add' | 'remove' | 'keep'; line: string }>
}

export interface PipelineVersion {
  id: number
  version_tag: string
  commit_hash: string
  commit_msg: string
  author: string
  created_at: string
  is_latest: boolean
  changes_count: number
  parent_hash: string | null
}

export interface PipelineSummary {
  total: number
  models_analyzed: number
  avg_score: number
  total_bugs_found: number
  top_bug_categories: Array<{ category: string; count: number }>
  versions_created: number
}
