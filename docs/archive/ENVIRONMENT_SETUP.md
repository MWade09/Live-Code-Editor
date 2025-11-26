# Environment Setup Guide

## Local Development Setup

To run the platform locally with AI features, you need to set up environment variables.

### Step 1: Create `.env.local` File

In the `website/` directory, create a file named `.env.local`:

```bash
cd website
# On Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# On macOS/Linux
touch .env.local
```

### Step 2: Add Required Environment Variables

Open `.env.local` and add the following:

```env
# OpenRouter Platform API Key (REQUIRED for free tier AI features)
# Get your key from: https://openrouter.ai/keys
OPENROUTER_PLATFORM_KEY=sk-or-v1-your-actual-key-here

# Supabase Configuration (REQUIRED for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site URL (for OpenRouter HTTP-Referer)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 3: Get Your OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai)
2. Sign up or log in
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)
6. Paste it into your `.env.local` file

### Step 4: Restart Development Server

After creating `.env.local`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

The environment variables will now be loaded.

---

## Production Setup (Netlify)

For production deployment, add these environment variables in the Netlify dashboard:

1. Go to your Netlify site settings
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `OPENROUTER_PLATFORM_KEY` | `sk-or-v1-...` | Your OpenRouter API key |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://...supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Your Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://ailiveeditor.netlify.app` | Your production URL |

4. Click **Save**
5. Trigger a new deployment

---

## Verifying Setup

### Check if Environment Variables are Loaded

Add a temporary console log to verify (remove after testing):

```typescript
// In any server component or API route
console.log('API Key set:', !!process.env.OPENROUTER_PLATFORM_KEY)
```

### Test Free Tier AI

1. Open the editor: http://localhost:3000/editor/
2. Create a new file
3. Open AI chat panel
4. Try sending a message with a free model (🆓 icon)
5. Check the terminal for logs:
   - ✅ Platform API key is set
   - 📥 Free tier request for model
   - 🚀 Sending request to OpenRouter
   - 📡 OpenRouter response status: 200

### Common Issues

**Issue**: "Service configuration error: Platform API key not set"
- **Solution**: You forgot to create `.env.local` or the variable name is wrong

**Issue**: "no auth credentials found" (401 error)
- **Solution**: Your API key is invalid. Get a new one from OpenRouter

**Issue**: Changes to `.env.local` not taking effect
- **Solution**: Restart the dev server (Ctrl+C, then `npm run dev`)

**Issue**: "Rate limit exceeded"
- **Solution**: You've hit the 100 requests/hour limit. Wait or use your own API key

---

## Security Notes

⚠️ **NEVER commit `.env.local` to git!**

The `.env.local` file is already in `.gitignore`, but double-check:

```bash
# Verify it's ignored
git status

# Should NOT show .env.local as a tracked file
```

✅ **Best Practices**:
- Use different API keys for development and production
- Rotate keys regularly
- Monitor usage in OpenRouter dashboard
- Set spending limits on your OpenRouter account

---

## Free Tier Models

The following models are available through the platform API key (free tier):

- 🆓 `deepseek/deepseek-r1-0528:free`
- 🆓 `deepseek/deepseek-chat-v3-0324:free`
- 🆓 `google/gemma-3-27b-it:free`

**Rate Limits**:
- 100 requests per hour per IP address
- Resets every hour

**Premium Models** (require user's own API key):
- Any non-free model in OpenRouter catalog
- No rate limits (depends on user's OpenRouter plan)

---

## Quick Reference

```bash
# Local development
cd website
npm run dev
# Open: http://localhost:3000/editor/

# Check logs for API key status
# Look for: ✅ Platform API key is set (length: XX)

# Production
# Add env vars in Netlify dashboard → Deploy
```

That's it! You're ready to use AI features. 🎉
