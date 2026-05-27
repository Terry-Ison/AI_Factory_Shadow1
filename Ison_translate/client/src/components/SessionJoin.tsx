import { LANGUAGES } from '../config'

type Props = {
  sessionId: string
  sourceLang: string
  targetLang: string
  joining: boolean
  onSessionIdChange: (value: string) => void
  onSourceLangChange: (value: string) => void
  onTargetLangChange: (value: string) => void
  onJoin: () => void
}

export function SessionJoin({
  sessionId,
  sourceLang,
  targetLang,
  joining,
  onSessionIdChange,
  onSourceLangChange,
  onTargetLangChange,
  onJoin,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5 dark:shadow-black/20">
      <h1 className="mb-1 text-2xl font-bold text-card-foreground">Live Voice Translator</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter the same session code in two browser tabs. Each side speaks in their language and
        hears the partner&apos;s translation in real time.
      </p>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Session ID
        </span>
        <input
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
          placeholder="e.g. demo-room-1"
          value={sessionId}
          onChange={(e) => onSessionIdChange(e.target.value)}
        />
      </label>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            My language
          </span>
          <select
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
            value={sourceLang}
            onChange={(e) => onSourceLangChange(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Partner&apos;s language
          </span>
          <select
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
            value={targetLang}
            onChange={(e) => onTargetLangChange(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        disabled={!sessionId.trim() || joining}
        onClick={onJoin}
        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {joining ? 'Joining…' : 'Join session'}
      </button>
    </div>
  )
}
