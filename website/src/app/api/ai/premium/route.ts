import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 20% markup on API costs
const MARKUP_PERCENTAGE = 0.20

// Premium models (require user's API key)
const PREMIUM_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.5-haiku',
  'anthropic/claude-sonnet-4',
  'google/gemini-2.5-pro-preview',
  'google/gemini-2.5-flash-preview-05-2023',
  'openai/gpt-4o-mini',
  'openai/gpt-4.1',
  'openai/o3',
  'x-ai/grok-3-beta',
]

interface UsageRecord {
  user_id: string
  model: string
  tokens_used: number
  cost_usd: number
  markup_usd: number
  total_usd: number
  timestamp: string
}

async function logUsage(record: UsageRecord) {
  try {
    const supabase = await createClient()
    
    // Create usage table if it doesn't exist
    const { error } = await supabase
      .from('ai_usage')
      .insert({
        user_id: record.user_id,
        model: record.model,
        tokens_used: record.tokens_used,
        cost_usd: record.cost_usd,
        markup_usd: record.markup_usd,
        total_usd: record.total_usd,
        created_at: record.timestamp,
      })

    if (error) {
      console.error('Failed to log usage:', error)
    }
  } catch (error) {
    console.error('Usage logging error:', error)
  }
}

function calculateCost(model: string, tokens: number): number {
  // Simplified cost calculation (you should use actual OpenRouter pricing)
  const costPerMillion: Record<string, number> = {
    'anthropic/claude-3.5-sonnet': 3.00,
    'anthropic/claude-3.5-haiku': 0.80,
    'anthropic/claude-sonnet-4': 4.00,
    'google/gemini-2.5-pro-preview': 2.50,
    'google/gemini-2.5-flash-preview-05-2023': 0.50,
    'openai/gpt-4o-mini': 0.15,
    'openai/gpt-4.1': 10.00,
    'openai/o3': 15.00,
    'x-ai/grok-3-beta': 5.00,
  }

  const baseCost = (costPerMillion[model] || 1.00) * (tokens / 1_000_000)
  return baseCost
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required for premium models' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { model, messages, apiKey } = body

    // Validate model is premium
    if (!PREMIUM_MODELS.some(pm => model.includes(pm.split('/')[1]))) {
      return NextResponse.json(
        { error: 'Model not recognized as premium tier' },
        { status: 400 }
      )
    }

    // Validate API key provided
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key required for premium models' },
        { status: 400 }
      )
    }

    // Proxy request to OpenRouter with user's API key
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      
      // Check if it's an auth error
      if (openrouterResponse.status === 401 || openrouterResponse.status === 403) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your OpenRouter API key.' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'AI service error' },
        { status: openrouterResponse.status }
      )
    }

    const data = await openrouterResponse.json()

    // Calculate usage and costs
    const tokensUsed = (data.usage?.total_tokens || 0)
    const baseCost = calculateCost(model, tokensUsed)
    const markupCost = baseCost * MARKUP_PERCENTAGE
    const totalCost = baseCost + markupCost

    // Log usage for billing
    await logUsage({
      user_id: user.id,
      model,
      tokens_used: tokensUsed,
      cost_usd: baseCost,
      markup_usd: markupCost,
      total_usd: totalCost,
      timestamp: new Date().toISOString(),
    })

    // Add cost metadata to response
    const response = NextResponse.json({
      ...data,
      _billing: {
        tokens: tokensUsed,
        base_cost: baseCost,
        markup: markupCost,
        total: totalCost,
        markup_percentage: MARKUP_PERCENTAGE * 100,
      },
    })

    return response

  } catch (error) {
    console.error('Premium AI endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
