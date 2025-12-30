import { useState } from 'react'
import { 
  FieldVerification, 
  VerificationStatus
} from '@/lib/types/verification'
import { 
  getVerificationsForCandidate,
  getAuditLogsForVerification
} from '@/lib/sample-data/verification'

export function useVerification(candidateId: string) {
  const [verifications, setVerifications] = useState<FieldVerification[]>(
    () => getVerificationsForCandidate(candidateId)
  )
  
  const verifyField = (
    fieldName: string, 
    status: VerificationStatus, 
    notes?: string
  ) => {
    // Mock: Update local state (in real app, this would call API)
    setVerifications(prev => prev.map(v => 
      v.fieldName === fieldName 
        ? { 
            ...v, 
            status, 
            notes: notes || v.notes,
            verifiedBy: 'user-002', // Current user
            verifiedAt: new Date(),
            updatedAt: new Date()
          }
        : v
    ))
    console.log(`Verified ${fieldName} as ${status}`, { notes })
  }
  
  const updateFieldValue = (fieldName: string, newValue: string) => {
    setVerifications(prev => prev.map(v =>
      v.fieldName === fieldName
        ? { ...v, currentValue: newValue, updatedAt: new Date() }
        : v
    ))
    console.log(`Updated ${fieldName} to ${newValue}`)
  }
  
  const getFieldVerification = (fieldName: string): FieldVerification | undefined => {
    return verifications.find(v => v.fieldName === fieldName)
  }
  
  const getFieldHistory = (fieldName: string) => {
    const verification = getFieldVerification(fieldName)
    if (!verification) return []
    return getAuditLogsForVerification(verification.id)
  }
  
  return {
    verifications,
    verifyField,
    updateFieldValue,
    getFieldVerification,
    getFieldHistory
  }
}
