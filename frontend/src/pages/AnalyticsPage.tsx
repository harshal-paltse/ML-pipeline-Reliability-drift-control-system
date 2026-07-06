import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { fetchStats, fetchFeatureImportance } from '../hooks/useApi'
import type { PredictionStats, FeatureImportance } from '../types'

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed']

export default function AnalyticsPage() {
  const [stats, setStats]       = useState<PredictionStats | null>(null)
  const [importance, setImp]    = useState<FeatureImportance[]>([])
  const [days, setDays]         = useState(7)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchStats(days), fetchFeatureImportance()])
      .then(([s, imp]) => { setStats(s); setImp(imp.features || []) })
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-subtext text-sm">Loading analytics...</div>
  )

  const approvalData = stats ? [
    { name: 'Approved', value: stats.approved_count },
    { name: 'Rejected', value: stats.rejected_count },
  ] : []

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-1">Insights</p>
          <h1 className="text-2xl font-bold text-text">Analytics</h1>
        </div>
        <div className="flex gap-2">
          {[1, 7, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                days === d ? 'bg-accent text-white border-accent' : 'border-border text-subtext hover:text-text'
              }`}>
              {d === 1 ? '24h' : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Predictions', value: stats?.total_predictions.toLocaleString() ?? '0', color: '#2563eb' },
          { label: 'Approval Rate',     value: stats ? `${(stats.approval_rate * 100).toFixed(1)}%` : '0%', color: '#16a34a' },
          { label: 'Avg Confidence',    value: stats ? `${(stats.avg_confidence * 100).toFixed(1)}%` : '0%', color: '#7c3aed' },
          { label: 'Avg Credit Score',  value: stats?.avg_credit_score.toFixed(0) ?? '0', color: '#d97706' },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <p className="text-xs text-subtext uppercase tracking-wider mb-2">{k.label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Predictions over time */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Predictions Over Time</p>
          {(stats?.predictions_by_hour.length ?? 0) < 2 ? (
            <div className="text-subtext text-sm text-center py-8">Not enough data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats!.predictions_by_hour} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={v => v.split(' ')[1] || v} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="approved" name="Approved" fill="#16a34a" radius={[3,3,0,0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#dc2626" radius={[3,3,0,0]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Approval pie */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Approval Distribution</p>
          {!stats?.total_predictions ? (
            <div className="text-subtext text-sm text-center py-8">No predictions yet.</div>
          ) : (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={approvalData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}>
                    <Cell fill="#16a34a" />
                    <Cell fill="#dc2626" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confidence distribution */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Confidence Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats?.confidence_distribution ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" name="Predictions" radius={[3,3,0,0]}>
                {(stats?.confidence_distribution ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature importance */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Feature Importance</p>
          {importance.length === 0 ? (
            <div className="text-subtext text-sm text-center py-8">No model loaded.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {importance.sort((a,b) => b.importance - a.importance).map((f, i) => (
                <div key={f.feature} className="flex items-center gap-3">
                  <span className="text-xs text-subtext w-28 capitalize">{f.feature.replace('_', ' ')}</span>
                  <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${f.importance * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="text-xs font-mono text-subtext w-10 text-right">
                    {(f.importance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="card p-5 mt-6">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-4">Average Applicant Profile</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Credit Score', value: stats?.avg_credit_score.toFixed(0) ?? '—' },
            { label: 'Annual Income', value: stats ? `₹${new Intl.NumberFormat('en-IN').format(stats.avg_income)}` : '—' },
            { label: 'Loan Amount', value: stats ? `₹${new Intl.NumberFormat('en-IN').format(stats.avg_loan_amount)}` : '—' },
            { label: 'Avg Confidence', value: stats ? `${(stats.avg_confidence * 100).toFixed(1)}%` : '—' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 bg-surface rounded-lg">
              <p className="text-xs text-subtext mb-1">{s.label}</p>
              <p className="text-lg font-bold text-text">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
