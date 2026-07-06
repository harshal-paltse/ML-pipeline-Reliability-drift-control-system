import type { FeatureDrift } from '../types'

interface Props { drifts: FeatureDrift[] }

const LABELS: Record<string, string> = {
  age: 'Age', income: 'Income', credit_score: 'Credit Score',
  employment_years: 'Employ. Yrs', loan_amount: 'Loan Amount',
}

export default function DriftHeatmap({ drifts }: Props) {
  if (!drifts.length) return (
    <div className="text-subtext text-sm text-center py-8">
      Waiting for enough live data to compute drift...
    </div>
  )

  return (
    <div className="grid grid-cols-5 gap-3">
      {drifts.map(d => {
        const isDrifted = d.is_drifted
        return (
          <div key={d.feature}
            className={`rounded-xl p-4 border-2 flex flex-col gap-1 ${
              isDrifted ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
            <span className="text-xs text-subtext font-medium">{LABELS[d.feature] || d.feature}</span>
            <span className={`text-xl font-bold font-mono ${isDrifted ? 'text-danger' : 'text-success'}`}>
              {(d.ks_statistic * 100).toFixed(1)}%
            </span>
            <span className={`text-xs font-semibold ${isDrifted ? 'text-danger' : 'text-success'}`}>
              {isDrifted ? '⚠ Drifted' : '✓ Stable'}
            </span>
            <span className="text-xs text-subtext">p={d.p_value.toFixed(3)}</span>
          </div>
        )
      })}
    </div>
  )
}
