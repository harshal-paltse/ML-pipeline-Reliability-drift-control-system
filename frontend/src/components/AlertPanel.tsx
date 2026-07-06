import type { AlertItem } from '../types'
import { resolveAlert } from '../hooks/useApi'

interface Props { alerts: AlertItem[]; onRefresh: () => void }

const LEVEL_STYLE: Record<string, string> = {
  critical: 'border-red-200 bg-red-50',
  warning:  'border-amber-200 bg-amber-50',
  info:     'border-blue-200 bg-blue-50',
}
const LEVEL_DOT: Record<string, string> = {
  critical: 'bg-danger', warning: 'bg-warn', info: 'bg-accent',
}
const LEVEL_TEXT: Record<string, string> = {
  critical: 'text-danger', warning: 'text-warn', info: 'text-accent',
}

export default function AlertPanel({ alerts, onRefresh }: Props) {
  const active = alerts.filter(a => !a.resolved)

  const handleResolve = async (id: number) => {
    await resolveAlert(id); onRefresh()
  }

  if (!active.length) return (
    <div className="flex items-center gap-2 text-success text-sm py-4">
      <span className="w-2 h-2 rounded-full bg-success" />
      All systems nominal — no active alerts
    </div>
  )

  return (
    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
      {active.map(alert => (
        <div key={alert.id}
          className={`rounded-xl border p-3 flex items-start justify-between gap-3 ${LEVEL_STYLE[alert.level] || LEVEL_STYLE.info}`}>
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${LEVEL_DOT[alert.level] || 'bg-accent'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${LEVEL_TEXT[alert.level] || 'text-accent'}`}>
                  {alert.level}
                </span>
                <span className="text-xs text-subtext capitalize">{alert.category}</span>
              </div>
              <p className="text-sm text-text leading-snug">{alert.message}</p>
              <span className="text-xs text-subtext mt-1 block">
                {new Date(alert.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
          <button onClick={() => handleResolve(alert.id)}
            className="text-xs text-subtext hover:text-text border border-border rounded-lg px-2 py-1 flex-shrink-0 bg-white transition-colors">
            Resolve
          </button>
        </div>
      ))}
    </div>
  )
}
