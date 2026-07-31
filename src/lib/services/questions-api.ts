// Questions Generation API Service — direct browser fetch to Python LLM service
// @see docs/FRONTEND_INTEGRATION_CONTRACT.md

import type { Candidate } from "@/lib/types/candidate"
import type {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  QuestionsHealthResponse,
} from "@/types/question-generation"
import { mapMainAppCandidateToQuestionService } from "@/lib/utils/map-candidate-for-question-service"
import { buildMissingOnlyQuestionRequest } from "@/lib/utils/missing-only-question-request"

function questionsApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_QUESTIONS_API_URL?.trim()
  if (raw) return raw.replace(/\/+$/, "")
  return "http://localhost:8002"
}

export interface GenerateQuestionsOptions {
  /**
   * Narrow `fields_to_generate` after sparse build (incremental session-entry QG).
   * Return value must be non-empty or the request is rejected client-side.
   */
  fieldsToGenerateFilter?: (fields: string[]) => string[]
}

/**
 * Generate AI-powered cold-call questions.
 * FE sends sparse allowlisted values and authoritative `fields_to_generate`.
 *
 * Caller must pass an already catalog-enriched candidate (Cold Caller dialog
 * `candidateWithCatalog`). This path does not refetch employer/project catalogs.
 */
export async function generateQuestions(
  candidateId: string,
  candidate: Candidate,
  conversationContext = "cold_call",
  options?: GenerateQuestionsOptions,
): Promise<GenerateQuestionsResponse> {
  const mappedCandidateData = mapMainAppCandidateToQuestionService(candidate)
  const built = buildMissingOnlyQuestionRequest(mappedCandidateData)
  const fieldsToGenerate = options?.fieldsToGenerateFilter
    ? options.fieldsToGenerateFilter(built.fieldsToGenerate)
    : built.fieldsToGenerate
  if (fieldsToGenerate.length === 0) {
    throw new Error("Generate questions: no fields_to_generate after filter")
  }
  const request: GenerateQuestionsRequest = {
    candidate_id: candidateId,
    candidate_data: built.candidateData,
    fields_to_generate: fieldsToGenerate,
    conversation_context: conversationContext,
  }

  const response = await fetch(`${questionsApiBaseUrl()}/api/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Generate questions failed (${response.status}): ${errorBody}`)
  }

  return response.json() as Promise<GenerateQuestionsResponse>
}

/** Liveness check for the Python question generation service. */
export async function checkQuestionsApiHealth(): Promise<QuestionsHealthResponse> {
  const response = await fetch(`${questionsApiBaseUrl()}/health`)
  if (!response.ok) {
    throw new Error(`Questions API health check failed (${response.status})`)
  }
  return response.json() as Promise<QuestionsHealthResponse>
}

export function getQuestionsApiBaseUrl(): string {
  return questionsApiBaseUrl()
}
