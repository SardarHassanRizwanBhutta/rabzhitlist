/**
 * Call Notes Extract v2 — apply engine smoke tests.
 * Run: npx tsx scripts/test-call-notes-extract-v2.ts
 */

import type { CandidateFormData } from "../src/components/candidate-creation-dialog"
import type { AllowedEmptyField, CallNotesExtraction } from "../src/types/call-notes-extraction"
import { applyCallNotesExtractionsToFormData } from "../src/lib/utils/call-notes-apply-extractions"
import type { CallNotesCatalogResolution } from "../src/lib/utils/call-notes-extract-lookup"
import { hasUnresolvedCheckedCatalogIdRows } from "../src/lib/utils/call-notes-extract-catalog"
import {
  buildEmployerCreatePrefillFromExtractRows,
  buildProjectCreatePrefillFromExtractRows,
} from "../src/lib/utils/call-notes-extract-create-prefill"

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const baseForm: CandidateFormData = {
  name: "Test",
  postingTitle: "",
  city: "",
  currentSalary: "",
  expectedSalary: "",
  cnic: "",
  contactNumber: "",
  email: "",
  linkedinUrl: "",
  githubUrl: "",
  source: "",
  callStatus: "pending",
  workExperiences: [
    {
      id: "we-1",
      employerId: null,
      employerName: "",
      jobTitle: "Engineer",
      projects: [
        {
          id: "proj-1",
          projectId: null,
          projectName: "",
          contributionNotes: "",
        },
      ],
      startDate: undefined,
      endDate: undefined,
      techStacks: [],
      shiftType: "",
      workMode: "",
      salaryPolicy: "",
      timeSupportZones: [],
      benefits: [],
    },
  ],
  certifications: [],
  educations: [],
  techStacks: [],
  personalityType: "",
  achievements: [],
  competitions: [],
}

const headcountMeta: AllowedEmptyField = {
  fieldPath: "workExperiences[we-1].headcount",
  apiFieldName: "work_experience_0_headcount",
  fieldLabel: "Headcount",
  fieldType: "number",
  requiresLinkedCatalogId: "employer",
}

const headcountExtraction: CallNotesExtraction = {
  fieldPath: "workExperiences[we-1].headcount",
  apiFieldName: "work_experience_0_headcount",
  value: 500,
  sourceText: "about 500 employees",
  confidence: 0.9,
}

// Block apply when employer not linked
assert(
  hasUnresolvedCheckedCatalogIdRows(
    new Set([headcountExtraction.fieldPath]),
    [{ fieldPath: headcountExtraction.fieldPath, requiresLinkedCatalogId: "employer" }],
    baseForm,
    new Map(),
  ),
  "expected catalog ID gate when employer unlinked",
)

const employerResolution: CallNotesCatalogResolution = {
  kind: "employer",
  catalogId: 42,
  catalogName: "Acme Corp",
}

const lookupResolutions = new Map<string, CallNotesCatalogResolution>([
  ["workExperiences[we-1].employerName", employerResolution],
])

const applied = applyCallNotesExtractionsToFormData(
  baseForm,
  [headcountExtraction],
  [headcountMeta],
  lookupResolutions,
)

assert(applied.applied.length === 1, "expected headcount applied with employer resolution")
assert(
  applied.formData.workExperiences[0].employerId === 42,
  "expected employerId from resolution",
)
assert(
  applied.formData.workExperiences[0].headcount === "500",
  "expected headcount on form",
)
assert(
  applied.formData.workExperiences[0].employerCatalogDirty === true,
  "expected employer catalog dirty flag",
)

const officeMeta: AllowedEmptyField = {
  fieldPath: "workExperiences[we-1].locations[0].country",
  apiFieldName: "work_experience_0_office_0_country",
  fieldLabel: "Country",
  fieldType: "text",
  requiresLinkedCatalogId: "employer",
}

const officeApplied = applyCallNotesExtractionsToFormData(
  applied.formData,
  [
    {
      fieldPath: officeMeta.fieldPath,
      apiFieldName: officeMeta.apiFieldName,
      value: "Pakistan",
      sourceText: "Lahore office in Pakistan",
      confidence: 0.85,
    },
  ],
  [officeMeta],
  lookupResolutions,
)

assert(officeApplied.applied.length === 1, "expected office country applied")
assert(
  officeApplied.formData.workExperiences[0].locations?.[0]?.country === "Pakistan",
  "expected auto-created office row",
)

// Employer create prefill from selected extract rows
const weId = "we-1"
const selectedPaths = new Set([
  "workExperiences[we-1].employerName",
  "workExperiences[we-1].headcount",
  "workExperiences[we-1].foundedYear",
  "workExperiences[we-1].status",
  "workExperiences[we-1].locations[0].city",
  "workExperiences[we-1].layoffs[0].affectedEmployees",
])

const employerPrefillRows: CallNotesExtraction[] = [
  {
    fieldPath: "workExperiences[we-1].employerName",
    apiFieldName: "work_experience_0_employerName",
    value: "Acme Corp",
    sourceText: "works at Acme",
    confidence: 0.9,
  },
  {
    fieldPath: "workExperiences[we-1].headcount",
    apiFieldName: "work_experience_0_headcount",
    value: 1200,
    sourceText: "1200 employees",
    confidence: 0.85,
  },
  {
    fieldPath: "workExperiences[we-1].foundedYear",
    apiFieldName: "work_experience_0_foundedYear",
    value: 1998,
    sourceText: "founded 1998",
    confidence: 0.8,
  },
  {
    fieldPath: "workExperiences[we-1].status",
    apiFieldName: "work_experience_0_status",
    value: "Active",
    sourceText: "still active",
    confidence: 0.75,
  },
  {
    fieldPath: "workExperiences[we-1].locations[0].city",
    apiFieldName: "work_experience_0_office_0_city",
    value: "Karachi",
    sourceText: "Karachi office",
    confidence: 0.7,
  },
  {
    fieldPath: "workExperiences[we-1].layoffs[0].affectedEmployees",
    apiFieldName: "work_experience_0_layoff_0_affectedEmployees",
    value: 50,
    sourceText: "laid off 50",
    confidence: 0.65,
  },
]

