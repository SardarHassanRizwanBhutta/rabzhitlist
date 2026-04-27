# Candidate API Reference

Complete API reference for the Candidate module. This covers the **single transactional create** endpoint (which inserts data into all related tables in one call), the **update** endpoint, **listing/filtering**, **deletion**, and all **sub-resource** endpoints for granular edits after creation.

---

## Table of Contents

- [Base URL](#base-url)
- [Enum Reference](#enum-reference)
- [1. Create Candidate (Transactional)](#1-create-candidate-transactional)
- [2. List Candidates (Paginated + Filtered)](#2-list-candidates-paginated--filtered)
- [3. Get Candidate by ID](#3-get-candidate-by-id)
- [4. Update Candidate (Basic Info)](#4-update-candidate-basic-info)
- [5. Delete Candidate (Soft Delete)](#5-delete-candidate-soft-delete)
- [6. Sub-Resource Endpoints (Granular Edits)](#6-sub-resource-endpoints-granular-edits)
  - [6.1 Tech Stacks](#61-tech-stacks)
  - [6.2 Projects](#62-projects)
  - [6.3 Educations](#63-educations)
  - [6.4 Certifications](#64-certifications)
  - [6.5 Achievements](#65-achievements)
  - [6.6 Work Experiences](#66-work-experiences)
  - [6.7 Work Experience Sub-Resources](#67-work-experience-sub-resources)
- [Response DTO Shapes](#response-dto-shapes)
- [Integration Pattern](#integration-pattern)
- [Lookup APIs for Foreign Keys](#lookup-apis-for-foreign-keys)

---

## Base URL

```
{API_HOST}/api
```

All requests use `Content-Type: application/json`.

---

## Enum Reference

All enums are sent and received as **integers**.

| Enum | Values |
|------|--------|
| **CandidateSource** | `0` = headhunt, `1` = zoho, `2` = manual, `3` = referral |
| **MbtiType** | `0` = ESTJ, `1` = ENTJ, `2` = ESFJ, `3` = ENFJ, `4` = ISTJ, `5` = ISFJ, `6` = INTJ, `7` = INFJ, `8` = ESTP, `9` = ESFP, `10` = ENTP, `11` = ENFP, `12` = ISTP, `13` = ISFP, `14` = INTP, `15` = INFP |
| **ShiftType** | `0` = day, `1` = night, `2` = evening, `3` = rotational, `4` = flexible, `5` = onCall |
| **WorkMode** | `0` = onsite, `1` = remote, `2` = hybrid |
| **CertificationLevel** | `0` = foundation, `1` = associate, `2` = professional, `3` = expert, `4` = master |
| **AchievementType** | `0` = competition, `1` = openSource, `2` = award, `3` = medal, `4` = publication, `5` = certification, `6` = recognition, `7` = other |
| **BenefitUnit** | `0` = pkr, `1` = days, `2` = count, `3` = percentage |

---

## 1. Create Candidate (Transactional)

**`POST /api/candidates`**

Creates a candidate with **all related data in a single database transaction**. If any part fails, nothing is committed.

All nested arrays are **optional** — omit them or pass `null` / `[]` to skip that section. Only `name` is required.

### Database Tables Affected

| Section | Table |
|---------|-------|
| Basic Info | `candidates` |
| Work Experiences | `candidate_work_experiences` |
| Work Exp. Benefits | `candidate_work_experience_benefits` |
| Work Exp. Projects | `candidate_work_experience_projects` |
| Work Exp. Tech Stacks | `candidate_work_experience_tech_stacks` |
| Work Exp. Time Support Zones | `candidate_work_experience_time_support_zones` |
| Tech Stacks | `candidate_tech_stacks` |
| Projects | `candidate_projects` |
| Educations | `candidate_educations` |
| Certifications | `candidate_certifications` |
| Achievements | `candidate_achievements` |

### Request Body Schema

```jsonc
{
  // ── Basic Information (candidates table) ──────────────────────
  "name": "string",                    // REQUIRED, max 200 chars
  "email": "string | null",           // unique, nullable
  "phoneNumber": "string | null",     // max 20 chars
  "postingTitle": "string | null",    // max 150 chars
  "cnic": "string | null",           // max 15 chars, unique
  "linkedInUrl": "string | null",
  "githubUrl": "string | null",
  "city": "string | null",           // max 100 chars
  "totalExperienceYears": 0.0,       // decimal, nullable
  "currentSalary": 0.00,             // decimal, nullable
  "expectedSalary": 0.00,            // decimal, nullable
  "personalityType": 0,              // MbtiType enum, nullable
  "source": 0,                       // CandidateSource enum, nullable
  "status": "sourced",               // string, defaults to "sourced"
  "resumeUrl": "string | null",

  // ── Tech Stacks (candidate_tech_stacks table) ────────────────
  "techStackIds": [1, 5, 12],        // array of existing tech_stack IDs

  // ── Projects (candidate_projects table) ──────────────────────
  "projects": [
    {
      "projectId": 3,                 // REQUIRED, existing project ID
      "contribution": "string | null"
    }
  ],

  // ── Educations (candidate_educations table) ──────────────────
  "educations": [
    {
      "universityId": 2,              // existing university ID, nullable
      "degreeId": 1,                  // existing degree ID, nullable
      "majorId": 4,                   // existing major ID, nullable
      "startMonth": "2018-09-01",     // DateOnly (yyyy-MM-dd), nullable
      "endMonth": "2022-06-01",       // DateOnly (yyyy-MM-dd), nullable
      "grades": "3.8 GPA",           // string, nullable
      "isTopper": false,              // bool, defaults to false
      "isMainCheetah": false          // bool, defaults to false
    }
  ],

  // ── Certifications (candidate_certifications table) ──────────
  "certifications": [
    {
      "certificationId": 7,           // REQUIRED, existing certification ID
      "issueDate": "2024-01-15",      // DateOnly, nullable
      "expiryDate": "2027-01-15",     // DateOnly, nullable
      "url": "string | null",
      "level": 2                      // CertificationLevel enum, nullable
    }
  ],

  // ── Achievements (candidate_achievements table) ──────────────
  "achievements": [
    {
      "name": "Hackathon Winner",     // REQUIRED
      "type": 0,                      // AchievementType enum, nullable
      "ranking": "1st Place",         // string, nullable
      "year": 2024,                   // int, nullable
      "url": "string | null",
      "description": "string | null"
    }
  ],

  // ── Work Experiences (candidate_work_experiences + sub-tables)
  "workExperiences": [
    {
      "employerId": 1,                // existing employer ID, nullable
      "jobTitle": "Full Stack Dev",   // REQUIRED
      "startDate": "2022-07-01",      // DateOnly, nullable
      "endDate": null,                // DateOnly, nullable
      "shiftType": 0,                 // ShiftType enum, nullable
      "workMode": 2,                  // WorkMode enum, nullable

      // Sub-resources within this work experience:
      "timeSupportZoneIds": [1, 3],   // existing time_support_zone IDs
      "techStackIds": [1, 5],         // existing tech_stack IDs

      "benefits": [
        {
          "benefitId": 2,              // REQUIRED, existing benefit ID
          "hasValue": true,            // bool, defaults to false
          "unitType": 0,               // BenefitUnit enum, nullable
          "value": 25000.00            // decimal, nullable
        }
      ],

      "projects": [
        {
          "projectId": 3,              // REQUIRED, existing project ID
          "contribution": "Backend APIs" // string, nullable
        }
      ]
    }
  ]
}
```

### Minimal Request (Basic Info Only)

```json
{
  "name": "Jane Smith"
}
```

### Full Example Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+923001234567",
  "postingTitle": "Senior Backend Engineer",
  "cnic": "3520212345678",
  "linkedInUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "city": "Lahore",
  "totalExperienceYears": 5.5,
  "currentSalary": 200000.00,
  "expectedSalary": 300000.00,
  "personalityType": 6,
  "source": 2,
  "status": "sourced",
  "resumeUrl": "https://storage.example.com/resumes/johndoe.pdf",
  "techStackIds": [1, 5, 12],
  "projects": [
    { "projectId": 3, "contribution": "Led backend development" }
  ],
  "educations": [
    {
      "universityId": 2,
      "degreeId": 1,
      "majorId": 4,
      "startMonth": "2018-09-01",
      "endMonth": "2022-06-01",
      "grades": "3.8 GPA",
      "isTopper": false,
      "isMainCheetah": false
    }
  ],
  "certifications": [
    {
      "certificationId": 7,
      "issueDate": "2024-01-15",
      "expiryDate": "2027-01-15",
      "url": "https://credly.com/badges/example",
      "level": 2
    }
  ],
  "achievements": [
    {
      "name": "Hackathon Winner",
      "type": 0,
      "ranking": "1st Place",
      "year": 2024,
      "url": "https://devpost.com/example",
      "description": "Won inter-university hackathon"
    }
  ],
  "workExperiences": [
    {
      "employerId": 1,
      "jobTitle": "Full Stack Developer",
      "startDate": "2022-07-01",
      "endDate": null,
      "shiftType": 0,
      "workMode": 2,
      "timeSupportZoneIds": [1, 3],
      "techStackIds": [1, 5],
      "benefits": [
        {
          "benefitId": 2,
          "hasValue": true,
          "unitType": 0,
          "value": 25000.00
        }
      ],
      "projects": [
        { "projectId": 3, "contribution": "Backend APIs" }
      ]
    }
  ]
}
```

### Response: `201 Created`

Returns the full `CandidateDto` with all sections populated including resolved names (employer names, tech stack names, university names, etc.).

**Location header:** `/api/candidates/{id}`

See [Response DTO Shapes](#response-dto-shapes) for the complete response structure.

---

## 2. List Candidates (Paginated + Filtered)

**`GET /api/candidates`**

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageNumber` | int | `1` | Page number (1-based) |
| `pageSize` | int | `10` | Items per page (max 100) |
| `certificationId` | long? | — | Filter: only candidates with this certification |
| `universityId` | long? | — | Filter: only candidates who attended this university |

Filters are combined with AND when both are present.

### Example

```
GET /api/candidates?pageNumber=1&pageSize=20&universityId=3
```

### Response: `200 OK`

```json
{
  "items": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+923001234567",
      "postingTitle": "Senior Backend Engineer",
      "cnic": "3520212345678",
      "linkedInUrl": "https://linkedin.com/in/johndoe",
      "githubUrl": "https://github.com/johndoe",
      "city": "Lahore",
      "totalExperienceYears": 5.5,
      "currentSalary": 200000.00,
      "expectedSalary": 300000.00,
      "personalityType": 6,
      "source": 2,
      "status": "sourced",
      "resumeUrl": "https://storage.example.com/resumes/johndoe.pdf",
      "createdAt": "2026-04-03T10:30:00Z",
      "updatedAt": "2026-04-03T10:30:00Z"
    }
  ],
  "totalCount": 42,
  "pageNumber": 1,
  "pageSize": 20
}
```

List items are **flat** (no nested sections). Use GET by ID for full details.

---

## 3. Get Candidate by ID

**`GET /api/candidates/{id}`**

Returns the full candidate with all nested sections (projects, tech stacks, certifications, educations, work experiences with their sub-resources, and achievements).

### Response: `200 OK`

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+923001234567",
  "postingTitle": "Senior Backend Engineer",
  "cnic": "3520212345678",
  "linkedInUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "city": "Lahore",
  "totalExperienceYears": 5.5,
  "currentSalary": 200000.00,
  "expectedSalary": 300000.00,
  "personalityType": 6,
  "source": 2,
  "status": "sourced",
  "resumeUrl": "https://storage.example.com/resumes/johndoe.pdf",
  "projects": [
    {
      "candidateId": 1,
      "projectId": 3,
      "projectName": "E-Commerce Platform",
      "contribution": "Led backend development"
    }
  ],
  "techStacks": [
    { "candidateId": 1, "techStackId": 1, "techStackName": "C#" },
    { "candidateId": 1, "techStackId": 5, "techStackName": "PostgreSQL" }
  ],
  "certifications": [
    {
      "candidateId": 1,
      "certificationId": 7,
      "certificationName": "AWS Solutions Architect",
      "issuerName": "Amazon",
      "issueDate": "2024-01-15",
      "expiryDate": "2027-01-15",
      "url": "https://credly.com/badges/example",
      "level": 2
    }
  ],
  "educations": [
    {
      "id": 1,
      "candidateId": 1,
      "universityId": 2,
      "universityName": "LUMS",
      "degreeId": 1,
      "degreeName": "BSc",
      "majorId": 4,
      "majorName": "Computer Science",
      "startMonth": "2018-09-01",
      "endMonth": "2022-06-01",
      "grades": "3.8 GPA",
      "isTopper": false,
      "isMainCheetah": false
    }
  ],
  "workExperiences": [
    {
      "id": 1,
      "candidateId": 1,
      "employerId": 1,
      "employerName": "TechCorp",
      "jobTitle": "Full Stack Developer",
      "startDate": "2022-07-01",
      "endDate": null,
      "shiftType": 0,
      "workMode": 2,
      "timeSupportZones": [
        { "workExperienceId": 1, "timeSupportZoneId": 1, "timeSupportZoneName": "PST" }
      ],
      "benefits": [
        {
          "workExperienceId": 1,
          "benefitId": 2,
          "benefitName": "Transport Allowance",
          "hasValue": true,
          "unitType": 0,
          "value": 25000.00
        }
      ],
      "techStacks": [
        { "workExperienceId": 1, "techStackId": 1, "techStackName": "C#" }
      ],
      "projects": [
        {
          "workExperienceId": 1,
          "projectId": 3,
          "projectName": "E-Commerce Platform",
          "contribution": "Backend APIs"
        }
      ],
      "createdAt": "2026-04-03T10:30:00Z",
      "updatedAt": "2026-04-03T10:30:00Z"
    }
  ],
  "achievements": [
    {
      "id": 1,
      "candidateId": 1,
      "name": "Hackathon Winner",
      "type": 0,
      "ranking": "1st Place",
      "year": 2024,
      "url": "https://devpost.com/example",
      "description": "Won inter-university hackathon",
      "createdAt": "2026-04-03T10:30:00Z",
      "updatedAt": "2026-04-03T10:30:00Z"
    }
  ],
  "createdAt": "2026-04-03T10:30:00Z",
  "updatedAt": "2026-04-03T10:30:00Z"
}
```

### Response: `404 Not Found` — if candidate does not exist or is soft-deleted.

---

## 4. Update Candidate (Basic Info)

**`PUT /api/candidates/{id}`**

Updates **only the basic information fields** on the `candidates` table. Does **NOT** modify nested sections (work experiences, tech stacks, etc.). Use the [sub-resource endpoints](#6-sub-resource-endpoints-granular-edits) for granular edits to related data.

### Request Body

```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phoneNumber": "+923009876543",
  "postingTitle": "Lead Engineer",
  "cnic": "3520212345678",
  "linkedInUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "city": "Islamabad",
  "totalExperienceYears": 6.0,
  "currentSalary": 250000.00,
  "expectedSalary": 350000.00,
  "personalityType": 6,
  "source": 3,
  "status": "interview",
  "resumeUrl": null
}
```

All fields are sent (full replacement of basic info). `name` and `status` are required.

### Response: `200 OK` — returns the full `CandidateDto`.
### Response: `404 Not Found` — if candidate does not exist or is soft-deleted.

---

## 5. Delete Candidate (Soft Delete)

**`DELETE /api/candidates/{id}`**

Sets `deleted_at` timestamp. The candidate will no longer appear in listings or GET by ID.

### Response: `204 No Content` — success.
### Response: `404 Not Found` — not found or already deleted.

---

## 6. Sub-Resource Endpoints (Granular Edits)

Use these endpoints **after creation** to add, update, or remove individual items from a candidate's related data.

### 6.1 Tech Stacks

| Method | Route | Description |
|--------|-------|-------------|
| **POST** | `/api/candidates/{candidateId}/tech-stacks` | Add a tech stack |
| **DELETE** | `/api/candidates/{candidateId}/tech-stacks/{techStackId}` | Remove a tech stack |

**POST body:**

```json
{ "techStackId": 5 }
```

---

### 6.2 Projects

| Method | Route | Description |
|--------|-------|-------------|
| **GET** | `/api/candidates/{candidateId}/projects` | List projects |
| **GET** | `/api/candidates/{candidateId}/projects/{projectId}` | Get one |
| **PUT** | `/api/candidates/{candidateId}/projects/{projectId}` | Upsert (create or update) |
| **DELETE** | `/api/candidates/{candidateId}/projects/{projectId}` | Remove |

**PUT body:**

```json
{
  "projectId": 3,
  "contribution": "Led backend development"
}
```

---

### 6.3 Educations

| Method | Route | Description |
|--------|-------|-------------|
| **GET** | `/api/candidates/{candidateId}/educations` | List educations |
| **GET** | `/api/candidates/{candidateId}/educations/{id}` | Get one |
| **POST** | `/api/candidates/{candidateId}/educations` | Create |
| **PUT** | `/api/candidates/{candidateId}/educations/{id}` | Update |
| **DELETE** | `/api/candidates/{candidateId}/educations/{id}` | Delete |

**POST body:**

```json
{
  "universityId": 2,
  "degreeId": 1,
  "majorId": 4,
  "startMonth": "2018-09-01",
  "endMonth": "2022-06-01",
  "grades": "3.8 GPA",
  "isTopper": false,
  "isMainCheetah": false
}
```

**PUT body (same fields, all sent):**

```json
{
  "universityId": 2,
  "degreeId": 1,
  "majorId": 4,
  "startMonth": "2018-09-01",
  "endMonth": "2022-06-01",
  "grades": "3.9 GPA",
  "isTopper": true,
  "isMainCheetah": false
}
```

---

### 6.4 Certifications

| Method | Route | Description |
|--------|-------|-------------|
| **GET** | `/api/candidates/{candidateId}/certifications` | List |
| **GET** | `/api/candidates/{candidateId}/certifications/{certificationId}` | Get one |
| **PUT** | `/api/candidates/{candidateId}/certifications` | Upsert (create or update) |
| **DELETE** | `/api/candidates/{candidateId}/certifications/{certificationId}` | Remove |

**PUT body:**

```json
{
  "certificationId": 7,
  "issueDate": "2024-01-15",
  "expiryDate": "2027-01-15",
  "url": "https://credly.com/badges/example",
  "level": 2
}
```

---

### 6.5 Achievements

| Method | Route | Description |
|--------|-------|-------------|
| **GET** | `/api/candidates/{candidateId}/achievements` | List |
| **GET** | `/api/candidates/{candidateId}/achievements/{id}` | Get one |
| **POST** | `/api/candidates/{candidateId}/achievements` | Create |
| **PUT** | `/api/candidates/{candidateId}/achievements/{id}` | Update |
| **DELETE** | `/api/candidates/{candidateId}/achievements/{id}` | Delete |

**POST body:**

```json
{
  "name": "Hackathon Winner",
  "type": 0,
  "ranking": "1st Place",
  "year": 2024,
  "url": "https://devpost.com/example",
  "description": "Won inter-university hackathon"
}
```

**PUT body (same fields):**

```json
{
  "name": "Hackathon Winner",
  "type": 0,
  "ranking": "1st Place",
  "year": 2024,
  "url": "https://devpost.com/example",
  "description": "Won inter-university hackathon - updated description"
}
```

---

### 6.6 Work Experiences

| Method | Route | Description |
|--------|-------|-------------|
| **GET** | `/api/candidates/{candidateId}/work-experiences` | List |
| **GET** | `/api/candidates/{candidateId}/work-experiences/{id}` | Get one (with sub-resources) |
| **POST** | `/api/candidates/{candidateId}/work-experiences` | Create |
| **PUT** | `/api/candidates/{candidateId}/work-experiences/{id}` | Update (basic fields only) |
| **DELETE** | `/api/candidates/{candidateId}/work-experiences/{id}` | Delete |

**POST body:**

```json
{
  "employerId": 1,
  "jobTitle": "Full Stack Developer",
  "startDate": "2022-07-01",
  "endDate": null,
  "shiftType": 0,
  "workMode": 2
}
```

**PUT body (same fields, without candidateId):**

```json
{
  "employerId": 1,
  "jobTitle": "Senior Developer",
  "startDate": "2022-07-01",
  "endDate": "2025-01-01",
  "shiftType": 0,
  "workMode": 1
}
```

---

### 6.7 Work Experience Sub-Resources

These operate on a specific work experience identified by `{weId}`.

#### Time Support Zones

| Method | Route | Body |
|--------|-------|------|
| **POST** | `.../work-experiences/{weId}/time-support-zones` | `{ "timeSupportZoneId": 1 }` |
| **DELETE** | `.../work-experiences/{weId}/time-support-zones/{tszId}` | — |

#### Benefits

| Method | Route | Body |
|--------|-------|------|
| **PUT** | `.../work-experiences/{weId}/benefits/{benefitId}` | `{ "benefitId": 2, "hasValue": true, "unitType": 0, "value": 25000.00 }` |
| **DELETE** | `.../work-experiences/{weId}/benefits/{benefitId}` | — |

#### Tech Stacks

| Method | Route | Body |
|--------|-------|------|
| **POST** | `.../work-experiences/{weId}/tech-stacks` | `{ "techStackId": 5 }` |
| **DELETE** | `.../work-experiences/{weId}/tech-stacks/{techStackId}` | — |

#### Projects

| Method | Route | Body |
|--------|-------|------|
| **PUT** | `.../work-experiences/{weId}/projects/{projectId}` | `{ "projectId": 3, "contribution": "Backend APIs" }` |
| **DELETE** | `.../work-experiences/{weId}/projects/{projectId}` | — |

---

## Response DTO Shapes

### CandidateDto (full — returned by POST, GET by ID)

```
{
  id: long
  name: string
  email: string?
  phoneNumber: string?
  postingTitle: string?
  cnic: string?
  linkedInUrl: string?
  githubUrl: string?
  city: string?
  totalExperienceYears: decimal?
  currentSalary: decimal?
  expectedSalary: decimal?
  personalityType: int? (MbtiType)
  source: int? (CandidateSource)
  status: string
  resumeUrl: string?
  projects: CandidateProjectDto[]
  techStacks: CandidateTechStackDto[]
  certifications: CandidateCertificationDto[]
  educations: CandidateEducationDto[]
  workExperiences: CandidateWorkExperienceDto[]
  achievements: CandidateAchievementDto[]
  createdAt: datetime
  updatedAt: datetime
}
```

### CandidateListItemDto (flat — returned by GET list)

```
{
  id: long
  name: string
  email: string?
  phoneNumber: string?
  postingTitle: string?
  cnic: string?
  linkedInUrl: string?
  githubUrl: string?
  city: string?
  totalExperienceYears: decimal?
  currentSalary: decimal?
  expectedSalary: decimal?
  personalityType: int? (MbtiType)
  source: int? (CandidateSource)
  status: string
  resumeUrl: string?
  createdAt: datetime
  updatedAt: datetime
}
```

### CandidateProjectDto

```
{ candidateId: long, projectId: long, projectName: string?, contribution: string? }
```

### CandidateTechStackDto

```
{ candidateId: long, techStackId: long, techStackName: string }
```

### CandidateCertificationDto

```
{ candidateId: long, certificationId: long, certificationName: string, issuerName: string?, issueDate: date?, expiryDate: date?, url: string?, level: int? }
```

### CandidateEducationDto

```
{ id: long, candidateId: long?, universityId: long?, universityName: string?, degreeId: long?, degreeName: string?, majorId: long?, majorName: string?, startMonth: date?, endMonth: date?, grades: string?, isTopper: bool, isMainCheetah: bool }
```

### CandidateAchievementDto

```
{ id: long, candidateId: long?, name: string, type: int?, ranking: string?, year: int?, url: string?, description: string?, createdAt: datetime, updatedAt: datetime }
```

### CandidateWorkExperienceDto

```
{
  id: long
  candidateId: long
  employerId: long?
  employerName: string?
  jobTitle: string
  startDate: date?
  endDate: date?
  shiftType: int? (ShiftType)
  workMode: int? (WorkMode)
  timeSupportZones: WorkExperienceTimeSupportZoneDto[]
  benefits: WorkExperienceBenefitDto[]
  techStacks: WorkExperienceTechStackDto[]
  projects: WorkExperienceProjectDto[]
  createdAt: datetime
  updatedAt: datetime
}
```

### WorkExperienceTimeSupportZoneDto

```
{ workExperienceId: long, timeSupportZoneId: long, timeSupportZoneName: string }
```

### WorkExperienceBenefitDto

```
{ workExperienceId: long, benefitId: long, benefitName: string, hasValue: bool, unitType: int?, value: decimal? }
```

### WorkExperienceTechStackDto

```
{ workExperienceId: long, techStackId: long, techStackName: string }
```

### WorkExperienceProjectDto

```
{ workExperienceId: long, projectId: long, projectName: string?, contribution: string? }
```

---

## Integration Pattern

### Create Candidate Dialog (all 7 sections in one form)

1. Collect all data from all sections in the form.
2. Send **one** `POST /api/candidates` with all nested arrays.
3. On `201` success, read the returned `CandidateDto` — it contains all sections with resolved names and generated IDs.
4. On error, show the error message. Nothing was saved (transactional).

### Edit Candidate (after creation)

1. **Basic info:** `PUT /api/candidates/{id}` with the updated fields.
2. **Sub-resources:** Use the individual endpoints in [Section 6](#6-sub-resource-endpoints-granular-edits) to add/remove/update specific items.
3. After any edit, re-fetch `GET /api/candidates/{id}` to get the latest full state.

### Filtered Candidate Lists

- From Certifications page: `GET /api/candidates?certificationId={id}`
- From Universities page: `GET /api/candidates?universityId={id}`
- Both can be combined: `GET /api/candidates?certificationId=7&universityId=3`

---

## Lookup APIs for Foreign Keys

All foreign key IDs in the create request must reference **existing** catalog records. Use these APIs to populate dropdowns/selects:

| Dropdown | API |
|----------|-----|
| Tech Stacks | `GET /api/tech-stacks` or `GET /api/tech-stacks/search?search=react` |
| Projects | `GET /api/projects` |
| Universities | `GET /api/universities` |
| Degrees | `GET /api/degrees` |
| Majors | `GET /api/majors` |
| Certifications | `GET /api/certifications` or `GET /api/certifications/search?search=aws` |
| Employers | `GET /api/employers` |
| Benefits | `GET /api/benefits` |
| Time Support Zones | `GET /api/time-support-zones` |
