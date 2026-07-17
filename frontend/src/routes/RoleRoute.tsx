import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../lib/api'

export default function RoleRoute({ allow }: { allow: Role[] }) {
  const { role } = useAuth()

  if (role && !allow.includes(role)) {
    return <Navigate to="/katalog" replace />
  }

  return <Outlet />
}
