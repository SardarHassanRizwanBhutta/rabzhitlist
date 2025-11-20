export interface Certification {
  id: string
  certificationName: string
  issuingBody: string
  certificationLevel: CertificationLevel
  createdAt: Date
  updatedAt: Date
}

export type CertificationLevel = 
  | "Foundation"
  | "Associate" 
  | "Professional"
  | "Expert"
  | "Master"

export interface CertificationTableColumn {
  id: keyof Certification | 'actions'
  label: string
  sortable?: boolean
  priority: 'high' | 'medium' | 'low'
  responsive: {
    desktop: boolean
    tablet: boolean
    mobile: boolean
  }
}

export const CERTIFICATION_LEVEL_COLORS: Record<CertificationLevel, string> = {
  Foundation: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  Associate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Professional: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Expert: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Master: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
}

export const CERTIFICATION_LEVEL_LABELS: Record<CertificationLevel, string> = {
  Foundation: "Foundation",
  Associate: "Associate",
  Professional: "Professional", 
  Expert: "Expert",
  Master: "Master"
}
