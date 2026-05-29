import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isGuest } = useAuth()

  if (!user && !isGuest) {
    return <Navigate to="/login" replace />
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ background: 'var(--md-surface)' }}
    >
      <Navbar onToggleSidebar={() => setSidebarCollapsed((v) => !v)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={sidebarCollapsed} />
        {/* M3 surface-container-low for the main content area */}
        <main
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          style={{ background: 'var(--md-surface-container-low)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
