/**
 * Profile & Settings Page — change password, view account info,
 * manage user list (admin), system info.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { updateProfile, listUsers } from '../hooks/useApi'
import type { User } from '../types'

export default function ProfilePage() {
  const { user, logout }          = useAuth()
  const [users, setUsers]         = useState<User[]>([])
  const [pwForm, setPwForm]       = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [tab, setTab]             = useState<'profile' | 'password' | 'users'>('profile')

  useEffect(() => {
    if (user?.role === 'admin') {
      listUsers().then(setUsers).catch(() => {})
    }
  }, [user])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) {
      setMsg({ type: 'err', text: 'New passwords do not match.' }); return
    }
    setSaving(true); setMsg(null)
    try {
      await updateProfile({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      setMsg({ type: 'ok', text: 'Password updated successfully.' })
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      setMsg({ type: 'err', text: err?.response?.data?.detail || 'Failed to update password.' })
    } finally { setSaving(false) }
  }

  const TABS = [
    { id: 'profile',  label: 'Profile' },
    { id: 'password', label: 'Change Password' },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'All Users' }] : []),
  ] as const

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider mb-1">Account</p>
        <h1 className="text-2xl font-bold text-text">Profile & Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.id ? 'bg-white text-text shadow-sm' : 'text-subtext hover:text-text'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="card p-6 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-accent uppercase">{user?.username[0]}</span>
            </div>
            <div>
              <p className="text-xl font-bold text-text">{user?.username}</p>
              <p className="text-subtext text-sm">{user?.email}</p>
              <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                user?.role === 'admin' ? 'bg-blue-100 text-accent' :
                user?.role === 'analyst' ? 'bg-green-100 text-success' : 'bg-gray-100 text-subtext'
              }`}>{user?.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            {[
              { label: 'User ID',    value: `#${user?.id}` },
              { label: 'Role',       value: user?.role ?? '—' },
              { label: 'Status',     value: user?.is_active ? 'Active' : 'Disabled' },
              { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—' },
              { label: 'Last Login', value: user?.last_login ? new Date(user.last_login).toLocaleString('en-IN') : 'First session' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-subtext uppercase tracking-wider mb-0.5">{f.label}</p>
                <p className="text-sm font-medium text-text capitalize">{f.value}</p>
              </div>
            ))}
          </div>

          <button onClick={logout}
            className="btn-danger py-2.5 text-sm mt-2">
            Sign Out
          </button>
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="card p-6">
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            {[
              { name: 'current_password', label: 'Current Password', placeholder: '••••••••' },
              { name: 'new_password',     label: 'New Password',     placeholder: 'Min 6 characters' },
              { name: 'confirm',          label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1.5">
                  {f.label}
                </label>
                <input type="password" value={pwForm[f.name as keyof typeof pwForm]}
                  onChange={e => setPwForm(p => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder} required minLength={f.name !== 'current_password' ? 6 : 1}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-white" />
              </div>
            ))}

            {msg && (
              <div className={`text-sm rounded-lg px-3 py-2.5 ${
                msg.type === 'ok'
                  ? 'bg-green-50 border border-green-200 text-success'
                  : 'bg-red-50 border border-red-200 text-danger'
              }`}>{msg.text}</div>
            )}

            <button type="submit" disabled={saving} className="btn-primary py-2.5 text-sm">
              {saving ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Users tab (admin only) */}
      {tab === 'users' && user?.role === 'admin' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-text">All Users ({users.length})</p>
          </div>
          <div className="divide-y divide-border">
            {users.map(u => (
              <div key={u.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-accent uppercase">{u.username[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{u.username}</p>
                    <p className="text-xs text-subtext">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                    u.role === 'admin' ? 'bg-blue-100 text-accent' :
                    u.role === 'analyst' ? 'bg-green-100 text-success' : 'bg-gray-100 text-subtext'
                  }`}>{u.role}</span>
                  <span className={u.is_active ? 'badge-success' : 'badge-gray'}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                  <span className="text-xs text-subtext">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : 'Never'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
