import { LANGUAGES } from '../config'

type Props = {
  sourceLang: string
  targetLang: string
  onSourceLangChange: (value: string) => void
  onTargetLangChange: (value: string) => void
  className?: string
}

export function LanguageSelectFields({
  sourceLang,
  targetLang,
  onSourceLangChange,
  onTargetLangChange,
  className = '',
}: Props) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className}`}>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
          My language
        </span>
        <select
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-white outline-none ring-indigo-500/40 focus:ring-2"
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
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
          Partner's language
        </span>
        <select
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-white outline-none ring-indigo-500/40 focus:ring-2"
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
  )
}
