export class AuthManager {
  constructor(projectSyncManager) {
    this.projectSync = projectSyncManager;
    this.tokenKey = 'website_auth_token';
    this.siteKey = 'website_origin_base';
    this.authToken = '';
    try {
      const stored = localStorage.getItem(this.tokenKey);
      if (stored) this.authToken = stored;
    } catch {}
  }

  initFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const site = params.get('site');
      if (site) {
        try { localStorage.setItem(this.siteKey, site.replace(/\/$/, '')); } catch {}
      }
      if (token) {
        this.setToken(token);
        // sanitize URL
        params.delete('token');
        const sanitized = `${location.pathname}?${params.toString()}`;
        try { history.replaceState(null, '', sanitized); } catch {}
      }
    } catch {}
    // propagate into ProjectSync
    if (this.projectSync && this.authToken) this.projectSync.authToken = this.authToken;
  }

  isAuthenticated() {
    return !!this.authToken;
  }

  getSiteOrigin() {
    try {
      const fromLocal = localStorage.getItem(this.siteKey);
      if (fromLocal) return fromLocal;
    } catch {}
    // fallback to referrer
    try { return new URL(document.referrer).origin; } catch {}
    return '';
  }

  setToken(token) {
    this.authToken = token || '';
    try { localStorage.setItem(this.tokenKey, this.authToken); } catch {}
    if (this.projectSync) this.projectSync.authToken = this.authToken;
  }

  clearToken() {
    this.authToken = '';
    try { localStorage.removeItem(this.tokenKey); } catch {}
    if (this.projectSync) this.projectSync.authToken = '';
  }

  login(siteOrigin) {
    const base = (siteOrigin || this.getSiteOrigin() || '').replace(/\/$/, '');
    if (!base) {
      console.warn('[AuthManager] No site origin for login redirect');
      return;
    }
    const current = window.location.href;
    const target = `${base}/auth/login?redirect=${encodeURIComponent(current)}`;
    window.location.href = target;
  }

  logout(siteOrigin) {
    this.clearToken();
    const base = (siteOrigin || this.getSiteOrigin() || '').replace(/\/$/, '');
    if (base) {
      try { window.location.href = `${base}`; } catch {}
    }
  }
}


