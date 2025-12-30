import { 
  FieldVerification, 
  VerificationAuditLog, 
  VerificationUser,
  CandidateVerificationSummary,
  ProjectVerificationSummary
} from "@/lib/types/verification"
  
  // Mock users who perform verifications
  export const sampleVerificationUsers: VerificationUser[] = [
    { id: "user-001", name: "System", role: "system", email: "system@app.com" },
    { id: "user-002", name: "Sarah Ahmed (HR)", role: "hr", email: "sarah@company.com" },
    { id: "user-003", name: "John Manager", role: "manager", email: "john@company.com" },
    { id: "user-004", name: "Admin User", role: "admin", email: "admin@company.com" },
  ]
  
  // Field verifications for candidates (simulates candidate_field_verifications table)
  export const sampleFieldVerifications: FieldVerification[] = [
    // Candidate 1: Umais Rasheed - Mostly verified (resume_parse source)
    {
      id: "verif-001",
      entityId: "1",
      entityType: "candidate",
      candidateId: "1",
      fieldName: "name",
      currentValue: "Umais Rasheed",
      status: "verified",
      source: "resume_parse",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-16"),
      notes: "Verified against CNIC",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-16")
    },
    {
      id: "verif-002",
      entityId: "1",
      entityType: "candidate",
      candidateId: "1",
      fieldName: "email",
      currentValue: "mianumais1997@gmail.com",
      status: "verified",
      source: "resume_parse",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-16"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-16")
    },
    {
      id: "verif-003",
      entityId: "1",
      entityType: "candidate",
      candidateId: "1",
      fieldName: "mobileNo",
      currentValue: "0321-6781277",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-16"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-16")
    },
    {
      id: "verif-004",
      entityId: "1",
      entityType: "candidate",
      candidateId: "1",
      fieldName: "cnic",
      currentValue: "61101-83552611",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-003",
      verifiedAt: new Date("2024-01-17"),
      notes: "Verified with ID copy",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-17")
    },
    {
      id: "verif-005",
      entityId: "1",
      entityType: "candidate",
      candidateId: "1",
      fieldName: "currentSalary",
      currentValue: "1050000",
      status: "unverified",
      source: "resume_parse",
      notes: "Needs manual verification",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15")
    },
    {
      id: "verif-006",
      entityId: "1",
      entityType: "candidate",
      candidateId: "1",
      fieldName: "expectedSalary",
      currentValue: "1100000",
      status: "unverified",
      source: "resume_parse",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15")
    },
    {
      id: "verif-007",
      entityId: "1",
      entityType: "candidate",
      candidateId: "1",
      fieldName: "city",
      currentValue: "Islamabad",
      status: "verified",
      source: "resume_parse",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-16"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-16")
    },
    
    // Candidate 2: Abdul Rehman - Mixed verification status
    {
      id: "verif-008",
      entityId: "2",
      entityType: "candidate",
      candidateId: "2",
      fieldName: "name",
      currentValue: "Abdul Rehman",
      status: "verified",
      source: "zoho",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-20"),
      createdAt: new Date("2024-01-18"),
      updatedAt: new Date("2024-01-20")
    },
    {
      id: "verif-009",
      entityId: "2",
      entityType: "candidate",
      candidateId: "2",
      fieldName: "email",
      currentValue: "abdulrehman6149@gmail.com",
      status: "unverified",
      source: "zoho",
      createdAt: new Date("2024-01-18"),
      updatedAt: new Date("2024-01-18")
    },
    {
      id: "verif-010",
      entityId: "2",
      entityType: "candidate",
      candidateId: "2",
      fieldName: "mobileNo",
      currentValue: "0316-7655438",
      status: "unverified",
      source: "zoho",
      notes: "Conflicting values from resume and Zoho",
      createdAt: new Date("2024-01-18"),
      updatedAt: new Date("2024-01-19")
    },
    {
      id: "verif-011",
      entityId: "2",
      entityType: "candidate",
      candidateId: "2",
      fieldName: "currentSalary",
      currentValue: null,
      status: "unverified",
      source: "zoho",
      createdAt: new Date("2024-01-18"),
      updatedAt: new Date("2024-01-18")
    },
    
    // Add verifications for candidates 3-5 with varying statuses...
    // Candidate 3: Muhammad Ahmad - mostly unverified (new import)
    {
      id: "verif-012",
      entityId: "3",
      entityType: "candidate",
      candidateId: "3",
      fieldName: "name",
      currentValue: "Muhammad Ahmad",
      status: "verified",
      source: "linkedin",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01")
    },
    {
      id: "verif-013",
      entityId: "3",
      entityType: "candidate",
      candidateId: "3",
      fieldName: "email",
      currentValue: "ahmad@example.com",
      status: "unverified",
      source: "linkedin",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01")
    },
    {
      id: "verif-014",
      entityId: "3",
      entityType: "candidate",
      candidateId: "3",
      fieldName: "currentSalary",
      currentValue: "850000",
      status: "unverified",
      source: "resume_parse",
      notes: "Needs manual verification",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01")
    },
  ]

  // Field verifications for projects (simulates project_field_verifications table)
  export const sampleProjectFieldVerifications: FieldVerification[] = [
    // Project 1: Miracle Morning Routine - Mostly verified
    {
      id: "proj-verif-001",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "projectName",
      currentValue: "Miracle Morning Routine",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-003",
      verifiedAt: new Date("2024-01-20"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20")
    },
    {
      id: "proj-verif-002",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "projectType",
      currentValue: "Employer",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-003",
      verifiedAt: new Date("2024-01-20"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20")
    },
    {
      id: "proj-verif-003",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "teamSize",
      currentValue: "5",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-21"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-21")
    },
    {
      id: "proj-verif-004",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "status",
      currentValue: "Development",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-003",
      verifiedAt: new Date("2024-01-20"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20")
    },
    {
      id: "proj-verif-005",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "techStacks",
      currentValue: "react native, express.js, node.js, aws, sql, nextjs, react",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-22"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-22")
    },
    {
      id: "proj-verif-006",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "verticalDomains",
      currentValue: "Sports & Fitness, Healthcare",
      status: "unverified",
      source: "manual_entry",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15")
    },
    {
      id: "proj-verif-007",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "horizontalDomains",
      currentValue: "Mobile Application, Workflow Automation, Communication & Collaboration",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-003",
      verifiedAt: new Date("2024-01-23"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-23")
    },
    {
      id: "proj-verif-008",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "technicalAspects",
      currentValue: "REST APIs, Authentication/Authorization, Caching, Logging & Monitoring, CI/CD",
      status: "unverified",
      source: "manual_entry",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15")
    },
    {
      id: "proj-verif-009",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "startDate",
      currentValue: "2023-06-01",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-003",
      verifiedAt: new Date("2024-01-20"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20")
    },
    {
      id: "proj-verif-010",
      entityId: "proj-001",
      entityType: "project",
      fieldName: "description",
      currentValue: null,
      status: "unverified",
      source: "manual_entry",
      notes: "Description needs to be added",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15")
    },

    // Project 2: Pause Breathe Reflect - Mixed verification
    {
      id: "proj-verif-011",
      entityId: "proj-002",
      entityType: "project",
      fieldName: "projectName",
      currentValue: "Pause Breathe Reflect",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-25"),
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-25")
    },
    {
      id: "proj-verif-012",
      entityId: "proj-002",
      entityType: "project",
      fieldName: "projectType",
      currentValue: "Employer",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-25"),
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-25")
    },
    {
      id: "proj-verif-013",
      entityId: "proj-002",
      entityType: "project",
      fieldName: "teamSize",
      currentValue: null,
      status: "unverified",
      source: "manual_entry",
      notes: "Team size not specified",
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-20")
    },
    {
      id: "proj-verif-014",
      entityId: "proj-002",
      entityType: "project",
      fieldName: "status",
      currentValue: "Development",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-003",
      verifiedAt: new Date("2024-01-26"),
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-26")
    },
    {
      id: "proj-verif-015",
      entityId: "proj-002",
      entityType: "project",
      fieldName: "techStacks",
      currentValue: "React Native, Node.js, AWS, PostgreSQL",
      status: "unverified",
      source: "manual_entry",
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-20")
    },
    {
      id: "proj-verif-016",
      entityId: "proj-002",
      entityType: "project",
      fieldName: "verticalDomains",
      currentValue: "Healthcare, Sports & Fitness",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-002",
      verifiedAt: new Date("2024-01-27"),
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-27")
    },

    // Project 3: Parsley - Mostly unverified (new project)
    {
      id: "proj-verif-017",
      entityId: "proj-003",
      entityType: "project",
      fieldName: "projectName",
      currentValue: "Parsley",
      status: "verified",
      source: "manual_entry",
      verifiedBy: "user-003",
      verifiedAt: new Date("2024-02-05"),
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-05")
    },
    {
      id: "proj-verif-018",
      entityId: "proj-003",
      entityType: "project",
      fieldName: "projectType",
      currentValue: "Employer",
      status: "unverified",
      source: "manual_entry",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01")
    },
    {
      id: "proj-verif-019",
      entityId: "proj-003",
      entityType: "project",
      fieldName: "techStacks",
      currentValue: null,
      status: "unverified",
      source: "manual_entry",
      notes: "Tech stack needs verification",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01")
    },
    {
      id: "proj-verif-020",
      entityId: "proj-003",
      entityType: "project",
      fieldName: "status",
      currentValue: "Development",
      status: "unverified",
      source: "manual_entry",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01")
    },
  ]

  // Project verification audit logs
  export const sampleProjectVerificationAuditLogs: VerificationAuditLog[] = [
    {
      id: "proj-audit-001",
      verificationId: "proj-verif-001",
      action: "status_change",
      oldStatus: undefined,
      newStatus: "unverified",
      oldValue: undefined,
      newValue: "Miracle Morning Routine",
      changedBy: "user-001",
      changedByName: "System",
      changedAt: new Date("2024-01-15T10:00:00"),
      reason: "Initial project creation"
    },
    {
      id: "proj-audit-002",
      verificationId: "proj-verif-001",
      action: "status_change",
      oldStatus: "unverified",
      newStatus: "verified",
      changedBy: "user-003",
      changedByName: "John Manager",
      changedAt: new Date("2024-01-20T14:30:00"),
      reason: "Verified project name with client documentation"
    },
    {
      id: "proj-audit-003",
      verificationId: "proj-verif-005",
      action: "status_change",
      oldStatus: undefined,
      newStatus: "unverified",
      oldValue: undefined,
      newValue: "react native, node.js",
      changedBy: "user-001",
      changedByName: "System",
      changedAt: new Date("2024-01-15T10:00:00"),
      reason: "Initial tech stack entry"
    },
    {
      id: "proj-audit-004",
      verificationId: "proj-verif-005",
      action: "value_update",
      oldValue: "react native, node.js",
      newValue: "react native, express.js, node.js, aws, sql, nextjs, react",
      changedBy: "user-002",
      changedByName: "Sarah Ahmed (HR)",
      changedAt: new Date("2024-01-22T09:15:00"),
      reason: "Updated tech stack based on project documentation"
    },
    {
      id: "proj-audit-005",
      verificationId: "proj-verif-005",
      action: "status_change",
      oldStatus: "unverified",
      newStatus: "verified",
      changedBy: "user-002",
      changedByName: "Sarah Ahmed (HR)",
      changedAt: new Date("2024-01-22T09:20:00"),
      reason: "Tech stack verified with development team"
    },
  ]
  
  // Audit log entries (simulates verification_audit_log table)
  export const sampleVerificationAuditLogs: VerificationAuditLog[] = [
    // Candidate 1 - currentSalary history (shows multiple changes)
    {
      id: "audit-001",
      verificationId: "verif-005",
      action: "status_change",
      oldStatus: undefined,
      newStatus: "unverified",
      oldValue: undefined,
      newValue: "55000",
      changedBy: "user-001",
      changedByName: "System",
      changedAt: new Date("2024-01-15T10:00:00"),
      reason: "Initial import from resume parse"
    },
    {
      id: "audit-002",
      verificationId: "verif-005",
      action: "value_update",
      oldStatus: "unverified",
      newStatus: "unverified",
      oldValue: "55000",
      newValue: "1050000",
      changedBy: "user-002",
      changedByName: "Sarah Ahmed (HR)",
      changedAt: new Date("2024-01-16T14:30:00"),
      reason: "Corrected based on offer letter - value was in wrong format"
    },
    
    // Candidate 1 - name verification history
    {
      id: "audit-003",
      verificationId: "verif-001",
      action: "status_change",
      oldStatus: undefined,
      newStatus: "unverified",
      oldValue: undefined,
      newValue: "Umais Rasheed",
      changedBy: "user-001",
      changedByName: "System",
      changedAt: new Date("2024-01-15T10:00:00"),
      reason: "Initial import from resume parse"
    },
    {
      id: "audit-004",
      verificationId: "verif-001",
      action: "status_change",
      oldStatus: "unverified",
      newStatus: "verified",
      oldValue: "Umais Rasheed",
      newValue: "Umais Rasheed",
      changedBy: "user-002",
      changedByName: "Sarah Ahmed (HR)",
      changedAt: new Date("2024-01-16T09:15:00"),
      reason: "Verified against CNIC document"
    },
    
    // Candidate 2 - disputed mobile number history
    {
      id: "audit-005",
      verificationId: "verif-010",
      action: "status_change",
      oldStatus: undefined,
      newStatus: "unverified",
      oldValue: undefined,
      newValue: "0316-7655438",
      changedBy: "user-001",
      changedByName: "System",
      changedAt: new Date("2024-01-18T11:00:00"),
      reason: "Imported from Zoho CRM"
    },
    {
      id: "audit-006",
      verificationId: "verif-010",
      action: "status_change",
      oldStatus: "unverified",
      newStatus: "unverified",
      changedBy: "user-002",
      changedByName: "Sarah Ahmed (HR)",
      changedAt: new Date("2024-01-19T16:45:00"),
      reason: "Resume shows different number: 0300-1234567"
    },
  ]
  
  // Helper function to get verifications for a candidate
  export function getVerificationsForCandidate(candidateId: string): FieldVerification[] {
    return sampleFieldVerifications.filter(v => v.entityId === candidateId || v.candidateId === candidateId)
  }
  
  // Helper function to get verifications for a project
  export function getVerificationsForProject(projectId: string): FieldVerification[] {
    return sampleProjectFieldVerifications.filter(v => v.entityId === projectId)
  }
  
  // Helper function to get audit logs for a verification (candidates)
  export function getAuditLogsForVerification(verificationId: string): VerificationAuditLog[] {
    return sampleVerificationAuditLogs
      .filter(log => log.verificationId === verificationId)
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime()) // Newest first
  }
  
  // Helper function to get audit logs for a project verification
  export function getProjectAuditLogsForVerification(verificationId: string): VerificationAuditLog[] {
    return sampleProjectVerificationAuditLogs
      .filter(log => log.verificationId === verificationId)
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime()) // Newest first
  }
  
  // Helper function to calculate candidate verification summary
  export function calculateVerificationSummary(candidateId: string): CandidateVerificationSummary {
    const verifications = getVerificationsForCandidate(candidateId)
    const totalFields = verifications.length || 7 // Default trackable fields
    const verifiedFields = verifications.filter(v => v.status === 'verified').length
    const unverifiedFields = verifications.filter(v => v.status === 'unverified').length
    
    const lastVerified = verifications
      .filter(v => v.verifiedAt)
      .sort((a, b) => (b.verifiedAt?.getTime() || 0) - (a.verifiedAt?.getTime() || 0))[0]
    
    return {
      candidateId,
      totalFields,
      verifiedFields,
      unverifiedFields,
      verificationPercentage: totalFields > 0 ? Math.round((verifiedFields / totalFields) * 100) : 0,
      lastVerifiedAt: lastVerified?.verifiedAt,
      lastVerifiedBy: lastVerified?.verifiedBy
    }
  }

  // Helper function to calculate project verification summary
  export function calculateProjectVerificationSummary(projectId: string): ProjectVerificationSummary {
    const verifications = getVerificationsForProject(projectId)
    const totalFields = verifications.length || 10 // Default trackable project fields
    const verifiedFields = verifications.filter(v => v.status === 'verified').length
    const unverifiedFields = verifications.filter(v => v.status === 'unverified').length
    
    const lastVerified = verifications
      .filter(v => v.verifiedAt)
      .sort((a, b) => (b.verifiedAt?.getTime() || 0) - (a.verifiedAt?.getTime() || 0))[0]
    
    return {
      projectId,
      totalFields,
      verifiedFields,
      unverifiedFields,
      verificationPercentage: totalFields > 0 ? Math.round((verifiedFields / totalFields) * 100) : 0,
      lastVerifiedAt: lastVerified?.verifiedAt,
      lastVerifiedBy: lastVerified?.verifiedBy
    }
  }
 