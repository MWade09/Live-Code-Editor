# 🚀 Deployment Quick Reference

**One-page cheat sheet for deploying projects**

---

## ⚡ Quick Deploy (3 Steps)

```
1. Settings → Deployment → Add Token
2. Editor → Click Deploy Button
3. Choose Platform → Deploy Now
```

**Time to deploy**: 60 seconds

---

## 🔑 Get Tokens

### Netlify
```
1. netlify.com → Login
2. User Settings → Applications
3. Personal Access Tokens → New
4. Copy token → Save in Editor Settings
```

### Vercel
```
1. vercel.com → Login
2. Settings → Tokens
3. Create → Copy token
4. Save in Editor Settings
```

---

## 🎯 Deployment Checklist

Before clicking Deploy:

- [ ] Project is saved
- [ ] Files are in root directory
- [ ] Paths are relative (not absolute)
- [ ] `index.html` exists at root
- [ ] Token is connected
- [ ] Site name is available (optional)

---

## 🛠️ Common Commands

**Check if token is connected:**
- Settings → Deployment → Look for ✅

**View deployment history:**
- Navigate to `/deployments`

**Update a deployed site:**
- Edit project → Save → Deploy again

**Remove token:**
- Settings → Deployment → Remove Token

---

## 🔧 Environment Variables

**Format:**
```
KEY=value
```

**Examples:**
```
API_KEY=abc123xyz
NODE_ENV=production
ENABLE_FEATURE=true
```

**Access in code:**
```javascript
// Node.js
process.env.API_KEY

// Vite
import.meta.env.VITE_API_KEY

// Next.js
process.env.NEXT_PUBLIC_API_KEY
```

---

## ⏱️ Rate Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Deployments | 10 | per hour |
| Token ops | 20 | per 15 min |
| Status checks | 100 | per 5 min |
| Name checks | 50 | per 5 min |

---

## 🐛 Quick Fixes

**"No token found"**
→ Add token in Settings

**"Site name not available"**
→ Use the name checker & try suggestions

**"Rate limit exceeded"**
→ Wait 15-60 minutes

**Deployment stuck building**
→ Wait 5 min, check error logs

**Site looks broken**
→ Check file paths are relative

**"Unauthorized"**
→ Refresh page or re-login

---

## 📊 Status Icons

- ✅ **Green** = Success (deployed)
- 🔵 **Blue** = Building (in progress)
- 🟡 **Yellow** = Pending (queued)
- ❌ **Red** = Failed (error)

---

## 🎨 Site Name Tips

- ✅ Short and memorable
- ✅ Use hyphens (`my-project`)
- ✅ Check availability first
- ❌ Avoid special characters
- ❌ Don't use spaces

---

## 🔒 Security

- ✅ Tokens are AES-256 encrypted
- ✅ Never share your tokens
- ✅ Use env vars for secrets
- ✅ Regenerate if compromised

---

## 📱 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save project | `Ctrl/Cmd + S` |
| Open settings | Click profile |
| Deploy modal | Click deploy button |

---

## 🆘 Get Help

**Documentation**: `/docs`  
**Deployment History**: `/deployments`  
**Settings**: `/settings#deployment`

**Need more help?** See full [Deployment User Guide](./DEPLOYMENT_USER_GUIDE.md)

---

*Quick Reference v1.0 | Updated: Nov 19, 2025*
