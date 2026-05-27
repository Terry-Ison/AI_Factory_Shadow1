import { Outlet } from 'react-router'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export function BaseLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
