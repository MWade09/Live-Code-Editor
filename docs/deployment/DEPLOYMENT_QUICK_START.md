# 🚀 Deployment Feature - Quick Start Guide

Get your projects live in minutes with one-click deployment to Netlify or Vercel!

---

## 📋 Prerequisites

Before you can deploy, you need:
1. A Live Code Editor account (logged in)
2. A project to deploy
3. An API token from Netlify or Vercel

---

## 🔑 Step 1: Get Your API Token

### Option A: Netlify Token

1. Go to [Netlify Applications](https://app.netlify.com/user/applications)
2. Click **"New access token"**
3. Name it (e.g., "Live Code Editor")
4. Click **"Generate token"**
5. **Copy the token** (you won't see it again!)

### Option B: Vercel Token

1. Go to [Vercel Tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name it (e.g., "Live Code Editor")
4. Click **"Create"**
5. **Copy the token**

---

## 💾 Step 2: Save Your Token

You can save your token through:

### Method 1: Settings Page (Recommended)
*Coming soon - integrate into settings UI*

### Method 2: Direct API Call

Open browser console and run:

```javascript
// For Netlify
fetch('/api/deployment/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'netlify',
    accessToken: 'YOUR_NETLIFY_TOKEN_HERE'
  })
}).then(r => r.json()).then(console.log)

// For Vercel
fetch('/api/deployment/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'vercel',
    accessToken: 'YOUR_VERCEL_TOKEN_HERE'
  })
}).then(r => r.json()).then(console.log)
```

---

## 🚀 Step 3: Deploy Your Project

1. Open your project in the editor
2. Click the **"Deploy"** button (rocket icon 🚀)
3. Choose your platform (Netlify or Vercel)
4. *Optional:* Add environment variables
5. Click **"Deploy Now"**
6. Watch the build progress in real-time!
7. Get your live URL when complete! 🎉

---

## ⚙️ Optional: Environment Variables

If your project needs environment variables:

1. In the deployment modal, find the "Environment Variables" section
2. Enter key-value pairs:
   - Key: `API_KEY`
   - Value: `your-secret-key`
3. Click the **+** button to add
4. Add as many as you need

Example variables:
- `NODE_ENV`: `production`
- `API_KEY`: `your-api-key`
- `DATABASE_URL`: `your-database-url`

---

## ✅ What Happens During Deployment?

1. **Preparing** (5s) - Validating files and creating deployment record
2. **Building** (20-40s) - Platform is building your project
3. **Deploying** (10-20s) - Making your site live
4. **Success!** - Your site is now accessible via the provided URL

**Total time:** Usually 30-60 seconds

---

## 🎯 Deployment Status

Watch your deployment progress:

- ⏳ **Pending** - Initializing deployment
- 🔨 **Building** - Platform is building your project
- ✅ **Success** - Your site is live!
- ❌ **Failed** - Something went wrong (check error message)

---

## 🌐 Accessing Your Deployed Site

Once deployment succeeds, you'll get a URL like:

**Netlify:**
```
https://your-project-name.netlify.app
```

**Vercel:**
```
https://your-project-name.vercel.app
```

Click the URL or copy it to share your project!

---

## 🔄 Updating Your Deployment

To update your live site:

1. Make changes to your project
2. Click **"Deploy"** again
3. Choose the same platform
4. Your site will be updated with the new changes!

**Note:** Each deployment creates a new build. The URL stays the same.

---

## 🐛 Troubleshooting

### "No token found" error
**Solution:** Make sure you saved your API token (Step 2)

### "Deployment failed" error
**Possible causes:**
- Invalid API token
- Project files too large (>100MB)
- Platform service issues

**Solution:**
1. Check error message for details
2. Verify your token is correct
3. Try again in a few minutes

### "index.html required" error
**Solution:** Make sure your project has an `index.html` file, or one will be auto-generated.

### Deployment stuck at "Building"
**Solution:**
1. Wait a bit longer (can take up to 2 minutes)
2. Refresh the status
3. If stuck for >5 minutes, try deploying again

---

## 💡 Tips & Best Practices

### 1. Test Locally First
Make sure your project works in the preview before deploying.

### 2. Use Environment Variables
Don't hardcode secrets! Use environment variables for:
- API keys
- Database URLs
- Configuration values

### 3. Choose the Right Platform

**Netlify:**
- Great for static sites
- Simple configuration
- Fast deployments

**Vercel:**
- Great for Next.js and React
- Serverless functions support
- Excellent performance

### 4. Keep Tokens Secure
- Don't share your API tokens
- Don't commit tokens to git
- Rotate tokens periodically

### 5. Check File Sizes
- Keep total size under 100MB
- Optimize images before deploying
- Remove unnecessary files

---

## 📊 Deployment Limits

- **Maximum file size:** 10MB per file
- **Maximum total size:** 100MB per deployment
- **Deployment frequency:** Recommended 5+ minutes between deploys
- **Platforms supported:** Netlify, Vercel

---

## 🎨 Example Projects

### Simple HTML Site
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Site</title>
    <style>
        body { 
            font-family: Arial;
            text-align: center;
            padding: 50px;
        }
    </style>
</head>
<body>
    <h1>Hello World!</h1>
    <p>My first deployed site!</p>
</body>
</html>
```

### Multi-File Project
```
my-project/
├── index.html    (Main page)
├── styles.css    (Styles)
├── script.js     (JavaScript)
└── about.html    (About page)
```

---

## 🆘 Getting Help

**Need help with deployment?**

1. Check the error message in the deployment modal
2. Review this guide
3. Check platform status:
   - [Netlify Status](https://www.netlifystatus.com/)
   - [Vercel Status](https://www.vercel-status.com/)
4. Contact support if issue persists

---

## 🎉 Success!

Once you see the green checkmark ✅ and your live URL, your site is deployed!

Share your URL with friends, add it to your portfolio, or use it for testing.

**Happy deploying!** 🚀

---

## 📚 Additional Resources

- [Full Documentation](./ONE_CLICK_DEPLOYMENT_COMPLETE.md)
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
- [Implementation Summary](./DEPLOYMENT_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated:** November 13, 2025
