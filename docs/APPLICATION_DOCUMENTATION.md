# Recruitment & HR Application - Complete Documentation

## 1. Basic Overview of the Application

This application is a comprehensive **Recruitment and HR Management System** designed for internal use within an organization to identify, evaluate, and onboard the right candidates. The system serves as a centralized platform for managing candidate profiles, tracking their skills, work experiences, education, certifications, and achievements.

### Key Objectives:
- **Candidate Discovery**: Find candidates based on complex criteria including skills, experience, education, personality types, and culture fit
- **Data Verification**: Maintain data integrity through a comprehensive verification system that tracks data sources and verification status
- **Relationship Mapping**: Track relationships between candidates, employers, projects, universities, and certifications
- **AI-Powered Interactions**: Generate context-aware questions for different interaction modes (Cold Caller, Interviewer, L1, L2) using LLM-based AI
- **Advanced Filtering**: Support 50+ filter criteria for candidates, enabling precise talent searches
- **Data Completeness Tracking**: Monitor and report on data completion percentages for candidate profiles

### Technology Stack (Frontend):
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useMemo, useCallback)

---

## 2. Modules/Tables and Their Purposes

### 2.1 Candidates Module
**Purpose**: Central entity storing all candidate information including personal details, work history, education, certifications, achievements, and skills.

**Key Data Points**:
- Personal information (name, email, phone, CNIC, city)
- Career information (posting title, current/expected salary, status)
- Professional links (GitHub, LinkedIn)
- Work experiences (multiple entries with nested projects)
- Education history (multiple entries)
- Certifications (multiple entries)
- Standalone projects (multiple entries, not tied to work experience)
- Achievements/Competitions (multiple entries)
- Tech stacks (overall skills)
- Personality type (e.g., ESTJ, INTJ)
- Top developer flag
- Source of candidate
- Resume file

**Status Types**: active, pending, interviewed, shortlisted, hired, rejected, withdrawn

### 2.2 Employers Module
**Purpose**: Store information about companies/organizations where candidates have worked or may work.

**Key Data Points**:
- Basic info (name, website, LinkedIn, founded year)
- Status (Active, Flagged, Closed)
- Ranking (Top, Standard, DPL Favourite)
- Type (Services Based, Product Based, SAAS, Startup, Integrator, Resource Augmentation)
- Locations (multiple locations with size, salary policy, country, city)
- Tech stacks used by the employer
- Benefits offered
- Layoff history
- DPL Competitive flag
- Average job tenure
- Tags

**Relationships**: 
- One-to-many with Employer Locations
- One-to-many with Layoffs
- Many-to-many with Tech Stacks (via junction table)
- Many-to-many with Benefits (via junction table)

### 2.3 Projects Module
**Purpose**: Store project information that candidates have worked on (could be tied, or not tied to specific work experience).

**Key Data Points**:
- Project name
- Employer name (optional - if project is associated with an employer)
- Client location
- Tech stacks
- Vertical domains (e.g., Healthcare, E-commerce)
- Horizontal domains (e.g., Mobile Application, Workflow Automation)
- Technical aspects (e.g., REST APIs, Authentication, CI/CD)
- Team size
- Start/end dates
- Status (Development, Maintenance, Closed)
- Project type (Academic, Freelance, Employer, Personal, Open Source)
- Description and notes
- Project link
- Published status
- Publish platforms (App Store, Play Store, Web, Desktop)
- Download count

**Relationships**:
- Many-to-one with Employer (optional)
- Many-to-many with Tech Stacks
- Many-to-many with Vertical Domains
- Many-to-many with Horizontal Domains
- Many-to-many with Technical Aspects

### 2.4 Universities Module
**Purpose**: Store university information for candidate education tracking.

**Key Data Points**:
- University name
- Country
- Ranking (Top, Standard, DPL Favourite)
- Website and LinkedIn URLs
- Locations (multiple campuses with city, address, main campus flag)

**Relationships**:
- One-to-many with University Locations
- Many-to-many with Candidates (via Education junction table)

### 2.5 Certifications Module
**Purpose**: Master data table for available certifications.

**Key Data Points**:
- Certification name
- Issuing body
- Certification level (Foundation, Associate, Professional, Expert, Master)

**Relationships**:
- Many-to-many with Candidates (via Candidate Certifications junction table)

### 2.6 Verification Module
**Purpose**: Track verification status and history for all data fields across candidates, projects, employers, universities, and certifications.

**Key Components**:
- **Field Verifications**: Track verification status per field
- **Verification Audit Logs**: Complete history of verification changes
- **Conflicting Sources**: Track when multiple sources provide different values

**Key Data Points**:
- Entity ID and type (candidate or project)
- Field name and path (supports nested fields like `workExperiences[0].jobTitle`)
- Current value
- Verification status (verified, unverified)
- Data source (zoho recruit apis, resume_parse, linkedin, manual_entry)
- Verified by (user ID)
- Verification timestamp
- Notes
- Audit trail of all changes

**Relationships**:
- One-to-many with Verification Audit Logs
- One-to-many with Conflicting Sources

### 2.7 Data Integrity Tables
**Purpose**: Master data tables to ensure consistency across the application.

