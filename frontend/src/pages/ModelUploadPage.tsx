import { useState, useEffect, useRef } from 'react'
import { fetchUploadedModels, uploadModel, activateUploadedModel,
         deleteUploadedModel, predictWithUploadedModel } from '../hooks/useApi'
import type { UploadedModel } from '../types'
import { useAuth } from '../hooks/useAuth'

export default function ModelUploadPage() {
  const { user }                    = useAuth()
  const [models, setModels]         = useState<UploadedModel[]>([])
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<string | null>(null)
  const [predicting, setPredicting] = useState<number | null>(null)
  const [predResult, setPredResult] = useState<Record<number, any>>({})
  const fileRef                     = useRef<HTMLInputElement>(null)
  const scalerRef                   = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', feature_names: 'age,annual_income_inr,cibil_score,employment_years,loan_amount_inr,loan_tenure_months,existing_loans', notes: ''
  })
  const [predFeatures, setPredFeatures] = useState<Record<number, Record<string, string>>>({})

  const load = async () => {
    try { setModels(await fetchUploadedModels()) } catch { /* ignore */ }
  }
  useEffect(() => { load() }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Please select a model file.'); return }

    setUploading(true); setError(null); setSuccess(null)
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('notes', form.notes)
    fd.append('feature_names', form.feature_names)
    fd.append('model_file', file)
    if (scalerRef.current?.files?.[0]) fd.append('scaler_file', scalerRef.current.files[0])

    try {
      await uploadModel(fd)
      setSuccess('Model uploaded successfully!')
      setForm({ name: '', feature_names: 'age,annual_income_inr,cibil_score,employment_years,loan_amount_inr,loan_tenure_months,existing_loans', notes: '' })
      if (fileRef.current)   fileRef.current.value   = ''
      if (scalerRef.current) scalerRef.current.value = ''
      load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Upload failed.')
    } finally { setUploading(false) }
  }

  const handleActivate = async (id: number) => {
    try {
      await activateUploadedModel(id)
      setSuccess('Model activated as live prediction model.')
      load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Activation failed.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this model?')) return
    await deleteUploadedModel(id); load()
  }

  const handlePredict = async (model: UploadedModel) => {
    const feats = predFeatures[model.id] || {}
    const parsed: Record<string, number> = {}
    for (const f of model.feature_names) {
      const v = parseFloat(feats[f] || '0')
      if (isNaN(v)) { setError(`Invalid value for feature: ${f}`); return }
      parsed[f] = v
    }
    setPredicting(model.id); setError(null)
    try {
      const res = await predictWithUploadedModel(model.id, parsed)
      setPredResult(prev => ({ ...prev, [model.id]: res }))
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Prediction failed.')
    } finally { setPredicting(null) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-1">Models</p>
        <h1 className="text-2xl font-bold text-text">Upload ML Model</h1>
        <p className="text-subtext text-sm mt-1">
          Upload any scikit-learn compatible <code className="bg-surface px-1 rounded text-xs">.joblib</code> or <code className="bg-surface px-1 rounded text-xs">.pkl</code> model and run live predictions.
          All monetary features are treated as <strong>Indian Rupees (₹)</strong>.
        </p>
      </div>

      {/* Feature name guide */}
      <div className="card p-5 mb-6 bg-blue-50 border-blue-100">
        <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">
          Recommended Feature Names (INR-aware)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { name: 'age',                 desc: 'Applicant age (years)' },
            { name: 'annual_income_inr',   desc: 'Annual income in ₹' },
            { name: 'cibil_score',         desc: 'CIBIL credit score (300–900)' },
            { name: 'employment_years',    desc: 'Years employed' },
            { name: 'loan_amount_inr',     desc: 'Requested loan in ₹' },
            { name: 'loan_tenure_months',  desc: 'Repayment period (months)' },
            { name: 'existing_loans',      desc: 'Number of active loans' },
            { name: 'loan_to_value_ratio', desc: 'LTV % (0–100)' },
            { name: 'debt_to_income_ratio',desc: 'DTI % (0–100)' },
            { name: 'missed_payments',     desc: 'Missed EMIs (last 12m)' },
            { name: 'savings_inr',         desc: 'Total savings in ₹' },
            { name: 'self_employed',       desc: '0=Salaried, 1=Self-employed' },
          ].map(f => (
            <div key={f.name} className="flex flex-col gap-0.5">
              <code className="text-xs font-mono text-accent">{f.name}</code>
              <span className="text-xs text-subtext">{f.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-subtext mt-3">
          You can use any feature names — these are just recommended for best auto-labeling in the UI.
        </p>
      </div>

      {/* Upload form */}
      <div className="card p-6 mb-8">
        <h2 className="text-sm font-semibold text-text mb-5">Upload New Model</h2>
        <form onSubmit={handleUpload} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">Model Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. XGBoost Credit v2" required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-white" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">
              Feature Names * <span className="text-subtext font-normal normal-case">(comma-separated)</span>
            </label>
            <input value={form.feature_names}
              onChange={e => setForm(f => ({ ...f, feature_names: e.target.value }))} required
              placeholder="age,income,credit_score,..."
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-white" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">
              Model File * (.joblib / .pkl)
            </label>
            <input ref={fileRef} type="file" accept=".joblib,.pkl" required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-white" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">
              Scaler File <span className="text-subtext font-normal normal-case">(optional)</span>
            </label>
            <input ref={scalerRef} type="file" accept=".joblib,.pkl"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-surface file:text-subtext" />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional description..."
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-white" />
          </div>

          {error   && <div className="col-span-2 bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-3 py-2">{error}</div>}
          {success && <div className="col-span-2 bg-green-50 border border-green-200 text-success text-sm rounded-lg px-3 py-2">{success}</div>}

          <div className="col-span-2">
            <button type="submit" disabled={uploading} className="btn-primary px-6 py-2.5 text-sm">
              {uploading ? 'Uploading...' : 'Upload Model'}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded models list */}
      <h2 className="text-sm font-semibold text-text mb-4">Uploaded Models ({models.length})</h2>
      {models.length === 0 ? (
        <div className="card p-10 text-center text-subtext text-sm">No models uploaded yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {models.map(m => (
            <div key={m.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text">{m.name}</h3>
                    <span className="badge-gray font-mono text-xs">{m.version}</span>
                    {m.is_active && <span className="badge-success">Active</span>}
                    {m.model_type && <span className="badge-blue">{m.model_type}</span>}
                  </div>
                  <p className="text-xs text-subtext">
                    {m.filename} · Features: <span className="font-mono">{m.feature_names.join(', ')}</span>
                  </p>
                  {m.notes && <p className="text-xs text-subtext mt-1">{m.notes}</p>}
                </div>
                <div className="flex gap-2">
                  {user?.role === 'admin' && !m.is_active && (
                    <button onClick={() => handleActivate(m.id)}
                      className="text-xs px-3 py-1.5 border border-accent text-accent rounded-lg hover:bg-blue-50 transition-colors">
                      Activate
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(m.id)}
                      className="text-xs px-3 py-1.5 border border-red-200 text-danger rounded-lg hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Inline prediction form */}
              <div className="border-t border-border pt-3 mt-2">
                <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-2">Test Prediction</p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                  {m.feature_names.map(f => (
                    <div key={f}>
                      <label className="block text-xs text-subtext mb-1 capitalize">{f.replace('_', ' ')}</label>
                      <input type="number"
                        value={predFeatures[m.id]?.[f] || ''}
                        onChange={e => setPredFeatures(prev => ({
                          ...prev,
                          [m.id]: { ...(prev[m.id] || {}), [f]: e.target.value }
                        }))}
                        placeholder="0"
                        className="w-full border border-border rounded px-2 py-1.5 text-xs text-text bg-white" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handlePredict(m)} disabled={predicting === m.id}
                    className="btn-primary px-4 py-1.5 text-xs">
                    {predicting === m.id ? 'Running...' : 'Run Prediction'}
                  </button>
                  {predResult[m.id] && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      predResult[m.id].prediction === 1
                        ? 'bg-green-50 text-success border border-green-200'
                        : 'bg-red-50 text-danger border border-red-200'
                    }`}>
                      {predResult[m.id].label} — {(predResult[m.id].confidence * 100).toFixed(1)}% confidence
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
