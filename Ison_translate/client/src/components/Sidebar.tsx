<<<<<<< Updated upstream
import {
  BarChart3,
  Building2,
  History,
  KeyRound,
  LogOut,
  Mic,
  Shield,
  User,
  Users,
} from 'lucide-react'
=======
import { BarChart3, Building2, History, KeyRound, LogOut, Mic, Shield, User, Users } from 'lucide-react'
>>>>>>> Stashed changes
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  collapsed: boolean
}

export function Sidebar({ collapsed }: Props) {
<<<<<<< Updated upstream
  const { user, isGuest, isSuperAdmin, isTenantAdmin, canAccessHistory, logout } = useAuth()
=======
  const { user, isGuest, logout, isTenantAdmin, isSuperAdmin, canAccessHistory } = useAuth()
>>>>>>> Stashed changes
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
        {!isGuest && user && canAccessHistory && (
          <NavItem
            icon={<History size={20} />}
            label="History"
            collapsed={collapsed}
            active={isActive('/app/history')}
            onClick={() => navigate('/app/history')}
          />
        )}
<<<<<<< Updated upstream

        {isTenantAdmin && (
          <>
            {!collapsed && <SectionLabel>Admin</SectionLabel>}
=======
        {isTenantAdmin && (
          <>
>>>>>>> Stashed changes
            <NavItem
              icon={<Users size={20} />}
              label="Users"
              collapsed={collapsed}
              active={isActive('/app/admin/users')}
              onClick={() => navigate('/app/admin/users')}
            />
            <NavItem
              icon={<BarChart3 size={20} />}
              label="Analytics"
              collapsed={collapsed}
              active={isActive('/app/admin/analytics')}
              onClick={() => navigate('/app/admin/analytics')}
            />
            <NavItem
              icon={<KeyRound size={20} />}
              label="Voice providers"
              collapsed={collapsed}
              active={isActive('/app/admin/voice-providers')}
              onClick={() => navigate('/app/admin/voice-providers')}
            />
          </>
        )}
<<<<<<< Updated upstream

        {isSuperAdmin && (
          <>
            {!collapsed && <SectionLabel>Super admin</SectionLabel>}
=======
        {isSuperAdmin && (
          <>
>>>>>>> Stashed changes
            <NavItem
              icon={<Building2 size={20} />}
              label="Organizations"
              collapsed={collapsed}
              active={isActive('/app/super-admin/organizations')}
              onClick={() => navigate('/app/super-admin/organizations')}
            />
            <NavItem
<<<<<<< Updated upstream
              icon={<Users size={20} />}
              label="All users"
              collapsed={collapsed}
              active={isActive('/app/super-admin/users')}
              onClick={() => navigate('/app/super-admin/users')}
            />
            <NavItem
=======
>>>>>>> Stashed changes
              icon={<Shield size={20} />}
              label="Provider catalog"
              collapsed={collapsed}
              active={isActive('/app/super-admin/voice-providers')}
              onClick={() => navigate('/app/super-admin/voice-providers')}
            />
          </>
        )}
      </nav>

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
              <p className="truncate text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>
                {user.displayName}
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        {isGuest && !collapsed && (
          <div className="mb-1 flex items-center gap-3 px-3 py-3">
            <User size={20} style={{ color: 'var(--md-on-surface-variant)' }} />
            <span className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>Guest</span>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-4 pb-1 pt-4"
      style={{
        fontSize: '0.6875rem',
        fontWeight: 500,
        letterSpacing: '0.05rem',
        textTransform: 'uppercase',
        color: 'var(--md-outline)',
      }}
    >
      {children}
    </div>
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
        background: active ? 'var(--md-secondary-container)' : 'transparent',
        color: active ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 150ms, color 150ms',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span className="relative z-10 flex shrink-0 items-center justify-center" style={{ width: '1.5rem' }}>
        {icon}
      </span>
      {!collapsed && <span className="relative z-10 truncate">{label}</span>}
    </button>
  )
}
