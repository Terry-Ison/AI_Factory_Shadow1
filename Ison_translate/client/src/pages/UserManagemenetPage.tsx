import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileAudio,
  Languages,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useOnClickOutside } from '../hooks/useOnClickOutside'

type UserStatus = 'active' | 'review' | 'suspended'

type AdminUser = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Agent' | 'Customer'
  status: UserStatus
  location: string
  joinedAt: string
  lastSeen: string
  sourceLang: string
  targetLang: string
  sessions: number
  minutes: number
  transcripts: number
  recordings: number
  riskScore: number
  device: string
  ipAddress: string
  recentActivity: {
    id: string
    title: string
    detail: string
    time: string
    tone: 'neutral' | 'success' | 'warning'
  }[]
}

type UserFilter = 'all' | UserStatus

const users: AdminUser[] = [
  {
    id: 'USR-1048',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@example.com',
    role: 'Customer',
    status: 'active',
    location: 'Mumbai, IN',
    joinedAt: 'May 18, 2026',
    lastSeen: '8 min ago',
    sourceLang: 'English',
    targetLang: 'Hindi',
    sessions: 42,
    minutes: 618,
    transcripts: 39,
    recordings: 27,
    riskScore: 12,
    device: 'Chrome on Windows',
    ipAddress: '103.86.98.24',
    recentActivity: [
      { id: 'a1', title: 'Completed translation session', detail: 'English to Hindi, 18 transcript lines, 12 min audio.', time: '8 min ago', tone: 'success' },
      { id: 'a2', title: 'Downloaded transcript', detail: 'Session #9AD31F copied from history detail.', time: '34 min ago', tone: 'neutral' },
      { id: 'a3', title: 'Updated default languages', detail: 'Changed target language from Spanish to Hindi.', time: 'Yesterday', tone: 'neutral' },
    ],
  },
  {
    id: 'USR-1022',
    name: 'Sofia Reyes',
    email: 'sofia.reyes@example.com',
    role: 'Agent',
    status: 'review',
    location: 'Austin, US',
    joinedAt: 'Apr 29, 2026',
    lastSeen: '24 min ago',
    sourceLang: 'Spanish',
    targetLang: 'English',
    sessions: 76,
    minutes: 1320,
    transcripts: 68,
    recordings: 54,
    riskScore: 64,
    device: 'Safari on macOS',
    ipAddress: '172.58.41.17',
    recentActivity: [
      { id: 's1', title: 'Unusual session volume', detail: '12 sessions started within one hour.', time: '24 min ago', tone: 'warning' },
      { id: 's2', title: 'Joined customer session', detail: 'Spanish to English live support translation.', time: '1 hr ago', tone: 'success' },
      { id: 's3', title: 'Failed audio upload retry', detail: 'One source recording retried after network timeout.', time: '2 hrs ago', tone: 'warning' },
    ],
  },
  {
    id: 'USR-0997',
    name: 'Kenji Tanaka',
    email: 'kenji.tanaka@example.com',
    role: 'Customer',
    status: 'active',
    location: 'Tokyo, JP',
    joinedAt: 'Mar 12, 2026',
    lastSeen: '2 hrs ago',
    sourceLang: 'Japanese',
    targetLang: 'English',
    sessions: 31,
    minutes: 404,
    transcripts: 30,
    recordings: 18,
    riskScore: 8,
    device: 'Edge on Windows',
    ipAddress: '126.73.18.91',
    recentActivity: [
      { id: 'k1', title: 'Completed translation session', detail: 'Japanese to English with saved transcript.', time: '2 hrs ago', tone: 'success' },
      { id: 'k2', title: 'Viewed history detail', detail: 'Opened session #441C0A from conversation archive.', time: '3 hrs ago', tone: 'neutral' },
      { id: 'k3', title: 'Signed in', detail: 'Successful password login from known device.', time: 'Today', tone: 'success' },
    ],
  },
  {
    id: 'USR-0871',
    name: 'Noah Carter',
    email: 'noah.carter@example.com',
    role: 'Customer',
    status: 'suspended',
    location: 'London, UK',
    joinedAt: 'Jan 7, 2026',
    lastSeen: '3 days ago',
    sourceLang: 'English',
    targetLang: 'French',
    sessions: 9,
    minutes: 88,
    transcripts: 5,
    recordings: 2,
    riskScore: 91,
    device: 'Firefox on Linux',
    ipAddress: '45.129.14.7',
    recentActivity: [
      { id: 'n1', title: 'Account suspended', detail: 'Admin action after repeated policy flags.', time: '3 days ago', tone: 'warning' },
      { id: 'n2', title: 'Multiple failed logins', detail: '7 failed attempts from unknown location.', time: '3 days ago', tone: 'warning' },
      { id: 'n3', title: 'Transcript flagged', detail: 'Automated moderation marked session for review.', time: '4 days ago', tone: 'warning' },
    ],
  },
]

