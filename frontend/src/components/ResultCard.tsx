import { useState } from 'react'
import type { CompanyMatch, StudentProfile } from '../types'
import { INDUSTRY_LABELS, CITY_LABELS, ROLE_LABELS, SIZE_LABELS, labelOf } from '../labels'
import { fetchCoverLetter } from '../api'

interface Props {
  match: CompanyMatch
  profile: StudentProfile
}

export default function ResultCard({ match, profile }: Props) {
  const [open, setOpen] = useState(false)
  const [letter, setLetter] = useState(match.coverLetter)
  const [letterLoading, setLetterLoading] = useState(false)
  const [letterError, setLetterError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleToggle() {
    const nowOpen = !open
    setOpen(nowOpen)
    if (nowOpen && !letter && !letterLoading) {
      setLetterLoading(true)
      setLetterError(null)
      try {
        const text = await fetchCoverLetter(profile, match)
        setLetter(text)
      } catch (e) {
        setLetterError(e instanceof Error ? e.message : 'خطأ غير معروف')
      } finally {
        setLetterLoading(false)
      }
    }
  }

  async function copyLetter() {
    if (!letter) return
    await navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scorePct = Math.round(match.fitScore * 100)
  const scoreColor =
    scorePct >= 80 ? 'bg-kfu-50 text-kfu-700 ring-kfu-100'
    : scorePct >= 60 ? 'bg-amber-50 text-amber-700 ring-amber-100'
    : 'bg-gray-50 text-gray-700 ring-gray-100'

  const sizeColor =
    match.size === 'Startup' ? 'bg-purple-50 text-purple-700 ring-purple-100'
    : match.size === 'Scaleup' ? 'bg-blue-50 text-blue-700 ring-blue-100'
    : 'bg-gray-50 text-gray-600 ring-gray-100'

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900">{match.company}</h3>
            {match.size && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${sizeColor}`}>
                {labelOf(match.size, SIZE_LABELS)}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-500 truncate">
            {labelOf(match.role, ROLE_LABELS)} · {labelOf(match.industry, INDUSTRY_LABELS)} · {labelOf(match.location, CITY_LABELS)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${scoreColor}`}>
          نسبة الملاءمة {scorePct}%
        </span>
      </div>

      {match.reasoning && <p className="mt-3 text-sm text-gray-700 leading-relaxed">{match.reasoning}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={match.applyUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-kfu-700 px-4 py-2 text-sm font-medium text-white hover:bg-kfu-800"
        >
          ← التقديم
        </a>
        <button
          onClick={handleToggle}
          disabled={letterLoading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {letterLoading
            ? 'جارٍ توليد الخطاب…'
            : open ? 'إخفاء خطاب التقديم' : 'توليد خطاب التقديم'}
        </button>
        {match.publicContact && (
          <a
            href={`mailto:${match.publicContact}`}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ✉ {match.publicContact}
          </a>
        )}
      </div>

      {open && (
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
          {letterLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-kfu-600" />
              جارٍ كتابة خطاب مخصّص لك…
            </div>
          )}
          {letterError && (
            <p className="text-sm text-red-700">{letterError}</p>
          )}
          {!letterLoading && !letterError && letter && (
            <>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800" dir="rtl">{letter}</pre>
              <button
                onClick={copyLetter}
                className="mt-3 text-sm font-medium text-kfu-700 hover:text-kfu-900"
              >
                {copied ? '✓ تم النسخ' : 'نسخ'}
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}
