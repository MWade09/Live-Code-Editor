# 🚀 One-Click Deployment User Guide

**Deploy your projects to the web in seconds!**

This guide will walk you through deploying your Live Code Editor projects to Netlify or Vercel with just one click.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Getting API Tokens](#getting-api-tokens)
3. [Connecting Your Account](#connecting-your-account)
4. [Deploying Your First Project](#deploying-your-first-project)
5. [Managing Deployments](#managing-deployments)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## 🎯 Quick Start

### What You'll Need:
- ✅ A Live Code Editor account
- ✅ A saved project ready to deploy
- ✅ A free Netlify or Vercel account
- ⏱️ **5 minutes** total setup time

### Three Simple Steps:
1. **Get your API token** from Netlify or Vercel
2. **Connect your account** in Settings
3. **Click Deploy** from the editor

That's it! Your site will be live in under a minute.

---

## 🔑 Getting API Tokens

You need an API token to deploy. Choose **Netlify** (recommended for beginners) or **Vercel** (great for Next.js):

### Option 1: Netlify (Recommended)

**Why Netlify?**
- ✅ Free tier includes 300 build minutes/month
- ✅ Automatic SSL certificates
- ✅ Built-in forms and serverless functions
- ✅ Great for static sites and JAMstack

**Steps to Get Token:**

1. **Sign up** at [netlify.com](https://netlify.com) (it's free!)

2. **Go to User Settings**
   - Click your profile picture (top right)
   - Select "User settings"

3. **Generate Access Token**
   - In the left sidebar, click "Applications"
   - Scroll to "Personal access tokens"
   - Click "New access token"
   - Give it a name like "Live Code Editor"
   - Click "Generate token"
   - **⚠️ Copy the token immediately** - you won't see it again!

4. **Keep it safe** - This token allows deployments from your account

### Option 2: Vercel

**Why Vercel?**
- ✅ Optimized for Next.js, React, Vue
- ✅ Edge network for ultra-fast sites
- ✅ Great developer experience
- ✅ Automatic preview deployments

**Steps to Get Token:**

1. **Sign up** at [vercel.com](https://vercel.com) (free tier available)

2. **Go to Account Settings**
   - Click your profile picture (top right)
   - Select "Settings"

3. **Create Token**
   - Click "Tokens" in the left sidebar
   - Click "Create"
   - Give it a name like "Live Code Editor"
   - Set expiration (or choose "No Expiration")
   - Click "Create Token"
   - **⚠️ Copy the token now** - it won't be shown again!

---

## 🔗 Connecting Your Account

Once you have your token, connect it to Live Code Editor:

### Step-by-Step:

1. **Open Settings**
   - Click your profile icon (top right corner)
   - Select "Settings" from dropdown

2. **Go to Deployment Tab**
   - Click the "Deployment" tab
   - You'll see Netlify and Vercel sections

3. **Add Your Token**
   - Find the platform you chose (Netlify or Vercel)
   - Click the "Show" button to reveal the token input
   - Paste your copied token
   - Click "Save Token"

4. **Verify Connection**
   - Look for the green checkmark: ✅ "Connected"
   - If you see it, you're ready to deploy!

### 🔒 Security Notes:
- Your tokens are **encrypted** before storage (AES-256-GCM)
- Nobody can see your token, not even site admins
- You can remove the token anytime by clicking "Remove Token"
- Lost your token? Generate a new one and update settings

**⚠️ Important for Existing Users:**
If you saved a token before November 19, 2025, you'll need to re-save it due to the new encryption system:
1. Go to Settings → Deployment
2. Click "Remove Token" for your platform
3. Add the same token again
4. This is a one-time security upgrade

---

## 🎨 Deploying Your First Project

Now for the fun part - deploying your project to the web!

### Prerequisites:
- ✅ Your account is connected (see previous section)
- ✅ You have a project open in the editor
- ✅ Your project is saved (check the title bar)

### Deployment Steps:

1. **Open Your Project**
   - Make sure you're viewing the project you want to deploy
   - The project name should be visible in the title bar

2. **Click Deploy Button**
   - Look for the cloud/rocket icon in the toolbar
   - Click it to open the deployment modal

3. **Choose Your Platform**
   - Select Netlify or Vercel
   - (Both work great - use whichever you connected)

4. **Check Site Name** (Optional but Recommended)
   - You'll see a site name input field
   - The editor auto-generates a name from your project title
   - Click "Check Availability" to verify it's not taken
   - ✅ Green checkmark = available
   - ❌ Red X = taken (you'll see suggestions)
   - See the URL preview: `your-name.netlify.app` or `your-name.vercel.app`

5. **Add Environment Variables** (Optional)
   - Click "Add Environment Variable" if needed
   - Enter key-value pairs (e.g., `API_KEY=abc123`)
   - Useful for API keys, feature flags, etc.

6. **Deploy!**
   - Click the big "Deploy Now" button
   - Watch the progress indicator
   - Wait 30-60 seconds (usually faster!)

7. **View Your Site**
   - When complete, you'll see "Deployment Successful!"
   - Click the URL to open your live site
   - Share the link with anyone!

### 🎉 Congratulations!
Your project is now live on the internet! Anyone can visit your URL and see your work.

---

## 📊 Managing Deployments

### Viewing Deployment History

See all your past deployments:

1. **Go to Deployments Page**
   - Visit `/deployments` or
   - Click "View History" in settings

2. **What You'll See**
   - All deployments listed newest first
   - Status indicators:
     - ✅ Green = Success
     - 🔵 Blue (pulsing) = Building
     - 🟡 Yellow = Pending
     - ❌ Red = Failed
   - Platform badges (Netlify/Vercel)
   - Timestamps (e.g., "2h ago")

3. **Filter Your Deployments**
   - **By Platform**: Show only Netlify or Vercel
   - **By Status**: Show only successful, failed, etc.
   - Results counter shows how many match

4. **Quick Actions**
   - Click "View Site" to open the live deployment
   - Click "View Project" to edit the source code
   - See error messages for failed deployments

### Re-deploying a Project

To update your live site after making changes:

1. Make your edits in the editor
2. Save your project (Ctrl+S or Cmd+S)
3. Click Deploy again
4. Choose the same platform
5. Your site will be updated!

**Note**: Each deployment creates a new version. The URL stays the same (unless you change the site name).

---

## 🔧 Environment Variables

Environment variables let you store configuration separately from your code.

### What Are They?

Think of environment variables as settings that:
- Change between environments (dev vs production)
- Store sensitive data (API keys, passwords)
- Configure features (enable/disable functionality)

### Common Use Cases:

**API Keys:**
```
API_KEY=your-secret-key-here
STRIPE_KEY=sk_test_abc123
```

**Configuration:**
```
ENABLE_ANALYTICS=true
MAX_UPLOAD_SIZE=5242880
```

**URLs:**
```
API_URL=https://api.example.com
REDIRECT_URL=https://myapp.com/callback
```

### How to Add Them:

1. During deployment, look for "Environment Variables" section
2. Click "Add Environment Variable"
3. Enter the **Key** (name) and **Value**
4. Add more by clicking "Add" again
5. Deploy normally

### Accessing in Your Code:

**JavaScript/Node.js:**
```javascript
const apiKey = process.env.API_KEY;
```

**React (Vite):**
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

**Note**: Public variables should be prefixed with `VITE_` or `NEXT_PUBLIC_` to be accessible in the browser.

### ⚠️ Security Warning:
- **Never** commit API keys to your code
- **Always** use environment variables for secrets
- **Don't** expose sensitive data in client-side code

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### ❌ "No token found. Please connect your account first."

**Problem**: You haven't connected a deployment platform.

**Solution**:
1. Go to Settings → Deployment tab
2. Add your Netlify or Vercel token
3. Wait for the ✅ "Connected" status
4. Try deploying again

---

#### ❌ "Site name is not available"

**Problem**: Someone else is using that site name.

**Solution**:
1. Click "Check Availability" in the deployment modal
2. Try the suggested alternative names
3. Or create a custom unique name
4. Site names must be globally unique across all users

---

#### ❌ "Failed to decrypt authentication token"

**Problem**: Token was saved before the encryption system was added.

**Solution**:
1. Go to Settings → Deployment
2. Click "Remove Token" for your platform (Netlify or Vercel)
3. Add the same token again (it will be encrypted this time)
4. Try your operation again

**Note**: This is a one-time migration after the November 19, 2025 security upgrade. All new tokens are automatically encrypted.

---

#### ❌ "Rate limit exceeded"

**Problem**: You've deployed too many times in a short period.

**Solution**:
- Wait a few minutes and try again
- Limits:
  - 10 deployments per hour
  - 20 token operations per 15 minutes
  - These limits prevent abuse and protect the service

---

#### 🔵 Deployment Stuck on "Building"

**Problem**: Deployment is taking longer than expected.

**Solution**:
1. Wait 2-3 minutes (some builds take time)
2. Check your deployment history at `/deployments`
3. If still building after 5 minutes:
   - Check for build errors in your code
   - Verify all dependencies are listed correctly
   - Try deploying a simpler project first

---

#### ❌ Deployment Failed

**Problem**: Something went wrong during deployment.

**Solution**:
1. Click on the failed deployment in history
2. Read the error message for details
3. Common causes:
   - Missing files (check your project structure)
   - Syntax errors in your code
   - Invalid package.json or dependencies
   - Platform API issues (check Netlify/Vercel status)

---

#### 🌐 Site Loads but Looks Broken

**Problem**: Deployment succeeded but the site doesn't work correctly.

**Solution**:
1. **Check file paths**: Make sure paths are relative, not absolute
   - ❌ Bad: `/home/user/project/style.css`
   - ✅ Good: `./style.css` or `style.css`

2. **Check Console Errors**: Open browser DevTools (F12) and check console

3. **Verify File Structure**: Ensure you have an `index.html` at the root

4. **Test Locally**: Make sure it works in the editor preview first

---

#### 🔒 "Unauthorized" Error

**Problem**: Authentication issue.

**Solution**:
1. Make sure you're logged into Live Code Editor
2. Refresh the page
3. If problem persists, log out and log back in
4. Verify your token is still valid (regenerate if needed)

---

### Still Having Issues?

If you're still experiencing problems:

1. **Check Status Pages**:
   - [Netlify Status](https://netlifystatus.com)
   - [Vercel Status](https://vercel-status.com)

2. **Review Documentation**:
   - Check your platform's official docs
   - Search for specific error messages

3. **Try a Simple Project First**:
   - Create a basic HTML file
   - Deploy that to test the system
   - Then try your complex project

4. **Contact Support**:
   - Include the error message
   - Mention which platform (Netlify/Vercel)
   - Share your deployment ID from history

---

## ❓ FAQ

### General Questions

**Q: Is deployment free?**  
A: Yes! Both Netlify and Vercel offer generous free tiers perfect for personal projects and learning.

**Q: How many sites can I deploy?**  
A: Unlimited on our end! Check your chosen platform's limits (usually very generous).

**Q: Can I deploy private projects?**  
A: The deployments themselves are public URLs, but you can add authentication to your app.

**Q: What types of projects can I deploy?**  
A: Static sites (HTML/CSS/JS), React, Vue, Svelte, Next.js, and most frontend frameworks.

**Q: Do deployments expire?**  
A: No, your sites stay live indefinitely on the free tier.

---

### Technical Questions

**Q: Can I use a custom domain?**  
A: Not yet from the editor, but you can add one directly in Netlify/Vercel dashboard.

**Q: How do I update my deployed site?**  
A: Just deploy again! The editor will update the existing site.

**Q: Can I roll back to a previous version?**  
A: Currently no, but we're working on it! For now, use your platform's dashboard.

**Q: What's the difference between Netlify and Vercel?**  
A: Both are excellent! Netlify is simpler, Vercel is better for Next.js. Pick either - you can't go wrong.

**Q: Are my tokens secure?**  
A: Yes! We use military-grade AES-256-GCM encryption. Even we can't see your tokens.

**Q: Can I deploy to both Netlify and Vercel?**  
A: Absolutely! Connect both accounts and choose which one to use per deployment.

---

### Limits & Performance

**Q: What are the rate limits?**  
A:
- 10 deployments per hour
- 20 token operations per 15 minutes  
- 100 status checks per 5 minutes
- 50 name checks per 5 minutes

**Q: How long does deployment take?**  
A: Usually 30-60 seconds. Complex projects may take 2-3 minutes.

**Q: Is there a file size limit?**  
A: The editor doesn't limit size, but platforms do:
- Netlify: 500MB per site
- Vercel: 100MB per deployment

**Q: Can I deploy backend/server code?**  
A: Not directly. Both platforms support serverless functions - check their docs!

---

### Account & Billing

**Q: Do I need a credit card?**  
A: No! Free tiers don't require payment information.

**Q: What happens if I exceed the free tier?**  
A: Netlify/Vercel will notify you. You can upgrade or your sites will pause until next month.

**Q: Can I remove my connected account?**  
A: Yes! Go to Settings → Deployment and click "Remove Token".

**Q: What if I regenerate my token on Netlify/Vercel?**  
A: Old tokens stop working. Update your token in Live Code Editor settings.

---

## 🎓 Best Practices

### Before Deploying:

1. ✅ **Test in Preview**: Make sure it works in the editor preview
2. ✅ **Check File Paths**: Use relative paths, not absolute
3. ✅ **Validate HTML**: Ensure your HTML is valid
4. ✅ **Optimize Images**: Compress large images
5. ✅ **Remove Console Logs**: Clean up debugging code

### Choosing Site Names:

1. 📝 **Keep it Short**: Easier to remember and share
2. 📝 **Use Hyphens**: `my-cool-project` not `mycooolproject`
3. 📝 **Be Descriptive**: Name should hint at what the site does
4. 📝 **Check Availability**: Use the checker before deploying
5. 📝 **Avoid Numbers**: Unless meaningful (e.g., `game-2048`)

### Security:

1. 🔒 **Never Expose Tokens**: Don't put API keys in client code
2. 🔒 **Use Environment Variables**: For all sensitive data
3. 🔒 **Keep Tokens Private**: Don't share your deployment tokens
4. 🔒 **Regenerate if Compromised**: If token leaks, create a new one
5. 🔒 **Review Permissions**: Only give tokens necessary permissions

### Performance:

1. ⚡ **Minimize Files**: Fewer files = faster deploys
2. ⚡ **Compress Assets**: Use minified CSS/JS in production
3. ⚡ **Lazy Load Images**: Load images only when needed
4. ⚡ **Use CDNs**: For libraries (they're already fast on CDN)
5. ⚡ **Cache Static Assets**: Netlify/Vercel do this automatically

---

## 🎉 Success Tips

### Make Your Site Stand Out:

1. 🌟 **Add a README**: Document what your project does
2. 🌟 **Create a Demo**: Show what it can do
3. 🌟 **Make it Responsive**: Test on mobile devices
4. 🌟 **Add Metadata**: Title, description, Open Graph tags
5. 🌟 **Share Your URL**: Show off your work!

### Growing Your Skills:

1. 📚 **Start Simple**: Deploy a single HTML page first
2. 📚 **Add Complexity**: Then try CSS frameworks, JavaScript
3. 📚 **Experiment**: Try different frameworks and libraries
4. 📚 **Learn from Others**: Check out other deployed projects
5. 📚 **Keep Building**: The more you deploy, the better you get!

---

## 📚 Additional Resources

### Official Documentation:
- [Netlify Docs](https://docs.netlify.com)
- [Vercel Docs](https://vercel.com/docs)
- [Live Code Editor Docs](https://ailiveeditor.netlify.app/docs)

### Tutorials:
- Deploy your first static site
- Adding custom domains
- Setting up continuous deployment
- Serverless functions basics

### Community:
- Join our Discord community
- Share your deployed projects
- Get help from other users
- Showcase your work

---

## 🚀 Ready to Deploy?

You now have everything you need to deploy your projects to the web!

**Quick Recap:**
1. ✅ Get your API token from Netlify or Vercel
2. ✅ Connect your account in Settings
3. ✅ Open your project and click Deploy
4. ✅ Check site name availability
5. ✅ Click "Deploy Now" and wait
6. ✅ Share your live site with the world!

**Happy Deploying!** 🎊

---

*Last Updated: November 19, 2025*  
*Version: 1.0*  
*Questions? Check [ailiveeditor.netlify.app/help](https://ailiveeditor.netlify.app/help)*
