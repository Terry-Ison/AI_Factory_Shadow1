import { History, LogOut, Mic, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  collapsed: boolean
}

export function Sidebar({ collapsed }: Props) {
  const { user, isGuest, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-white/10 bg-[var(--color-bg)] transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Top nav items */}
      <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
        <NavItem
          icon={<Mic size={17} />}
          label="Translate"
          collapsed={collapsed}
          active={isActive('/app/translate')}
          onClick={() => navigate('/app/translate')}
        />
        {!isGuest && user && (
          <NavItem
            icon={<History size={17} />}
            label="History"
            collapsed={collapsed}
            active={isActive('/app/history')}
            onClick={() => navigate('/app/history')}
          />
        )}
      </nav>

      {/* Bottom: user info + sign out */}
      <div className="border-t border-white/10 p-2 pb-3">
        {user && !collapsed && (
          <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{user.displayName}</p>
              <p className="truncate text-[10px] text-slate-500">{user.email}</p>
            </div>
          </div>
        )}
        {isGuest && !collapsed && (
          <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2">
            <User size={16} className="shrink-0 text-slate-400" />
            <span className="text-xs text-slate-400">Guest</span>
          </div>
        )}
        <NavItem
          icon={<LogOut size={17} />}
          label="Sign out"
          collapsed={collapsed}
          active={false}
          onClick={handleLogout}
          danger
        />
      </div>
    </aside>
  )
}

type NavItemProps = {
  icon: React.ReactNode
  label: string
  collapsed: boolean
  active: boolean
  onClick: () => void
  danger?: boolean
}

function NavItem({ icon, label, collapsed, active, onClick, danger }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition ${
        active
          ? 'bg-indigo-600/20 text-indigo-300'
          : danger
            ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate font-medium">{label}</span>}
    </button>
  )
}
