import { useState, useEffect } from 'react'
import { predictLoan, fetchRecentPredictions, fetchUploadedModels } from '../hooks/useApi'
import type { PredictionResponse, PredictionLog, UploadedModel } from '../types'
import { Link } from 'react-router-dom'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtNum = (n: number) =>
  new Intl.NumberFormat('en-IN').format(n)

// ── Known feature metadata (label, unit, hint, min, max) ─────────────────────
const FEATURE_META: Record<string, { label: string; hint: string; placeholder: string; min?: number; max?: number; prefix?: string }> = {
  age:                    { label: 'Age',                    hint: '18–75 years',         placeholder: '35',       min: 18,  max: 75 },
  annual_income_inr:      { label: 'Annual Income',          hint: '₹ per year',           placeholder: '600000',   min: 0,   prefix: '₹' },
  income:                 { label: 'Annual Income',          hint: '₹ per year',           placeholder: '600000',   min: 0,   prefix: '₹' },
  monthly_income_inr:     { label: 'Monthly Income',         hint: '₹ per month',          placeholder: '50000',    min: 0,   prefix: '₹' },
  cibil_score:            { label: 'CIBIL Score',            hint: '300–900',              placeholder: '720',      min: 300, max: 900 },
  credit_score:           { label: 'Credit / CIBIL Score',   hint: '300–900',              placeholder: '720',      min: 300, max: 900 },
  employment_years:       { label: 'Employment Years',       hint: 'years at current job', placeholder: '5',        min: 0 },
  loan_amount_inr:        { label: 'Loan Amount',            hint: '₹ requested',          placeholder: '500000',   min: 0,   prefix: '₹' },
  loan_amount:            { label: 'Loan Amount',            hint: '₹ requested',          placeholder: '500000',   min: 0,   prefix: '₹' },
  loan_tenure_months:     { label: 'Loan Tenure',            hint: 'months',               placeholder: '60',       min: 6,   max: 360 },
  existing_loans:         { label: 'Existing Active Loans',  hint: 'count',                placeholder: '1',        min: 0,   max: 20 },
  loan_to_value_ratio:    { label: 'Loan-to-Value Ratio',    hint: '% (0–100)',            placeholder: '70',       min: 0,   max: 100 },
  debt_to_income_ratio:   { label: 'Debt-to-Income Ratio',   hint: '% (0–100)',            placeholder: '30',       min: 0,   max: 100 },
  num_credit_cards:       { label: 'Credit Cards',           hint: 'number of cards',      placeholder: '2',        min: 0 },
  missed_payments:        { label: 'Missed Payments (12m)',  hint: 'last 12 months',       placeholder: '0',        min: 0 },
  property_value_inr:     { label: 'Property Value',         hint: '₹ collateral value',   placeholder: '2000000',  min: 0,   prefix: '₹' },
  savings_inr:            { label: 'Savings / FD Balance',   hint: '₹ total savings',      placeholder: '100000',   min: 0,   prefix: '₹' },
  dependents:             { label: 'Dependents',             hint: 'number of dependents', placeholder: '2',        min: 0 },
  education_level:        { label: 'Education Level',        hint: '0=None 1=School 2=Graduate 3=PG', placeholder: '2', min: 0, max: 3 },
  self_employed:          { label: 'Self Employed',          hint: '0 = No, 1 = Yes',      placeholder: '0',        min: 0,   max: 1 },
}

