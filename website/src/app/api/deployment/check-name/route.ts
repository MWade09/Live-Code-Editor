import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NetlifyClient } from '@/lib/deployment/netlify-client'
import { sanitizeProjectName } from '@/lib/deployment/deployment-helpers'
import { decryptToken } from '@/lib/deployment/encryption'
import {
  checkRateLimit,
  getRateLimitHeaders,
  createRateLimitError,
} from '@/lib/deployment/rate-limit'

/**
 * POST /api/deployment/check-name
 * Check if a deployment site name is available
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id, 'checkName')
    if (!rateLimit.allowed) {
      const error = createRateLimitError({
        limit: rateLimit.limit,
        resetTime: rateLimit.resetTime,
      })
      return NextResponse.json(
        { error: error.error },
        {
          status: 429,
          headers: {
            ...getRateLimitHeaders(rateLimit),
            'Retry-After': error.retryAfter.toString(),
          },
        }
      )
    }

    const { siteName, platform } = await req.json()

    // Validate input
    if (!siteName || !platform) {
      return NextResponse.json(
        { error: 'Site name and platform are required' },
        { status: 400 }
      )
    }

    if (!['netlify', 'vercel'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Sanitize the site name
    const sanitizedName = sanitizeProjectName(siteName)

    if (platform === 'netlify') {
      // Get deployment token
      const { data: tokenData, error: tokenError } = await supabase
        .from('deployment_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('platform', 'netlify')
        .single()

      if (tokenError || !tokenData) {
        return NextResponse.json(
          { error: 'No Netlify token found. Please connect your account first.' },
          { status: 400 }
        )
      }

      // Decrypt the token
      let accessToken: string
      try {
        accessToken = decryptToken(tokenData.access_token)
      } catch (error) {
        console.error('Failed to decrypt token:', error)
        return NextResponse.json(
          { error: 'Failed to decrypt authentication token' },
          { status: 500 }
        )
      }

      const client = new NetlifyClient(accessToken)
      const result = await client.checkSiteNameAvailability(sanitizedName)

      return NextResponse.json({
        sanitizedName,
        available: result.available,
        suggestion: result.suggestion,
      })
    }

    // For Vercel or other platforms
    return NextResponse.json({
      sanitizedName,
      available: true,
      message: 'Name availability check not implemented for this platform',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
