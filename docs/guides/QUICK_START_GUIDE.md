# 🚀 Quick Start Guide - Production Build

**Today's Date**: September 29, 2025  
**Target Launch**: December 15-20, 2025 (12 weeks)  
**Current Phase**: Phase 1 - Sprint 1.1 (Guest Mode Polish)

---

## 📋 What To Do Right Now

### Step 1: Review the Roadmap
✅ Read `PRODUCTION_ROADMAP.md` to understand the full vision

### Step 2: Set Up Project Management
Choose one and set it up today:
- **GitHub Projects** (integrated with repo)
- **Linear** (developer-friendly)
- **Notion** (flexible, visual)

### Step 3: Start Sprint 1.1 (This Week)

**Sprint 1.1 Goal**: Complete Guest Mode Experience (3-4 days)

---

## 🎯 Today's Tasks (Day 1)

### Task 1: Create Guest Banner Component (2-3 hours)

**Location**: `editor/index.html` + `editor/css/styles.css` + `editor/js/modules/GuestBannerManager.js`

**What to build**:
```html
<!-- Add to editor/index.html after header -->
<div id="guest-banner" class="guest-banner hidden">
  <div class="guest-banner-content">
    <div class="guest-info">
      <span class="guest-icon">👤</span>
      <span class="guest-text">Guest Mode</span>
      <span class="guest-quota">
        <span id="guest-quota-used">0</span>/<span id="guest-quota-limit">10</span> AI requests remaining
      </span>
      <div class="guest-progress-bar">
        <div id="guest-progress-fill" class="guest-progress-fill"></div>
      </div>
    </div>
    <div class="guest-actions">
      <button id="guest-add-key-btn" class="guest-btn guest-btn-secondary">
        🔑 Add API Key
      </button>
      <button id="guest-signup-btn" class="guest-btn guest-btn-primary">
        ✨ Sign Up Free
      </button>
      <button id="guest-dismiss-btn" class="guest-btn-close">×</button>
    </div>
  </div>
</div>
```

**Styling** (add to `editor/css/styles.css`):
```css
.guest-banner {
  position: fixed;
  top: 60px; /* Below main header */
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  padding: 12px 20px;
  animation: slideDown 0.3s ease-out;
}

.guest-banner.hidden {
  display: none;
}

.guest-banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
}

.guest-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.guest-icon {
  font-size: 20px;
}

.guest-text {
  font-weight: 600;
  color: #e2e8f0;
}

.guest-quota {
  color: #94a3b8;
  font-size: 14px;
}

.guest-progress-bar {
  width: 120px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.guest-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
  width: 0%;
}

.guest-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.guest-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.guest-btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
}

.guest-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.guest-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.guest-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.guest-btn-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  padding: 0 8px;
}

.guest-btn-close:hover {
  color: #e2e8f0;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .guest-banner-content {
    flex-direction: column;
    gap: 12px;
  }
  
  .guest-actions {
    width: 100%;
    justify-content: space-between;
  }
}
```

