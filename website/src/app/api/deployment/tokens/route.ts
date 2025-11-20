import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptToken, validateEncryptionSetup } from '@/lib/deployment/encryption'
import {
  checkRateLimit,
  getRateLimitHeaders,
  createRateLimitError,
} from '@/lib/deployment/rate-limit'

/**
 * GET /api/deployment/tokens
 * Get deployment tokens for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id, 'token')
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

    // Get tokens (without exposing actual token values)
    const { data: tokens, error } = await supabase
      .from('deployment_tokens')
      .select('id, platform, created_at, updated_at, expires_at')
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to fetch tokens:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tokens: tokens || [],
      netlifyConnected: tokens?.some((t) => t.platform === 'netlify') || false,
      vercelConnected: tokens?.some((t) => t.platform === 'vercel') || false,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/deployment/tokens
 * Save or update a deployment token
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
    const rateLimit = checkRateLimit(user.id, 'token')
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

    // Validate encryption is properly set up
    if (!validateEncryptionSetup()) {
      console.error('Encryption key not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { platform, accessToken } = await req.json()

    // Validate input
    if (!platform || !accessToken) {
      return NextResponse.json(
        { error: 'Platform and access token are required' },
        { status: 400 }
      )
    }

    if (!['netlify', 'vercel'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Encrypt the token before storing
    const encryptedToken = encryptToken(accessToken)

    const { error } = await supabase
      .from('deployment_tokens')
      .upsert(
        {
          user_id: user.id,
          platform,
          access_token: encryptedToken,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,platform',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Failed to save token:', error)
      return NextResponse.json(
        { error: 'Failed to save token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      platform,
      message: `${platform} token saved successfully`,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/deployment/tokens?platform=netlify
 * Delete a deployment token
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id, 'token')
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

    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform')

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform parameter is required' },
        { status: 400 }
      )
    }

    if (!['netlify', 'vercel'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    const { error } = await supabase
      .from('deployment_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform)

    if (error) {
      console.error('Failed to delete token:', error)
      return NextResponse.json(
        { error: 'Failed to delete token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      platform,
      message: `${platform} token deleted successfully`,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