**Tables**:
- **Tech Stacks**: Standardized list of technologies (e.g., React, Node.js, AWS)
- **Vertical Domains**: Industry verticals (e.g., Healthcare, E-commerce, Finance)
- **Horizontal Domains**: Functional domains (e.g., Mobile Application, Workflow Automation)
- **Technical Aspects**: Technical capabilities (e.g., REST APIs, Microservices, CI/CD)
- **Benefits**: Employee benefits (e.g., Health Insurance, Gym Passport, IPD)
- **Shift Types**: Morning, Evening, Night, Rotational, 24x7
- **Work Modes**: Remote, Onsite, Hybrid
- **Time Support Zones**: US, UK, EU, APAC, MEA
- **Personality Types**: MBTI types (e.g., ESTJ, INTJ, ENFP)
- **Achievement Types**: Competition, Open Source, Award, Medal, Publication, Certification, Recognition, Other
- **Publish Platforms**: App Store, Play Store, Web, Desktop

**Relationships**: All data integrity tables have many-to-many relationships with relevant entities via junction tables.

---

## 3. Filters for Each Module and Their Interconnections

### 3.1 Candidate Filters (50+ Filter Criteria)

#### Basic Information Filters:
- **basicInfoSearch**: Global search across name, email, phone, CNIC
- **postingTitle**: Filter by job posting title
- **cities**: Filter by candidate city
- **excludeCities**: Exclude candidates from specific cities
- **status**: Filter by candidate status (active, pending, interviewed, shortlisted, hired, rejected, withdrawn)
- **currentSalaryMin/Max**: Salary range filter
- **expectedSalaryMin/Max**: Expected salary range filter
- **source**: Filter by candidate source (e.g., Referral, DPL Employee)
- **personalityTypes**: Filter by personality types (e.g., ESTJ, INTJ)

#### Work Experience Filters:
- **employers**: Filter by employer names
- **jobTitle**: Filter by job title
- **yearsOfExperienceMin/Max**: Total years of experience
- **avgJobTenureMin/Max**: Average job tenure across all employers
- **isCurrentlyWorking**: Filter currently working vs. not working candidates
- **candidateTechStacks**: Filter by tech stacks used in work experience
  - **candidateTechStacksRequireAll**: AND logic (all) vs OR logic (any)
  - **candidateTechStacksRequireInBoth**: Require in both work experience AND projects
- **techStackMinYears**: Minimum years of experience for specific tech stacks
- **candidateDomains**: Filter by domains worked in
- **shiftTypes**: Filter by shift types (Morning, Evening, Night, etc.)
- **workModes**: Filter by work modes (Remote, Onsite, Hybrid)
- **workModeMinYears**: Minimum years of experience in specific work modes
- **timeSupportZones**: Filter by time zones supported

#### Project-Related Filters (Linked to Projects Module):
- **projects**: Filter by project names
- **projectStatus**: Filter by project status (Development, Maintenance, Closed)
- **projectTypes**: Filter by project type (Academic, Freelance, Employer, Personal, Open Source)
- **techStacks**: Filter by tech stacks used in projects
- **verticalDomains**: Filter by vertical domains in projects
- **horizontalDomains**: Filter by horizontal domains in projects
- **technicalAspects**: Filter by technical aspects in projects
- **clientLocations**: Filter by client locations in projects
- **minClientLocationCount**: Minimum number of unique client locations
- **startDateStart/End**: Filter by project start date range
- **projectTeamSizeMin/Max**: Filter by project team size
- **hasPublishedProject**: Filter candidates with published projects
- **publishPlatforms**: Filter by publish platforms (App Store, Play Store, etc.)
- **minProjectDownloadCount**: Minimum download count for projects

#### Employer-Related Filters (Linked to Employers Module):
- **employerStatus**: Filter by employer status (Active, Flagged, Closed)
- **employerCountries**: Filter by employer countries
- **employerCities**: Filter by employer cities
- **employerTypes**: Filter by employer types (Services Based, Product Based, etc.)
- **employerSalaryPolicies**: Filter by salary policies (Standard, Tax Free, Remittance)
- **employerSizeMin/Max**: Filter by employer size
- **employerRankings**: Filter by employer rankings (Top, Standard, DPL Favourite)
- **careerTransitionFromType/ToType**: Find candidates who transitioned between employer types
- **workedWithTopDeveloper**: Filter candidates who worked with top developers

#### University-Related Filters (Linked to Universities Module):
- **universities**: Filter by university names
- **universityCountries**: Filter by university countries
- **universityRankings**: Filter by university rankings (Top, Standard, DPL Favourite)
- **universityCities**: Filter by university campus cities
- **degreeNames**: Filter by degree names
- **majorNames**: Filter by major names
- **isTopper**: Filter by topper status
- **isCheetah**: Filter by cheetah status
- **educationEndDateStart/End**: Filter by graduation date range

#### Certification-Related Filters (Linked to Certifications Module):
- **certificationNames**: Filter by certification names
- **certificationIssuingBodies**: Filter by issuing bodies
- **certificationLevels**: Filter by certification levels (Foundation, Associate, Professional, Expert, Master)

#### Achievement Filters:
- **achievementTypes**: Filter by achievement types (Competition, Open Source, Award, etc.)
- **achievementPlatforms**: Filter by achievement platforms (HackerOne, Kaggle, React, etc.)
- **internationalBugBountyOnly**: Filter only international bug bounty platforms

#### Advanced Filters:
- **isTopDeveloper**: Filter by top developer flag
- **hasMutualConnectionWithDPL**: Filter candidates with mutual connections to DPL employees
  - **mutualConnectionToleranceMonths**: Tolerance for date gaps
  - **mutualConnectionType**: Filter by connection type (education, work, both)
