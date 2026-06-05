import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function TenantAdminLayout() {
  const { isTenantAdmin, isSuperAdmin } = useAuth()
  if (!isTenantAdmin && !isSuperAdmin) {
    return <Navigate to="/app/translate" replace />
  }
  return <Outlet />
}

export function SuperAdminLayout() {
  const { isSuperAdmin } = useAuth()
  if (!isSuperAdmin) {
    return <Navigate to="/app/translate" replace />
  }
  return <Outlet />
}
