import type { ModelVersion } from '../types'
import { rollbackModel } from '../hooks/useApi'

interface Props { models: ModelVersion[]; onRefresh: () => void }

export default function ModelTable({ models, onRefresh }: Props) {
  const handleRollback = async (version: string) => {
    if (!confirm(`Roll back to model ${version}?`)) return
    try { await rollbackModel(version); onRefresh() }
    catch { alert('Rollback failed.') }
  }

  if (!models.length) return <div className="text-subtext text-sm py-4">No models registered yet.</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-subtext text-xs uppercase tracking-wider">
            <th className="text-left py-2 pr-4">Version</th>
            <th className="text-left py-2 pr-4">Accuracy</th>
            <th className="text-left py-2 pr-4">F1</th>
            <th className="text-left py-2 pr-4">Status</th>
            <th className="text-left py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {models.map(m => (
            <tr key={m.id} className="border-b border-border/50 hover:bg-surface transition-colors">
              <td className="py-2.5 pr-4 font-mono text-accent text-xs">{m.version}</td>
              <td className="py-2.5 pr-4">{(m.accuracy * 100).toFixed(1)}%</td>
              <td className="py-2.5 pr-4">{(m.f1_score * 100).toFixed(1)}%</td>
              <td className="py-2.5 pr-4">
                <span className={m.is_active ? 'badge-success' : 'badge-gray'}>
                  {m.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="py-2.5">
                {!m.is_active && (
                  <button onClick={() => handleRollback(m.version)}
                    className="text-xs text-warn border border-amber-200 rounded-lg px-2 py-1 hover:bg-amber-50 transition-colors">
                    Rollback
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