- **joinedProjectFromStart**: Filter candidates who joined projects from start
- **verificationPercentageMin/Max**: Filter by verification percentage
- **dataProgressMin/Max**: Filter by data completion percentage

### 3.2 Employer Filters

#### Basic Filters:
- **status**: Filter by employer status
- **foundedYears**: Filter by founded years
- **countries**: Filter by countries
- **cities**: Filter by cities
- **employerTypes**: Filter by employer types
- **salaryPolicies**: Filter by salary policies
- **workModes**: Filter by employer-level work mode (employer row)
- **shiftTypes**: Filter by employer-level shift type (employer row)
- **timeSupportZones**: Filter by employer time-support zone links (`employer_time_support_zones`)
- **sizeMin/Max**: Filter by employer size
- **rankings**: Filter by rankings
- **tags**: Filter by tags
- **isDPLCompetitive**: Filter by DPL Competitive flag

#### Location-Based Filters:
- **minLocationsCount**: Minimum number of locations
- **minCitiesCount**: Minimum number of unique cities
- **employeeCities**: Filter by employee cities
- **employeeCountries**: Filter by employee countries

#### Employee-Based Filters (Linked to Candidates):
- **minApplicants**: Minimum number of applicants/employees
- **employerTechStacks**: Filter by tech stacks used by employees
- **benefits**: Filter by benefits (employer-level and/or candidate work-experience benefits per API)
- **techStackMinCount**: Minimum count of developers with tech stacks

#### Project-Based Filters (Linked to Projects):
- **techStacks**: Filter by project tech stacks
- **projectTechStackMinYears**: Minimum years of experience in project tech stacks
- **verticalDomains**: Filter by vertical domains in projects
- **horizontalDomains**: Filter by horizontal domains in projects
- **technicalAspects**: Filter by technical aspects in projects
- **clientLocations**: Filter by client locations
- **projectStatus**: Filter by project status
- **projectTeamSizeMin/Max**: Filter by project team size
- **hasPublishedProject**: Filter employers with published projects
- **publishPlatforms**: Filter by publish platforms
- **minDownloadCount**: Minimum download count

#### Layoff Filters:
- **layoffDateStart/End**: Filter by layoff date range
- **minLayoffEmployees**: Minimum number of employees laid off

#### Job Tenure Filters:
- **avgJobTenureMin/Max**: Filter by average job tenure

### 3.3 Project Filters

#### Basic Filters:
- **status**: Filter by project status
- **projectTypes**: Filter by project types
- **projectName**: Search by project name
- **projectLink**: Filter by project link

#### Employer-Related Filters (Linked to Employers):
- **employers**: Filter by employer names
- **employerCities**: Filter by employer cities
- **employerCountries**: Filter by employer countries
- **employerTypes**: Filter by employer types

#### Technical Filters:
- **techStacks**: Filter by tech stacks
- **verticalDomains**: Filter by vertical domains
- **horizontalDomains**: Filter by horizontal domains
- **technicalAspects**: Filter by technical aspects
- **clientLocations**: Filter by client locations

#### Date Filters:
- **startDateStart/End**: Filter by start date range
- **completionDateStart/End**: Filter by completion date range
- **startEndDateStart/End**: Filter projects that started AND completed within range

#### Size and Publication Filters:
- **teamSizeMin/Max**: Filter by team size
- **isPublished**: Filter by published status
- **publishPlatforms**: Filter by publish platforms
- **minDownloadCount**: Minimum download count

### 3.4 University Filters

#### Basic Filters:
- **countries**: Filter by countries
- **rankings**: Filter by rankings (Top, Standard, DPL Favourite)
- **cities**: Filter by campus cities

#### Performance Filters (Linked to Candidates):
- **minJobSuccessRatio**: Minimum job success ratio (calculated from candidate data)

### 3.5 Filter Interconnections

**Candidates ↔ Projects**:
- Candidates can be filtered by project attributes (tech stacks, domains, status, etc.)
- Projects can be filtered by employer information
- Projects linked to candidates through work experience projects and standalone projects

**Candidates ↔ Employers**:
- Candidates filtered by employer attributes (status, type, size, ranking, etc.)
- Employers filtered by candidate attributes (tech stacks, work modes, employee locations, etc.)
- Relationship established through work experiences

**Candidates ↔ Universities**:
- Candidates filtered by university attributes (name, country, ranking, city)
- Universities can calculate job success ratios from candidate data
- Relationship established through education entries

**Candidates ↔ Certifications**:
- Candidates filtered by certification attributes (name, issuing body, level)
- Relationship established through candidate certifications

**Employers ↔ Projects**:
- Employers filtered by project attributes (tech stacks, domains, client locations, etc.)
- Projects can be associated with employers
- Relationship helps identify employer capabilities and project portfolios

---

## 4. Data Types

### 4.1 Candidate Type

