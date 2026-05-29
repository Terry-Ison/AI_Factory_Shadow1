import { History, LogOut, Mic, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  collapsed: boolean
}

/**
 * M3 Navigation Drawer — Modal / standard variant.
 * Active destination: secondary-container fill + on-secondary-container text.
 * Inactive: on-surface-variant text.
 */
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
      className="flex shrink-0 flex-col"
      style={{
        width: collapsed ? '4.5rem' : '15rem',
        transition: 'width 250ms cubic-bezier(0.2, 0, 0, 1)',
        background: 'var(--md-surface)',
        borderRight: '1px solid var(--md-outline-variant)',
        overflow: 'hidden',
      }}
    >
      {/* Section heading — only visible when expanded */}
      {!collapsed && (
        <div
          className="px-4 pb-1 pt-5"
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.03125rem',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          MENU
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        <NavItem
          icon={<Mic size={20} />}
          label="Translate"
          collapsed={collapsed}
          active={isActive('/app/translate')}
          onClick={() => navigate('/app/translate')}
        />
        {!isGuest && user && (
          <NavItem
            icon={<History size={20} />}
            label="History"
            collapsed={collapsed}
            active={isActive('/app/history')}
            onClick={() => navigate('/app/history')}
          />
        )}
      </nav>

      {/* User section */}
      <div
        className="px-2 pb-2"
        style={{ borderTop: '1px solid var(--md-outline-variant)' }}
      >
        {user && !collapsed && (
          <div
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3"
            style={{ borderRadius: 'var(--shape-lg)' }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: 'var(--md-primary-container)',
                color: 'var(--md-on-primary-container)',
                borderRadius: 'var(--shape-full)',
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-medium"
                style={{ color: 'var(--md-on-surface)' }}
              >
                {user.displayName}
              </p>
              <p
                className="truncate text-xs"
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                {user.email}
              </p>
            </div>
          </div>
        )}
        {isGuest && !collapsed && (
          <div className="mb-1 flex items-center gap-3 px-3 py-3">
            <User size={20} style={{ color: 'var(--md-on-surface-variant)' }} />
            <span
              className="text-sm"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Guest
            </span>
          </div>
        )}
        <NavItem
          icon={<LogOut size={20} />}
          label="Sign out"
          collapsed={collapsed}
          active={false}
          onClick={handleLogout}
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
}

function NavItem({ icon, label, collapsed, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      className="flex w-full items-center gap-3 text-sm font-medium"
      style={{
        height: '3.5rem',
        padding: collapsed ? '0' : '0 1rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 'var(--shape-full)',
        background: active
          ? 'var(--md-secondary-container)'
          : 'transparent',
        color: active
          ? 'var(--md-on-secondary-container)'
          : 'var(--md-on-surface-variant)',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 150ms, color 150ms',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* State layer */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: 'currentColor',
          opacity: 0,
          transition: 'opacity 100ms',
          pointerEvents: 'none',
        }}
        className="nav-state-layer"
      />
      <span className="relative z-10 flex shrink-0 items-center justify-center" style={{ width: '1.5rem' }}>
        {icon}
      </span>
      {!collapsed && (
        <span className="relative z-10 truncate">{label}</span>
      )}
    </button>
  )
}
