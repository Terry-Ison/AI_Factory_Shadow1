import { ChevronRight, Users } from 'lucide-react'
import type { HistoryUser } from '@/data/historyDummy'
import { cn } from '@/lib/utils'

type Props = {
  users: HistoryUser[]
  selectedUserId: string | null
  onSelectUser: (userId: string) => void
}

export function UserList({ users, selectedUserId, onSelectUser }: Props) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Users size={16} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-card-foreground">Users</h2>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {users.length}
        </span>
      </header>

      <ul className="flex-1 overflow-y-auto p-2">
        {users.map((user) => {
          const isSelected = selectedUserId === user.id
          return (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onSelectUser(user.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground',
                  )}
                >
                  {user.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{user.name}</span>
                  <span
                    className={cn(
                      'block truncate text-xs',
                      isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {user.role} · {user.sessionCount} sessions
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  className={cn('shrink-0', isSelected ? 'opacity-90' : 'text-muted-foreground')}
                />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
