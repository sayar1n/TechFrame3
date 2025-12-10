import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitConfigs } from '@/utils/rateLimit'

// В серверных API routes используем внутренний URL контейнера
const API_BASE = process.env.API_URL || 'http://fastapi-backend:8000'

export async function GET(request: NextRequest) {
  // ДОБАВЛЕНО: Rate limiting для ISS endpoints
  const rateLimitResult = checkRateLimit(request, rateLimitConfigs.iss)
  
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
          'X-RateLimit-Limit': rateLimitConfigs.iss.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    )
  }

  try {
    const response = await fetch(`${API_BASE}/iss/last`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`FastAPI error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch ISS data', details: errorText },
        {
          status: response.status,
          headers: {
            'X-RateLimit-Limit': rateLimitConfigs.iss.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': rateLimitConfigs.iss.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error fetching ISS data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

