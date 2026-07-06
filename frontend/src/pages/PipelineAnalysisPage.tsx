import { useState, useEffect, useRef } from 'react'
import { fetchUploadedModels, triggerAnalysis, getAnalysis,
         listModelAnalyses, listVersions, getVersionCode, getLatestCode } from '../hooks/useApi'
import type { UploadedModel, PipelineAnalysis, PipelineVersion } from '../types'
import { Link } from 'react-router-dom'

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const r   = size * 0.38
  const circ = 2 * Math.PI * r
  const off  = circ - (score / 100) * circ
  const color = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={size*0.09} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.09}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x={size/2} y={size/2 + size*0.07} textAnchor="middle"
          fontSize={size*0.22} fontWeight="700" fill={color} fontFamily="monospace">
          {Math.round(score)}
        </text>
      </svg>
      <span className="text-xs text-subtext text-center leading-tight">{label}</span>
    </div>
  )
}

// ── Severity badge ────────────────────────────────────────────────────────────
function SeverityBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border border-red-200',
    high:     'bg-orange-100 text-orange-700 border border-orange-200',
    medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
    low:      'bg-blue-100 text-blue-700 border border-blue-200',
    info:     'bg-gray-100 text-gray-600 border border-gray-200',
  }
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${map[s] || map.info}`}>
      {s}
    </span>
  )
}

// ── Code viewer ───────────────────────────────────────────────────────────────
function CodeViewer({ code, title }: { code: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs font-mono text-subtext ml-2">{title}</span>
        </div>
        <button onClick={copy}
          className="text-xs text-accent hover:underline px-2 py-1 border border-border rounded">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs font-mono text-text bg-white leading-relaxed max-h-[500px] overflow-y-auto">
        {code}
      </pre>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PipelineAnalysisPage() {
  const [models, setModels]           = useState<UploadedModel[]>([])
  const [selectedModel, setSelected]  = useState<UploadedModel | null>(null)
  const [analyses, setAnalyses]       = useState<any[]>([])
  const [versions, setVersions]       = useState<PipelineVersion[]>([])
  const [activeAnalysis, setActive]   = useState<PipelineAnalysis | null>(null)
  const [activeCode, setActiveCode]   = useState<string>('')
  const [activeTab, setActiveTab]     = useState<'bugs' | 'code' | 'versions' | 'suggestions'>('bugs')
  const [running, setRunning]         = useState(false)
  const [polling, setPolling]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const pollRef                       = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchUploadedModels().then(ms => {
      setModels(ms)
      if (ms.length > 0) selectModel(ms[0])
    }).catch(() => {})
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const selectModel = async (m: UploadedModel) => {
    setSelected(m); setActive(null); setActiveCode(''); setError(null)
    try {
      const [a, v] = await Promise.all([listModelAnalyses(m.id), listVersions(m.id)])
      setAnalyses(a); setVersions(v)
      if (a.length > 0 && a[0].status === 'done') {
        const full = await getAnalysis(a[0].id)
        setActive(full)
        try {
          const c = await getLatestCode(m.id)
          setActiveCode(c.code || '')
        } catch { setActiveCode('') }
      }
    } catch { setAnalyses([]); setVersions([]) }
  }

  const handleRunAnalysis = async () => {
    if (!selectedModel) return
    setRunning(true); setError(null); setActive(null)
    try {
      const res = await triggerAnalysis(selectedModel.id)
      const analysisId = res.analysis_id
      // Poll until done
      setPolling(true)
      pollRef.current = setInterval(async () => {
        try {
          const a = await getAnalysis(analysisId)
          if (a.status === 'done') {
            clearInterval(pollRef.current!)
            setPolling(false); setRunning(false)
            setActive(a)
            const [newA, newV] = await Promise.all([
              listModelAnalyses(selectedModel.id),
              listVersions(selectedModel.id)
            ])
            setAnalyses(newA); setVersions(newV)
            try {
              const c = await getLatestCode(selectedModel.id)
              setActiveCode(c.code || '')
            } catch { setActiveCode('') }
          } else if (a.status === 'failed') {
            clearInterval(pollRef.current!)
            setPolling(false); setRunning(false)
            setError(a.error_message || 'Analysis failed.')
          }
        } catch { /* keep polling */ }
      }, 2000)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to start analysis.')
      setRunning(false)
    }
  }

  const loadVersion = async (versionId: number) => {
    try {
      const v = await getVersionCode(versionId)
      setActiveCode(v.code || '')
      setActiveTab('code')
    } catch { setError('Failed to load version code.') }
  }

  const bugs      = activeAnalysis?.bugs || []
  const conflicts = activeAnalysis?.conflicts || []
  const warnings  = activeAnalysis?.warnings || []
  const critical  = bugs.filter(b => b.severity === 'critical').length
  const high      = bugs.filter(b => b.severity === 'high').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-1">ML Pipeline</p>
        <h1 className="text-2xl font-bold text-text">Pipeline Analyzer</h1>
        <p className="text-subtext text-sm mt-1">
          Upload your model → get a full bug report → download the fixed pipeline code.
          Version history tracked like Git.
        </p>
      </div>

      {models.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text mb-2">No models uploaded yet</h2>
          <p className="text-subtext text-sm mb-5">Upload a .joblib or .pkl model to start analysis.</p>
          <Link to="/models" className="btn-primary px-6 py-2.5 text-sm inline-block">
            Upload a Model →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Left sidebar: model list ── */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Your Models</p>
            {models.map(m => (
              <button key={m.id} onClick={() => selectModel(m)}
                className={`card p-4 text-left transition-all ${
                  selectedModel?.id === m.id
                    ? 'border-accent ring-1 ring-accent/20'
                    : 'hover:border-accent/40'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{m.name}</p>
                    <p className="text-xs text-subtext font-mono mt-0.5">{m.model_type || 'Unknown'}</p>
                    <p className="text-xs text-subtext mt-1">{m.feature_names.length} features</p>
                  </div>
                  {m.is_active && (
                    <span className="badge-success text-xs flex-shrink-0">Active</span>
                  )}
                </div>
              </button>
            ))}

            {/* Analysis history */}
            {analyses.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-2">
                  Analysis History
                </p>
                {analyses.slice(0, 5).map((a: any) => (
                  <button key={a.id} onClick={async () => {
                    const full = await getAnalysis(a.id)
                    setActive(full)
                  }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface text-xs mb-1 border border-transparent hover:border-border transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-subtext">#{a.id}</span>
                      <span className={`font-bold ${
                        a.overall_score >= 80 ? 'text-success' :
                        a.overall_score >= 50 ? 'text-warn' : 'text-danger'
                      }`}>{a.overall_score?.toFixed(0) ?? '—'}/100</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {a.bugs_count > 0 && (
                        <span className="text-danger">{a.bugs_count} bugs</span>
                      )}
                      {a.status !== 'done' && (
                        <span className="text-subtext capitalize">{a.status}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* Run analysis button */}
            <div className="card p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-text">
                  {selectedModel ? selectedModel.name : 'Select a model'}
                </p>
                <p className="text-xs text-subtext mt-0.5">
                  {selectedModel
                    ? `${selectedModel.model_type} · ${selectedModel.feature_names.length} features · ${selectedModel.version}`
                    : 'Choose a model from the left panel'}
                </p>
              </div>
              <button
                onClick={handleRunAnalysis}
                disabled={!selectedModel || running}
                className="btn-primary px-6 py-2.5 text-sm flex-shrink-0 flex items-center gap-2">
                {running ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    {polling ? 'Analyzing...' : 'Starting...'}
                  </>
                ) : '▶ Run Analysis'}
              </button>
            </div>

            {error && (
              <div className="card p-4 border-red-200 bg-red-50 text-danger text-sm">{error}</div>
            )}

            {/* Score cards */}
            {activeAnalysis && activeAnalysis.status === 'done' && (
              <>
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Quality Scores</p>
                    <div className="flex items-center gap-2">
                      {critical > 0 && (
                        <span className="badge-danger">{critical} critical</span>
                      )}
                      {high > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                          {high} high
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-around flex-wrap gap-4">
                    <ScoreRing score={activeAnalysis.overall_score} label="Overall" size={90} />
                    <ScoreRing score={activeAnalysis.code_quality}   label="Code Quality" />
                    <ScoreRing score={activeAnalysis.data_quality}   label="Data Quality" />
                    <ScoreRing score={activeAnalysis.model_health}   label="Model Health" />
                    <ScoreRing score={activeAnalysis.pipeline_score} label="Pipeline" />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Bugs',      value: bugs.length,      color: bugs.length > 0 ? '#dc2626' : '#16a34a' },
                    { label: 'Conflicts', value: conflicts.length,  color: conflicts.length > 0 ? '#d97706' : '#16a34a' },
                    { label: 'Warnings',  value: warnings.length,   color: warnings.length > 0 ? '#d97706' : '#16a34a' },
                    { label: 'Versions',  value: versions.length,   color: '#2563eb' },
                  ].map(s => (
                    <div key={s.label} className="card p-4 text-center">
                      <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-subtext mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-surface rounded-xl p-1">
                  {(['bugs', 'code', 'versions', 'suggestions'] as const).map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                        activeTab === t ? 'bg-white text-text shadow-sm' : 'text-subtext hover:text-text'
                      }`}>
                      {t}
                      {t === 'bugs' && bugs.length > 0 && (
                        <span className="ml-1.5 bg-danger text-white text-xs rounded-full px-1.5">{bugs.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ── BUGS TAB ── */}
                {activeTab === 'bugs' && (
                  <div className="flex flex-col gap-3">
                    {bugs.length === 0 && conflicts.length === 0 && warnings.length === 0 ? (
                      <div className="card p-8 text-center">
                        <p className="text-2xl mb-2">✅</p>
                        <p className="font-semibold text-success">No issues found!</p>
                        <p className="text-subtext text-sm mt-1">Your pipeline looks clean.</p>
                      </div>
                    ) : (
                      <>
                        {/* Bugs */}
                        {bugs.map((bug, i) => (
                          <div key={i} className={`card p-5 border-l-4 ${
                            bug.severity === 'critical' ? 'border-l-red-500' :
                            bug.severity === 'high'     ? 'border-l-orange-500' :
                            bug.severity === 'medium'   ? 'border-l-yellow-500' : 'border-l-blue-400'
                          }`}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <p className="font-semibold text-text text-sm">{bug.title}</p>
                              <SeverityBadge s={bug.severity} />
                            </div>
                            <p className="text-sm text-subtext mb-3">{bug.detail}</p>
                            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                              <p className="text-xs font-semibold text-success mb-0.5">Fix</p>
                              <p className="text-xs text-success">{bug.fix}</p>
                            </div>
                            <p className="text-xs text-subtext mt-2 font-mono bg-surface px-2 py-1 rounded inline-block">
                              {bug.category}
                            </p>
                          </div>
                        ))}

                        {/* Conflicts */}
                        {conflicts.map((c, i) => (
                          <div key={i} className="card p-5 border-l-4 border-l-amber-400">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <p className="font-semibold text-text text-sm">⚡ Conflict: {c.type.replace(/_/g, ' ')}</p>
                              <span className="badge-warn">conflict</span>
                            </div>
                            <p className="text-sm text-subtext mb-3">{c.description}</p>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              <p className="text-xs font-semibold text-warn mb-0.5">Resolution</p>
                              <p className="text-xs text-warn">{c.resolution}</p>
                            </div>
                          </div>
                        ))}

                        {/* Warnings */}
                        {warnings.map((w, i) => (
                          <div key={i} className="card p-4 border-l-4 border-l-blue-300">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">ℹ</span>
                              <div>
                                <p className="text-xs font-mono text-subtext mb-0.5">{w.category}</p>
                                <p className="text-sm text-text">{w.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* ── CODE TAB ── */}
                {activeTab === 'code' && (
                  <div className="flex flex-col gap-4">
                    {activeAnalysis.rewrite_summary && (
                      <div className="card p-5 bg-green-50 border-green-200">
                        <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">
                          Changes Applied
                        </p>
                        <pre className="text-xs text-success whitespace-pre-wrap font-mono">
                          {activeAnalysis.rewrite_summary}
                        </pre>
                      </div>
                    )}
                    {activeCode ? (
                      <CodeViewer code={activeCode} title="pipeline_fixed.py" />
                    ) : (
                      <div className="card p-8 text-center text-subtext text-sm">
                        No code generated yet.
                      </div>
                    )}
                  </div>
                )}

                {/* ── VERSIONS TAB ── */}
                {activeTab === 'versions' && (
                  <div className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border bg-surface flex items-center gap-2">
                      <svg className="w-4 h-4 text-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <p className="text-sm font-semibold text-text">
                        Version History ({versions.length} commits)
                      </p>
                    </div>
                    {versions.length === 0 ? (
                      <div className="p-8 text-center text-subtext text-sm">No versions yet.</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {versions.map((v, i) => (
                          <div key={v.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-surface/50">
                            <div className="flex items-start gap-3 min-w-0">
                              {/* Git-style line */}
                              <div className="flex flex-col items-center mt-1">
                                <div className={`w-3 h-3 rounded-full border-2 ${
                                  v.is_latest ? 'bg-accent border-accent' : 'bg-white border-border'
                                }`} />
                                {i < versions.length - 1 && (
                                  <div className="w-0.5 h-8 bg-border mt-1" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs bg-surface border border-border rounded px-1.5 py-0.5 text-accent">
                                    {v.commit_hash}
                                  </span>
                                  <span className="font-semibold text-sm text-text">{v.version_tag}</span>
                                  {v.is_latest && <span className="badge-blue text-xs">latest</span>}
                                </div>
                                <p className="text-sm text-subtext mt-1 truncate">{v.commit_msg}</p>
                                <p className="text-xs text-subtext mt-1">
                                  {v.author} · {new Date(v.created_at).toLocaleString('en-IN')}
                                  {v.changes_count > 0 && ` · ${v.changes_count} lines`}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => loadVersion(v.id)}
                              className="text-xs text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors flex-shrink-0">
                              View Code
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SUGGESTIONS TAB ── */}
                {activeTab === 'suggestions' && (
                  <div className="flex flex-col gap-3">
                    {(activeAnalysis.suggestions || []).map((s, i) => (
                      <div key={i} className="card p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="font-semibold text-text text-sm">{s.title}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                            s.priority === 'high'   ? 'bg-red-100 text-red-700' :
                            s.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                      'bg-gray-100 text-gray-600'
                          }`}>{s.priority}</span>
                        </div>
                        <p className="text-sm text-subtext">{s.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Waiting state */}
            {running && (
              <div className="card p-12 text-center">
                <svg className="w-10 h-10 animate-spin text-accent mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <p className="font-semibold text-text">Analyzing pipeline...</p>
                <p className="text-subtext text-sm mt-1">
                  Inspecting model, detecting bugs, rewriting code
                </p>
              </div>
            )}

            {/* Empty state */}
            {!activeAnalysis && !running && selectedModel && (
              <div className="card p-12 text-center border-dashed">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold text-text mb-1">Ready to analyze</p>
                <p className="text-subtext text-sm">
                  Click "Run Analysis" to inspect <strong>{selectedModel.name}</strong> for bugs,
                  conflicts, and get a rewritten pipeline.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
