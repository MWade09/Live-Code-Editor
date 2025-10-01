import { NextRequest, NextResponse } from 'next/server'

// Platform OpenRouter API key for free models
// TODO: Move to environment variable for security
const PLATFORM_API_KEY = process.env.OPENROUTER_PLATFORM_KEY || ''

// Rate limiting: simple in-memory store (use Redis in production)
const requestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 100 // requests per hour
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

// Allowed free models
const FREE_MODELS = [
  'deepseek/deepseek-r1-0528:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-27b-it:free',
]

function getClientId(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return ip
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = requestCounts.get(clientId)

  if (!record || now > record.resetAt) {
    // New window
    requestCounts.set(clientId, { count: 1, resetAt: now + RATE_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT - record.count }
}

export async function POST(request: NextRequest) {
  try {
    if (!PLATFORM_API_KEY) {
      console.error('OPENROUTER_PLATFORM_KEY not configured')
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { model, messages } = body

    // Validate model is in free tier
    if (!FREE_MODELS.includes(model)) {
      return NextResponse.json(
        { error: 'Model not allowed for free tier. Use a 🆓 free model or add your API key for 🔑 premium models.' },
        { status: 403 }
      )
    }

    // Check rate limit
    const clientId = getClientId(request)
    const { allowed, remaining } = checkRateLimit(clientId)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later or use your own API key for premium models.' },
        { status: 429 }
      )
    }

    // Proxy request to OpenRouter with platform key
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PLATFORM_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://ailiveeditor.netlify.app',
        'X-Title': 'AI Live Editor',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    })

    if (!openrouterResponse.ok) {
      const errorData = await openrouterResponse.text()
      console.error('OpenRouter API error:', errorData)
      return NextResponse.json(
        { error: 'AI service error' },
        { status: openrouterResponse.status }
      )
    }

    const data = await openrouterResponse.json()

    // Add rate limit headers
    const response = NextResponse.json(data)
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString())

    return response

  } catch (error) {
    console.error('Free AI endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
