export const API_URL = import.meta.env.VITE_API_URL ?? ''

export function apiUrl(path: string) {
  if (!API_URL) return path
  return `${API_URL.replace(/\/$/, '')}${path}`
}

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ru', label: 'Russian' },
] as const

export function languageLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase()
}