**JavaScript Module** (`editor/js/modules/GuestBannerManager.js`):
```javascript
export class GuestBannerManager {
  constructor() {
    this.banner = document.getElementById('guest-banner')
    this.quotaUsedEl = document.getElementById('guest-quota-used')
    this.quotaLimitEl = document.getElementById('guest-quota-limit')
    this.progressFill = document.getElementById('guest-progress-fill')
    this.dismissBtn = document.getElementById('guest-dismiss-btn')
    this.signupBtn = document.getElementById('guest-signup-btn')
    this.addKeyBtn = document.getElementById('guest-add-key-btn')
    
    this.QUOTA_KEY = 'guest_ai_requests_used'
    this.LIMIT = 10
    this.dismissed = false
    
    this.setupEventListeners()
    this.checkGuestMode()
  }
  
  setupEventListeners() {
    this.dismissBtn?.addEventListener('click', () => this.dismiss())
    this.signupBtn?.addEventListener('click', () => this.redirectToSignup())
    this.addKeyBtn?.addEventListener('click', () => this.showAPIKeyDialog())
  }
  
  checkGuestMode() {
    // Check if guest mode (URL param or no auth)
    const urlParams = new URLSearchParams(window.location.search)
    const isGuest = urlParams.has('guest') || !this.hasAuth()
    
    if (isGuest) {
      this.showBanner()
      this.updateQuota()
    }
  }
  
  hasAuth() {
    // Check if user has auth token or OpenRouter API key
    const hasOpenRouterKey = localStorage.getItem('openrouter_api_key')
    const hasAuthToken = localStorage.getItem('auth_token') // or check cookies
    return hasOpenRouterKey || hasAuthToken
  }
  
  showBanner() {
    if (!this.dismissed) {
      this.banner?.classList.remove('hidden')
    }
  }
  
  hideBanner() {
    this.banner?.classList.add('hidden')
  }
  
  dismiss() {
    this.dismissed = true
    this.hideBanner()
    
    // Reshow if quota gets low
    setTimeout(() => {
      const used = this.getQuotaUsed()
      if (used >= this.LIMIT - 2) {
        this.dismissed = false
        this.showBanner()
      }
    }, 60000) // Check again in 1 minute
  }
  
  getQuotaUsed() {
    try {
      return parseInt(localStorage.getItem(this.QUOTA_KEY) || '0')
    } catch {
      return 0
    }
  }
  
  updateQuota() {
    const used = this.getQuotaUsed()
    const remaining = Math.max(0, this.LIMIT - used)
    const percentage = (used / this.LIMIT) * 100
    
    if (this.quotaUsedEl) this.quotaUsedEl.textContent = used
    if (this.quotaLimitEl) this.quotaLimitEl.textContent = this.LIMIT
    if (this.progressFill) this.progressFill.style.width = `${percentage}%`
    
    // Change color when quota is low
    if (remaining <= 2) {
      if (this.progressFill) {
        this.progressFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)'
      }
      this.showBanner() // Force show if dismissed
    }
  }
  
  redirectToSignup() {
    // Preserve current editor state
    const currentState = this.getCurrentEditorState()
    if (currentState) {
      sessionStorage.setItem('editor_state_before_signup', JSON.stringify(currentState))
    }
    
    // Redirect to website signup
    const websiteURL = 'https://ailiveeditor.netlify.app'
    window.location.href = `${websiteURL}/auth/signup?return_to=editor`
  }
  
  showAPIKeyDialog() {
    // Show modal to add OpenRouter API key
    const key = prompt('Enter your OpenRouter API key:')
    if (key && key.trim()) {
      localStorage.setItem('openrouter_api_key', key.trim())
      alert('API key saved! You now have unlimited AI requests.')
      this.hideBanner()
    }
  }
  
  getCurrentEditorState() {
    // Get current file content, cursor position, etc.
    // This will integrate with your FileManager
    return {
      files: [], // Get from FileManager
      activeFile: null,
      cursorPosition: null
    }
  }
  
  // Call this after each AI request
  incrementQuota() {
    const used = this.getQuotaUsed()
    localStorage.setItem(this.QUOTA_KEY, (used + 1).toString())
    this.updateQuota()
  }
  
  // Reset quota (called from settings or after auth)
  resetQuota() {
    localStorage.setItem(this.QUOTA_KEY, '0')
    this.updateQuota()
  }
}
```

### Task 2: Integrate Banner with AI Managers (1 hour)

**Update `editor/js/app.js`**:
```javascript
import { GuestBannerManager } from './modules/GuestBannerManager.js'

// In initialization
const guestBanner = new GuestBannerManager()

// Pass to AI managers
const aiManager = new AIManager(editor, fileManager, guestBanner)
const inlineAI = new InlineAIManager(editor, fileManager, guestBanner)
```

**Update `editor/js/modules/AIManager.js`** (around line 640):
```javascript
async sendMessage(message) {
  // Existing quota check...
  
  // Increment guest quota BEFORE request
  if (this.guestBanner) {
    this.guestBanner.incrementQuota()
  }
  
  // ... rest of sendMessage
}
```

**Update `editor/js/modules/InlineAIManager.js`** (around line 398):
```javascript
async generateSuggestion() {
  // Existing quota check...
  
  // Increment guest quota
  if (this.guestBanner) {
    this.guestBanner.incrementQuota()
  }
  
  // ... rest of generateSuggestion
}
```

### Task 3: Test Guest Mode (30 minutes)

**Testing Checklist**:
- [ ] Open editor with `?guest=1` parameter
- [ ] Verify banner appears
- [ ] Make AI requests and watch quota decrease
- [ ] Verify progress bar updates
- [ ] Test "Dismiss" button
- [ ] Test "Add API Key" button
- [ ] Test "Sign Up Free" button
- [ ] Test banner on mobile (responsive)
- [ ] Test banner reappears when quota low (< 3)
- [ ] Test banner hides when API key added

