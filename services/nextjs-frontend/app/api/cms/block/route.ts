import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitConfigs } from '@/utils/rateLimit'

const API_BASE = process.env.API_URL || 'http://fastapi-backend:8000'

export async function GET(request: NextRequest) {
  // ДОБАВЛЕНО: Rate limiting для CMS endpoints
  const rateLimitResult = checkRateLimit(request, rateLimitConfigs.cms)
  
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
          'X-RateLimit-Limit': rateLimitConfigs.cms.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    )
  }

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
    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': rateLimitConfigs.cms.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error fetching CMS block:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

