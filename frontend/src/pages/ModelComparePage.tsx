/**
 * Model Comparison Page — compare all uploaded models side by side,
 * run the same input through each and compare outputs.
 */
import { useState, useEffect } from 'react'
import { fetchUploadedModels, predictWithUploadedModel } from '../hooks/useApi'
import type { UploadedModel } from '../types'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626']

interface CompareResult {
  model_id: number
  model_name: string
  label: string
  confidence: number
  prediction: number
}

export default function ModelComparePage() {
  const [models, setModels]       = useState<UploadedModel[]>([])
  const [selected, setSelected]   = useState<number[]>([])
  const [features, setFeatures]   = useState<Record<string, string>>({})
  const [results, setResults]     = useState<CompareResult[]>([])
  const [running, setRunning]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    fetchUploadedModels().then(ms => {
      setModels(ms)
      // Auto-select all
      setSelected(ms.map(m => m.id))
      // Build union of all feature names
      const allFeats = Array.from(new Set(ms.flatMap(m => m.feature_names)))
      const init: Record<string, string> = {}
      allFeats.forEach(f => { init[f] = '' })
      setFeatures(init)
    }).catch(() => {})
  }, [])

  const allFeatures = Array.from(new Set(models.flatMap(m => m.feature_names)))

  const handleRun = async () => {
    if (!selected.length) return
    setRunning(true); setError(null); setResults([])
    const out: CompareResult[] = []
    for (const id of selected) {
      const model = models.find(m => m.id === id)
      if (!model) continue
      const feats: Record<string, number> = {}
      for (const f of model.feature_names) {
        feats[f] = parseFloat(features[f] ?? '0') || 0
      }
      try {
        const res = await predictWithUploadedModel(id, feats)
        out.push({ model_id: id, model_name: model.name, label: res.label,
                   confidence: res.confidence, prediction: res.prediction })
      } catch (e: any) {
        out.push({ model_id: id, model_name: model.name, label: 'Error',
                   confidence: 0, prediction: -1 })
      }
    }
    setResults(out)
    setRunning(false)
  }

  if (!models.length) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-subtext text-sm">No uploaded models found. Upload at least 2 models to compare.</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-1">Evaluation</p>
        <h1 className="text-2xl font-bold text-text">Model Comparison</h1>
        <p className="text-subtext text-sm mt-1">
          Run the same applicant data through multiple models and compare their decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: input */}
        <div className="md:col-span-1 flex flex-col gap-4">
          {/* Model selector */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-3">Select Models</p>
            <div className="flex flex-col gap-2">
              {models.map((m, i) => (
                <label key={m.id} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={e => setSelected(prev =>
                      e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id)
                    )}
                    className="rounded border-border"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{m.name}</p>
                      <p className="text-xs text-subtext font-mono">{m.model_type}</p>
                    </div>
                    {m.is_active && <span className="badge-success text-xs flex-shrink-0">Active</span>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Feature inputs */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-3">Input Features</p>
            <div className="flex flex-col gap-2.5">
              {allFeatures.map(f => (
                <div key={f}>
                  <label className="block text-xs text-subtext mb-1 capitalize">
                    {f.replace(/_/g, ' ')}
                  </label>
                  <input type="number" value={features[f] ?? ''}
                    onChange={e => setFeatures(prev => ({ ...prev, [f]: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-white"
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-danger text-xs mt-2">{error}</p>}
            <button onClick={handleRun} disabled={running || !selected.length}
              className="btn-primary w-full py-2.5 text-sm mt-4">
              {running ? 'Comparing...' : `Compare ${selected.length} Models`}
            </button>
          </div>
        </div>

        {/* Right: results */}
        <div className="md:col-span-2">
          {results.length === 0 ? (
            <div className="card p-10 text-center text-subtext text-sm h-full flex items-center justify-center">
              Fill in features and click Compare to see results.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Agreement banner */}
              <div className={`card p-4 border-2 ${
                results.every(r => r.label === results[0].label)
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }`}>
                <p className="text-sm font-semibold text-text">
                  {results.every(r => r.label === results[0].label)
                    ? `✓ All ${results.length} models agree: ${results[0].label}`
                    : `⚠ Models disagree — ${results.filter(r => r.label === 'Approved').length} Approved, ${results.filter(r => r.label === 'Rejected').length} Rejected`
                  }
                </p>
              </div>

              {/* Per-model cards */}
              {results.map((r, i) => {
                const model = models.find(m => m.id === r.model_id)
                const color = COLORS[models.findIndex(m => m.id === r.model_id) % COLORS.length]
                return (
                  <div key={r.model_id} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                        <div>
                          <p className="font-semibold text-text text-sm">{r.model_name}</p>
                          <p className="text-xs text-subtext font-mono">{model?.model_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={r.label === 'Approved' ? 'badge-success' : r.label === 'Error' ? 'badge-gray' : 'badge-danger'}>
                          {r.label}
                        </span>
                        <span className="text-lg font-bold font-mono text-text">
                          {(r.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-surface rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${r.confidence * 100}%`, background: r.label === 'Approved' ? '#16a34a' : '#dc2626' }} />
                    </div>
                  </div>
                )
              })}

              {/* Confidence comparison chart */}
              <div className="card p-5">
                <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Confidence Comparison</p>
                <div className="flex flex-col gap-3">
                  {results.map((r, i) => {
                    const color = COLORS[models.findIndex(m => m.id === r.model_id) % COLORS.length]
                    return (
                      <div key={r.model_id} className="flex items-center gap-3">
                        <span className="text-xs text-subtext w-28 truncate">{r.model_name}</span>
                        <div className="flex-1 h-4 bg-surface rounded-full overflow-hidden">
                          <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                            style={{ width: `${r.confidence * 100}%`, background: color }}>
                            <span className="text-white text-xs font-bold">{(r.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
