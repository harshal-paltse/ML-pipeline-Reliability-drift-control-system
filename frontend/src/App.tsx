import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import PredictionPage      from './pages/PredictionPage'
import DashboardPage       from './pages/DashboardPage'
import LoginPage           from './pages/LoginPage'
import ApiKeysPage         from './pages/ApiKeysPage'
import ModelUploadPage     from './pages/ModelUploadPage'
import AnalyticsPage       from './pages/AnalyticsPage'
import BatchPredictPage    from './pages/BatchPredictPage'
import ModelComparePage    from './pages/ModelComparePage'
import ProfilePage         from './pages/ProfilePage'
import PipelineAnalysisPage from './pages/PipelineAnalysisPage'

function ProtectedRoute({ children, adminOnly = false }: {
  children: React.ReactNode; adminOnly?: boolean
}) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

const NAV_LINKS = [
  { to: '/',          label: 'Predict',    icon: '◎', group: 'main' },
  { to: '/batch',     label: 'Batch',      icon: '⊞', group: 'main' },
  { to: '/pipeline',  label: 'Analyzer',   icon: '⚙', group: 'main', highlight: true },
  { to: '/compare',   label: 'Compare',    icon: '⇄', group: 'main' },
  { to: '/dashboard', label: 'Dashboard',  icon: '▦', group: 'admin' },
  { to: '/analytics', label: 'Analytics',  icon: '↗', group: 'admin' },
  { to: '/models',    label: 'Models',     icon: '⬆', group: 'admin' },
  { to: '/api-keys',  label: 'API Keys',   icon: '⚿', group: 'admin' },
]

function NavLink({ l, active }: { l: typeof NAV_LINKS[0]; active: boolean }) {
  return (
    <Link to={l.to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-accent text-white'
          : l.highlight
            ? 'text-accent border border-accent/30 hover:bg-blue-50'
            : 'text-subtext hover:text-text hover:bg-surface'
      }`}>
      <span className="text-xs">{l.icon}</span>
      {l.label}
    </Link>
  )
}

function Layout() {
  const loc = useLocation()
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-surface">
      {/* Top nav */}
      <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-text text-sm">ML Drift Control</span>
            <span className="badge-blue text-xs hidden md:inline">v3.0</span>
          </div>

          {/* Nav links — desktop */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-1">
              {/* Divider between groups */}
              {NAV_LINKS.map((l, i) => (
                <span key={l.to}>
                  {i === 4 && (
                    <span className="w-px h-5 bg-border mx-1 inline-block" />
                  )}
                  <NavLink l={l} active={loc.pathname === l.to} />
                </span>
              ))}
            </div>
          )}

          {/* User menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-accent uppercase">{user?.username[0]}</span>
                  </div>
                  <div className="text-xs hidden lg:block">
                    <p className="font-semibold text-text leading-tight">{user?.username}</p>
                    <p className="text-subtext capitalize leading-tight">{user?.role}</p>
                  </div>
                </Link>
                <button onClick={logout}
                  className="text-xs text-subtext border border-border rounded-lg px-3 py-1.5 hover:text-danger hover:border-danger/30 transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary px-4 py-1.5 text-sm">Sign In</Link>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {isAuthenticated && (
          <div className="lg:hidden flex overflow-x-auto gap-1 px-4 pb-2 scrollbar-hide">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  loc.pathname === l.to
                    ? 'bg-accent text-white'
                    : 'text-subtext hover:text-text bg-surface'
                }`}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Page content */}
      <main>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/"         element={<ProtectedRoute><PredictionPage /></ProtectedRoute>} />
          <Route path="/batch"    element={<ProtectedRoute><BatchPredictPage /></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute><PipelineAnalysisPage /></ProtectedRoute>} />
          <Route path="/compare"  element={<ProtectedRoute><ModelComparePage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/models"   element={<ProtectedRoute><ModelUploadPage /></ProtectedRoute>} />
          <Route path="/api-keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
          <Route path="/profile"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
}
