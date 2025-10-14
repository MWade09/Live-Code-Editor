# Platform Key System - Proper Implementation

## System Architecture

The editor uses a **platform key system** to provide free AI access:

1. **Backend API** (`/api/ai/free`) - Uses platform's OpenRouter key for free models
2. **Backend API** (`/api/ai/premium`) - Uses user's personal key for premium models  
3. **Static Editor** (`/editor/`) - Makes requests to backend APIs

## How It Works

### Free Models (No User Key Needed)
```javascript
// User selects: 🆓 DeepSeek Chat V3.0324 (Free)
fetch('/api/ai/free', {
    method: 'POST',
    body: JSON.stringify({ model, messages })
})
// Backend uses: OPENROUTER_PLATFORM_KEY environment variable
// User sees: "🆓 Chat using free tier for model: deepseek/..."
```

### Premium Models (User Key Required)
```javascript
// User selects: 🔑 Claude 3.5 Sonnet
fetch('/api/ai/premium', {
    method: 'POST',
    body: JSON.stringify({ model, messages, apiKey: userKey })
})
// Backend uses: User's personal API key
// User sees: "💳 Chat using premium tier for model: anthropic/..."
```

## Rate Limiting

The `/api/ai/free` endpoint enforces:
- **100 requests per hour** per IP address
- **Only free-tier models** allowed
- Response headers show remaining quota

## Configuration

### Environment Variables (Backend)
```bash
# .env.local
OPENROUTER_PLATFORM_KEY=sk-or-v1-xxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Free Models List
Defined in both frontend and backend:
```javascript
const freeModels = [
    'deepseek/deepseek-r1-0528:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'google/gemma-3-27b-it:free'
];
```

## Files Modified

### 1. `chat-panel.js` (Chat Mode)
**Lines ~250-280:**
```javascript
if (isFreeModel) {
    // No user key needed - backend uses platform key
    response = await fetch('/api/ai/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages })
    });
} else {
    // Premium model - requires user's key
    if (!apiKey) {
        addSystemMessage('This model requires an API key...');
        return;
    }
    response = await fetch('/api/ai/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, apiKey })
    });
}
```

### 2. `chat-panel.js` (Agent Mode)
**Lines ~400-430:**
Same pattern as Chat Mode

### 3. `index.html`
**Lines ~196-208:**
Restored "🆓 Free" labels for free models

## Backend API Routes

### `/api/ai/free/route.ts`
- Uses `process.env.OPENROUTER_PLATFORM_KEY`
- Rate limits by IP address (100/hour)
- Only allows FREE_MODELS array
- Returns 403 if model not in free tier
- Returns 429 if rate limit exceeded

### `/api/ai/premium/route.ts`
- Uses `apiKey` from request body (user's key)
- No rate limiting (user pays for usage)
- Allows any model
- Returns detailed billing info

## Testing

### 1. Test Free Models (No User Key)
1. Open editor through main website domain
2. Don't enter any API key
3. Select "🆓 DeepSeek Chat V3.0324 (Free)"
4. Send message: "Hello"
5. **Expected:** Response within 2-3 seconds
6. **Console:** `🆓 Chat using free tier for model: deepseek/deepseek-chat-v3-0324:free`
7. **Console:** `ℹ️ Free tier requests remaining: 99`

### 2. Test Premium Models (User Key Required)
1. Select "🔑 Claude 3.5 Sonnet"
2. Try to send without API key
3. **Expected:** Error message asking for API key
4. Add your OpenRouter API key
5. Send message again
6. **Expected:** Response from Claude
7. **Console:** `💳 Chat using premium tier for model: anthropic/claude-3.5-sonnet`

### 3. Test Rate Limiting
1. Send 100 requests with free model (no key)
2. On 101st request:
3. **Expected:** "Rate limit exceeded..." error
4. **Status:** 429 Too Many Requests

## Common Issues

### Issue: "Failed to fetch" or CORS error
**Cause:** Editor accessed directly from file system or different domain than backend
**Solution:** Access editor through main website domain (same origin as Next.js backend)

### Issue: "Service configuration error: Platform API key not set"
**Cause:** `OPENROUTER_PLATFORM_KEY` not set in environment variables
**Solution:** Add to `.env.local` and restart dev server / redeploy

### Issue: 401 Unauthorized on free models
**Cause:** Platform key is invalid or expired
**Solution:** Generate new key at openrouter.ai/keys and update .env.local

### Issue: "Model not allowed for free tier"
**Cause:** Trying to use premium model without user API key
**Solution:** Either add your API key or select a 🆓 free model

## Security Notes

1. **Platform key** should be in `.env.local` (NOT committed to git)
2. **User keys** stored in localStorage (client-side only)
3. **Rate limiting** prevents platform key abuse
4. **Backend proxy** keeps platform key secure (never exposed to client)

## Cost Monitoring

The platform pays for free tier usage:
- DeepSeek models: ~$0.001 per 1000 tokens
- Gemma models: ~$0.001 per 1000 tokens
- 100 requests/hour limit = ~$0.10/hour max cost
- ~$72/month worst case (if constantly rate limited)

Users pay for their own premium model usage through their personal keys.