const filters: { label: string; value: UserFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Review', value: 'review' },
  { label: 'Suspended', value: 'suspended' },
]

function statusStyles(status: UserStatus) {
  if (status === 'active') {
    return { label: 'Active', color: '#22c55e', bg: 'color-mix(in srgb, #22c55e 14%, transparent)' }
  }
  if (status === 'review') {
    return { label: 'Needs review', color: '#f59e0b', bg: 'color-mix(in srgb, #f59e0b 16%, transparent)' }
  }
  return { label: 'Suspended', color: 'var(--md-error)', bg: 'var(--md-error-container)' }
}

function StatCard({ icon, label, value, subtext }: { icon: ReactNode; label: string; value: string | number; subtext: string }) {
  return (
    <div
      className="p-3"
      style={{
        background: 'var(--md-surface-container-lowest)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center"
          style={{
            background: 'var(--md-secondary-container)',
            borderRadius: 'var(--shape-full)',
            color: 'var(--md-on-secondary-container)',
          }}
        >
          {icon}
        </span>
        <MoreHorizontal size={18} style={{ color: 'var(--md-outline)' }} />
      </div>
      <p className="text-xl leading-7" style={{ color: 'var(--md-on-surface)' }}>
        {value}
      </p>
      <p className="text-sm font-medium leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
        {label}
      </p>
      <p className="mt-0.5 text-xs leading-4" style={{ color: 'var(--md-outline)' }}>
        {subtext}
      </p>
    </div>
  )
}

function UserRow({ user, onClick }: { user: AdminUser; onClick: () => void }) {
  const status = statusStyles(user.status)

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[auto_1fr_auto] gap-4 p-4 text-left transition hover:-translate-y-0.5"
      style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)', color: 'var(--md-on-surface)' }}
    >
      <div className="flex h-12 w-12 items-center justify-center text-sm font-bold" style={{ background: 'var(--md-primary-container)', borderRadius: 'var(--shape-full)', color: 'var(--md-on-primary-container)' }}>
        {user.name.charAt(0)}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-base font-medium leading-6">{user.name}</p>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-xs" style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>
        <p className="truncate text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>{user.email}</p>
        <div className="mt-2 grid gap-2 text-xs leading-4 sm:grid-cols-4" style={{ color: 'var(--md-outline)' }}>
          <span>{user.role}</span>
          <span>{user.location}</span>
          <span>{user.sessions} sessions</span>
          <span>{user.riskScore}% risk</span>
        </div>
      </div>
      <div className="hidden text-right text-xs leading-4 md:block" style={{ color: 'var(--md-outline)' }}>
        <p>Last seen</p>
        <p className="mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>{user.lastSeen}</p>
      </div>
    </button>
  )
}

function ActivityItem({ item }: { item: AdminUser['recentActivity'][number] }) {
  const icon = item.tone === 'success' ? <CheckCircle2 size={16} /> : item.tone === 'warning' ? <AlertTriangle size={16} /> : <Activity size={16} />
  const color = item.tone === 'success' ? '#22c55e' : item.tone === 'warning' ? '#f59e0b' : 'var(--md-primary)'

  return (
    <li className="flex gap-3">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center" style={{ background: 'var(--md-surface-container)', borderRadius: 'var(--shape-full)', color }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1 border-b pb-4" style={{ borderColor: 'var(--md-outline-variant)' }}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-medium leading-5" style={{ color: 'var(--md-on-surface)' }}>{item.title}</p>
          <span className="text-xs leading-4" style={{ color: 'var(--md-outline)' }}>{item.time}</span>
        </div>
        <p className="mt-1 text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>{item.detail}</p>
      </div>
    </li>
  )
}

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Customer')
  const [message, setMessage] = useState('Join Transly to manage translation sessions and view activity history.')
  const modalRef = useRef<HTMLDivElement | null>(null)

  useOnClickOutside(modalRef, onClose, true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--md-scrim)' }}>
      <div
        ref={modalRef}
        className="w-full max-w-lg overflow-hidden"
        style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)', boxShadow: 'var(--elevation-4)' }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center" style={{ background: 'var(--md-primary-container)', borderRadius: 'var(--shape-full)', color: 'var(--md-on-primary-container)' }}>
              <UserPlus size={18} />
            </span>
            <div>
              <h2 className="text-lg font-medium leading-6" style={{ color: 'var(--md-on-surface)' }}>Invite user</h2>
              <p className="text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>Send an email invitation to the dashboard.</p>
            </div>
          </div>
          <button type="button" className="md-icon-btn" onClick={onClose} aria-label="Close invite popup">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <Input
            label="Email address"
            value={email}
            onChange={setEmail}
            placeholder="name@company.com"
            type="email"
          />
          <label className="md-field">
            <span className="md-field-label">Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value)} className="md-field-input">
              <option>Customer</option>
              <option>Agent</option>
              <option>Admin</option>
            </select>
          </label>
          <Input
            label="Invite message"
            value={message}
            onChange={setMessage}
            placeholder="Add a short message"
            multiline
            rows={5}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="filled" onClick={onClose} disabled={!email.trim()} leftIcon={<Send size={16} />}>
            Send invite
          </Button>
        </div>
      </div>
    </div>
  )
}

