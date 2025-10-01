/**
 * GuestBannerManager - Manages guest mode quota tracking (non-intrusive approach)
 * Only shows UI for actual guest users, integrates with chat panel
 */
export class GuestBannerManager {
  constructor(fileManager = null) {
    this.fileManager = fileManager
    
    // UI elements
    this.quotaIndicator = document.getElementById('guest-quota-indicator')
    this.quotaRemaining = document.getElementById('guest-quota-remaining')
    this.quotaModal = document.getElementById('guestQuotaModal')
    this.modalSignupBtn = document.getElementById('modal-signup-btn')
    this.closeModalBtn = document.getElementById('close-quota-modal-btn')
    
    // Configuration
    this.QUOTA_KEY = 'guest_ai_requests_used'
    this.LIMIT = 10
    this.isGuest = false
    
    this.init()
  }
  
  async init() {
    // Check if user is authenticated
    this.isGuest = await this.checkIfGuest()
    
    if (this.isGuest) {
      this.showQuotaIndicator()
      this.updateQuotaDisplay()
    }
    
    this.setupEventListeners()
  }
  
  setupEventListeners() {
    this.modalSignupBtn?.addEventListener('click', () => this.redirectToSignup())
    this.closeModalBtn?.addEventListener('click', () => this.hideQuotaModal())
  }
  
  async checkIfGuest() {
    // Check for OpenRouter API key
    const hasOpenRouterKey = !!localStorage.getItem('openrouter_api_key')
    if (hasOpenRouterKey) return false
    
    // Check for auth token (from AuthManager)
    const hasAuthToken = !!localStorage.getItem('website_auth_token')
    if (hasAuthToken) return false
    
    // Check for Supabase session cookie
    const hasSupabaseSession = document.cookie.split(';').some(cookie => 
      cookie.trim().startsWith('sb-')
    )
    if (hasSupabaseSession) return false
    
    // Check with AuthManager if available
    if (window.app?.authManager?.isAuthenticated()) return false
    
    // User is a guest
    return true
  }
  
  showQuotaIndicator() {
    if (this.quotaIndicator) {
      this.quotaIndicator.style.display = 'flex'
    }
  }
  
  hideQuotaIndicator() {
    if (this.quotaIndicator) {
      this.quotaIndicator.style.display = 'none'
    }
  }
  
  getUsedQuota() {
    try {
      const used = parseInt(localStorage.getItem(this.QUOTA_KEY) || '0')
      return Math.max(0, Math.min(used, this.LIMIT))
    } catch {
      return 0
    }
  }
  
  getRemainingQuota() {
    return Math.max(0, this.LIMIT - this.getUsedQuota())
  }
  
  updateQuotaDisplay() {
    const remaining = this.getRemainingQuota()
    
    if (this.quotaRemaining) {
      this.quotaRemaining.textContent = remaining
      
      // Update color based on remaining quota
      if (remaining <= 2) {
        this.quotaRemaining.style.color = '#ef4444' // red
      } else if (remaining <= 5) {
        this.quotaRemaining.style.color = '#f59e0b' // orange
      } else {
        this.quotaRemaining.style.color = '#10b981' // green
      }
    }
  }
  
  incrementQuota() {
    if (!this.isGuest) return true
    
    const used = this.getUsedQuota()
    const newUsed = used + 1
    
    try {
      localStorage.setItem(this.QUOTA_KEY, newUsed.toString())
    } catch (e) {
      console.warn('Failed to save quota:', e)
    }
    
    this.updateQuotaDisplay()
    
    // Return true if still under limit
    return newUsed <= this.LIMIT
  }
  
  canMakeRequest() {
    if (!this.isGuest) return true
    
    const remaining = this.getRemainingQuota()
    return remaining > 0
  }
  
  getRemainingRequests() {
    if (!this.isGuest) return Infinity
    return this.getRemainingQuota()
  }
  
  showQuotaExceededModal() {
    if (this.quotaModal) {
      this.quotaModal.style.display = 'flex'
    }
  }
  
  hideQuotaModal() {
    if (this.quotaModal) {
      this.quotaModal.style.display = 'none'
    }
  }
  
  redirectToSignup() {
    // Save editor state before redirecting
    const editorState = this.getCurrentEditorState()
    
    try {
      sessionStorage.setItem('editor_state_before_signup', JSON.stringify(editorState))
    } catch (e) {
      console.warn('Could not save editor state:', e)
    }
    
    // Redirect to signup with return URL
    const websiteOrigin = this.getWebsiteOrigin()
    const returnTo = encodeURIComponent(window.location.href)
    const signupUrl = `${websiteOrigin}/auth/signup?return_to=${returnTo}`
    
    window.location.href = signupUrl
  }
  
  getCurrentEditorState() {
    const files = []
    
    if (this.fileManager && this.fileManager.files) {
      Object.entries(this.fileManager.files).forEach(([name, fileData]) => {
        files.push({
          name: name,
          content: fileData.content || ''
        })
      })
    }
    
    return {
      files: files,
      activeFile: this.fileManager?.currentFile || null,
      timestamp: Date.now()
    }
  }
  
  getWebsiteOrigin() {
    // Try localStorage first
    try {
      const stored = localStorage.getItem('website_origin_base')
      if (stored) return stored
    } catch {}
    
    // Fallback to production URL
    return 'https://ailiveeditor.netlify.app'
  }
  
  // Reset quota (for testing/debugging)
  resetQuota() {
    try {
      localStorage.removeItem(this.QUOTA_KEY)
      this.updateQuotaDisplay()
      console.log('✅ Guest quota reset')
    } catch (e) {
      console.error('Failed to reset quota:', e)
    }
  }
}
