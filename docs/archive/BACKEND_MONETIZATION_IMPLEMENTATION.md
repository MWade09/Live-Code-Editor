# Backend Monetization Implementation Guide

## Overview
Implemented a secure backend proxy system for the freemium AI monetization model. This eliminates client-side API key exposure and enables 20% markup on premium requests.

## Architecture

### Free Tier (`/api/ai/free`)
- **Models**: DeepSeek R1, DeepSeek Chat, Gemma 3
- **Authentication**: None required (uses platform API key server-side)
- **Rate Limiting**: 100 requests/hour per IP address
- **Cost**: Free to users (platform pays API costs)

### Premium Tier (`/api/ai/premium`)
- **Models**: Claude, GPT-4, Gemini, Grok, etc.
- **Authentication**: Required (Supabase auth)
- **API Key**: User provides their own OpenRouter key
- **Markup**: 20% added on top of base API cost
- **Tracking**: All usage logged to `ai_usage` table for billing

## Implementation Details

### 1. Backend API Endpoints

#### `/api/ai/free` (Free Tier)
```typescript
POST /api/ai/free
Content-Type: application/json

{
  "model": "deepseek/deepseek-r1-0528:free",
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}

Response:
{
  "id": "...",
  "choices": [...],
  "usage": { "total_tokens": 123 }
}

Headers:
X-RateLimit-Remaining: 95
X-RateLimit-Limit: 100
```

Features:
- IP-based rate limiting (100 req/hour)
- Uses platform OpenRouter API key (secure server-side)
- No authentication required
- Allowed models validated server-side

#### `/api/ai/premium` (Premium Tier)
```typescript
POST /api/ai/premium
Content-Type: application/json
Authorization: Bearer <supabase-session-token>

{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [...],
  "apiKey": "sk-or-v1-user-key-here"
}

Response:
{
  "id": "...",
  "choices": [...],
  "usage": { "total_tokens": 456 },
  "_billing": {
    "tokens": 456,
    "base_cost": 0.001368,
    "markup": 0.000274,
    "total": 0.001642,
    "markup_percentage": 20
  }
}
```

Features:
- Requires Supabase authentication
- User provides their own OpenRouter API key
- 20% markup calculated and logged
- Usage tracked in `ai_usage` table
- Billing metadata returned in response

### 2. Database Schema

Created `ai_usage` table for tracking and billing:

```sql
CREATE TABLE ai_usage (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    model TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    cost_usd DECIMAL(10, 6) NOT NULL,      -- Base API cost
    markup_usd DECIMAL(10, 6) NOT NULL,    -- 20% markup
    total_usd DECIMAL(10, 6) NOT NULL,     -- Total charged
    created_at TIMESTAMP NOT NULL
);
```

Row Level Security:
- Users can view only their own usage
- Service role can insert records
- Admins can view all usage

### 3. Client-Side Integration

Updated `AIManager.js` to use backend endpoints:

**Before** (Client-side, insecure):
```javascript
// Platform key exposed in client code!
this.platformKey = 'sk-or-v1-your-platform-key-here';

fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${platformKey}` }
});
```

**After** (Server-side, secure):
```javascript
// Free models go through backend proxy
fetch(`${websiteAPI}/ai/free`, {
  method: 'POST',
  body: JSON.stringify({ model, messages })
});

// Premium models also proxied, with user's key
fetch(`${websiteAPI}/ai/premium`, {
  method: 'POST',
  body: JSON.stringify({ model, messages, apiKey: userKey })
});
```

### 4. Security Improvements

✅ **Before** (Insecure):
- Platform API key hardcoded in client JavaScript
- Anyone could extract key from browser DevTools
- No rate limiting
- No usage tracking
- Direct API calls from client

✅ **After** (Secure):
- Platform key stored in environment variable `OPENROUTER_PLATFORM_KEY`
- Never exposed to client
- Rate limiting per IP (free tier)
- Authentication required (premium tier)
- All usage logged for billing
- Backend proxy validates models

### 5. Environment Variables

Add to `.env.local`:

```bash
# OpenRouter Platform Key (for free tier)
OPENROUTER_PLATFORM_KEY=sk-or-v1-your-platform-key-here

