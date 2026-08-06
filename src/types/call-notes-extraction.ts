/**
 * Call Notes Extract — request/response types and Zod schemas.
 * @see docs/CALL_NOTES_EXTRACT_API_CONTRACT.md
 */

import { z } from "zod"

export const allowedEmptyFieldTypeSchema = z.enum([
  "text",
  "number",
  "select",
  "date",
  "multiselect",
  "benefits",
  "boolean",
  "textarea",
  "combobox",
])

export type AllowedEmptyFieldType = z.infer<typeof allowedEmptyFieldTypeSchema>

export const fieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
})

export const allowedEmptyFieldSchema = z.object({
  fieldPath: z.string().min(1),
  apiFieldName: z.string().min(1),
  fieldLabel: z.string().min(1),
  fieldType: allowedEmptyFieldTypeSchema,
  context: z.string().optional(),
  options: z.array(fieldOptionSchema).optional(),
  requiresLookupResolution: z.boolean().optional(),
})

export type AllowedEmptyField = z.infer<typeof allowedEmptyFieldSchema>

export const callNotesExtractWorkExperienceSnapshotSchema = z.object({
  id: z.string(),
  employerName: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  projects: z
    .array(
      z.object({
        id: z.string(),
        projectName: z.string().nullable().optional(),
      }),
    )
    .optional(),
})

export const callNotesExtractCandidateSnapshotSchema = z.object({
  candidateId: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  currentSalary: z.number().nullable().optional(),
  expectedSalary: z.number().nullable().optional(),
  techStacks: z.array(z.string()).optional(),
  workExperiences: z.array(callNotesExtractWorkExperienceSnapshotSchema).optional(),
  certifications: z
    .array(
      z.object({
        id: z.string(),
        certificationName: z.string().nullable().optional(),
      }),
    )
    .optional(),
  achievements: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().nullable().optional(),
      }),
    )
    .optional(),
  hasResume: z.boolean().optional(),
})

export type CallNotesExtractCandidateSnapshot = z.infer<
  typeof callNotesExtractCandidateSnapshotSchema
>

export const callNotesExtractRequestSchema = z.object({
  rawNotes: z.string(),
  candidateSnapshot: callNotesExtractCandidateSnapshotSchema.optional(),
  allowedEmptyFields: z.array(allowedEmptyFieldSchema).min(1),
})

export type CallNotesExtractRequest = z.infer<typeof callNotesExtractRequestSchema>

export const callNotesExtractionSchema = z.object({
  fieldPath: z.string().min(1),
  apiFieldName: z.string().min(1),
  value: z.unknown(),
  sourceText: z.string(),
  confidence: z.number().min(0).max(1),
})

export type CallNotesExtraction = z.infer<typeof callNotesExtractionSchema>

export const callNotesExtractResponseSchema = z.object({
  extractions: z.array(callNotesExtractionSchema),
  meta: z
    .object({
      model: z.string().optional(),
      processingMs: z.number().optional(),
    })
    .optional(),
})

export type CallNotesExtractResponse = z.infer<typeof callNotesExtractResponseSchema>