```typescript
interface Candidate {
  id: string
  name: string
  postingTitle: string | null
  email: string
  mobileNo: string
  cnic: string | null
  currentSalary: number | null
  expectedSalary: number | null
  city: string
  githubUrl?: string | null
  linkedinUrl?: string | null
  source: string
  status: CandidateStatus  // "active" | "pending" | "interviewed" | "shortlisted" | "hired" | "rejected" | "withdrawn"
  resume?: string | null
  workExperiences?: WorkExperience[]
  projects?: CandidateStandaloneProject[]
  certifications?: CandidateCertification[] | null
  educations?: CandidateEducation[]
  techStacks?: string[]
  isTopDeveloper?: boolean | null
  personalityType?: string | null  // e.g., "ESTJ", "INTJ", "ENFP"
  organizationalRoles?: OrganizationalRole[]
  achievements?: Achievement[]
  competitions?: Competition[]  // DEPRECATED
  createdAt: Date
  updatedAt: Date
}
```

### 4.2 CandidateCertification Type

```typescript
interface CandidateCertification {
  id: string
  certificationId: string  // Reference to Certification master data
  certificationName: string
  issueDate: Date | undefined
  expiryDate: Date | undefined
  certificationUrl: string | null
}
```

### 4.3 WorkExperience Type

```typescript
interface WorkExperience {
  id: string
  employerName: string  // Reference to Employer
  jobTitle: string
  projects: ProjectExperience[]  // Nested projects within work experience
  startDate: Date | undefined
  endDate: Date | undefined
  techStacks: string[]  // Array of tech stack names
  domains: string[]  // Array of domain names
  shiftType: ShiftType | "" | null  // "Morning" | "Evening" | "Night" | "Rotational" | "24x7"
  workMode: WorkMode | "" | null  // "Remote" | "Onsite" | "Hybrid"
  timeSupportZones: string[]  // Array of time zones: "US" | "UK" | "EU" | "APAC" | "MEA"
  benefits: EmployerBenefit[]  // Array of benefits with amounts and units
}

interface ProjectExperience {
  id: string
  projectName: string  // Reference to Project or new project name
  contributionNotes: string | null
}

interface EmployerBenefit {
  id: string
  name: string  // e.g., "Health Insurance", "Gym Passport"
  amount: number | null  // null for simple benefits, number for amount-based
  unit: BenefitUnit | null  // "PKR" | "days" | "count" | "percent"
}
```

### 4.4 Additional Related Types

```typescript
interface CandidateEducation {
  id: string
  universityLocationId: string  // Reference to UniversityLocation
  universityLocationName: string
  degreeName: string
  majorName: string
  startMonth: Date | undefined
  endMonth: Date | undefined
  grades: string | null
  isTopper: boolean | null
  isCheetah: boolean | null
}

interface CandidateStandaloneProject {
  id: string
  projectName: string
  contributionNotes: string | null
}

interface Achievement {
  id: string
  name: string
  achievementType: AchievementType  // "Competition" | "Open Source" | "Award" | "Medal" | "Publication" | "Certification" | "Recognition" | "Other"
  ranking?: string
  year?: number
  url?: string
  description?: string
}

interface OrganizationalRole {
  id: string
  organizationName: string
  role: string  // e.g., "CEO", "Board Member", "Advisor"
  startDate?: Date
  endDate?: Date
}
```

---

## 5. Database Relationships (Plain English SQL)

### 5.1 Candidates Relationships

**Candidates → Work Experiences (One-to-Many)**
```sql
-- One candidate can have many work experiences
-- Foreign key: work_experiences.candidate_id → candidates.id
-- Cascade: ON DELETE CASCADE (if candidate deleted, work experiences deleted)
```

**Candidates → Educations (One-to-Many)**
```sql
-- One candidate can have many education entries
-- Foreign key: candidate_educations.candidate_id → candidates.id
-- Cascade: ON DELETE CASCADE
```

