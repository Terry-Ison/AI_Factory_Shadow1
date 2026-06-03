import { ChevronLeft, ChevronRight, History, LayoutDashboard, LogOut, Menu, Mic, Settings, User, Users } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover'
import { Button } from './ui/Button'

type Props = {
  collapsed: boolean
  onToggleSidebar: () => void
}

export function Sidebar({ collapsed, onToggleSidebar }: Props) {
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
      <button onClick={onToggleSidebar} className={`absolute ${!collapsed ? 'left-56' : 'left-14'} top-18 z-10 bg-white rounded-full shadow-md bg-gray-400 p-1 cursor-pointer hover:bg-gray-100`}>
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2 pt-6">
        {!isGuest && user && (

          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            collapsed={collapsed}
            active={isActive('/app/dashboard')}
            onClick={() => navigate('/app/dashboard')}
          />
        )}
        <NavItem
          icon={<Mic size={20} />}
          label="Translate"
          collapsed={collapsed}
          active={isActive('/app/translate')}
          onClick={() => navigate('/app/translate')}
        />
        <NavItem
          icon={<Users size={20} />}
          label="User Management"
          collapsed={collapsed}
          active={isActive('/app/user-management')}
          onClick={() => navigate('/app/user-management')}
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
        {
          !isGuest && user && (
            <NavItem
              icon={<Settings size={20} />}
              label="Settings"
              collapsed={collapsed}
              active={isActive('/app/settings')}
              onClick={() => navigate('/app/settings')}
            />
          )
        }

      </nav>

      {/* User section */}
      {user && (
        <>
          <Popover>
            <PopoverTrigger>
              <div
                className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer border-t-1 border-gray-200"
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
                {!collapsed && (
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium text-start"
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

                )}

                {!collapsed && (
                  <LogOut size={20} className='text-gray-700 ml-2 ' />
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent align="end" side='top' className="w-44">
              <Button variant="ghost" size="sm" className="w-full justify-start cursor-pointer" onClick={handleLogout}>
                <LogOut size={16} className='text-gray-700' />
                <span className="text-sm">Sign out</span>
              </Button>
              {/* <Button variant="ghost" size="sm" className="w-full justify-start cursor-pointer">
                <Settings size={16} className='text-gray-700' />
                <span className="text-sm">Settings</span>
              </Button> */}
            </PopoverContent>
          </Popover>

        </>
      )}

      <div
        className="px-2"
        style={{ borderTop: '1px solid var(--md-outline-variant)' }}
      >

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
      className="flex w-full items-center gap-3 text-sm font-medium rounded-lg justify-start"
      style={{
        height: '2.3rem',
        padding: collapsed ? '0' : '12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
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
      <span className="relative z-10 flex shrink-0 items-center justify-center w-5 h-4">
        {icon}
      </span>
      {!collapsed && (
        <span className={`relative z-10 truncate ${collapsed ? 'text-base' : 'text-normal'}`}>{label}</span>
      )}
    </button>
  )
}
