interface Props { score: number }

export default function HealthGauge({ score }: Props) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score))
  const offset = circumference - (progress / 100) * circumference
  const color = score > 80 ? '#16a34a' : score > 50 ? '#d97706' : '#dc2626'
  const label = score > 80 ? 'Healthy' : score > 50 ? 'Degraded' : 'Critical'
  const bg    = score > 80 ? '#dcfce7' : score > 50 ? '#fef3c7' : '#fee2e2'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono text-text">{Math.round(score)}</span>
          <span className="text-xs text-subtext">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color, background: bg }}>
        {label}
      </span>
    </div>
  )
}
