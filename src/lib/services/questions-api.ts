// Questions Generation API Service

import type { Candidate } from '@/lib/types/candidate'
import type { GenerateQuestionsRequest, GenerateQuestionsResponse } from '@/types/cold-caller'

/**
 * Generate AI-powered questions for cold calling based on missing candidate fields
 * Uses Next.js API route to proxy requests to the FastAPI server (avoids CORS issues)
 */
export async function generateQuestions(
  candidateId: string,
  missingFields: string[],
  candidateData: Candidate
): Promise<GenerateQuestionsResponse> {
  const requestBody: GenerateQuestionsRequest = {
    candidate_id: candidateId,
    missing_fields: missingFields,
    candidate_data: candidateData,
    conversation_context: 'cold_call'
  }

  // Use local Next.js API route to proxy the request (avoids CORS)
  const url = '/api/generate-questions'
  
  console.log('Calling Questions API via proxy:', url)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('Response status:', response.status)

    const data = await response.json()
    
    if (!response.ok) {
      console.error('API Error Response:', data)
      throw new Error(data.error || `API Error: ${response.status}`)
    }

    console.log('API Response:', data)
    return data
  } catch (error) {
    console.error('Fetch error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the API. Please check if the server is running.')
      }
      throw error
    }
    
    throw new Error('An unexpected error occurred while generating questions.')
  }
}

/**
 * Check if the questions API is healthy
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate_id: 'health-check',
        missing_fields: [],
        candidate_data: {},
        conversation_context: 'health_check'
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get the API base URL (useful for debugging)
 */
export function getApiBaseUrl(): string {
  return '/api/generate-questions (proxied)'
}
