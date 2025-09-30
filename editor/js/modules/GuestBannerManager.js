/**
 * GuestBannerManager - Manages the guest mode banner and quota tracking
 * Displays AI usage quota for guest users and provides upgrade paths
 */
export class GuestBannerManager {
  constructor(fileManager = null) {
    this.fileManager = fileManager
    this.banner = document.getElementById('guest-banner')
    this.quotaUsedEl = document.getElementById('guest-quota-used')
    this.quotaLimitEl = document.getElementById('guest-quota-limit')
    this.progressFill = document.getElementById('guest-progress-fill')
    this.dismissBtn = document.getElementById('guest-dismiss-btn')
    this.signupBtn = document.getElementById('guest-signup-btn')
    this.addKeyBtn = document.getElementById('guest-add-key-btn')
    
    this.QUOTA_KEY = 'guest_ai_requests_used'
    this.DISMISSED_KEY = 'guest_banner_dismissed'
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
    
    // Check if previously dismissed
    const wasDismissed = localStorage.getItem(this.DISMISSED_KEY) === 'true'
    this.dismissed = wasDismissed
    
    if (isGuest) {
      this.showBanner()
      this.updateQuota()
    }
  }
  
  hasAuth() {
    // Check if user has auth token or OpenRouter API key
    const hasOpenRouterKey = !!localStorage.getItem('openrouter_api_key')
    const hasAuthToken = !!localStorage.getItem('auth_token')
    
    // Also check for Supabase session
    const hasSupabaseSession = document.cookie.includes('sb-')
    
    return hasOpenRouterKey || hasAuthToken || hasSupabaseSession
  }
  
  showBanner() {
    if (!this.dismissed && this.banner) {
      this.banner.classList.remove('hidden')
    }
  }
  
  hideBanner() {
    if (this.banner) {
      this.banner.classList.add('hidden')
    }
  }
  
  dismiss() {
    this.dismissed = true
    localStorage.setItem(this.DISMISSED_KEY, 'true')
    this.hideBanner()
    
    // Reshow if quota gets low (< 3 remaining)
    setTimeout(() => {
      const used = this.getQuotaUsed()
      if (used >= this.LIMIT - 2) {
        this.dismissed = false
        localStorage.setItem(this.DISMISSED_KEY, 'false')
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
    if (remaining <= 2 && this.progressFill) {
      this.progressFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)'
      // Force show banner if quota is critically low
      if (remaining === 0) {
        this.dismissed = false
        localStorage.setItem(this.DISMISSED_KEY, 'false')
        this.showBanner()
      }
    }
    
    // Warning when low
    if (remaining <= 2 && remaining > 0) {
      this.dismissed = false
      localStorage.setItem(this.DISMISSED_KEY, 'false')
      this.showBanner()
    }
  }
  
  redirectToSignup() {
    // Preserve current editor state
    const currentState = this.getCurrentEditorState()
    if (currentState) {
      try {
        sessionStorage.setItem('editor_state_before_signup', JSON.stringify(currentState))
      } catch (e) {
        console.warn('Could not save editor state:', e)
      }
    }
    
    // Redirect to website signup
    const websiteURL = 'https://ailiveeditor.netlify.app'
    const returnURL = encodeURIComponent(window.location.href)
    window.location.href = `${websiteURL}/auth/signup?return_to=${returnURL}`
  }
  
  showAPIKeyDialog() {
    // Show modal to add OpenRouter API key
    const key = prompt(
      'Enter your OpenRouter API key:\n\n' +
      'Get your API key from: https://openrouter.ai/keys\n' +
      'This will give you unlimited AI requests!'
    )
    
    if (key && key.trim()) {
      localStorage.setItem('openrouter_api_key', key.trim())
      alert('✅ API key saved! You now have unlimited AI requests.')
      this.resetQuota()
      this.hideBanner()
      
      // Reload to apply changes
      window.location.reload()
    }
  }
  
  getCurrentEditorState() {
    // Get current file content, cursor position, etc.
    if (!this.fileManager) {
      return null
    }
    
    try {
      return {
        files: this.fileManager.files || [],
        openTabs: this.fileManager.openTabs || [],
        activeTabIndex: this.fileManager.activeTabIndex || 0,
        timestamp: Date.now()
      }
    } catch (e) {
      console.warn('Could not capture editor state:', e)
      return null
    }
  }
  
  // Call this after each AI request
  incrementQuota() {
    // Don't track if user has API key or auth
    if (this.hasAuth()) {
      return
    }
    
    const used = this.getQuotaUsed()
    const newUsed = used + 1
    
    localStorage.setItem(this.QUOTA_KEY, newUsed.toString())
    this.updateQuota()
    
    // Show warning when approaching limit
    if (newUsed >= this.LIMIT - 2) {
      console.warn(`Guest quota warning: ${this.LIMIT - newUsed} requests remaining`)
    }
    
    // Throw error when limit reached
    if (newUsed >= this.LIMIT) {
      throw new Error(
        'Guest AI limit reached (10 requests). ' +
        'Sign up for free unlimited AI requests or add your OpenRouter API key!'
      )
    }
  }
  
  // Check if user can make AI request
  canMakeRequest() {
    if (this.hasAuth()) {
      return true
    }
    
    const used = this.getQuotaUsed()
    return used < this.LIMIT
  }
  
  // Get remaining requests
  getRemainingRequests() {
    if (this.hasAuth()) {
      return Infinity
    }
    
    const used = this.getQuotaUsed()
    return Math.max(0, this.LIMIT - used)
  }
  
  // Reset quota (called from settings or after auth)
  resetQuota() {
    localStorage.setItem(this.QUOTA_KEY, '0')
    this.updateQuota()
  }
  
  // Show error message when quota exceeded
  showQuotaExceededMessage() {
    if (!this.banner) return
    
    // Flash the banner to draw attention
    this.showBanner()
    this.banner.style.animation = 'none'
    setTimeout(() => {
      this.banner.style.animation = 'slideDown 0.3s ease-out'
    }, 10)
    
    // Highlight the signup button
    if (this.signupBtn) {
      this.signupBtn.style.animation = 'pulse 0.5s ease-in-out 3'
    }
  }
}

// Add pulse animation for signup button
const style = document.createElement('style')
style.textContent = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
`
document.head.appendChild(style)

