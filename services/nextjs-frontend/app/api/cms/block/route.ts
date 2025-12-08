import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.API_URL || 'http://fastapi-backend:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug') || 'dashboard_experiment'
    
    const response = await fetch(`${API_BASE}/cms/block?slug=${slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // signal: AbortSignal.timeout(10000),
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch CMS block', details: await response.text() },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching CMS block:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

