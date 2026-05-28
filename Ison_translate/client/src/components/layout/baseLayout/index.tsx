import { Outlet } from 'react-router'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export function BaseLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
