import { NextRequest, NextResponse } from 'next/server'

function questionsApiBaseUrl(): string {
  const raw = process.env.QUESTIONS_API_URL?.trim()
  if (raw) return raw.replace(/\/+$/, "")
  return "http://localhost:8002"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const base = questionsApiBaseUrl()
    console.log("Proxying request to:", `${base}/api/generate-questions`)

    const response = await fetch(`${base}/api/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
      return NextResponse.json(
        { error: `API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect to questions API' },
      { status: 500 }
    )
  }
}


