import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function TenantAdminLayout() {
<<<<<<< Updated upstream
  const { isTenantAdmin, isSuperAdmin } = useAuth()
  if (!isTenantAdmin && !isSuperAdmin) {
    return <Navigate to="/app/translate" replace />
  }
=======
  const { isTenantAdmin } = useAuth()
  if (!isTenantAdmin) return <Navigate to="/app/translate" replace />
>>>>>>> Stashed changes
  return <Outlet />
}

export function SuperAdminLayout() {
  const { isSuperAdmin } = useAuth()
<<<<<<< Updated upstream
  if (!isSuperAdmin) {
    return <Navigate to="/app/translate" replace />
  }
=======
  if (!isSuperAdmin) return <Navigate to="/app/translate" replace />
>>>>>>> Stashed changes
  return <Outlet />
}
