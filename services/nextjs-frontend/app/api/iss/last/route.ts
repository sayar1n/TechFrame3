import { NextRequest, NextResponse } from 'next/server'

// В серверных API routes используем внутренний URL контейнера
const API_BASE = process.env.API_URL || 'http://fastapi-backend:8000'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE}/last`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Добавляем таймаут
    //   signal: AbortSignal.timeout(10000),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`FastAPI error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch ISS data', details: errorText },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching ISS data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