---

## 🗓️ This Week's Schedule

### Monday (Today):
- ✅ Review roadmap
- ✅ Set up project management
- 🔨 Build guest banner component
- 🔨 Integrate with AI managers

### Tuesday:
- 🔨 Test and polish guest banner
- 🔨 Implement sign-up flow optimization
- 🔨 Add state preservation during sign-up

### Wednesday:
- 🔨 Build welcome email after sign-up
- 🔨 Auto-save first project after registration
- 🔨 End-to-end testing of guest → user flow

### Thursday:
- 🔨 Start Sprint 1.2: Database extensions
- 🔨 Write SQL migration for git_metadata
- 🔨 Create project_commits table

### Friday:
- 🔨 Finish database schema updates
- 🔨 Write RLS policies
- 🔨 Update TypeScript types
- 📊 Sprint review and planning

---

## 🛠️ Development Environment Setup

### Required Tools:
```bash
# Node.js 18+
node --version

# Install website dependencies
cd website
npm install

# Install editor dependencies (if any)
cd ../editor
# (currently vanilla JS, no build step)

# Set up environment variables
cp website/.env.example website/.env.local
# Add your Supabase and Stripe keys
```

### Environment Variables Needed:
```env
# Supabase (website/.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (add later in Phase 4)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin Users
NEXT_ADMIN_USER_IDS=your_user_id_1,your_user_id_2

# Website URL
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000
```

### Run Locally:
```bash
# Terminal 1: Website
cd website
npm run dev
# Opens at http://localhost:3000

# Terminal 2: Editor (if using live server)
cd editor
# Open index.html in browser or use VS Code Live Server
# Opens at http://localhost:5500 or similar
```

---

## 📚 Key Files Reference

### Guest Mode Files:
- `editor/index.html` - Add banner HTML
- `editor/css/styles.css` - Banner styling
- `editor/js/modules/GuestBannerManager.js` - Banner logic (NEW)
- `editor/js/modules/AIManager.js` - Integrate quota tracking
- `editor/js/modules/InlineAIManager.js` - Integrate quota tracking
- `editor/js/app.js` - Initialize GuestBannerManager

### Database Files (Sprint 1.2):
- `website/database-schema.sql` - Current schema
- `website/migrations/` - Create this folder for migrations
- `website/src/types/database.ts` - TypeScript types
- `website/src/lib/database/index.ts` - Database service

### API Files:
- `website/src/app/api/projects/[id]/route.ts` - Project CRUD
- `website/src/app/api/projects/[id]/commits/route.ts` - Commits (CREATE)
- `website/src/app/api/ai/proxy/route.ts` - AI proxy (CREATE LATER)

---

## 🎯 Daily Standup Template

**What I did yesterday**:
- 

**What I'm doing today**:
- 

**Blockers**:
- 

**Metrics**:
- Lines of code:
- Features completed:
- Tests written:
- Bugs fixed:

---

## 🚨 When You Get Stuck

### Common Issues:

**Issue**: Banner not showing
- Check `?guest=1` in URL
- Verify `hasAuth()` logic
- Check console for errors

**Issue**: Quota not incrementing
- Verify `guestBanner.incrementQuota()` is called
- Check localStorage in DevTools
- Clear localStorage and retry

**Issue**: Styling not applying
- Clear browser cache
- Check CSS selector specificity
- Verify `styles.css` is loaded

### Getting Help:
1. Check documentation in `docs/` folder
2. Review similar implementations in codebase
3. Search GitHub issues
4. Ask in community (Discord/Forum when launched)
5. Review `PRODUCTION_ROADMAP.md` for context

---

## 📈 Progress Tracking

### Week 1 Goals:
- [ ] Guest banner complete and tested
- [ ] Sign-up flow optimized
- [ ] Database schema extended
- [ ] Version control persisting to DB

### Completion Metrics:
- Guest Mode: 0% → 100%
- Database Extensions: 0% → 50%
- Overall Phase 1 Progress: 0% → 35%

---

## 🎉 Motivation

You're building something incredible! Every line of code gets you closer to launch. Remember:

- ✅ Website is beautiful and functional
- ✅ Editor has advanced AI features
- ✅ Authentication system works perfectly
- ✅ Community features are in place
- ✅ Database is production-ready

**You're 80% done. Now let's get to 100%!** 💪

---

**Ready to start?** Open `editor/index.html` and add that guest banner! 🚀

*Updated: September 29, 2025*
