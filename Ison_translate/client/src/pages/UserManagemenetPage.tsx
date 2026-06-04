import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileAudio,
  Languages,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/Input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

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
  {
    id: 'USR-0812',
    name: 'Elena Novak',
    email: 'elena.novak@example.com',
    role: 'Agent',
    status: 'active',
    location: 'Prague, CZ',
    joinedAt: 'Feb 2, 2026',
    lastSeen: '1 hr ago',
    sourceLang: 'Czech',
    targetLang: 'English',
    sessions: 54,
    minutes: 720,
    transcripts: 48,
    recordings: 31,
    riskScore: 18,
    device: 'Chrome on macOS',
    ipAddress: '89.22.11.4',
    recentActivity: [],
  },
  {
    id: 'USR-0755',
    name: 'Marcus Chen',
    email: 'marcus.chen@example.com',
    role: 'Customer',
    status: 'active',
    location: 'Singapore, SG',
    joinedAt: 'Jan 22, 2026',
    lastSeen: '5 hrs ago',
    sourceLang: 'Mandarin',
    targetLang: 'English',
    sessions: 22,
    minutes: 310,
    transcripts: 20,
    recordings: 14,
    riskScore: 10,
    device: 'Safari on iOS',
    ipAddress: '203.12.44.90',
    recentActivity: [],
  },
  {
    id: 'USR-0701',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    role: 'Admin',
    status: 'active',
    location: 'Delhi, IN',
    joinedAt: 'Dec 8, 2025',
    lastSeen: 'Yesterday',
    sourceLang: 'Hindi',
    targetLang: 'English',
    sessions: 120,
    minutes: 2100,
    transcripts: 110,
    recordings: 88,
    riskScore: 5,
    device: 'Chrome on Android',
    ipAddress: '117.88.22.15',
    recentActivity: [],
  },
  {
    id: 'USR-0688',
    name: 'Lucas Weber',
    email: 'lucas.weber@example.com',
    role: 'Customer',
    status: 'review',
    location: 'Berlin, DE',
    joinedAt: 'Nov 14, 2025',
    lastSeen: '2 days ago',
    sourceLang: 'German',
    targetLang: 'English',
    sessions: 15,
    minutes: 190,
    transcripts: 12,
    recordings: 6,
    riskScore: 58,
    device: 'Firefox on Windows',
    ipAddress: '91.44.12.8',
    recentActivity: [],
  },
  {
    id: 'USR-0620',
    name: 'Amara Okafor',
    email: 'amara.okafor@example.com',
    role: 'Customer',
    status: 'active',
    location: 'Lagos, NG',
    joinedAt: 'Oct 3, 2025',
    lastSeen: '12 min ago',
    sourceLang: 'English',
    targetLang: 'French',
    sessions: 38,
    minutes: 520,
    transcripts: 35,
    recordings: 22,
    riskScore: 14,
    device: 'Edge on Windows',
    ipAddress: '41.203.88.12',
    recentActivity: [],
  },
  {
    id: 'USR-0599',
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    role: 'Agent',
    status: 'suspended',
    location: 'Toronto, CA',
    joinedAt: 'Sep 19, 2025',
    lastSeen: '1 week ago',
    sourceLang: 'English',
    targetLang: 'French',
    sessions: 11,
    minutes: 95,
    transcripts: 8,
    recordings: 3,
    riskScore: 88,
    device: 'Chrome on Linux',
    ipAddress: '72.14.201.44',
    recentActivity: [],
  },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

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
      title={subtext ? `${label} — ${subtext}` : label}
      className="flex min-w-0 items-center gap-2 px-2 py-1.5"
      style={{
        background: 'var(--md-surface-container)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center [&_svg]:h-[0.875rem] [&_svg]:w-[0.875rem]"
        style={{
          background: 'var(--md-secondary-container)',
          borderRadius: 'var(--shape-full)',
          color: 'var(--md-on-secondary-container)',
        }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-5 tabular-nums" style={{ color: 'var(--md-on-surface)' }}>
          {value}
        </p>
        <p className="truncate text-[0.6875rem] leading-4" style={{ color: 'var(--md-on-surface-variant)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

function UserActionsMenu({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  const itemClass =
    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-[var(--md-on-surface)] outline-none hover:bg-[var(--md-surface-container)] focus:bg-[var(--md-surface-container)]'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--md-on-surface-variant)] transition hover:bg-[var(--md-surface-container)]"
          aria-label="User actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-36 p-1">
        <button
          type="button"
          className={itemClass}
          onClick={() => {
            onView()
            setOpen(false)
          }}
        >
          <Eye size={15} />
          View
        </button>
        <button
          type="button"
          className={itemClass}
          onClick={() => {
            onEdit()
            setOpen(false)
          }}
        >
          <Pencil size={15} />
          Edit
        </button>
        <button
          type="button"
          className={cn(itemClass, 'text-red-600 hover:bg-red-500/10 focus:bg-red-500/10')}
          onClick={() => {
            onDelete()
            setOpen(false)
          }}
        >
          <Trash2 size={15} />
          Delete
        </button>
      </PopoverContent>
    </Popover>
  )
}

function UsersTable({
  users: rows,
  onView,
  onEdit,
  onDelete,
}: {
  users: AdminUser[]
  onView: (user: AdminUser) => void
  onEdit: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-[var(--md-outline-variant)] hover:bg-transparent">
          <TableHead className="pl-4 text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)]">User</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)]">Email</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)]">Role</TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)] lg:table-cell">Location</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)]">Status</TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)] md:table-cell">Sessions</TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)] sm:table-cell">Risk</TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)] xl:table-cell">Last seen</TableHead>
          <TableHead className="w-12 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((user) => {
          const status = statusStyles(user.status)
          return (
            <TableRow
              key={user.id}
              className="border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container)]/60"
            >
              <TableCell className="pl-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-xs font-bold"
                    style={{
                      background: 'var(--md-primary-container)',
                      borderRadius: 'var(--shape-full)',
                      color: 'var(--md-on-primary-container)',
                    }}
                  >
                    {user.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--md-on-surface)]">{user.name}</p>
                    <p className="truncate text-xs text-[var(--md-outline)] lg:hidden">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden max-w-[12rem] truncate text-[var(--md-on-surface-variant)] lg:table-cell">
                {user.email}
              </TableCell>
              <TableCell className="text-[var(--md-on-surface-variant)]">{user.role}</TableCell>
              <TableCell className="hidden text-[var(--md-on-surface-variant)] lg:table-cell">{user.location}</TableCell>
              <TableCell>
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
              </TableCell>
              <TableCell className="hidden tabular-nums text-[var(--md-on-surface-variant)] md:table-cell">
                {user.sessions}
              </TableCell>
              <TableCell className="hidden tabular-nums text-[var(--md-on-surface-variant)] sm:table-cell">
                {user.riskScore}%
              </TableCell>
              <TableCell className="hidden text-[var(--md-on-surface-variant)] xl:table-cell">{user.lastSeen}</TableCell>
              <TableCell className="pr-4 text-right">
                <UserActionsMenu
                  onView={() => onView(user)}
                  onEdit={() => onEdit(user)}
                  onDelete={() => onDelete(user)}
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function UsersTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, total)

  const pageBtn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition'

  return (
    <div
      className="flex shrink-0 flex-col gap-3 border-t border-[var(--md-outline-variant)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-[var(--md-on-surface-variant)]">
        Showing <span className="font-medium text-[var(--md-on-surface)]">{start}</span>–
        <span className="font-medium text-[var(--md-on-surface)]">{end}</span> of{' '}
        <span className="font-medium text-[var(--md-on-surface)]">{total}</span> results
      </p>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--md-on-surface-variant)]">Rows</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-9 appearance-none rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] py-0 pl-3 pr-8 text-sm text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)]"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--md-outline)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className={cn(
              pageBtn,
              'border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] text-[var(--md-on-surface-variant)]',
              safePage <= 1 && 'cursor-not-allowed opacity-40',
            )}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              className={cn(
                pageBtn,
                n === safePage
                  ? 'border-[var(--md-on-surface)] bg-[var(--md-on-surface)] text-[var(--md-surface)]'
                  : 'border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)]',
              )}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className={cn(
              pageBtn,
              'border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] text-[var(--md-on-surface)]',
              safePage >= totalPages && 'cursor-not-allowed opacity-40',
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
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

function InviteUserModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Customer')
  const [message, setMessage] = useState(
    'Join Transly to manage translation sessions and view activity history.'
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="flex items-start gap-3 border-b px-5 py-4 pr-12">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <DialogTitle className="text-lg leading-6">Invite user</DialogTitle>
            <DialogDescription>Send an email invitation to the dashboard.</DialogDescription>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <Field>
            <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Customer">Customer</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="invite-message">Invite message</FieldLabel>
            <Textarea
              id="invite-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Add a short message"
              rows={5}
            />
          </Field>
        </div>

        <DialogFooter className="gap-2 sm:justify-end m-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!email.trim()} onClick={() => onOpenChange(false)}>
            <Send data-icon="inline-start" />
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

      <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<MessageSquare size={14} />} label="Transcripts" value={user.transcripts} subtext="Saved session text" />
        <StatCard icon={<FileAudio size={14} />} label="Recordings" value={user.recordings} subtext="Audio files saved" />
        <StatCard icon={<Languages size={14} />} label="Language pair" value={`${user.sourceLang} → ${user.targetLang}`} subtext="Default preference" />
        <StatCard icon={<Clock size={14} />} label="Last seen" value={user.lastSeen} subtext={`Joined ${user.joinedAt}`} />
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  useEffect(() => {
    setPage(1)
  }, [query, filter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, pageSize, safePage])

  const selectedUser = selectedId ? users.find((user) => user.id === selectedId) : null
  const activeCount = users.filter((user) => user.status === 'active').length
  const reviewCount = users.filter((user) => user.status === 'review').length
  const suspendedCount = users.filter((user) => user.status === 'suspended').length

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-5 overflow-hidden p-4 md:p-6">
      <InviteUserModal open={inviteOpen} onOpenChange={setInviteOpen} />

      <header className="shrink-0" >
        <div className="flex flex-col gap-5 ">
          <div className="max-w-2xl">
            <h1 className="text-xl leading-10 md:text-2xl font-bold" style={{ color: 'var(--md-on-surface)' }}>
              User management
            </h1>
            <p className="text-sm leading-4" style={{ color: 'var(--md-on-surface-variant)' }}>
              Monitor users, invite teammates, review activity, and open full account details from the list.
            </p>
          </div>

          <div className="flex flex-row flex-row-reverse justify-between gap-3 xl:items-end">
            <Button variant="default" size="default" onClick={() => setInviteOpen(true)}>
              <Send size={14} />
              <span className="text-sm font-medium">Invite User</span>
            </Button>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2 md:grid-cols-4">
              <StatCard icon={<Users size={14} />} label="Total users" value={users.length} subtext="Registered accounts" />
              <StatCard icon={<UserCheck size={14} />} label="Active" value={activeCount} subtext="Recently healthy" />
              <StatCard icon={<AlertTriangle size={14} />} label="Review" value={reviewCount} subtext="Needs admin check" />
              <StatCard icon={<Ban size={14} />} label="Suspended" value={suspendedCount} subtext="Restricted access" />
            </div>
          </div>
        </div>
      </header>

      {selectedUser ? (
        <UserDetailView user={selectedUser} onBack={() => setSelectedId(null)} />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)' }}>
          <div className="flex justify-between space-y-3 px-4 py-2 gap-2 items-center" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
            <label className="flex py-2 items-center gap-3 px-3 my-auto" style={{  border: '1px solid var(--md-outline-variant)', borderRadius: 'var(--shape-sm)', color: 'var(--md-on-surface-variant)' }}>
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, roles, locations" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>

            <Select value={filter} onValueChange={(value) => setFilter(value as UserFilter)}>
              <SelectTrigger
                size="default"
                className="h-12 my-auto  gap-2 border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-3 py-4 text-[var(--md-on-surface)] shadow-none hover:bg-[var(--md-surface-container-high)]"
              >
                {/* <SlidersHorizontal size={16} className="shrink-0 text-[var(--md-outline)]" /> */}
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent align="start" position='popper' className="min-w-[9.5rem]">
                {filters.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-6 text-center">
                <Search size={32} style={{ color: 'var(--md-outline)' }} />
                <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>No users match this view.</p>
              </div>
            ) : (
              <UsersTable
                users={paginatedUsers}
                onView={(user) => setSelectedId(user.id)}
                onEdit={(user) => setSelectedId(user.id)}
                onDelete={(user) => window.alert(`Delete ${user.name} — wire to API when ready.`)}
              />
            )}
          </div>

          {filteredUsers.length > 0 && (
            <UsersTablePagination
              page={safePage}
              pageSize={pageSize}
              total={filteredUsers.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </section>
      )}
    </main>
  )
}
