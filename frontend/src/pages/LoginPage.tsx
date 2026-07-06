import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [mode, setMode]       = useState<'login' | 'register'>('login')
  const [form, setForm]       = useState({ username: '', email: '', password: '', role: 'analyst' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = mode === 'login'
        ? await loginUser({ username: form.username, password: form.password })
        : await registerUser(form)
      login(res.access_token, { id: res.user_id, username: res.username,
        role: res.role, email: form.email, is_active: true,
        created_at: new Date().toISOString(), last_login: null })
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent rounded-2xl mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text">ML Drift Control</h1>
          <p className="text-subtext text-sm mt-1">Credit Risk Prediction Platform</p>
        </div>

        <div className="card p-8">
          {/* Tab switcher */}
          <div className="flex bg-surface rounded-lg p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null) }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                  mode === m ? 'bg-white text-text shadow-sm' : 'text-subtext hover:text-text'
                }`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input name="username" value={form.username} onChange={handleChange} required
                placeholder="Enter username"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-white" />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  placeholder="you@example.com"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-white" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                placeholder="••••••••"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-white" />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <select name="role" value={form.role} onChange={handleChange}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-white">
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary py-2.5 text-sm mt-1">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-subtext">
              <span className="font-semibold text-accent">Default admin:</span> admin / admin123
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
