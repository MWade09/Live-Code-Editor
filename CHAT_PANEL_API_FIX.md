# Chat Panel API Routing Fix

## Issue
The chat panel was calling OpenRouter API directly instead of using our backend proxy routes, causing 401 "no auth credentials found" errors for free models.

## Root Cause

The chat panel (`chat-panel.js`) had its own API calling logic separate from AIManager, and it was calling OpenRouter directly:

```javascript
// OLD - Direct call to OpenRouter
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,  // User's API key (empty for free models)
        ...
    },
    ...
});
```

This meant:
- Free tier users had no API key → 401 error
- Bypassed our rate limiting
- Bypassed our monetization system
- Exposed OpenRouter endpoints directly to client

## Solution

Updated both **chat mode** and **agent mode** to route through our backend API:

### Chat Mode (`processWithAI`)
```javascript
// NEW - Route through backend
const isFreeModel = freeModels.includes(model);

if (isFreeModel) {
    // Use platform API key (backend)
    response = await fetch('/api/ai/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages })
    });
} else {
    // Use user's API key (backend)
    response = await fetch('/api/ai/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, apiKey })
    });
}
```

### Agent Mode (`processWithAgentMode`)
- Same routing logic applied
- Checks if model is free
- Routes to `/api/ai/free` or `/api/ai/premium`
- Proper error handling with user-friendly messages

## Benefits

✅ **Free models work** - Uses platform API key from backend  
✅ **Rate limiting enforced** - 100 requests/hour for free tier  
✅ **Security** - API keys never exposed to client  
✅ **Consistent** - Same routing logic as AIManager  
✅ **Better errors** - User-friendly error messages  

## Error Handling Improvements

Added specific error handling:
- **429**: Rate limit exceeded message
- **403**: Model not available for free tier message
- Display remaining requests for free tier
- Clear distinction between free/premium model requirements

## Testing

Before fix:
```
❌ Chat with free model → 401 "no auth credentials found"
```

After fix:
```
✅ Chat with free model → Works using platform API key
✅ Rate limiting → Shows remaining requests
✅ Premium model → Requires user API key
```

## Files Modified

1. **`website/public/editor/js/chat-panel.js`**
   - Updated `processWithAI()` function
   - Updated `processWithAgentMode()` function
   - Added free model detection
   - Added backend API routing
   - Improved error handling

## Free Models Supported

- 🆓 `deepseek/deepseek-r1-0528:free`
- 🆓 `deepseek/deepseek-chat-v3-0324:free`
- 🆓 `google/gemma-3-27b-it:free`

Rate limits: 100 requests/hour per IP address

## Related Files

This completes the API routing migration:
- ✅ AIManager.js - Fixed previously
- ✅ chat-panel.js - Fixed now
- ✅ Backend API routes - Already implemented

All AI features now route through our secure backend! 🎉
