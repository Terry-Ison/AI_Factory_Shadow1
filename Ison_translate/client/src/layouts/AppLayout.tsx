import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isGuest, isPending } = useAuth()

  if (!user && !isGuest) {
    return <Navigate to="/login" replace />
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ background: 'var(--md-surface)' }}
    >
      <Navbar onToggleSidebar={() => setSidebarCollapsed((v) => !v)} />
      {isPending && (
        <div
          className="px-4 py-2 text-center text-sm"
          style={{
            background: 'var(--md-tertiary-container)',
            color: 'var(--md-on-tertiary-container)',
          }}
        >
<<<<<<< Updated upstream
          Your organization membership is pending approval. You can join sessions but history and admin features are unavailable until approved.
=======
          Your organization membership is pending approval. You can join sessions but history is unavailable until approved.
>>>>>>> Stashed changes
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={sidebarCollapsed} />
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
