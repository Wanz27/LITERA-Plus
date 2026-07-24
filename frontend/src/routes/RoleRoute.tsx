import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../lib/api'

export default function RoleRoute({ allow }: { allow: Role[] }) {
  const { role, authReady } = useAuth()

  /**
   * The cached role from localStorage can be stale (e.g. promoted from visitor to admin since
   * last login). Deciding before `getMe()` confirms the real role risks redirecting away and
   * never coming back, so wait rather than guess.
   */
  if (!authReady) {
    return <div className="grid h-screen place-items-center text-sm text-slate-400">Memuat...</div>
  }

  if (role && !allow.includes(role)) {
    return <Navigate to="/katalog" replace />
  }

  return <Outlet />
}
