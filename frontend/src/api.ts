import type { StudentProfile, CompanyMatch } from './types'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function findMatches(profile: StudentProfile): Promise<CompanyMatch[]> {
  const res = await fetch(`${API}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error(`خطأ في الخادم (${res.status}). تأكد من تشغيل الخادم على ${API}`)
  const data = await res.json()
  return data.matches as CompanyMatch[]
}

export async function fetchCoverLetter(
  profile: StudentProfile,
  match: CompanyMatch,
): Promise<string> {
  const res = await fetch(`${API}/cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile,
      company: match.company,
      industry: match.industry,
      role: match.role,
      reasoning: match.reasoning,
    }),
  })
  if (!res.ok) throw new Error(`تعذّر توليد خطاب التقديم (${res.status}).`)
  const data = await res.json()
  return data.coverLetter as string
}
