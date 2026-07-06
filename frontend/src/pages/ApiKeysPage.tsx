import { useState, useEffect } from 'react'
import { listApiKeys, createApiKey, revokeApiKey } from '../hooks/useApi'
import type { ApiKey, ApiKeyCreated } from '../types'

export default function ApiKeysPage() {
  const [keys, setKeys]         = useState<ApiKey[]>([])
  const [newName, setNewName]   = useState('')
  const [creating, setCreating] = useState(false)
  const [created, setCreated]   = useState<ApiKeyCreated | null>(null)
  const [copied, setCopied]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const load = async () => {
    try { setKeys(await listApiKeys()) } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true); setError(null); setCreated(null)
    try {
      const res = await createApiKey(newName.trim())
      setCreated(res); setNewName(''); load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create key.')
    } finally { setCreating(false) }
  }

  const handleRevoke = async (id: number) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    await revokeApiKey(id); load()
  }

  const copyKey = () => {
    if (!created) return
    navigator.clipboard.writeText(created.key)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-1">Settings</p>
        <h1 className="text-2xl font-bold text-text">API Keys</h1>
        <p className="text-subtext text-sm mt-1">
          Generate keys to authenticate live prediction requests via <code className="bg-surface px-1 rounded text-xs">X-API-Key</code> header.
        </p>
      </div>

      {/* Create form */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-4">Create New API Key</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Key name (e.g. Production App)"
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-text bg-white" />
          <button type="submit" disabled={creating || !newName.trim()}
            className="btn-primary px-5 py-2 text-sm">
            {creating ? 'Creating...' : 'Generate Key'}
          </button>
        </form>
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
      </div>

      {/* Newly created key — show once */}
      {created && (
        <div className="card p-5 mb-6 border-green-200 bg-green-50 fade-in">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-success">Key created — copy it now!</p>
              <p className="text-xs text-subtext mt-0.5">This key will not be shown again.</p>
            </div>
            <button onClick={() => setCreated(null)}
              className="text-subtext hover:text-text text-lg leading-none">×</button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <code className="flex-1 bg-white border border-green-200 rounded-lg px-3 py-2 text-xs font-mono text-text break-all">
              {created.key}
            </code>
            <button onClick={copyKey}
              className="px-3 py-2 text-xs border border-green-300 rounded-lg text-success hover:bg-green-100 transition-colors whitespace-nowrap">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-3 p-3 bg-white rounded-lg border border-green-100 text-xs text-subtext">
            <p className="font-semibold text-text mb-1">Usage example:</p>
            <code className="block text-xs font-mono text-subtext">
              curl -X POST http://localhost:8000/v1/predict \<br/>
              &nbsp;&nbsp;-H "X-API-Key: {created.key}" \<br/>
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
              &nbsp;&nbsp;-d '{`{"features":{"age":35,"annual_income_inr":600000,"cibil_score":720,"employment_years":8,"loan_amount_inr":500000,"loan_tenure_months":60,"existing_loans":1}}`}'
            </code>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Your API Keys ({keys.filter(k => k.is_active).length} active)</h2>
        </div>
        {keys.length === 0 ? (
          <div className="px-6 py-10 text-center text-subtext text-sm">
            No API keys yet. Create one above.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {keys.map(k => (
              <div key={k.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${k.is_active ? 'bg-success' : 'bg-border'}`} />
                  <div>
                    <p className="text-sm font-medium text-text">{k.name}</p>
                    <p className="text-xs text-subtext font-mono mt-0.5">{k.key_prefix}••••••••</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-subtext">
                  <span>{k.request_count} requests</span>
                  <span>{k.last_used ? `Last: ${new Date(k.last_used).toLocaleDateString()}` : 'Never used'}</span>
                  <span className={k.is_active ? 'badge-success' : 'badge-gray'}>
                    {k.is_active ? 'Active' : 'Revoked'}
                  </span>
                  {k.is_active && (
                    <button onClick={() => handleRevoke(k.id)}
                      className="text-danger hover:underline text-xs">Revoke</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Docs */}
      <div className="card p-6 mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Live API Reference</h2>
        <div className="space-y-3 text-sm">
          {[
            { method: 'POST', path: '/v1/predict', desc: 'Run prediction (API key auth)' },
            { method: 'GET',  path: '/health',     desc: 'Service health check' },
            { method: 'GET',  path: '/metrics',    desc: 'Model monitoring data' },
            { method: 'GET',  path: '/docs',       desc: 'Interactive Swagger UI' },
          ].map(e => (
            <div key={e.path} className="flex items-center gap-3">
              <span className={`badge-${e.method === 'POST' ? 'blue' : 'gray'} font-mono`}>{e.method}</span>
              <code className="text-xs font-mono text-text">{e.path}</code>
              <span className="text-subtext text-xs">{e.desc}</span>
            </div>
          ))}
        </div>
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 text-accent text-sm font-medium hover:underline">
          Open API Docs →
        </a>
      </div>
    </div>
  )
}
