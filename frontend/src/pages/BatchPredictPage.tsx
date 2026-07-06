/**
 * Batch Prediction Page — paste CSV rows or upload a CSV file,
 * run predictions on all rows at once, download results as CSV.
 */
import { useState, useRef, useEffect } from 'react'
import { fetchUploadedModels, predictLoan } from '../hooks/useApi'
import type { UploadedModel } from '../types'
import { Link } from 'react-router-dom'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

interface BatchRow { [key: string]: string }
interface BatchResult extends BatchRow {
  _prediction: string
  _label: string
  _confidence: string
  _risk: string
}

export default function BatchPredictPage() {
  const [activeModel, setActiveModel] = useState<UploadedModel | null>(null)
  const [csvText, setCsvText]         = useState('')
  const [results, setResults]         = useState<BatchResult[]>([])
  const [running, setRunning]         = useState(false)
  const [progress, setProgress]       = useState(0)
  const [error, setError]             = useState<string | null>(null)
  const fileRef                       = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUploadedModels()
      .then(ms => setActiveModel(ms.find(m => m.is_active) ?? null))
      .catch(() => {})
  }, [])

  const parseCSV = (text: string): BatchRow[] => {
    const lines = text.trim().split('\n').filter(Boolean)
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim())
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim())
      const row: BatchRow = {}
      headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
      return row
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCsvText(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  const handleRun = async () => {
    if (!activeModel) return
    const rows = parseCSV(csvText)
    if (!rows.length) { setError('No valid rows found. Check CSV format.'); return }

    setRunning(true); setError(null); setResults([]); setProgress(0)
    const out: BatchResult[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const features: Record<string, number> = {}
      for (const f of activeModel.feature_names) {
        features[f] = parseFloat(row[f] ?? '0') || 0
      }
      try {
        const res = await predictLoan({ features })
        out.push({
          ...row,
          _prediction: String(res.prediction),
          _label:      res.label,
          _confidence: (res.confidence * 100).toFixed(1) + '%',
          _risk:       res.risk_level,
        })
      } catch {
        out.push({ ...row, _prediction: '-1', _label: 'Error', _confidence: '-', _risk: '-' })
      }
      setProgress(Math.round(((i + 1) / rows.length) * 100))
    }

    setResults(out)
    setRunning(false)
  }

  const downloadCSV = () => {
    if (!results.length) return
    const headers = Object.keys(results[0])
    const csv = [
      headers.join(','),
      ...results.map(r => headers.map(h => r[h] ?? '').join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'batch_predictions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const approved = results.filter(r => r._label === 'Approved').length
  const rejected = results.filter(r => r._label === 'Rejected').length

  if (!activeModel) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-text mb-2">No Model Activated</h2>
      <p className="text-subtext text-sm mb-6">Upload and activate a model first.</p>
      <Link to="/models" className="inline-flex items-center gap-2 btn-primary px-6 py-2.5 text-sm">
        Upload a Model →
      </Link>
    </div>
  )

  const sampleCSV = activeModel.feature_names.join(',') + '\n' +
    activeModel.feature_names.map(() => '0').join(',')

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-1">Batch Processing</p>
        <h1 className="text-2xl font-bold text-text">Batch Prediction</h1>
        <p className="text-subtext text-sm mt-1">
          Run predictions on multiple applicants at once. Upload a CSV or paste data below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Input */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-text">Input CSV</p>
            <div className="flex gap-2">
              <button onClick={() => setCsvText(sampleCSV)}
                className="text-xs text-accent hover:underline">Load sample</button>
              <label className="text-xs text-accent hover:underline cursor-pointer">
                Upload file
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
          <p className="text-xs text-subtext mb-2">
            Required columns: <code className="font-mono">{activeModel.feature_names.join(', ')}</code>
          </p>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            rows={10}
            placeholder={`${activeModel.feature_names.join(',')}\n35,600000,720,8,500000,...`}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-xs font-mono text-text bg-white resize-none"
          />
          {error && <p className="text-danger text-xs mt-2">{error}</p>}
          <button
            onClick={handleRun}
            disabled={running || !csvText.trim()}
            className="btn-primary w-full py-2.5 text-sm mt-4"
          >
            {running ? `Running... ${progress}%` : `Run Batch (${parseCSV(csvText).length} rows)`}
          </button>
          {running && (
            <div className="mt-3 h-2 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Results Summary</p>
            {results.length === 0 ? (
              <p className="text-subtext text-sm">Run batch to see results.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-subtext">Total processed</span>
                  <span className="font-bold text-text">{results.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-subtext">Approved</span>
                  <span className="font-bold text-success">{approved} ({results.length ? ((approved/results.length)*100).toFixed(0) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-subtext">Rejected</span>
                  <span className="font-bold text-danger">{rejected} ({results.length ? ((rejected/results.length)*100).toFixed(0) : 0}%)</span>
                </div>
                <div className="h-3 bg-surface rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${results.length ? (approved/results.length)*100 : 0}%` }} />
                </div>
                <button onClick={downloadCSV}
                  className="btn-primary py-2 text-sm mt-2">
                  ↓ Download Results CSV
                </button>
              </div>
            )}
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-3">Active Model</p>
            <p className="font-semibold text-text">{activeModel.name}</p>
            <p className="text-xs text-subtext font-mono mt-1">{activeModel.version}</p>
            <p className="text-xs text-subtext mt-1">
              {activeModel.feature_names.length} features · {activeModel.model_type}
            </p>
          </div>
        </div>
      </div>

      {/* Results table */}
      {results.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Prediction Results ({results.length} rows)</p>
            <button onClick={downloadCSV} className="text-xs text-accent hover:underline">Download CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-2.5 text-subtext font-semibold uppercase tracking-wider">#</th>
                  {activeModel.feature_names.slice(0, 4).map(f => (
                    <th key={f} className="text-left px-4 py-2.5 text-subtext font-semibold uppercase tracking-wider capitalize">
                      {f.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="text-left px-4 py-2.5 text-subtext font-semibold uppercase tracking-wider">Decision</th>
                  <th className="text-left px-4 py-2.5 text-subtext font-semibold uppercase tracking-wider">Confidence</th>
                  <th className="text-left px-4 py-2.5 text-subtext font-semibold uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-surface/50">
                    <td className="px-4 py-2.5 text-subtext">{i + 1}</td>
                    {activeModel.feature_names.slice(0, 4).map(f => (
                      <td key={f} className="px-4 py-2.5 font-mono text-text">{r[f] ?? '—'}</td>
                    ))}
                    <td className="px-4 py-2.5">
                      <span className={r._label === 'Approved' ? 'badge-success' : r._label === 'Error' ? 'badge-gray' : 'badge-danger'}>
                        {r._label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-subtext">{r._confidence}</td>
                    <td className="px-4 py-2.5">
                      <span className={
                        r._risk === 'Low' ? 'text-success' :
                        r._risk === 'Medium' ? 'text-warn' : 'text-danger'
                      }>{r._risk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length > 100 && (
              <p className="text-xs text-subtext text-center py-3">
                Showing first 100 of {results.length} rows. Download CSV for full results.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
