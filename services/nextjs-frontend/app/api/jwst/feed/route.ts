import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitConfigs } from '@/utils/rateLimit'

const API_BASE = process.env.API_URL || 'http://fastapi-backend:8000'

export async function GET(request: NextRequest) {
  // ДОБАВЛЕНО: Rate limiting для JWST endpoints
  const rateLimitResult = checkRateLimit(request, rateLimitConfigs.jwst)
  
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
          'X-RateLimit-Limit': rateLimitConfigs.jwst.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams(searchParams)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд таймаут
    
    try {
      const response = await fetch(`${API_BASE}/jwst/feed?${params.toString()}`, {
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
        { error: 'Failed to fetch JWST feed', details: errorText },
        { status: response.status }
      )
    }
    
      const data = await response.json()
      return NextResponse.json(data, {
        headers: {
          'X-RateLimit-Limit': rateLimitConfigs.jwst.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        },
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error: any) {
    console.error('Error fetching JWST feed:', error)
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

