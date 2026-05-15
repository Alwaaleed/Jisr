import { useState } from 'react'
import ProfileForm from './components/ProfileForm'
import ResultCard from './components/ResultCard'
import { findMatches } from './api'
import type { StudentProfile, CompanyMatch } from './types'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<CompanyMatch[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submittedProfile, setSubmittedProfile] = useState<StudentProfile | null>(null)

  async function handleSubmit(profile: StudentProfile) {
    setLoading(true)
    setError(null)
    setMatches(null)
    setSubmittedProfile(profile)
    try {
      const results = await findMatches(profile)
      setMatches(results)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ غير معروف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-kfu-50 via-white to-white">
      <header className="border-b border-kfu-100 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-kfu-800 tracking-tight">باحث التدريب التعاوني</h1>
            <p className="text-xs sm:text-sm text-gray-500">مُطابقتك مع شركات سعودية تناسب ملفك الشخصي.</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-kfu-50 px-3 py-1 text-xs font-medium text-kfu-700 ring-1 ring-kfu-100">
            <span className="h-2 w-2 rounded-full bg-kfu-500 animate-pulse" />
            مُطابق ذكي
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {!matches && !loading && <ProfileForm onSubmit={handleSubmit} />}

        {loading && (
          <div className="mt-16 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-kfu-200 border-t-kfu-600" />
            <p className="mt-4 text-gray-600">جارٍ البحث عن الشركات المناسبة…</p>
            <p className="mt-1 text-xs text-gray-400">تعمل المعالجة محليًا على جهازك، وقد تستغرق بضع ثوانٍ.</p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {matches && submittedProfile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                تم العثور على {matches.length} {matches.length === 1 ? 'شركة' : 'شركة'}
              </h2>
              <button
                onClick={() => setMatches(null)}
                className="text-sm font-medium text-kfu-700 hover:text-kfu-900"
              >
                تعديل الملف الشخصي →
              </button>
            </div>
            {matches.length === 0 && (
              <p className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
                لا توجد نتائج بعد. جرّب توسيع نطاق القطاعات أو المدن.
              </p>
            )}
            {matches.map((m, i) => <ResultCard key={i} match={m} profile={submittedProfile} />)}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-6 py-8 text-center text-xs text-gray-400">
        مُصمَّم لطلبة جامعة الملك فيصل المتوقع تخرّجهم · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