**Candidates → Certifications (Many-to-Many via Junction Table)**
```sql
-- One candidate can have many certifications, one certification can belong to many candidates
-- Junction table: candidate_certifications
-- Foreign keys: 
--   candidate_certifications.candidate_id → candidates.id
--   candidate_certifications.certification_id → certifications.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Candidates → Projects (Many-to-Many via Junction Table)**
```sql
-- One candidate can work on many projects, one project can have many candidates
-- Junction table: candidate_projects (for standalone projects)
-- Foreign keys:
--   candidate_projects.candidate_id → candidates.id
--   candidate_projects.project_id → projects.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Candidates → Tech Stacks (Many-to-Many via Junction Table)**
```sql
-- One candidate can have many tech stacks, one tech stack can belong to many candidates
-- Junction table: candidate_tech_stacks
-- Foreign keys:
--   candidate_tech_stacks.candidate_id → candidates.id
--   candidate_tech_stacks.tech_stack_id → tech_stacks.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Candidates → Achievements (One-to-Many)**
```sql
-- One candidate can have many achievements
-- Foreign key: achievements.candidate_id → candidates.id
-- Cascade: ON DELETE CASCADE
```

**Candidates → Organizational Roles (One-to-Many)**
```sql
-- One candidate can have many organizational roles
-- Foreign key: organizational_roles.candidate_id → candidates.id
-- Cascade: ON DELETE CASCADE
```

**Candidates → Universities (Many-to-Many via Education Junction)**
```sql
-- One candidate can attend many universities, one university can have many candidates
-- Relationship through: candidate_educations.university_location_id → university_locations.id
-- Then: university_locations.university_id → universities.id
```

### 5.2 Work Experiences Relationships

**Work Experiences → Employers (Many-to-One)**
```sql
-- Many work experiences can belong to one employer
-- Foreign key: work_experiences.employer_name → employers.name (or employer_id → employers.id)
-- Cascade: ON DELETE SET NULL (if employer deleted, work experience remains but employer reference nullified)
```

**Work Experiences → Projects (One-to-Many)**
```sql
-- One work experience can have many projects (nested projects)
-- Foreign key: work_experience_projects.work_experience_id → work_experiences.id
-- Cascade: ON DELETE CASCADE
```

**Work Experiences → Tech Stacks (Many-to-Many via Junction Table)**
```sql
-- One work experience can use many tech stacks, one tech stack can be used in many work experiences
-- Junction table: work_experience_tech_stacks
-- Foreign keys:
--   work_experience_tech_stacks.work_experience_id → work_experiences.id
--   work_experience_tech_stacks.tech_stack_id → tech_stacks.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Work Experiences → Domains (Many-to-Many via Junction Table)**
```sql
-- One work experience can be in many domains, one domain can have many work experiences
-- Junction table: work_experience_domains
-- Foreign keys:
--   work_experience_domains.work_experience_id → work_experiences.id
--   work_experience_domains.domain_id → domains.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Work Experiences → Benefits (Many-to-Many via Junction Table)**
```sql
-- One work experience can have many benefits, one benefit can be in many work experiences
-- Junction table: work_experience_benefits
-- Foreign keys:
--   work_experience_benefits.work_experience_id → work_experiences.id
--   work_experience_benefits.benefit_id → benefits.id
-- Additional columns: amount, unit (for amount-based benefits)
-- Cascade: ON DELETE CASCADE for both foreign keys
```

### 5.3 Employers Relationships

**Employers → Employer Locations (One-to-Many)**
```sql
-- One employer can have many locations
-- Foreign key: employer_locations.employer_id → employers.id
-- Cascade: ON DELETE CASCADE
```

**Employers → Layoffs (One-to-Many)**
```sql
-- One employer can have many layoff records
-- Foreign key: layoffs.employer_id → employers.id
-- Cascade: ON DELETE CASCADE
```

**Employers → Tech Stacks (Many-to-Many via Junction Table)**
```sql
-- One employer can use many tech stacks, one tech stack can be used by many employers
-- Junction table: employer_tech_stacks
-- Foreign keys:
--   employer_tech_stacks.employer_id → employers.id
--   employer_tech_stacks.tech_stack_id → tech_stacks.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Employers → Benefits (Many-to-Many via Junction Table)**
```sql
-- One employer can offer many benefits, one benefit can be offered by many employers
-- Junction table: employer_benefits
-- Foreign keys:
--   employer_benefits.employer_id → employers.id
--   employer_benefits.benefit_id → benefits.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Employers → Candidates (Many-to-Many via Work Experiences)**
```sql
-- One employer can have many candidates (through work experiences), one candidate can work for many employers
-- Relationship through: work_experiences.employer_name → employers.name
```

### 5.4 Projects Relationships

**Projects → Employers (Many-to-One, Optional)**
```sql
-- Many projects can belong to one employer (optional relationship)
-- Foreign key: projects.employer_id → employers.id (nullable)
-- Cascade: ON DELETE SET NULL
```

**Projects → Tech Stacks (Many-to-Many via Junction Table)**
```sql
-- One project can use many tech stacks, one tech stack can be used in many projects
-- Junction table: project_tech_stacks
-- Foreign keys:
--   project_tech_stacks.project_id → projects.id
--   project_tech_stacks.tech_stack_id → tech_stacks.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Projects → Vertical Domains (Many-to-Many via Junction Table)**
```sql
-- One project can be in many vertical domains, one vertical domain can have many projects
-- Junction table: project_vertical_domains
-- Foreign keys:
--   project_vertical_domains.project_id → projects.id
--   project_vertical_domains.vertical_domain_id → vertical_domains.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Projects → Horizontal Domains (Many-to-Many via Junction Table)**
```sql
-- One project can be in many horizontal domains, one horizontal domain can have many projects
-- Junction table: project_horizontal_domains
-- Foreign keys:
--   project_horizontal_domains.project_id → projects.id
--   project_horizontal_domains.horizontal_domain_id → horizontal_domains.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Projects → Technical Aspects (Many-to-Many via Junction Table)**
```sql
-- One project can have many technical aspects, one technical aspect can be in many projects
-- Junction table: project_technical_aspects
-- Foreign keys:
--   project_technical_aspects.project_id → projects.id
--   project_technical_aspects.technical_aspect_id → technical_aspects.id
-- Cascade: ON DELETE CASCADE for both foreign keys
```

**Projects → Candidates (Many-to-Many via Junction Tables)**
```sql
-- One project can have many candidates, one candidate can work on many projects
-- Relationships through:
--   1. candidate_projects (standalone projects)
--   2. work_experience_projects (projects within work experience)
```

### 5.5 Universities Relationships

**Universities → University Locations (One-to-Many)**
```sql
-- One university can have many locations (campuses)
-- Foreign key: university_locations.university_id → universities.id
-- Cascade: ON DELETE CASCADE
```

**Universities → Candidates (Many-to-Many via Education Junction)**
```sql
-- One university can have many candidates, one candidate can attend many universities
-- Relationship through: candidate_educations.university_location_id → university_locations.id
-- Then: university_locations.university_id → universities.id
```

### 5.6 Certifications Relationships

