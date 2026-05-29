import { apiUrl } from '../config'

export type DeepLLanguage = {
  code: string
  label: string
}

export async function fetchDeepLVoiceLanguages(): Promise<DeepLLanguage[]> {
  const res = await fetch(apiUrl('/api/languages'))
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error ?? 'Failed to load DeepL languages')
  }
  return Array.isArray(data?.languages) ? data.languages : []
}