function UserDetailView({ user, onBack }: { user: AdminUser; onBack: () => void }) {
  const status = statusStyles(user.status)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <button type="button" onClick={onBack} className="md-btn md-btn-text w-fit gap-1" style={{ paddingLeft: '0.5rem' }}>
        <ArrowLeft size={16} />
        Back to users
      </button>

      <article className="shrink-0 p-5" style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center text-xl font-bold" style={{ background: 'var(--md-primary-container)', borderRadius: 'var(--shape-full)', color: 'var(--md-on-primary-container)' }}>
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl leading-8" style={{ color: 'var(--md-on-surface)' }}>{user.name}</h2>
                <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: status.bg, color: status.color }}>
                  {status.label}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                <Mail size={14} />
                {user.email}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                <MapPin size={14} />
                {user.location} / {user.role}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 md:w-80">
            <div className="rounded-md p-3 text-center" style={{ background: 'var(--md-surface-container)' }}>
              <p className="text-lg leading-6" style={{ color: 'var(--md-on-surface)' }}>{user.sessions}</p>
              <p className="text-xs" style={{ color: 'var(--md-outline)' }}>Sessions</p>
            </div>
            <div className="rounded-md p-3 text-center" style={{ background: 'var(--md-surface-container)' }}>
              <p className="text-lg leading-6" style={{ color: 'var(--md-on-surface)' }}>{user.minutes}</p>
              <p className="text-xs" style={{ color: 'var(--md-outline)' }}>Minutes</p>
            </div>
            <div className="rounded-md p-3 text-center" style={{ background: 'var(--md-surface-container)' }}>
              <p className="text-lg leading-6" style={{ color: 'var(--md-on-surface)' }}>{user.riskScore}%</p>
              <p className="text-xs" style={{ color: 'var(--md-outline)' }}>Risk</p>
            </div>
          </div>
        </div>
      </article>

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<MessageSquare size={18} />} label="Transcripts" value={user.transcripts} subtext="Saved session text" />
        <StatCard icon={<FileAudio size={18} />} label="Recordings" value={user.recordings} subtext="Audio files saved" />
        <StatCard icon={<Languages size={18} />} label="Language pair" value={`${user.sourceLang} -> ${user.targetLang}`} subtext="Default preference" />
        <StatCard icon={<Clock size={18} />} label="Last seen" value={user.lastSeen} subtext={`Joined ${user.joinedAt}`} />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_23rem]">
        <article className="min-h-0 overflow-hidden" style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
            <Activity size={17} style={{ color: 'var(--md-primary)' }} />
            <h3 className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>All user activity details</h3>
          </div>
          <div className="h-full min-h-0 overflow-y-auto p-4">
            <ol className="space-y-4">
              {user.recentActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </ol>
          </div>
        </article>

        <aside className="flex min-h-0 flex-col gap-4">
          <article className="p-4" style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)' }}>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={17} style={{ color: 'var(--md-primary)' }} />
              <h3 className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>Security profile</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span style={{ color: 'var(--md-on-surface-variant)' }}>Device</span>
                <span className="text-right" style={{ color: 'var(--md-on-surface)' }}>{user.device}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span style={{ color: 'var(--md-on-surface-variant)' }}>IP address</span>
                <span className="font-mono text-xs" style={{ color: 'var(--md-on-surface)' }}>{user.ipAddress}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span style={{ color: 'var(--md-on-surface-variant)' }}>Risk level</span>
                <span style={{ color: user.riskScore > 70 ? 'var(--md-error)' : user.riskScore > 50 ? '#f59e0b' : '#22c55e' }}>
                  {user.riskScore > 70 ? 'High' : user.riskScore > 50 ? 'Medium' : 'Low'}
                </span>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: 'var(--md-surface-container)' }}>
              <div className="h-full rounded-full" style={{ width: `${user.riskScore}%`, background: user.riskScore > 70 ? 'var(--md-error)' : user.riskScore > 50 ? '#f59e0b' : '#22c55e' }} />
            </div>
          </article>

          <article className="p-4" style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)' }}>
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock size={17} style={{ color: 'var(--md-primary)' }} />
              <h3 className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>Admin actions</h3>
            </div>
            <div className="grid gap-2">
              <button type="button" className="md-btn md-btn-tonal justify-start"><ShieldCheck size={16} />Mark reviewed</button>
              <button type="button" className="md-btn md-btn-outlined justify-start"><Mail size={16} />Send notice</button>
              <button type="button" className="md-btn md-btn-error justify-start"><Ban size={16} />Suspend user</button>
            </div>
          </article>
        </aside>
      </div>
    </div>
  )
}

