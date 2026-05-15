import type { Industry, Role } from './types'

export const INDUSTRY_LABELS: Record<Industry, string> = {
  'Tech/SaaS': 'تقنية / SaaS',
  'Oil & Gas': 'النفط والغاز',
  'Petrochemical': 'البتروكيماويات',
  'Banking/Fintech': 'البنوك والتقنية المالية',
  'Healthcare': 'الرعاية الصحية',
  'Government': 'القطاع الحكومي',
  'Telecom': 'الاتصالات',
  'Retail': 'التجزئة',
  'Logistics': 'اللوجستيات',
  'Consulting': 'الاستشارات',
  'Manufacturing': 'التصنيع',
  'Aviation': 'الطيران',
}

export const ROLE_LABELS: Record<Role, string> = {
  'Backend': 'تطوير الخلفية',
  'Frontend': 'تطوير الواجهات',
  'Data/BI': 'البيانات وذكاء الأعمال',
  'Cybersecurity': 'الأمن السيبراني',
  'DevOps': 'DevOps',
  'IT Support': 'الدعم الفني',
  'Business Analyst': 'محلل أعمال',
  'Product': 'إدارة المنتج',
  'QA': 'ضمان الجودة',
  'ERP/SAP': 'أنظمة ERP / SAP',
  'Mobile': 'تطبيقات الجوال',
  'AI/ML': 'الذكاء الاصطناعي',
}

export const CITY_LABELS: Record<string, string> = {
  'Dammam/Khobar': 'الدمام / الخبر',
  'Riyadh': 'الرياض',
  'Jeddah': 'جدة',
  'Makkah': 'مكة المكرمة',
  'Madinah': 'المدينة المنورة',
  'Eastern Province (other)': 'المنطقة الشرقية (أخرى)',
  'Remote': 'عن بُعد',
  'Any': 'أي مدينة',
}

export const LANGUAGE_LABELS: Record<string, string> = {
  'Arabic': 'العربية',
  'English': 'الإنجليزية',
  'French': 'الفرنسية',
  'Urdu': 'الأردية',
  'Hindi': 'الهندية',
  'Other': 'أخرى',
}

export const SIZE_LABELS: Record<string, string> = {
  'Startup': 'شركة ناشئة',
  'Scaleup': 'شركة متوسطة',
  'Enterprise': 'شركة كبرى',
}

export function labelOf(value: string, map: Record<string, string>): string {
  return map[value] ?? value
}
