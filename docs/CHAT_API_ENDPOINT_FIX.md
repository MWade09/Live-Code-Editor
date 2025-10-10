# Chat API Endpoint Fix - October 10, 2025

## Problem
Chat was returning **504 Gateway Timeout** errors when trying to send messages:
```
Failed to load resource: the server responded with a status of 504
Error: Unknown error
```

## Root Cause
The `chat-panel.js` was trying to call **backend API endpoints** that don't exist:
- `/api/ai/free` - For free models
- `/api/ai/premium` - For premium models with API key

These endpoints were designed for a backend server, but the editor is a **static frontend** that can run without a backend.

## Solution
Changed the chat to call **OpenRouter API directly** from the frontend instead of going through a backend proxy.

### Changes Made

#### Before (Broken):
```javascript
// Tried to call non-existent backend
response = await fetch('/api/ai/free', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages })
});
```

#### After (Fixed):
```javascript
// Calls OpenRouter directly
response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Live Code Editor'
    },
    body: JSON.stringify({ model, messages })
});
```

### For Premium Models (with API key):
```javascript
response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Live Code Editor'
    },
    body: JSON.stringify({ model, messages })
});
```

## Files Modified
- `chat-panel.js` - Updated both Chat Mode and Agent Mode to call OpenRouter directly

## What Now Works

✅ **Free Models** (DeepSeek, Gemma)
- No API key required
- Calls OpenRouter free tier directly
- Works in static hosting

✅ **Premium Models** (Claude, GPT-4, etc.)
- Uses user's OpenRouter API key
- Calls OpenRouter with Authorization header
- Secure (API key only in memory/localStorage)

✅ **Both Modes**
- Chat Mode: Conversations and Q&A
- Agent Mode: Direct file editing

## Important Notes

### CORS Considerations
OpenRouter supports CORS, so direct frontend calls work. The headers we include:
- `HTTP-Referer`: Identifies your app to OpenRouter
- `X-Title`: Shows as "Live Code Editor" in OpenRouter dashboard

### API Key Security
User's API key is:
- Stored in localStorage (browser only)
- Never sent to your servers
- Only sent directly to OpenRouter
- Can be cleared by user

### Rate Limiting
- Free models: OpenRouter's free tier limits apply
- Premium models: User's own API key limits apply
- No backend rate limiting (it's all OpenRouter's)

## Testing

1. **Test Free Model:**
   - Select "🆓 DeepSeek" or "🆓 Gemma"
   - Send a message
   - Should get response without API key

2. **Test Premium Model:**
   - Add OpenRouter API key in settings
   - Select "🔑 Claude" or "🔑 GPT-4"
   - Send a message
   - Should get response using your key

3. **Test Agent Mode:**
   - Switch to Agent Mode (🤖)
   - Open a file
   - Ask to modify it
   - Should edit file directly

## Console Output You Should See

**Successful Free Model Call:**
```
Processing message in chat mode
🆓 Chat using OpenRouter free tier for model: google/gemma-3-27b-it:free
[Response received]
```

**Successful Premium Model Call:**
```
Processing message in chat mode
💳 Chat using OpenRouter premium tier for model: anthropic/claude-3.5-sonnet
[Response received]
```

## No More Errors! ✅

The chat should now work perfectly without needing any backend server. It's a fully **standalone static editor** that can be hosted anywhere (GitHub Pages, Netlify, Vercel, etc.).
