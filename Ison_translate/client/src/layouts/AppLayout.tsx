import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isGuest } = useAuth()

  // Redirect to login if not authenticated or guest
  if (!user && !isGuest) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Navbar onToggleSidebar={() => setSidebarCollapsed((v) => !v)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
