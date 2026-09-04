/**
 * Call Notes Extract v2 — apply engine smoke tests.
 * Run: npx tsx scripts/test-call-notes-extract-v2.ts
 */

import type { CandidateFormData } from "../src/components/candidate-creation-dialog"
import type { Candidate } from "../src/lib/types/candidate"
import type { AllowedEmptyField, CallNotesExtraction } from "../src/types/call-notes-extraction"
import { applyCallNotesExtractionsToFormData } from "../src/lib/utils/call-notes-apply-extractions"
import type { CallNotesCatalogResolution } from "../src/lib/utils/call-notes-extract-lookup"
import { hasUnresolvedCheckedCatalogIdRows } from "../src/lib/utils/call-notes-extract-catalog"
import { buildCallNotesExtractCandidateSnapshot } from "../src/lib/utils/call-notes-extract-snapshot"
import {
  buildEmployerCreatePrefillFromExtractRows,
  buildEmployerCreatePrefillFromWorkExperience,
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
      employerLocationId: null,
      employerName: "",
      jobTitle: "Engineer",
      projects: [
        {
          id: "proj-1",
          projectId: null,
          projectName: "",
          contributionNotes: "",
          isMainContribution: false,
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

const multiOfficeMeta: AllowedEmptyField[] = [0, 1, 2].map((i) => ({
  fieldPath: `workExperiences[we-1].locations[${i}].city`,
  apiFieldName: `work_experience_0_office_${i}_city`,
  fieldLabel: "City",
  fieldType: "text" as const,
  requiresLinkedCatalogId: "employer" as const,
}))
const multiOfficeApplied = applyCallNotesExtractionsToFormData(
  baseForm,
  [
    {
      fieldPath: multiOfficeMeta[0].fieldPath,
      apiFieldName: multiOfficeMeta[0].apiFieldName,
      value: "Islamabad",
      sourceText: "Islamabad head office",
      confidence: 1,
    },
    {
      fieldPath: multiOfficeMeta[1].fieldPath,
      apiFieldName: multiOfficeMeta[1].apiFieldName,
      value: "Lahore",
      sourceText: "Lahore office",
      confidence: 1,
    },
    {
      fieldPath: multiOfficeMeta[2].fieldPath,
      apiFieldName: multiOfficeMeta[2].apiFieldName,
      value: "Karachi",
      sourceText: "Karachi office",
      confidence: 1,
    },
  ],
  multiOfficeMeta,
  lookupResolutions,
  { deferCatalogLinking: true },
)
assert(multiOfficeApplied.applied.length === 3, "expected three office cities applied")
assert(
  multiOfficeApplied.formData.workExperiences[0].locations?.[0]?.city === "Islamabad",
  "expected office 0 Islamabad",
)
assert(
  multiOfficeApplied.formData.workExperiences[0].locations?.[1]?.city === "Lahore",
  "expected office 1 Lahore",
)
assert(
  multiOfficeApplied.formData.workExperiences[0].locations?.[2]?.city === "Karachi",
  "expected office 2 Karachi",
)

const multiOfficePrefillPaths = new Set(multiOfficeMeta.map((m) => m.fieldPath))
const multiOfficePrefill = buildEmployerCreatePrefillFromExtractRows(
  [
    {
      fieldPath: multiOfficeMeta[0].fieldPath,
      apiFieldName: multiOfficeMeta[0].apiFieldName,
      value: "Islamabad",
      sourceText: "Islamabad",
      confidence: 1,
    },
    {
      fieldPath: multiOfficeMeta[1].fieldPath,
      apiFieldName: multiOfficeMeta[1].apiFieldName,
      value: "Lahore",
      sourceText: "Lahore",
      confidence: 1,
    },
    {
      fieldPath: multiOfficeMeta[2].fieldPath,
      apiFieldName: multiOfficeMeta[2].apiFieldName,
      value: "Karachi",
      sourceText: "Karachi",
      confidence: 1,
    },
  ],
  multiOfficePrefillPaths,
  "we-1",
  new Map(
    multiOfficeMeta.map((m) => [
      m.fieldPath,
      { ...m, fieldType: "text" as const },
    ]),
  ),
)
assert(multiOfficePrefill.locations?.length === 3, "expected three employer prefill offices")
assert(multiOfficePrefill.locations?.[0]?.city === "Islamabad", "prefill office 0")
assert(multiOfficePrefill.locations?.[1]?.city === "Lahore", "prefill office 1")
assert(multiOfficePrefill.locations?.[2]?.city === "Karachi", "prefill office 2")

// Headquarters: office rows default isHeadquarters to false; extract true must still apply,
// then employer-create prefill from the WE row must copy the HQ switch.
const hqOfficeMeta: AllowedEmptyField[] = [
  {
    fieldPath: "workExperiences[we-1].locations[0].city",
    apiFieldName: "work_experience_0_office_0_city",
    fieldLabel: "City",
    fieldType: "text",
    requiresLinkedCatalogId: "employer",
  },
  {
    fieldPath: "workExperiences[we-1].locations[0].isHeadquarters",
    apiFieldName: "work_experience_0_office_0_isHeadquarters",
    fieldLabel: "Headquarters",
    fieldType: "boolean",
    requiresLinkedCatalogId: "employer",
  },
  {
    fieldPath: "workExperiences[we-1].locations[1].city",
    apiFieldName: "work_experience_0_office_1_city",
    fieldLabel: "City",
    fieldType: "text",
    requiresLinkedCatalogId: "employer",
  },
  {
    fieldPath: "workExperiences[we-1].locations[1].isHeadquarters",
    apiFieldName: "work_experience_0_office_1_isHeadquarters",
    fieldLabel: "Headquarters",
    fieldType: "boolean",
    requiresLinkedCatalogId: "employer",
  },
]
const hqOfficeApplied = applyCallNotesExtractionsToFormData(
  baseForm,
  [
    {
      fieldPath: hqOfficeMeta[0].fieldPath,
      apiFieldName: hqOfficeMeta[0].apiFieldName,
      value: "Islamabad",
      sourceText: "Islamabad head office",
      confidence: 1,
    },
    {
      fieldPath: hqOfficeMeta[1].fieldPath,
      apiFieldName: hqOfficeMeta[1].apiFieldName,
      value: true,
      sourceText: "this is Head office",
      confidence: 1,
    },
    {
      fieldPath: hqOfficeMeta[2].fieldPath,
      apiFieldName: hqOfficeMeta[2].apiFieldName,
      value: "Lahore",
      sourceText: "Lahore office",
      confidence: 1,
    },
    {
      fieldPath: hqOfficeMeta[3].fieldPath,
      apiFieldName: hqOfficeMeta[3].apiFieldName,
      value: false,
      sourceText: "Lahore office",
      confidence: 1,
    },
  ],
  hqOfficeMeta,
  lookupResolutions,
  { deferCatalogLinking: true },
)
assert(
  hqOfficeApplied.applied.some((p) => p === hqOfficeMeta[1].fieldPath),
  "expected office 0 isHeadquarters true to apply over default false",
)
assert(
  hqOfficeApplied.formData.workExperiences[0].locations?.[0]?.isHeadquarters === true,
  "expected Islamabad office HQ true on form after apply",
)
assert(
  hqOfficeApplied.formData.workExperiences[0].locations?.[1]?.isHeadquarters === false,
  "expected Lahore office HQ false on form after apply",
)
const hqCreatePrefill = buildEmployerCreatePrefillFromWorkExperience(
  hqOfficeApplied.formData.workExperiences[0],
)
assert(hqCreatePrefill.locations?.[0]?.city === "Islamabad", "WE prefill Islamabad city")
assert(
  hqCreatePrefill.locations?.[0]?.isHeadquarters === true,
  "WE prefill must copy HQ true onto employer create Islamabad office",
)
assert(hqCreatePrefill.locations?.[1]?.isHeadquarters === false, "WE prefill Lahore HQ false")

const hqAlreadyTrueForm: CandidateFormData = {
  ...hqOfficeApplied.formData,
  workExperiences: hqOfficeApplied.formData.workExperiences.map((we, i) =>
    i !== 0
      ? we
      : {
          ...we,
          locations: we.locations?.map((loc, li) =>
            li === 0 ? { ...loc, isHeadquarters: true } : loc,
          ),
        },
  ),
}
const hqOverwriteBlocked = applyCallNotesExtractionsToFormData(
  hqAlreadyTrueForm,
  [
    {
      fieldPath: hqOfficeMeta[1].fieldPath,
      apiFieldName: hqOfficeMeta[1].apiFieldName,
      value: false,
      sourceText: "not HQ",
      confidence: 1,
    },
  ],
  [hqOfficeMeta[1]],
  lookupResolutions,
  { deferCatalogLinking: true },
)
assert(
  hqOverwriteBlocked.applied.length === 0,
  "empty-only apply must not turn HQ off when it is already true",
)
assert(
  hqOverwriteBlocked.formData.workExperiences[0].locations?.[0]?.isHeadquarters === true,
  "expected HQ to stay true when extract sends false",
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
    value: "Open",
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

// Nested project apply: combobox name + description (not contribution) on projects[0]
const jazzProjectMeta: AllowedEmptyField[] = [
  {
    fieldPath: "workExperiences[we-1].projects[0].projectName",
    apiFieldName: "work_experience_0_project_0_projectName",
    fieldLabel: "Name",
    fieldType: "combobox",
    requiresLookupResolution: true,
  },
  {
    fieldPath: "workExperiences[we-1].projects[0].description",
    apiFieldName: "work_experience_0_project_0_description",
    fieldLabel: "Description",
    fieldType: "textarea",
    requiresLinkedCatalogId: "project",
  },
  {
    fieldPath: "workExperiences[we-1].projects[0].contributionNotes",
    apiFieldName: "work_experience_0_project_0_contributionNotes",
    fieldLabel: "Contribution",
    fieldType: "textarea",
  },
]
const jazzDescription =
  "Pakistan Mobile Communications Limited) is the largest mobile network and digital services operator in Pakistan, serving over 75 million subscribers"
const jazzContribution = "Owned WSO2 integration delivery on Jazz."
const jazzProjectApplied = applyCallNotesExtractionsToFormData(
  {
    ...baseForm,
    workExperiences: baseForm.workExperiences.map((we) => ({
      ...we,
      projects: we.projects.map((p) => ({
        ...p,
        projectName: "",
        contributionNotes: "",
        description: "",
      })),
    })),
  },
  [
    {
      fieldPath: jazzProjectMeta[0].fieldPath,
      apiFieldName: jazzProjectMeta[0].apiFieldName,
      value: "Jazz Project",
      sourceText: "Working on Jazz Project.",
      confidence: 1,
    },
    {
      fieldPath: jazzProjectMeta[1].fieldPath,
      apiFieldName: jazzProjectMeta[1].apiFieldName,
      value: jazzDescription,
      sourceText: "Project Discription:  Pakistan Mobile Communications Limited)",
      confidence: 1,
    },
    {
      fieldPath: jazzProjectMeta[2].fieldPath,
      apiFieldName: jazzProjectMeta[2].apiFieldName,
      value: jazzContribution,
      sourceText: "Contribution: Owned WSO2 integration delivery on Jazz.",
      confidence: 1,
    },
  ],
  jazzProjectMeta,
  lookupResolutions,
  { deferCatalogLinking: true },
)
assert(
  jazzProjectApplied.applied.includes(jazzProjectMeta[0].fieldPath),
  "expected projectName applied with deferCatalogLinking despite requiresLookupResolution",
)
assert(
  jazzProjectApplied.applied.includes(jazzProjectMeta[1].fieldPath),
  "expected description applied",
)
assert(
  jazzProjectApplied.applied.includes(jazzProjectMeta[2].fieldPath),
  "expected contributionNotes applied when extract returns contribution-specific text",
)
assert(
  jazzProjectApplied.formData.workExperiences[0].projects[0].projectName === "Jazz Project",
  "expected Jazz Project name on WE project row",
)
assert(
  jazzProjectApplied.formData.workExperiences[0].projects[0].description === jazzDescription,
  "expected Jazz description on WE project row",
)
assert(
  jazzProjectApplied.formData.workExperiences[0].projects[0].contributionNotes === jazzContribution,
  "expected contributionNotes to stay separate from description",
)
assert(
  jazzProjectApplied.formData.workExperiences[0].projects[0].contributionNotes !==
    jazzDescription,
  "description paragraph must not be stored as contributionNotes",
)

const jazzEmptyProjectsApplied = applyCallNotesExtractionsToFormData(
  {
    ...baseForm,
    workExperiences: baseForm.workExperiences.map((we) => ({ ...we, projects: [] })),
  },
  [
    {
      fieldPath: jazzProjectMeta[0].fieldPath,
      apiFieldName: jazzProjectMeta[0].apiFieldName,
      value: "Jazz Project",
      sourceText: "Working on Jazz Project.",
      confidence: 1,
    },
    {
      fieldPath: jazzProjectMeta[1].fieldPath,
      apiFieldName: jazzProjectMeta[1].apiFieldName,
      value: jazzDescription,
      sourceText: "Project Discription:",
      confidence: 1,
    },
  ],
  jazzProjectMeta,
  lookupResolutions,
  { deferCatalogLinking: true },
)
assert(
  jazzEmptyProjectsApplied.formData.workExperiences[0].projects[0]?.projectName === "Jazz Project",
  "expected auto-created project row from projects[0] path",
)
assert(
  jazzEmptyProjectsApplied.formData.workExperiences[0].projects[0]?.description === jazzDescription,
  "expected description on auto-created project row",
)
assert(
  !jazzEmptyProjectsApplied.formData.workExperiences[0].projects[0]?.contributionNotes?.trim(),
  "expected contributionNotes empty when extract did not return it",
)

const extractSnap = buildCallNotesExtractCandidateSnapshot({
  id: "1",
  workExperiences: [
    {
      id: "4ae422ac-1c93-48d9-bb7b-137045314df1",
      employerName: "Arcana Info",
      jobTitle: "Senior WSO2 Integration / Middleware Engineer",
      projects: [],
    },
  ],
} as unknown as Candidate)
assert(
  extractSnap.workExperiences?.[0]?.projects?.length === 1,
  "extract snapshot pads synthetic project slot when WE has no projects",
)
assert(
  extractSnap.workExperiences?.[0]?.projects?.[0]?.id === "0",
  "extract snapshot synthetic project id is 0",
)

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

const wePrefill = buildEmployerCreatePrefillFromWorkExperience(
  deferApplied.formData.workExperiences[0],
)
assert(wePrefill.headcount === "500", "form-state employer prefill headcount")

import { paddedEmployerOfficeSlotCount } from "../src/lib/utils/qg-field-weights"
import { buildMissingOnlyQuestionRequest } from "../src/lib/utils/missing-only-question-request"

assert(paddedEmployerOfficeSlotCount(0) === 5, "cap when empty")
assert(paddedEmployerOfficeSlotCount(2) === 5, "pad two offices to cap")
assert(paddedEmployerOfficeSlotCount(7) === 7, "keep offices above cap")

const qgOffices = buildMissingOnlyQuestionRequest({ workExperiences: [{}] })
assert(
  qgOffices.fieldsToGenerate.includes("work_experience_0_office_4_city"),
  "generate-questions includes fifth office slot",
)
assert(
  !qgOffices.fieldsToGenerate.includes("work_experience_0_office_5_city"),
  "generate-questions does not add a sixth office slot",
)

console.log("call-notes-extract-v2: all tests passed")
