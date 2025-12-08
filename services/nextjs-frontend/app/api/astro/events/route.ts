import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.API_URL || 'http://fastapi-backend:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams(searchParams)
    
    const response = await fetch(`${API_BASE}/astro/events?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // signal: AbortSignal.timeout(10000),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`FastAPI error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch astronomy events', details: errorText },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Если в ответе есть ошибка, возвращаем её как есть
    if (data.error) {
      return NextResponse.json(data, { status: data.code || 500 })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching astronomy events:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

