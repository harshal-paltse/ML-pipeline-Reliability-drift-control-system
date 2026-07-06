/**
 * Small metric stat card used in the dashboard top row.
 */
interface Props {
  label: string
  value: string | number
  sub?: string
  color?: string
}

export default function StatCard({ label, value, sub, color = '#ffffff' }: Props) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs text-muted uppercase tracking-wider">{label}</span>
      <span
        className="text-2xl font-bold font-mono"
        style={{ color, textShadow: color !== '#ffffff' ? `0 0 10px ${color}44` : undefined }}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  )
}
