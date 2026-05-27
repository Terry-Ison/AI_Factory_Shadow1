import { useMemo, useState } from 'react'
import { History } from 'lucide-react'
import {
  HISTORY_USERS,
  getSessionById,
  getSessionsForUser,
  getUserById,
} from '@/data/historyDummy'
import { UserList } from '@/components/history/UserList'
import { SessionList } from '@/components/history/SessionList'
import { SessionDetail } from '@/components/history/SessionDetail'

export function HistoryPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const selectedUser = useMemo(
    () => (selectedUserId ? getUserById(selectedUserId) : undefined),
    [selectedUserId],
  )

  const userSessions = useMemo(
    () => (selectedUserId ? getSessionsForUser(selectedUserId) : []),
    [selectedUserId],
  )

  const selectedSession = useMemo(
    () => (selectedSessionId ? getSessionById(selectedSessionId) : undefined),
    [selectedSessionId],
  )

  function handleSelectUser(userId: string) {
    setSelectedUserId(userId)
    setSelectedSessionId(null)
  }

  function handleSelectSession(sessionId: string) {
    setSelectedSessionId(sessionId)
  }

  function handleBackToUsers() {
    setSelectedUserId(null)
    setSelectedSessionId(null)
  }

  function handleBackToSessions() {
    setSelectedSessionId(null)
  }

  const showUsers = !selectedUserId
  const showSessions = selectedUserId && !selectedSessionId
  const showDetail = selectedUserId && selectedSessionId && selectedSession && selectedUser

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <History size={22} />
          Translation history
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse past sessions by user. Select a user to view their calls, then open a session to
          read transcripts.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12 lg:min-h-[520px]">
        {/* Users — always on lg; mobile when no selection */}
        <div
          className={`min-h-[280px] lg:col-span-3 ${showUsers ? 'block' : 'hidden lg:block'}`}
        >
          <UserList
            users={HISTORY_USERS}
            selectedUserId={selectedUserId}
            onSelectUser={handleSelectUser}
          />
        </div>

        {/* Sessions — middle column on lg */}
        <div
          className={`min-h-[280px] lg:col-span-4 ${
            showSessions || (selectedUserId && !selectedSessionId)
              ? 'block'
              : selectedUserId
                ? 'hidden lg:block'
                : 'hidden'
          }`}
        >
          {selectedUser ? (
            <SessionList
              user={selectedUser}
              sessions={userSessions}
              selectedSessionId={selectedSessionId}
              onSelectSession={handleSelectSession}
              onBack={handleBackToUsers}
            />
          ) : (
            <EmptyPanel message="Select a user to see their past translation sessions." />
          )}
        </div>

        {/* Detail — right column */}
        <div
          className={`min-h-[320px] lg:col-span-5 ${
            showDetail ? 'block' : selectedUserId ? 'hidden lg:flex lg:flex-col' : 'hidden'
          }`}
        >
          {showDetail ? (
            <SessionDetail
              session={selectedSession}
              userName={selectedUser.name}
              onBack={handleBackToSessions}
            />
          ) : selectedUser ? (
            <EmptyPanel message="Select a session to view the full transcript." />
          ) : (
            <EmptyPanel message="Open a user’s session to review what was said and translated." />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <section className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </section>
  )
}
