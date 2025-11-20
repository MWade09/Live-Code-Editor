/**
 * Modern Deployment Manager - Integrates with React deployment system
 * Replaces the old DeployManager with API-based deployment
 */
export class ModernDeployManager {
    constructor(fileManager, projectSync) {
        this.fileManager = fileManager;
        this.projectSync = projectSync;
        this.deployModal = null;
        this.currentDeployment = null;
        
        this.init();
    }
    
    init() {
        // Create deployment modal container
        this.createDeployModal();
        
        console.log('✅ Modern Deployment Manager initialized');
    }
    
    /**
     * Create deployment modal in the DOM
     */
    createDeployModal() {
        const modalHTML = `
            <div id="modern-deploy-modal" class="deploy-modal" style="display: none;">
                <div class="deploy-modal-overlay"></div>
                <div class="deploy-modal-content">
                    <div class="deploy-modal-header">
                        <div class="deploy-header-left">
                            <div class="deploy-icon">🚀</div>
                            <div>
                                <h2>Deploy Project</h2>
                                <p class="deploy-subtitle" id="deploy-project-name">Loading...</p>
                            </div>
                        </div>
                        <button class="deploy-close-btn" id="deploy-close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="deploy-modal-body" id="deploy-modal-body">
                        <!-- Content will be dynamically loaded -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.deployModal = document.getElementById('modern-deploy-modal');
        
        // Add event listeners
        document.getElementById('deploy-close-btn').addEventListener('click', () => {
            this.hideModal();
        });
        
        this.deployModal.querySelector('.deploy-modal-overlay').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Add styles
        this.injectStyles();
    }
    
    /**
     * Inject CSS styles for the modal
     */
    injectStyles() {
        const styles = `
            <style>
                .deploy-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .deploy-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                }
                