function getFieldMeta(name: string) {
  return FEATURE_META[name] ?? {
    label: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    hint: '',
    placeholder: '0',
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PredictionPage() {
  const [activeModel, setActiveModel]   = useState<UploadedModel | null>(null)
  const [modelLoading, setModelLoading] = useState(true)
  const [formValues, setFormValues]     = useState<Record<string, string>>({})
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState<PredictionResponse | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [history, setHistory]           = useState<PredictionLog[]>([])

  // Load active uploaded model
  useEffect(() => {
    setModelLoading(true)
    fetchUploadedModels()
      .then(models => {
        const active = models.find(m => m.is_active) ?? null
        setActiveModel(active)
        // Pre-fill form with empty strings for each feature
        if (active) {
          const init: Record<string, string> = {}
          active.feature_names.forEach(f => { init[f] = '' })
          setFormValues(init)
        }
      })
      .catch(() => setActiveModel(null))
      .finally(() => setModelLoading(false))
    fetchRecentPredictions(5).then(setHistory).catch(() => {})
  }, [])

  const handleChange = (name: string, value: string) =>
    setFormValues(prev => ({ ...prev, [name]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeModel) return
    setLoading(true); setError(null); setResult(null)

    // Parse all feature values
    const features: Record<string, number> = {}
    for (const f of activeModel.feature_names) {
      const v = parseFloat(formValues[f] ?? '0')
      if (isNaN(v)) { setError(`Invalid value for "${f}"`); setLoading(false); return }
      features[f] = v
    }

    try {
      const res = await predictLoan({ features, inject_drift: false })
      setResult(res)
      fetchRecentPredictions(5).then(setHistory).catch(() => {})
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Prediction failed. Check backend.')
    } finally { setLoading(false) }
  }

  const isApproved = result?.prediction === 1
  const riskColor  = result?.risk_level === 'Low' ? '#16a34a' : result?.risk_level === 'Medium' ? '#d97706' : '#dc2626'

  // ── No model uploaded yet ──────────────────────────────────────────────────
  if (modelLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-subtext text-sm">
        Loading model...
      </div>
    )
  }

  if (!activeModel) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text mb-2">No Model Activated</h2>
        <p className="text-subtext text-sm mb-6">
          Upload your trained scikit-learn model (.joblib / .pkl) and activate it to start making predictions.
        </p>
        <Link to="/models"
          className="inline-flex items-center gap-2 btn-primary px-6 py-2.5 text-sm">
          Upload a Model →
        </Link>
      </div>
    )
  }

  const features = activeModel.feature_names

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-1">
          Credit Risk Assessment
        </p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Loan Approval Prediction</h1>
            <p className="text-subtext text-sm mt-1">
              All monetary values are in <span className="font-semibold text-text">Indian Rupees (₹)</span>
            </p>
          </div>
          <div className="text-right">
            <span className="badge-blue text-xs">{activeModel.model_type || 'ML Model'}</span>
            <p className="text-xs text-subtext mt-1 font-mono">{activeModel.name}</p>
          </div>
        </div>
      </div>

      {/* Model info banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm">
        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
        <span className="text-subtext">
          Using model <span className="font-semibold text-text">{activeModel.name}</span>
          {' '}· {features.length} features
          {' '}· <span className="font-mono text-xs">{activeModel.version}</span>
        </span>
        <Link to="/models" className="ml-auto text-xs text-accent hover:underline flex-shrink-0">
          Change model →
        </Link>
      </div>

      {/* Form */}
      <div className="card p-6 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Dynamic feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(f => {
              const meta = getFieldMeta(f)
              const isMonetary = meta.prefix === '₹'
              const val = formValues[f] ?? ''

              return (
                <div key={f}>
                  <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">
                    {meta.label}
                    {meta.hint && (
                      <span className="text-subtext/60 font-normal normal-case ml-1">({meta.hint})</span>
                    )}
                  </label>
                  <div className="relative">
                    {isMonetary && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext text-sm font-medium select-none">
                        ₹
                      </span>
                    )}
                    <input
                      type="number"
                      value={val}
                      onChange={e => handleChange(f, e.target.value)}
                      placeholder={meta.placeholder}
                      min={meta.min}
                      max={meta.max}
                      step="any"
                      required
                      className={`w-full border border-border rounded-lg py-2.5 text-sm text-text bg-white ${
                        isMonetary ? 'pl-7 pr-3' : 'px-3'
                      }`}
                    />
                  </div>
                  {/* Live INR formatting preview for monetary fields */}
                  {isMonetary && val && !isNaN(parseFloat(val)) && (
                    <p className="text-xs text-subtext mt-1">{fmt(parseFloat(val))}</p>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary py-3 text-sm">
            {loading ? 'Analyzing application...' : 'Get Prediction'}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className={`card p-6 mb-6 fade-in border-2 ${isApproved ? 'border-green-200' : 'border-red-200'}`}>

          {/* Decision header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-subtext uppercase tracking-wider mb-1">Decision</p>
              <p className={`text-4xl font-bold ${isApproved ? 'text-success' : 'text-danger'}`}>
                {result.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-subtext uppercase tracking-wider mb-1">Confidence</p>
              <p className="text-3xl font-bold font-mono text-text">
                {(result.confidence * 100).toFixed(1)}%
              </p>
              <p className="text-xs mt-1 font-semibold" style={{ color: riskColor }}>
                {result.risk_level} Risk
              </p>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="h-2 bg-surface rounded-full mb-5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${result.confidence * 100}%`,
                background: isApproved ? '#16a34a' : '#dc2626' }} />
          </div>

          {/* Risk factors */}
          {result.risk_factors.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-2">Key Factors</p>
              <div className="flex flex-col gap-1.5">
                {result.risk_factors.map((f, i) => (
                  <div key={i} className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                    isApproved ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
                  }`}>
                    <span className="mt-0.5 flex-shrink-0">{isApproved ? '✓' : '⚠'}</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature contributions */}
          <div>
            <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-3">
              Feature Contributions
            </p>
            <div className="flex flex-col gap-2">
              {Object.entries(result.explanation)
                .sort(([, a], [, b]) => b - a)
                .map(([feat, val]) => {
                  const meta = getFieldMeta(feat)
                  return (
                    <div key={feat} className="flex items-center gap-3">
                      <span className="text-xs text-subtext w-36 flex-shrink-0 truncate" title={meta.label}>
                        {meta.label}
                      </span>
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${Math.min(100, val * 400)}%`,
                            background: isApproved ? '#16a34a' : '#dc2626', opacity: 0.75 }} />
                      </div>
                      <span className="text-xs font-mono text-subtext w-10 text-right">
                        {(val * 100).toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-subtext">
            <span>Model: <span className="font-mono text-accent">{result.model_version}</span></span>
            <span>{new Date(result.timestamp).toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-3">
            Recent Predictions
          </p>
          <div className="flex flex-col gap-2">
            {history.map(h => (
              <div key={h.id} className="card px-4 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className={h.prediction === 1 ? 'badge-success' : 'badge-danger'}>
                    {h.label}
                  </span>
                  <span className="text-subtext text-xs">
                    CIBIL {h.credit_score} · {fmt(h.income)} · Age {h.age}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-subtext">
                    {(h.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-subtext text-xs">
                    {new Date(h.timestamp).toLocaleTimeString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
