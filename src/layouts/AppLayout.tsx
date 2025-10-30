import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'

export default function AppLayout() {
  const [loading] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.removeItem('authenticated')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <header className="bg-dark-card border-b border-gray-800 sticky top-0 z-10 shadow-xl">
        <div className="container-app flex items-center justify-between py-3">
          <div className="flex items-center space-x-4">
            {/* Wordmark instead of image logo */}
            <div className="select-none leading-none">
              <span className="text-2xl font-extrabold tracking-wider text-white">FZ</span>
              <span className="text-2xl font-extrabold tracking-wider text-brand-400">IA</span>
            </div>
            <h1 className="text-xl font-semibold text-white">MetricAI</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <nav className="flex items-center gap-2">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition shadow-sm ${
                    isActive
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      : 'text-gray-400 hover:bg-dark-secondary hover:text-white hover:shadow-lg hover:shadow-brand-500/20'
                  }`
                }
              >
                Configurações
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition shadow-sm ${
                    isActive
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      : 'text-gray-400 hover:bg-dark-secondary hover:text-white hover:shadow-lg hover:shadow-brand-500/20'
                  }`
                }
              >
                Dashboard
              </NavLink>
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-400 hover:bg-dark-secondary hover:text-white transition shadow-sm hover:shadow-lg hover:shadow-brand-500/20"
              title="Sair"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>
      <main className="container-app py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400"></div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  )
}

export function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  )
}