# Site URL for OpenRouter HTTP-Referer
NEXT_PUBLIC_SITE_URL=https://ailiveeditor.netlify.app
```

### 6. Rate Limiting

Current implementation uses in-memory storage:

```typescript
const requestCounts = new Map<string, { count: number; resetAt: number }>()
```

**For Production**: Replace with Redis:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

async function checkRateLimit(clientId: string) {
  const key = `rate:${clientId}`
  const count = await redis.incr(key)
  
  if (count === 1) {
    await redis.expire(key, 3600) // 1 hour
  }
  
  return {
    allowed: count <= RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - count)
  }
}
```

### 7. Cost Calculation

Simplified pricing table (update with actual OpenRouter rates):

```typescript
const costPerMillion: Record<string, number> = {
  'anthropic/claude-3.5-sonnet': 3.00,
  'anthropic/claude-3.5-haiku': 0.80,
  'openai/gpt-4o-mini': 0.15,
  'openai/gpt-4.1': 10.00,
  // ... more models
}

function calculateCost(model: string, tokens: number): number {
  const baseCost = (costPerMillion[model] || 1.00) * (tokens / 1_000_000)
  return baseCost
}
```

## Deployment Checklist

### 1. Database Setup
```bash
# Run migration to create ai_usage table
cd website
supabase db push database-migrations/003_ai_usage_table.sql
```

### 2. Environment Variables
```bash
# Add to Netlify environment variables
OPENROUTER_PLATFORM_KEY=sk-or-v1-...
NEXT_PUBLIC_SITE_URL=https://ailiveeditor.netlify.app
```

### 3. Deploy
```bash
git add -A
git commit -m "Implement secure backend AI proxy with 20% markup"
git push origin main
```

### 4. Verify
1. Test free tier: Use DeepSeek model without API key
2. Test rate limiting: Make 100+ requests from same IP
3. Test premium tier: Use Claude with your OpenRouter key
4. Check usage logging: Query `ai_usage` table
5. Verify billing: Check `_billing` metadata in responses

## Usage Analytics

Query total usage by user:

```sql
SELECT 
  user_id,
  COUNT(*) as requests,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost,
  SUM(markup_usd) as total_markup,
  SUM(total_usd) as total_revenue
FROM ai_usage
GROUP BY user_id
ORDER BY total_revenue DESC;
```

Query daily revenue:

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as requests,
  SUM(total_usd) as revenue,
  SUM(markup_usd) as profit
FROM ai_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Revenue Projections

**Assumptions**:
- 100 active premium users
- Average 100 requests/month per user
- Average 1000 tokens per request
- Average model cost: $3/million tokens

**Calculations**:
```
Requests/month: 100 users × 100 requests = 10,000 requests
Tokens/month: 10,000 × 1,000 = 10M tokens
Base API cost: 10M × ($3/1M) = $30
Platform markup (20%): $30 × 0.20 = $6
Monthly profit: $6
Annual profit: $72

With 1,000 users: $720/year
With 10,000 users: $7,200/year
```

## Next Steps

1. ✅ Implement backend endpoints
2. ✅ Add database schema
3. ✅ Update client to use backend
4. ✅ Add security (auth, rate limiting)
5. ⏭️ Deploy to production
6. ⏭️ Migrate to Redis for rate limiting
7. ⏭️ Build usage analytics dashboard
8. ⏭️ Implement billing system (Stripe integration)
9. ⏭️ Add webhook for usage alerts
10. ⏭️ Monitor costs and optimize

## Security Notes

**CRITICAL**: Never commit the platform API key to Git!

```bash
# Check if key is exposed
git log -p | grep -i "sk-or-v1"

# If found, immediately:
1. Rotate the API key at openrouter.ai
2. Remove from Git history (use BFG Repo-Cleaner)
3. Update environment variable
```

**Best Practices**:
- Store platform key in Netlify environment variables
- Use service role key for database operations
- Validate all inputs server-side
- Log suspicious activity (e.g., 100+ requests/min)
- Monitor API costs daily
- Set up billing alerts at OpenRouter
