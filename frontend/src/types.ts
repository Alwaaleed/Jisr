export type Industry =
  | 'Tech/SaaS' | 'Oil & Gas' | 'Petrochemical' | 'Banking/Fintech'
  | 'Healthcare' | 'Government' | 'Telecom' | 'Retail'
  | 'Logistics' | 'Consulting' | 'Manufacturing' | 'Aviation'

export type Role =
  | 'Backend' | 'Frontend' | 'Data/BI' | 'Cybersecurity'
  | 'DevOps' | 'IT Support' | 'Business Analyst' | 'Product'
  | 'QA' | 'ERP/SAP' | 'Mobile' | 'AI/ML'

export interface StudentProfile {
  major: string
  industries: Industry[]
  roles: Role[]
  skills: string[]
  languages: string[]
  cities: string[]
  dreamCompanies: string
}

export interface CompanyMatch {
  company: string
  industry: string
  size: string
  role: string
  location: string
  fitScore: number
  reasoning: string
  applyUrl: string
  publicContact: string | null
  coverLetter: string
}
