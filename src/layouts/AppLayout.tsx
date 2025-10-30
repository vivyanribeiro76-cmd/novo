import { NavLink, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="container-app flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-brand" />
            <div className="text-lg font-semibold">Sua Logo Aqui</div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md ${isActive ? 'bg-brand text-white' : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'}`
              }
            >
              Configurações
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md ${isActive ? 'bg-brand text-white' : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'}`
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container-app py-6">
        <Outlet />
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