**Certifications → Candidates (Many-to-Many via Junction Table)**
```sql
-- One certification can belong to many candidates, one candidate can have many certifications
-- Junction table: candidate_certifications
-- Foreign keys:
--   candidate_certifications.certification_id → certifications.id
--   candidate_certifications.candidate_id → candidates.id
-- Additional columns: issue_date, expiry_date, certification_url
-- Cascade: ON DELETE CASCADE for both foreign keys
```

### 5.7 Verification Relationships

**Field Verifications → Candidates/Projects (Many-to-One)**
```sql
-- Many field verifications can belong to one candidate or project
-- Foreign key: field_verifications.entity_id → candidates.id OR projects.id
-- Additional column: entity_type ('candidate' | 'project') to distinguish
-- Cascade: ON DELETE CASCADE
```

**Verification Audit Logs → Field Verifications (Many-to-One)**
```sql
-- Many audit logs can belong to one field verification
-- Foreign key: verification_audit_logs.verification_id → field_verifications.id
-- Cascade: ON DELETE CASCADE
```

**Conflicting Sources → Field Verifications (Many-to-One)**
```sql
-- Many conflicting sources can belong to one field verification
-- Foreign key: conflicting_sources.verification_id → field_verifications.id
-- Cascade: ON DELETE CASCADE
```

---

## 6. Verification Feature

### 6.1 Purpose

The verification system ensures **data integrity and traceability** across the application by:
- Tracking the **source** of each data field (Zoho CRM, resume parsing, LinkedIn scraping, manual entry)
- Maintaining **verification status** (verified/unverified) for each field
- Providing a **complete audit trail** of all verification changes
- Handling **conflicting data sources** when multiple sources provide different values
- Enabling **data quality metrics** (verification percentage per candidate/project)

### 6.2 How It Works

#### 6.2.1 Field Verification Tracking

Each trackable field in a candidate or project can have a corresponding `FieldVerification` record:

```typescript
interface FieldVerification {
  id: string
  entityId: string              // ID of candidate or project
  entityType: 'candidate' | 'project'
  fieldName: string             // e.g., "name", "email"
  fieldPath?: string            // For nested fields: "workExperiences[0].jobTitle"
  currentValue: string | null
  status: 'verified' | 'unverified'
  source: 'zoho' | 'resume_parse' | 'linkedin' | 'manual_entry'
  verifiedBy?: string           // User ID who verified
  verifiedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

#### 6.2.2 Verification Workflow

1. **Data Entry/Import**:
   - When data is imported from Zoho, source is marked as `'zoho'`
   - When resume is parsed, extracted fields are marked as `'resume_parse'`
   - When data is scraped from LinkedIn, source is marked as `'linkedin'`
   - When manually entered, source is marked as `'manual_entry'`
   - All fields start with status `'unverified'`

2. **Manual Verification**:
   - HR staff can review and verify fields
   - When verified, status changes to `'verified'`
   - `verifiedBy` and `verifiedAt` are recorded
   - An audit log entry is created

3. **Value Updates**:
   - When a field value is updated, the verification record is updated
   - An audit log entry records the old and new values
   - Source may change if updated from a different source

4. **Conflicting Sources**:
   - If multiple sources provide different values for the same field, conflicting sources are recorded
   - HR staff can review and choose the correct value
   - All conflicting values are preserved for audit purposes

#### 6.2.3 Verification Audit Logs

Every change to a verification record is logged:

```typescript
interface VerificationAuditLog {
  id: string
  verificationId: string
  action: 'status_change' | 'value_update' | 'note_added' | 'source_change'
  oldStatus?: VerificationStatus
  newStatus?: VerificationStatus
  oldValue?: string
  newValue?: string
  changedBy: string            // User ID or 'system'
  changedByName: string         // Display name
  changedAt: Date
  reason?: string
}
```

#### 6.2.4 Verification Statistics

The system calculates verification percentages:

```typescript
interface CandidateVerificationSummary {
  candidateId: string
  totalFields: number
  verifiedFields: number
  unverifiedFields: number
  verificationPercentage: number  // (verifiedFields / totalFields) * 100
  lastVerifiedAt?: Date
  lastVerifiedBy?: string
}
```

### 6.3 Relationship with Data Fields

**All trackable fields** in candidates and projects can be verified:

#### Candidate Fields:
- **Basic Information**: name, email, mobileNo, cnic, postingTitle, currentSalary, expectedSalary, city, githubUrl, linkedinUrl, personalityType, source, status
- **Work Experience Fields**: employerName, jobTitle, startDate, endDate, shiftType, workMode, timeSupportZones, techStacks, domains, benefits, project names, contribution notes
- **Education Fields**: universityLocationName, degreeName, majorName, startMonth, endMonth, grades, isTopper, isCheetah
- **Certification Fields**: certificationName, issueDate, expiryDate, certificationUrl
- **Achievement Fields**: name, achievementType, ranking, year, url, description
- **Tech Stacks**: standalone tech stacks array
- **Organizational Roles**: organizationName, role, startDate, endDate

#### Project Fields:
- **Basic Information**: projectName, employerName, clientLocation, description, notes, projectLink
- **Technical Information**: techStacks, verticalDomains, horizontalDomains, technicalAspects
- **Project Details**: teamSize, startDate, endDate, status, projectType
- **Publication Information**: isPublished, publishPlatforms, downloadCount

**Nested Field Support**: The system supports nested field paths like `workExperiences[0].jobTitle` or `educations[1].grades` to track verification for specific array elements.

---

## 7. AI-Based Python App Integration for LLM Questions

### 7.1 Purpose

The application integrates with an **external Python-based AI service** to generate **context-aware questions** for different interaction modes (Cold Caller, Interviewer, L1, L2). This enables HR staff to have intelligent conversations with candidates to collect missing information or conduct interviews.

### 7.2 Integration Architecture

```
Frontend (Next.js)
    ↓
