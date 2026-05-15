import { useState, FormEvent, KeyboardEvent, ReactNode } from 'react'
import type { StudentProfile, Industry, Role } from '../types'
import {
  INDUSTRY_LABELS, ROLE_LABELS, CITY_LABELS, LANGUAGE_LABELS, labelOf,
} from '../labels'

const INDUSTRIES: Industry[] = [
  'Tech/SaaS', 'Oil & Gas', 'Petrochemical', 'Banking/Fintech',
  'Healthcare', 'Government', 'Telecom', 'Retail',
  'Logistics', 'Consulting', 'Manufacturing', 'Aviation',
]

const ROLES: Role[] = [
  'Backend', 'Frontend', 'Data/BI', 'Cybersecurity',
  'DevOps', 'IT Support', 'Business Analyst', 'Product',
  'QA', 'ERP/SAP', 'Mobile', 'AI/ML',
]

const CITIES = [
  'Dammam/Khobar', 'Riyadh', 'Jeddah', 'Makkah', 'Madinah',
  'Eastern Province (other)', 'Remote', 'Any',
]

const LANGUAGES = ['Arabic', 'English', 'French', 'Urdu', 'Hindi', 'Other']

const SUGGESTED_SKILLS = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'SQL', 'AWS', 'Azure', 'Docker', 'Linux', 'Git',
  'Power BI', 'Tableau', 'SAP', 'Networking', 'Machine Learning',
]

interface Props {
  onSubmit: (profile: StudentProfile) => void
}

export default function ProfileForm({ onSubmit }: Props) {
  const [major, setMajor] = useState('')
  const [industries, setIndustries] = useState<Industry[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(['Arabic', 'English'])
  const [cities, setCities] = useState<string[]>([])
  const [dreamCompanies, setDreamCompanies] = useState('')

  function toggle<T>(value: T, list: T[], setList: (l: T[]) => void) {
    setList(list.includes(value) ? list.filter(x => x !== value) : [...list, value])
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      major,
      industries, roles,
      skills, languages,
      cities,
      dreamCompanies,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="تخصصك" subtitle="لتحديد طبيعة الأدوار المناسبة لك.">
        <Field label="التخصص">
          <input
            className={inputCls}
            value={major}
            onChange={e => setMajor(e.target.value)}
            placeholder="مثال: علوم الحاسب"
            required
          />
        </Field>
      </Section>

      <Section title="ما الذي يستهويك؟" subtitle="اختر القطاعات والأدوار التي ترغب بالعمل فيها. يمكنك اختيار أكثر من واحد.">
        <Label>القطاعات المستهدفة</Label>
        <ChipGroup
          options={INDUSTRIES}
          selected={industries}
          onToggle={v => toggle(v, industries, setIndustries)}
          getLabel={v => labelOf(v, INDUSTRY_LABELS)}
        />

        <Label className="mt-6">الأدوار المستهدفة</Label>
        <ChipGroup
          options={ROLES}
          selected={roles}
          onToggle={v => toggle(v, roles, setRoles)}
          getLabel={v => labelOf(v, ROLE_LABELS)}
        />
      </Section>

      <Section title="المهارات واللغات">
        <Label>المهارات التقنية</Label>
        <TagInput
          tags={skills}
          onChange={setSkills}
          suggestions={SUGGESTED_SKILLS}
          placeholder="اكتب مهارة ثم اضغط Enter"
        />

        <Label className="mt-6">اللغات</Label>
        <ChipGroup
          options={LANGUAGES}
          selected={languages}
          onToggle={v => toggle(v, languages, setLanguages)}
          getLabel={v => labelOf(v, LANGUAGE_LABELS)}
        />
      </Section>

      <Section title="الموقع">
        <Label>المدن المفضلة</Label>
        <ChipGroup
          options={CITIES}
          selected={cities}
          onToggle={v => toggle(v, cities, setCities)}
          getLabel={v => labelOf(v, CITY_LABELS)}
        />
      </Section>

      <Section
        title="شركات الأحلام"
        subtitle="اختياري — شركات تتمنى العمل بها. سنعطيها أولوية إذا كانت ضمن النتائج."
      >
        <input
          className={inputCls}
          value={dreamCompanies}
          onChange={e => setDreamCompanies(e.target.value)}
          placeholder="أرامكو، سابك، STC، تابي…"
        />
      </Section>

      <div className="flex justify-start">
        <button
          type="submit"
          className="rounded-lg bg-kfu-700 px-6 py-3 text-white font-medium shadow-sm hover:bg-kfu-800 active:bg-kfu-900 transition"
        >
          ← ابحث عن التطابقات
        </button>
      </div>
    </form>
  )
}

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-kfu-500 focus:outline-none focus:ring-2 focus:ring-kfu-100'

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`text-sm font-medium text-gray-700 mb-2 ${className}`}>{children}</div>
}

function ChipGroup<T extends string>({ options, selected, onToggle, getLabel }: {
  options: T[]
  selected: T[]
  onToggle: (v: T) => void
  getLabel?: (v: T) => string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={
              'rounded-full px-3 py-1.5 text-sm transition ' +
              (active
                ? 'bg-kfu-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
            }
          >
            {getLabel ? getLabel(opt) : opt}
          </button>
        )
      })}
    </div>
  )
}

function TagInput({ tags, onChange, suggestions = [], placeholder }: {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function add(raw: string) {
    const t = raw.trim()
    if (!t) return
    if (tags.some(x => x.toLowerCase() === t.toLowerCase())) return
    onChange([...tags, t])
    setInput('')
  }

  function remove(tag: string) {
    onChange(tags.filter(x => x !== tag))
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      remove(tags[tags.length - 1])
    }
  }

  const unusedSuggestions = suggestions.filter(
    s => !tags.some(t => t.toLowerCase() === s.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm focus-within:border-kfu-500 focus-within:ring-2 focus-within:ring-kfu-100">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-kfu-600 px-2.5 py-1 text-xs font-medium text-white">
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="hover:text-kfu-100"
              aria-label={`إزالة ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[140px] border-0 bg-transparent px-1 py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => add(input)}
          placeholder={placeholder}
        />
      </div>

      {unusedSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 self-center">اقتراحات:</span>
          {unusedSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-kfu-50 hover:text-kfu-700 transition"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