const employerMeta = new Map<string, AllowedEmptyField>(
  employerPrefillRows.map((r) => [
    r.fieldPath,
    { fieldPath: r.fieldPath, apiFieldName: r.apiFieldName, fieldLabel: r.fieldPath, fieldType: "text" },
  ]),
)

const employerPrefill = buildEmployerCreatePrefillFromExtractRows(
  employerPrefillRows,
  selectedPaths,
  weId,
  employerMeta,
)

assert(employerPrefill.name === "Acme Corp", "employer prefill name")
assert(employerPrefill.headcount === "1200", "employer prefill headcount")
assert(employerPrefill.foundedYear === "1998", "employer prefill foundedYear")
assert(employerPrefill.status === "open", "employer prefill status db value")
assert(employerPrefill.locations?.[0]?.city === "Karachi", "employer prefill office city")
assert(
  employerPrefill.layoffs?.[0]?.numberOfEmployeesLaidOff === "50",
  "employer prefill layoff count",
)

// Project create prefill
const projId = "proj-1"
const projectSelectedPaths = new Set([
  "workExperiences[we-1].projects[proj-1].projectName",
  "workExperiences[we-1].projects[proj-1].description",
  "workExperiences[we-1].projects[proj-1].averageTeamSize",
  "workExperiences[we-1].employerName",
])

const projectPrefillRows: CallNotesExtraction[] = [
  {
    fieldPath: "workExperiences[we-1].projects[proj-1].projectName",
    apiFieldName: "work_experience_0_project_0_projectName",
    value: "Payments Platform",
    sourceText: "payments platform",
    confidence: 0.9,
  },
  {
    fieldPath: "workExperiences[we-1].projects[proj-1].description",
    apiFieldName: "work_experience_0_project_0_description",
    value: "Core billing system",
    sourceText: "billing system",
    confidence: 0.85,
  },
  {
    fieldPath: "workExperiences[we-1].projects[proj-1].averageTeamSize",
    apiFieldName: "work_experience_0_project_0_averageTeamSize",
    value: 8,
    sourceText: "team of 8",
    confidence: 0.8,
  },
  {
    fieldPath: "workExperiences[we-1].employerName",
    apiFieldName: "work_experience_0_employerName",
    value: "Acme Corp",
    sourceText: "at Acme",
    confidence: 0.75,
  },
]

const projectMeta = new Map<string, AllowedEmptyField>(
  projectPrefillRows.map((r) => [
    r.fieldPath,
    { fieldPath: r.fieldPath, apiFieldName: r.apiFieldName, fieldLabel: r.fieldPath, fieldType: "text" },
  ]),
)

const projectPrefill = buildProjectCreatePrefillFromExtractRows(
  projectPrefillRows,
  projectSelectedPaths,
  weId,
  projId,
  projectMeta,
)

assert(
  projectPrefill.formPrefill.projectName === "Payments Platform",
  "project prefill name",
)
assert(
  projectPrefill.formPrefill.description === "Core billing system",
  "project prefill description",
)
assert(
  projectPrefill.formPrefill.averageTeamSize === "8",
  "project prefill team size",
)
assert(projectPrefill.employerNameHint === "Acme Corp", "project prefill employer hint")

// Draft create flow: defer catalog linking — apply without employer/project IDs
const employerNameMeta: AllowedEmptyField = {
  fieldPath: "workExperiences[we-1].employerName",
  apiFieldName: "work_experience_0_employerName",
  fieldLabel: "Employer",
  fieldType: "text",
  requiresLookupResolution: true,
}

const deferApplied = applyCallNotesExtractionsToFormData(
  baseForm,
  [
    {
      fieldPath: employerNameMeta.fieldPath,
      apiFieldName: employerNameMeta.apiFieldName,
      value: "NovaTech",
      sourceText: "works at NovaTech",
      confidence: 0.9,
    },
    headcountExtraction,
  ],
  [employerNameMeta, headcountMeta],
  undefined,
  { deferCatalogLinking: true },
)

assert(deferApplied.applied.length === 2, "defer mode applies name + headcount without lookup")
assert(
  deferApplied.formData.workExperiences[0].employerName === "NovaTech",
  "defer mode employer name only",
)
assert(deferApplied.formData.workExperiences[0].employerId == null, "defer mode employerId stays null")
assert(
  deferApplied.formData.workExperiences[0].headcount === "500",
  "defer mode headcount without linked employer",
)

import {
  buildEmployerCreatePrefillFromWorkExperience,
  buildProjectCreatePrefillFromProjectExperience,
} from "../src/lib/utils/call-notes-extract-create-prefill"

const wePrefill = buildEmployerCreatePrefillFromWorkExperience(
  deferApplied.formData.workExperiences[0],
)
assert(wePrefill.headcount === "500", "form-state employer prefill headcount")

console.log("call-notes-extract-v2: all tests passed")