Next.js API Route (/api/generate-questions)
    ↓
Python AI Service (FastAPI) - http://localhost:8002
    ↓
LLM (Large Language Model)
```

### 7.3 Request Flow

1. **Frontend Request**:
   - User opens Cold Caller/Interviewer mode for a candidate
   - System identifies missing/empty fields
   - Frontend calls `generateQuestions()` function

2. **Next.js API Proxy**:
   - Frontend makes POST request to `/api/generate-questions`
   - Next.js API route proxies the request to Python service
   - Avoids CORS issues and provides a unified interface

3. **Python AI Service**:
   - Receives request with candidate data and missing fields
   - Uses LLM to generate context-aware questions
   - Returns structured question responses

### 7.4 Request/Response Format

#### Request:
```typescript
interface GenerateQuestionsRequest {
  candidate_id: string
  missing_fields: string[]  // e.g., ["postingTitle", "workExperiences[0].startDate"]
  candidate_data: Candidate  // Full candidate object
  conversation_context: 'cold_call' | 'interviewer' | 'l1' | 'l2' | 'health_check'
}
```

#### Response:
```typescript
interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[]
}

interface GeneratedQuestion {
  id: string
  fieldPath: string  // e.g., "postingTitle"
  question: string   // AI-generated question text
  context?: string   // Additional context for the question
}
```

### 7.5 Integration Points

**File: `src/lib/services/questions-api.ts`**
- `generateQuestions()`: Main function to call the API
- `checkApiHealth()`: Health check function
- Handles error cases and connection issues

**File: `src/app/api/generate-questions/route.ts`**
- Next.js API route that proxies requests
- Environment variable: `QUESTIONS_API_URL` (default: `http://localhost:8002`)
- Handles CORS and error responses

**File: `src/components/cold-caller/cold-caller-dialog.tsx`**
- Uses `generateQuestions()` when "Generate Questions" button is clicked
- Maps generated questions to empty fields
- Displays questions alongside field inputs

### 7.6 Conversation Contexts

Different interaction modes generate different types of questions:

- **cold_call**: Initial data collection, friendly and conversational
- **interviewer**: Technical interview questions, more formal
- **l1**: Level 1 screening questions, basic technical assessment
- **l2**: Level 2 deep dive questions, advanced technical assessment

### 7.7 Error Handling

- Connection failures are caught and user-friendly error messages are displayed
- API errors are logged and propagated to the frontend
- Health check endpoint allows frontend to verify service availability

### 7.8 Future Enhancements

- **Resume Parsing Integration**: Another Python app for parsing resumes and extracting candidate data
- **Async Processing**: Queue system for handling long-running AI operations
- **Question Caching**: Cache frequently asked questions to reduce API calls
- **Multi-language Support**: Generate questions in different languages

---

## 8. Other Crucial Information

### 8.1 Data Completion Tracking

The application tracks **data completeness** for each candidate profile:

**Calculation Method**:
- Identifies all "trackable" fields across all sections
- Counts filled vs. empty fields
- Calculates percentage per section and overall

**Trackable Fields by Section**:
- **Basic Information**: 7 fields (postingTitle, cnic, currentSalary, expectedSalary, githubUrl, linkedinUrl, personalityType)
- **Work Experience**: 8 fields per work experience (startDate, endDate, shiftType, workMode, timeSupportZones, techStacks, domains, benefits) + contribution notes per project
- **Education**: 3 fields per education (grades, isTopper, isCheetah)
- **Certifications**: 1 field per certification (certificationUrl)
- **Achievements**: 4 fields per achievement (ranking, year, url, description)
- **Tech Stacks**: 1 field (standalone techStacks array)

**Use Cases**:
- Filter candidates by data completion percentage
- Identify candidates needing more information
- Track data quality improvements over time

### 8.2 Mutual Connections Feature

The system identifies **mutual connections** between candidates and DPL employees:

**How It Works**:
- Finds overlapping education periods at the same university
- Finds overlapping work experience periods at the same employer
- Supports tolerance windows for date gaps (e.g., 3 months)

**Use Cases**:
- Filter candidates with mutual connections to DPL
- Identify potential referrals
- Build relationship networks

**Implementation**:
- `dateRangesOverlap()`: Checks if two date ranges overlap
- `hasOverlappingEducation()`: Finds overlapping education periods
- `hasOverlappingWorkExperience()`: Finds overlapping work periods
- `findMutualConnectionsWithDPL()`: Main function to find all mutual connections

### 8.3 Career Transition Detection

The system can identify candidates who have **transitioned between employer types**:

**Example**: Find candidates who moved from "Services Based" to "Product Based" companies

**Filter Options**:
- `careerTransitionFromType`: Previous employer types
- `careerTransitionToType`: Current/new employer types
- `careerTransitionRequireCurrent`: If true, "to" type must be the current/most recent employer

### 8.4 Top Developer Tracking

**Purpose**: Identify and filter candidates who are "top developers"

