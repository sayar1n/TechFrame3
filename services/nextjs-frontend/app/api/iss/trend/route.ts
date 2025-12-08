import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.API_URL || 'http://fastapi-backend:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '240'
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд таймаут
    
    try {
      const response = await fetch(`${API_BASE}/iss/trend?limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`FastAPI error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch ISS trend', details: errorText },
        { status: response.status }
      )
    }
    
      const data = await response.json()
      return NextResponse.json(data)
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error: any) {
    console.error('Error fetching ISS trend:', error)
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout', details: 'The request took too long to complete' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