                .deploy-modal-content {
                    position: relative;
                    background: #1e293b;
                    border-radius: 12px;
                    border: 1px solid #334155;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    max-width: 700px;
                    width: 100%;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: modalSlideIn 0.3s ease-out;
                }
                
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .deploy-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 24px;
                    border-bottom: 1px solid #334155;
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                }
                
                .deploy-header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .deploy-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                
                .deploy-modal-header h2 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #fff;
                }
                
                .deploy-subtitle {
                    margin: 4px 0 0 0;
                    font-size: 14px;
                    color: #94a3b8;
                }
                
                .deploy-close-btn {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                
                .deploy-close-btn:hover {
                    background: #334155;
                    color: #fff;
                }
                
                .deploy-modal-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }
                
                .deploy-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    color: #94a3b8;
                }
                
                .deploy-loading-spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid #334155;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    /**
     * Show deployment modal
     */
    async showDeployModal() {
        // Ensure project is saved first
        if (!this.projectSync || !this.projectSync.currentProject) {
            this.showError('Please save your project first before deploying.');
            return;
        }
        
        const project = this.projectSync.currentProject;
        
        // Update modal title
        document.getElementById('deploy-project-name').textContent = project.title || 'Untitled Project';
        
        // Show modal with loading state
        this.deployModal.style.display = 'flex';
        this.showLoading();
        
        // Load deployment UI
        await this.loadDeploymentUI(project);
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        const body = document.getElementById('deploy-modal-body');
        body.innerHTML = `
            <div class="deploy-loading">
                <div class="deploy-loading-spinner"></div>
                <p>Preparing deployment...</p>
            </div>
        `;
    }
    
    /**
     * Load deployment UI from API
     */
    async loadDeploymentUI(project) {
        try {
            // Check if user has tokens configured
            const tokensResponse = await fetch('/api/deployment/tokens');
            const tokensData = await tokensResponse.json();
            
            // Render deployment interface
            this.renderDeploymentInterface(project, tokensData);
            
        } catch (error) {
            console.error('Failed to load deployment UI:', error);
            this.showError('Failed to load deployment interface. Please try again.');
        }
    }
    
    /**
     * Render deployment interface
     */
    renderDeploymentInterface(project, tokensData) {
        const body = document.getElementById('deploy-modal-body');
        
        const hasNetlify = tokensData.netlifyConnected || false;
        const hasVercel = tokensData.vercelConnected || false;
        
        body.innerHTML = `
            <div class="deploy-interface">
                ${!hasNetlify && !hasVercel ? `
                    <div class="deploy-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>No deployment platforms connected</strong>
                            <p>Please connect your Netlify or Vercel account to deploy projects.</p>
                            <a href="/settings#deployment" class="deploy-settings-link" target="_blank">
                                Go to Settings <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    </div>
                ` : ''}
                
                <div class="deploy-section">
                    <label class="deploy-label">Choose Platform</label>
                    <div class="deploy-platform-grid">
                        <button class="deploy-platform-btn ${!hasNetlify ? 'disabled' : ''}" 
                                data-platform="netlify" 
                                ${!hasNetlify ? 'disabled' : ''}>
                            <div class="platform-icon netlify-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                                    <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.8L19.2 12 12 19.2 4.8 12 12 4.8z" />
                                </svg>
                            </div>
                            <div class="platform-info">
                                <div class="platform-name">Netlify</div>
                                ${hasNetlify 
                                    ? '<div class="platform-status connected"><i class="fas fa-check-circle"></i> Connected</div>'
                                    : '<div class="platform-status"><i class="fas fa-times-circle"></i> Not connected</div>'
                                }
                            </div>
                        </button>
                        
                        <button class="deploy-platform-btn ${!hasVercel ? 'disabled' : ''}" 
                                data-platform="vercel"
                                ${!hasVercel ? 'disabled' : ''}>
                            <div class="platform-icon vercel-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                                    <path d="M12 2L2 19h20L12 2z" />
                                </svg>
                            </div>
                            <div class="platform-info">
                                <div class="platform-name">Vercel</div>
                                ${hasVercel 
                                    ? '<div class="platform-status connected"><i class="fas fa-check-circle"></i> Connected</div>'
                                    : '<div class="platform-status"><i class="fas fa-times-circle"></i> Not connected</div>'
                                }
                            </div>
                        </button>
                    </div>
                </div>
                
                <div class="deploy-section" id="deploy-name-section" style="display: none;">
                    <label class="deploy-label">Site Name</label>
                    <p class="deploy-help-text">Choose a unique name for your site URL</p>
                    <div class="deploy-name-input-group">
                        <input 
                            type="text" 
                            id="deploy-site-name" 
                            class="deploy-name-input" 
                            placeholder="my-awesome-site"
                        />
                        <button class="deploy-check-btn" id="deploy-check-name">
                            <i class="fas fa-search"></i> Check
                        </button>
                    </div>
                    <div id="deploy-name-status" class="deploy-name-status"></div>
                    <div class="deploy-name-preview" id="deploy-name-preview" style="display: none;"></div>
                </div>
                
                <div class="deploy-section" id="deploy-env-section" style="display: none;">
                    <label class="deploy-label">Environment Variables (Optional)</label>
                    <div id="deploy-env-vars"></div>
                    <button class="deploy-add-env-btn" id="deploy-add-env">
                        <i class="fas fa-plus"></i> Add Variable
                    </button>
                </div>
                
                <div class="deploy-section">
                    <div class="deploy-info-box">
                        <h3>What happens next?</h3>
                        <ul>
                            <li><i class="fas fa-check"></i> Your project will be deployed to the selected platform</li>
                            <li><i class="fas fa-check"></i> A unique URL will be generated for your site</li>
                            <li><i class="fas fa-check"></i> You can update your deployment anytime</li>
                            <li><i class="fas fa-check"></i> Deployment typically takes 30-60 seconds</li>
                        </ul>
                    </div>
                </div>
                
                <div class="deploy-actions">
                    <button class="deploy-cancel-btn" id="deploy-cancel">Cancel</button>
                    <button class="deploy-submit-btn" id="deploy-submit" disabled>
                        <i class="fas fa-rocket"></i> Deploy Now
                    </button>
                </div>
                
                <div id="deploy-status-container" style="display: none;"></div>
            </div>
        `;
        
        this.attachDeploymentHandlers(project);
        this.injectDeploymentStyles();
    }
    
    /**
     * Attach event handlers for deployment
     */
    attachDeploymentHandlers(project) {
        let selectedPlatform = null;
        const envVars = {};
        
        // Generate default site name from project title
        const defaultSiteName = this.sanitizeSiteName(project.title || 'my-project');
        document.getElementById('deploy-site-name').value = defaultSiteName;
        
        // Platform selection
        document.querySelectorAll('.deploy-platform-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.deploy-platform-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedPlatform = btn.dataset.platform;
                
                // Show site name section
                document.getElementById('deploy-name-section').style.display = 'block';
                document.getElementById('deploy-env-section').style.display = 'block';
                
                // Reset name availability check
                document.getElementById('deploy-name-status').innerHTML = '';
                document.getElementById('deploy-name-preview').style.display = 'none';
                document.getElementById('deploy-submit').disabled = true;
            });
        });
        
        // Check name availability
        document.getElementById('deploy-check-name').addEventListener('click', async () => {
            const siteNameInput = document.getElementById('deploy-site-name');
            const siteName = siteNameInput.value.trim();
            
            if (!siteName) {
                this.showNameStatus('error', 'Please enter a site name');
                return;
            }
            
            if (!selectedPlatform) {
                this.showNameStatus('error', 'Please select a platform first');
                return;
            }
            
            await this.checkSiteNameAvailability(siteName, selectedPlatform);
        });
        
        // Also check on Enter key
        document.getElementById('deploy-site-name').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                document.getElementById('deploy-check-name').click();
            }
        });
        
        // Cancel button
        document.getElementById('deploy-cancel').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Deploy button
        document.getElementById('deploy-submit').addEventListener('click', async () => {
            if (!selectedPlatform) return;
            
            const siteName = document.getElementById('deploy-site-name').value.trim();
            await this.executeDeploy(project, selectedPlatform, envVars, siteName);
        });
        
        // Add environment variable
        document.getElementById('deploy-add-env').addEventListener('click', () => {
            this.addEnvironmentVariable(envVars);
        });
    }
    
    /**
     * Add environment variable input
     */
    addEnvironmentVariable(envVars) {
        const container = document.getElementById('deploy-env-vars');
        const id = Date.now();
        
        const varHTML = `
            <div class="deploy-env-var" data-id="${id}">
                <input type="text" class="deploy-env-key" placeholder="KEY" />
                <input type="text" class="deploy-env-value" placeholder="value" />
                <button class="deploy-remove-env" data-id="${id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', varHTML);
        
        const varElement = container.querySelector(`[data-id="${id}"]`);
        const keyInput = varElement.querySelector('.deploy-env-key');
        const valueInput = varElement.querySelector('.deploy-env-value');
        
        keyInput.addEventListener('input', () => {
            if (keyInput.value) {
                envVars[keyInput.value] = valueInput.value;
            }
        });
        
        valueInput.addEventListener('input', () => {
            if (keyInput.value) {
                envVars[keyInput.value] = valueInput.value;
            }
        });
        
        varElement.querySelector('.deploy-remove-env').addEventListener('click', () => {
            if (keyInput.value) {
                delete envVars[keyInput.value];
            }
            varElement.remove();
        });
    }
    
    /**
     * Sanitize site name
     */
    sanitizeSiteName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 63)
            || 'my-project';
    }
    
    /**
     * Check site name availability
     */
    async checkSiteNameAvailability(siteName, platform) {
        const checkBtn = document.getElementById('deploy-check-name');
        const statusDiv = document.getElementById('deploy-name-status');
        const previewDiv = document.getElementById('deploy-name-preview');
        const submitBtn = document.getElementById('deploy-submit');
        
        checkBtn.disabled = true;
        checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        statusDiv.innerHTML = '';
        previewDiv.style.display = 'none';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/deployment/check-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    siteName,
                    platform
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                let errorMsg = data.error || 'Failed to check availability';
                if (data.requiresReauth) {
                    errorMsg += '<br><br><a href="/settings#deployment" target="_blank" style="color: #60a5fa; text-decoration: underline;">Go to Settings →</a>';
                }
                this.showNameStatus('error', errorMsg);
                return;
            }
            
            if (data.available) {
                this.showNameStatus('success', `✓ "${data.sanitizedName}" is available!`);
                previewDiv.style.display = 'block';
                previewDiv.innerHTML = `
                    <div class="deploy-preview-url">
                        <i class="fas fa-globe"></i>
                        <span>Your site will be: <strong>https://${data.sanitizedName}.netlify.app</strong></span>
                    </div>
                `;
                submitBtn.disabled = false;
                
                // Update input with sanitized name
                document.getElementById('deploy-site-name').value = data.sanitizedName;
            } else {
                this.showNameStatus('error', `✗ "${data.sanitizedName}" is already taken`);
                if (data.suggestion) {
                    statusDiv.innerHTML += `
                        <div class="deploy-name-suggestion">
                            Try: <button class="deploy-suggestion-btn" onclick="document.getElementById('deploy-site-name').value='${data.suggestion}'; document.getElementById('deploy-check-name').click();">
                                ${data.suggestion}
                            </button>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Name check error:', error);
            this.showNameStatus('error', 'Failed to check name availability');
        } finally {
            checkBtn.disabled = false;
            checkBtn.innerHTML = '<i class="fas fa-search"></i> Check';
        }
    }
    
    /**
     * Show name availability status
     */
    showNameStatus(type, message) {
        const statusDiv = document.getElementById('deploy-name-status');
        const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        const colorClass = type === 'success' ? 'success' : 'error';
        
        statusDiv.className = `deploy-name-status ${colorClass}`;
        statusDiv.innerHTML = `
            <i class="fas ${iconClass}"></i>
            <span>${message}</span>
        `;
    }
    
    /**
     * Execute deployment
     */
    async executeDeploy(project, platform, envVars, siteName) {
        const submitBtn = document.getElementById('deploy-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deploying...';
        
        try {
            const response = await fetch('/api/deployment/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    projectId: project.id,
                    platform,
                    envVars,
                    siteName
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Deployment failed');
            }
            
            // Show deployment status
            this.showDeploymentStatus(data.deploymentId);
            
        } catch (error) {
            console.error('Deployment error:', error);
            this.showError(error.message || 'Deployment failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Deploy Now';
        }
    }
    
    /**
     * Show deployment status with polling
     */
    showDeploymentStatus(deploymentId) {
        const container = document.getElementById('deploy-status-container');
        container.style.display = 'block';
        container.innerHTML = `
            <div class="deploy-status-box">
                <div class="deploy-status-header">
                    <div class="deploy-status-icon building">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div>
                        <strong id="deploy-status-text">Building your project...</strong>
                        <p class="deploy-status-detail" id="deploy-status-detail">This may take 30-60 seconds</p>
                    </div>
                </div>
                <div class="deploy-progress-bar">
                    <div class="deploy-progress-fill" id="deploy-progress-fill"></div>
                </div>
                <div id="deploy-url-container" style="display: none;"></div>
            </div>
        `;
        
        // Hide deployment form
        document.querySelector('.deploy-interface').style.display = 'none';
        
        // Start polling
        this.pollDeploymentStatus(deploymentId);
    }
    
    /**
     * Poll deployment status
     */
    async pollDeploymentStatus(deploymentId) {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/deployment/status/${deploymentId}`);
                const data = await response.json();
                
                this.updateDeploymentStatus(data);
                
                if (data.status === 'success' || data.status === 'failed') {
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Status poll error:', error);
            }
        }, 3000);
    }
    
    /**
     * Update deployment status UI
     */
    updateDeploymentStatus(data) {
        const statusText = document.getElementById('deploy-status-text');
        const statusDetail = document.getElementById('deploy-status-detail');
        const statusIcon = document.querySelector('.deploy-status-icon');
        const progressFill = document.getElementById('deploy-progress-fill');
        const urlContainer = document.getElementById('deploy-url-container');
        
        switch (data.status) {
            case 'building':
                statusText.textContent = '🔨 Building your project...';
                statusDetail.textContent = 'Platform is compiling and optimizing your code';
                progressFill.style.width = '66%';
                break;
                
            case 'success':
                statusIcon.className = 'deploy-status-icon success';
                statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                statusText.textContent = '✅ Deployment successful!';
                statusDetail.textContent = 'Your site is now live';
                progressFill.style.width = '100%';
                progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
                
                if (data.url) {
                    urlContainer.style.display = 'block';
                    urlContainer.innerHTML = `
                        <div class="deploy-success-box">
                            <strong>Your site is live! 🎉</strong>
                            <a href="${data.url}" target="_blank" class="deploy-live-url">
                                ${data.url} <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    `;
                }
                break;
                
            case 'failed':
                statusIcon.className = 'deploy-status-icon failed';
                statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
                statusText.textContent = '❌ Deployment failed';
                statusDetail.textContent = data.error || 'An error occurred during deployment';
                progressFill.style.width = '100%';
                progressFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
                break;
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const body = document.getElementById('deploy-modal-body');
        body.innerHTML = `
            <div class="deploy-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="deploy-error-btn" onclick="this.closest('.deploy-modal').style.display='none'">
                    Close
                </button>
            </div>
        `;
    }
    
    /**
     * Hide modal
     */
    hideModal() {
        this.deployModal.style.display = 'none';
    }
    
    /**
     * Inject deployment-specific styles
     */
    injectDeploymentStyles() {
        if (document.getElementById('deploy-interface-styles')) return;
        
        const styles = `
            <style id="deploy-interface-styles">
                .deploy-interface {
                    color: #e2e8f0;
                }
                
                .deploy-warning {
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    background: rgba(251, 191, 36, 0.1);
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    border-radius: 8px;
                    margin-bottom: 24px;
                }
                
                .deploy-warning i {
                    color: #fbbf24;
                    font-size: 24px;
                    flex-shrink: 0;
                }
                
                .deploy-warning strong {
                    display: block;
                    color: #fbbf24;
                    margin-bottom: 4px;
                }
                
                .deploy-warning p {
                    margin: 0 0 8px 0;
                    color: #cbd5e1;
                    font-size: 14px;
                }
                
                .deploy-settings-link {
                    color: #60a5fa;
                    text-decoration: none;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .deploy-settings-link:hover {
                    color: #93c5fd;
                }
                
                .deploy-section {
                    margin-bottom: 24px;
                }
                
                .deploy-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #cbd5e1;
                    margin-bottom: 12px;
                }
                
                .deploy-platform-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                
                .deploy-platform-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(30, 41, 59, 0.5);
                    border: 2px solid #334155;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #e2e8f0;
                }
                
                .deploy-platform-btn:not(.disabled):hover {
                    border-color: #475569;
                    background: rgba(51, 65, 85, 0.3);
                }
                
                .deploy-platform-btn.selected {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                }
                
                .deploy-platform-btn.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .platform-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .netlify-icon {
                    background: #00C7B7;
                    color: white;
                }
                
                .vercel-icon {
                    background: #000;
                    color: white;
                }
                
                .platform-info {
                    flex: 1;
                    text-align: left;
                }
                
                .platform-name {
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 4px;
                }
                
                .platform-status {
                    font-size: 12px;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .platform-status.connected {
                    color: #10b981;
                }
                
                .deploy-env-var {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                
                .deploy-env-key,
                .deploy-env-value {
                    flex: 1;
                    padding: 8px 12px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 6px;
                    color: #e2e8f0;
                    font-size: 14px;
                }
                
                .deploy-env-key:focus,
                .deploy-env-value:focus {
                    outline: none;
                    border-color: #3b82f6;
                }
                
                .deploy-remove-env {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                
                .deploy-remove-env:hover {
                    background: #334155;
                    color: #ef4444;
                }
                
                .deploy-add-env-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: #334155;
                    border: none;
                    border-radius: 6px;
                    color: #e2e8f0;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .deploy-add-env-btn:hover {
                    background: #475569;
                }
                
                .deploy-info-box {
                    padding: 16px;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 8px;
                }
                
                .deploy-info-box h3 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    color: #e2e8f0;
                }
                
                .deploy-info-box ul {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }
                
                .deploy-info-box li {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 14px;
                    color: #cbd5e1;
                }
                
                .deploy-info-box li:last-child {
                    margin-bottom: 0;
                }
                
                .deploy-info-box i {
                    color: #3b82f6;
                    margin-top: 2px;
                }
                
                .deploy-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid #334155;
                }
                
                .deploy-cancel-btn {
                    padding: 10px 24px;
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 14px;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                
                .deploy-cancel-btn:hover {
                    color: #e2e8f0;
                    background: #334155;
                }
                
                .deploy-submit-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                
                .deploy-submit-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                }
                
                .deploy-submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .deploy-status-box {
                    padding: 20px;
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid #334155;
                    border-radius: 8px;
                    margin-top: 24px;
                }
                
                .deploy-status-header {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 16px;
                }
                
                .deploy-status-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    flex-shrink: 0;
                }
                
                .deploy-status-icon.building {
                    background: rgba(59, 130, 246, 0.2);
                    color: #3b82f6;
                }
                
                .deploy-status-icon.success {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                }
                
                .deploy-status-icon.failed {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }
                
                .deploy-status-detail {
                    margin: 4px 0 0 0;
                    font-size: 14px;
                    color: #94a3b8;
                }
                
                .deploy-progress-bar {
                    height: 6px;
                    background: #1e293b;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }
                
                .deploy-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3b82f6, #2563eb);
                    border-radius: 3px;
                    transition: width 0.5s ease;
                    width: 33%;
                }
                
                .deploy-success-box {
                    padding: 16px;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 8px;
                }
                
                .deploy-success-box strong {
                    display: block;
                    color: #10b981;
                    margin-bottom: 8px;
                }
                
                .deploy-live-url {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #60a5fa;
                    text-decoration: none;
                    font-size: 14px;
                    word-break: break-all;
                }
                
                .deploy-live-url:hover {
                    color: #93c5fd;
                }
                
                .deploy-error {
                    text-align: center;
                    padding: 60px 20px;
                }
                
                .deploy-error i {
                    font-size: 48px;
                    color: #ef4444;
                    margin-bottom: 16px;
                }
                
                .deploy-error p {
                    color: #cbd5e1;
                    margin-bottom: 24px;
                }
                
                .deploy-error-btn {
                    padding: 10px 24px;
                    background: #334155;
                    border: none;
                    border-radius: 6px;
                    color: #e2e8f0;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .deploy-error-btn:hover {
                    background: #475569;
                }
                
                .deploy-help-text {
                    font-size: 13px;
                    color: #94a3b8;
                    margin: -8px 0 12px 0;
                }
                
                .deploy-name-input-group {
                    display: flex;
                    gap: 8px;
                }
                
                .deploy-name-input {
                    flex: 1;
                    padding: 10px 12px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 6px;
                    color: #e2e8f0;
                    font-size: 14px;
                    font-family: 'Courier New', monospace;
                }
                
                .deploy-name-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                }
                
                .deploy-check-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    background: #3b82f6;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                
                .deploy-check-btn:hover:not(:disabled) {
                    background: #2563eb;
                }
                
                .deploy-check-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .deploy-name-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    margin-top: 8px;
                }
                
                .deploy-name-status.success {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #10b981;
                }
                
                .deploy-name-status.error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                }
                
                .deploy-name-suggestion {
                    margin-top: 8px;
                    font-size: 13px;
                    color: #94a3b8;
                }
                
                .deploy-suggestion-btn {
                    background: #334155;
                    border: none;
                    padding: 4px 10px;
                    border-radius: 4px;
                    color: #60a5fa;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    margin-left: 4px;
                    transition: all 0.2s;
                }
                
                .deploy-suggestion-btn:hover {
                    background: #475569;
                }
                
                .deploy-name-preview {
                    margin-top: 12px;
                    padding: 12px;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 6px;
                }
                
                .deploy-preview-url {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    color: #e2e8f0;
                }
                
                .deploy-preview-url i {
                    color: #3b82f6;
                    font-size: 16px;
                }
                
                .deploy-preview-url strong {
                    color: #60a5fa;
                    font-family: 'Courier New', monospace;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}