**Features**:
- `isTopDeveloper` flag on candidate
- Filter candidates by top developer status
- Filter employers by whether they have top developers
- Filter candidates who worked with top developers

### 8.5 University Job Success Ratio

**Purpose**: Calculate job success ratio for universities based on candidate outcomes

**Calculation**:
- Analyzes candidates from each university
- Tracks their job status (hired, shortlisted, etc.)
- Calculates success ratio percentage

**Use Cases**:
- Filter universities by job success ratio
- Identify top-performing universities
- Make data-driven recruitment decisions

### 8.6 Employer Size Calculation

**Purpose**: Calculate employer size from location data

**Method**:
- Sums `minSize` and `maxSize` from all locations
- Displays as single number or range (e.g., "50" or "50-100")

**Use Cases**:
- Filter employers by size range
- Understand employer scale
- Make informed decisions about employer relationships

### 8.7 Average Job Tenure Calculation

**Purpose**: Calculate average job tenure for employers

**Method**:
- Analyzes work experience data for all candidates at an employer
- Calculates average tenure in years
- Can be manually set or auto-calculated

**Use Cases**:
- Filter employers by average job tenure
- Understand employee retention
- Identify stable vs. high-turnover employers

### 8.8 Project Publication Tracking

**Purpose**: Track published projects and their success metrics

**Features**:
- `isPublished` flag
- `publishPlatforms` array (App Store, Play Store, Web, Desktop)
- `downloadCount` for published apps

**Use Cases**:
- Filter candidates with published projects
- Filter employers with published projects
- Identify successful projects by download count
- Filter by specific publish platforms

### 8.9 Client Location Tracking

**Purpose**: Track where project clients are located

**Features**:
- `clientLocation` field on projects
- Filter by client locations (e.g., "San Francisco", "Silicon Valley")
- Filter by minimum number of unique client locations

**Use Cases**:
- Find candidates with international project experience
- Identify employers working with global clients
- Track geographic project distribution

### 8.10 Data Integrity and Master Data

**Purpose**: Ensure consistency across the application

**Master Data Tables**:
- Tech Stacks
- Vertical Domains
- Horizontal Domains
- Technical Aspects
- Benefits
- Shift Types
- Work Modes
- Time Support Zones
- Personality Types
- Achievement Types
- Publish Platforms

**Benefits**:
- Consistent data entry
- Easy filtering and searching
- Reduced typos and variations
- Better analytics and reporting

### 8.11 Soft Deletes

**Purpose**: Preserve data integrity while allowing "deletion"

**Implementation**:
- Use `deletedAt` timestamp instead of hard deletes
- Filter out soft-deleted records in queries
- Allow data recovery if needed

### 8.12 File Storage (Resumes)

**Purpose**: Store candidate resume files

**Implementation**:
- Resume files stored in AWS S3 (planned)
- `resume` field stores file path/URL
- Secure file access with presigned URLs

### 8.13 Search Functionality

**Purpose**: Full-text search across multiple fields

**Features**:
- Global search for candidates (name, email, phone, CNIC)
- Project name search
- Employer name search
- University name search

**Future Enhancements**:
- Elasticsearch integration for advanced search
- Search result ranking
- Search suggestions/autocomplete

### 8.14 Filter Persistence

**Purpose**: Save and restore filter states

**Features**:
- Filters stored in URL query parameters
- Shareable filter links
- Filter presets (future enhancement)

### 8.15 Performance Considerations

**Challenges**:
- Complex queries with 50+ filter criteria
- Multiple joins across many tables
- Large datasets (thousands of candidates)
- Real-time filtering and calculations

**Optimization Strategies**:
- Database indexes on frequently filtered columns
- Query optimization and caching
- Pagination for large result sets
- Lazy loading of nested data
- Materialized views for complex aggregations (future)

### 8.16 Security Considerations

**Authentication & Authorization**:
- JWT-based authentication (planned for backend)
- Role-based access control (admin, hr, manager)
- Field-level permissions (future)

**Data Privacy**:
- Sensitive data (CNIC, salary) requires proper access controls
- Audit logging for all data access
- GDPR compliance considerations (future)

### 8.17 Integration Points

**Current Integrations**:
- Python AI Questions Service (via HTTP API)
- Next.js API routes as proxy layer

**Planned Integrations**:
- Zoho CRM API (bidirectional sync for candidate data)
- Python Resume Parser Service (for automated data extraction)
- AWS S3 (for file storage)
- Email service (for notifications)

### 8.18 Scalability Considerations

**Database**:
- PostgreSQL for relational data
- Proper indexing strategy
- Connection pooling
- Read replicas for scaling (future)

**Application**:
- Stateless API design
- Horizontal scaling capability
- Caching layer (Redis - future)
- CDN for static assets (future)

### 8.19 Monitoring and Logging

**Planned Features**:
- Application logging (Winston/Pino)
- Error tracking (Sentry - future)
- Performance monitoring (CloudWatch)
- Database query monitoring
- API usage analytics

---

## Conclusion

This application is a comprehensive recruitment and HR management system with:
- **Complex data relationships** across multiple entities
- **Advanced filtering capabilities** with 50+ filter criteria
- **Data verification system** ensuring data integrity
- **AI-powered question generation** for candidate interactions
- **Rich feature set** including mutual connections, career transitions, and success metrics

The system is designed to scale and handle large datasets while maintaining data integrity and providing powerful search and filtering capabilities for finding the right candidates.