export function UserManagementPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<UserFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return users.filter((user) => {
      const matchesFilter = filter === 'all' || user.status === filter
      if (!matchesFilter) return false
      if (!normalizedQuery) return true

      return [user.name, user.email, user.role, user.location, user.id, user.sourceLang, user.targetLang]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [filter, query])

  const selectedUser = selectedId ? users.find((user) => user.id === selectedId) : null
  const activeCount = users.filter((user) => user.status === 'active').length
  const reviewCount = users.filter((user) => user.status === 'review').length
  const suspendedCount = users.filter((user) => user.status === 'suspended').length

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-5 overflow-hidden p-4 md:p-6">
      {inviteOpen && <InviteUserModal onClose={() => setInviteOpen(false)} />}

      <header className="shrink-0 p-5 md:p-6" style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)' }}>
        <div className="flex flex-col gap-5 ">
          <div className="max-w-2xl">
            {/* <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase" style={{ color: 'var(--md-primary)' }}>
              <ShieldCheck size={14} />
              Admin dashboard
            </div> */}
            <h1 className="text-3xl leading-10 md:text-4xl md:leading-[3rem]" style={{ color: 'var(--md-on-surface)' }}>
              User management
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--md-on-surface-variant)' }}>
              Monitor users, invite teammates, review activity, and open full account details from the list.
            </p>
          </div>

          <div className="flex flex-row flex-row-reverse justify-between gap-3 xl:items-end">
            <button type="button" className="md-btn md-btn-filled w-fit gap-2" onClick={() => setInviteOpen(true)}>
              <UserPlus size={17} />
              Invite user
            </button>
            <div className="grid min-w-0 gap-3 grid-cols-2 md:grid-cols-4 xl:w-[42rem] xl:grid-cols-4">
              <StatCard icon={<Users size={18} />} label="Total users" value={users.length} subtext="Registered accounts" />
              <StatCard icon={<UserCheck size={18} />} label="Active" value={activeCount} subtext="Recently healthy" />
              <StatCard icon={<AlertTriangle size={18} />} label="Review" value={reviewCount} subtext="Needs admin check" />
              <StatCard icon={<Ban size={18} />} label="Suspended" value={suspendedCount} subtext="Restricted access" />
            </div>
          </div>
        </div>
      </header>

      {selectedUser ? (
        <UserDetailView user={selectedUser} onBack={() => setSelectedId(null)} />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)' }}>
          <div className="shrink-0 space-y-3 p-4" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
            <label className="flex min-h-12 items-center gap-3 px-3" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)', color: 'var(--md-on-surface-variant)' }}>
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, roles, locations" className="min-w-0 flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--md-on-surface)' }} />
            </label>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="hidden shrink-0 items-center gap-1 text-xs font-medium sm:inline-flex" style={{ color: 'var(--md-outline)' }}>
                <SlidersHorizontal size={14} />
                Filter
              </span>
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className="md-chip shrink-0"
                  style={filter === item.value ? { background: 'var(--md-primary-container)', borderColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' } : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {filteredUsers.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
                <Search size={32} style={{ color: 'var(--md-outline)' }} />
                <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>No users match this view.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredUsers.map((user) => (
                  <li key={user.id}>
                    <UserRow user={user} onClick={() => setSelectedId(user.id)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
