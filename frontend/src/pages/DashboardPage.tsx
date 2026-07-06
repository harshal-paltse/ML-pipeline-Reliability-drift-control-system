import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { fetchMetrics, fetchAlerts, fetchModels, forceRetrain, injectDrift } from '../hooks/useApi'
import type { MonitoringData, AlertItem, ModelVersion } from '../types'
import HealthGauge from '../components/HealthGauge'
import DriftHeatmap from '../components/DriftHeatmap'
import AlertPanel from '../components/AlertPanel'
import ModelTable from '../components/ModelTable'

const REFRESH_MS = 15_000

export default function DashboardPage() {
  const [metrics, setMetrics]   = useState<MonitoringData | null>(null)
  const [alerts, setAlerts]     = useState<AlertItem[]>([])
  const [models, setModels]     = useState<ModelVersion[]>([])
  const [loading, setLoading]   = useState(true)
  const [retraining, setRetraining] = useState(false)
  const [injecting, setInjecting]   = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const refresh = useCallback(async () => {
    try {
      const [m, a, mv] = await Promise.all([fetchMetrics(), fetchAlerts(), fetchModels()])
      setMetrics(m); setAlerts(a); setModels(mv); setLastRefresh(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh(); const t = setInterval(refresh, REFRESH_MS); return () => clearInterval(t) }, [refresh])

  const handleRetrain = async () => {
    if (!confirm('Force retrain the model on all available data?')) return
    setRetraining(true)
    try { await forceRetrain(); await refresh() }
    catch { alert('Retraining failed.') }
    finally { setRetraining(false) }
  }

  const handleInjectDrift = async () => {
    setInjecting(true)
    try { await injectDrift(); await refresh() }
    catch { alert('Drift injection failed.') }
    finally { setInjecting(false) }
  }

  const chartData = (metrics?.health_history ?? []).map(h => ({
    time:    new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    health:  Math.round(h.health_score),
    drift:   Math.round(h.drift_score * 100),
    failure: Math.round(h.failure_score * 100),
  }))

  const driftBarData = (metrics?.feature_drifts ?? []).map(d => ({
    name: d.feature.replace('_', ' '), value: Math.round(d.ks_statistic * 100), drifted: d.is_drifted,
  }))

  const healthColor = !metrics ? '#64748b' : metrics.health_score > 80 ? '#16a34a' : metrics.health_score > 50 ? '#d97706' : '#dc2626'
  const activeModel = models.find(m => m.is_active)
  const activeAlerts = alerts.filter(a => !a.resolved).length

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-subtext text-sm">Loading dashboard...</div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-text">Model Monitoring</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-subtext">Updated {lastRefresh.toLocaleTimeString()}</span>
          <div className="w-2 h-2 rounded-full bg-success pulse-dot" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button onClick={handleInjectDrift} disabled={injecting}
          className="px-4 py-2 text-sm border border-warn text-warn rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50">
          {injecting ? 'Injecting...' : '⚡ Inject Drift (Demo)'}
        </button>
        <button onClick={handleRetrain} disabled={retraining}
          className="px-4 py-2 text-sm border border-accent text-accent rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50">
          {retraining ? 'Retraining...' : '↺ Force Retrain'}
        </button>
        {models.length > 1 && (
          <button onClick={() => {
            const prev = models.find(m => !m.is_active)
            if (prev) import('../hooks/useApi').then(({ rollbackModel }) => rollbackModel(prev.version).then(refresh))
          }} className="px-4 py-2 text-sm border border-border text-subtext rounded-lg hover:text-text transition-colors">
            ← Rollback to Previous
          </button>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Predictions (24h)', value: metrics?.prediction_count.toLocaleString() ?? '—', sub: 'live count', color: '#2563eb' },
          { label: 'Active Alerts',     value: activeAlerts, sub: activeAlerts > 0 ? 'needs attention' : 'all clear', color: activeAlerts > 0 ? '#dc2626' : '#16a34a' },
          { label: 'Avg Confidence',    value: metrics ? `${(metrics.confidence_score * 100).toFixed(1)}%` : '—', sub: 'last 60 min', color: !metrics ? '#64748b' : metrics.confidence_score > 0.75 ? '#16a34a' : metrics.confidence_score > 0.60 ? '#d97706' : '#dc2626' },
          { label: 'Active Model',      value: activeModel?.version ?? '—', sub: activeModel ? `acc ${(activeModel.accuracy * 100).toFixed(1)}%` : '', color: '#2563eb' },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <p className="text-xs text-subtext uppercase tracking-wider mb-2">{k.label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color: k.color }}>{k.value}</p>
            {k.sub && <p className="text-xs text-subtext mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Health gauge + breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className="card p-6 flex flex-col items-center justify-center gap-3">
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider self-start">Health Score</p>
          <HealthGauge score={metrics?.health_score ?? 100} />
        </div>
        <div className="card p-6 col-span-2">
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Score Breakdown</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Drift Penalty',       value: metrics ? metrics.drift_score * 100 : 0,       invert: true,  weight: '40%' },
              { label: 'Feature Failures',    value: metrics ? metrics.failure_score * 100 : 0,     invert: true,  weight: '30%' },
              { label: 'Confidence',          value: metrics ? metrics.confidence_score * 100 : 100, invert: false, weight: '20%' },
              { label: 'Importance Stability',value: metrics ? metrics.importance_score * 100 : 100, invert: false, weight: '10%' },
            ].map(item => {
              const isGood = item.invert ? item.value < 20 : item.value > 75
              const isBad  = item.invert ? item.value > 50 : item.value < 50
              const color  = isGood ? '#16a34a' : isBad ? '#dc2626' : '#d97706'
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-subtext mb-1">
                    <span>{item.label}</span>
                    <span className="text-subtext/60">weight {item.weight}</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.value}%`, background: color }} />
                  </div>
                  <span className="text-sm font-mono mt-1 block" style={{ color }}>
                    {item.value.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Health history chart */}
      <div className="card p-6 mb-5">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Health Score — Last 24 Hours</p>
        {chartData.length < 2 ? (
          <div className="text-subtext text-sm text-center py-8">
            Collecting data... health history appears after the first monitoring cycle (60s).
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="health" stroke={healthColor} strokeWidth={2.5} dot={false} name="Health Score" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Drift bar chart */}
      <div className="card p-6 mb-5">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Data Drift % per Feature (KS Statistic)</p>
        {driftBarData.length === 0 ? (
          <div className="text-subtext text-sm text-center py-8">No drift data yet. Make some predictions first.</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={driftBarData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" name="KS Statistic %" radius={[4,4,0,0]}>
                {driftBarData.map((e, i) => <Cell key={i} fill={e.drifted ? '#dc2626' : '#16a34a'} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Feature failure heatmap */}
      <div className="card p-6 mb-5">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Feature Failure Heatmap</p>
        <DriftHeatmap drifts={metrics?.feature_drifts ?? []} />
      </div>

      {/* Alerts + Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Active Alerts</p>
            {activeAlerts > 0 && <span className="badge-danger">{activeAlerts} active</span>}
          </div>
          <AlertPanel alerts={alerts} onRefresh={refresh} />
        </div>
        <div className="card p-6">
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Model Registry</p>
          <ModelTable models={models} onRefresh={refresh} />
        </div>
      </div>
    </div>
  )
}
