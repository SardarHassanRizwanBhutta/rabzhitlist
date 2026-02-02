import { NextRequest, NextResponse } from 'next/server'

const QUESTIONS_API_BASE_URL = process.env.QUESTIONS_API_URL || 'http://localhost:8002'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Proxying request to:', `${QUESTIONS_API_BASE_URL}/api/generate-questions`)
    
    const response = await fetch(`${QUESTIONS_API_BASE_URL}/api/generate-questions`, {
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


