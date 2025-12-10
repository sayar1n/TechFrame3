import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitConfigs } from '@/utils/rateLimit'

const API_BASE = process.env.API_URL || 'http://fastapi-backend:8000'

export async function GET(request: NextRequest) {
  // ДОБАВЛЕНО: Rate limiting для Astronomy endpoints
  const rateLimitResult = checkRateLimit(request, rateLimitConfigs.astro)
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: rateLimitResult.message,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimitConfigs.astro.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    )
  }

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
    
    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': rateLimitConfigs.astro.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error fetching astronomy events:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

