/**
 * ActionExecutor - Execute AI-suggested actions with user approval
 * 
 * Handles:
 * - File edits (with diff preview)
 * - File creation (with content preview)
 * - Terminal commands (with confirmation)
 * - Project plans (with task list)
 * 
 * All actions require user approval via preview cards
 */
export class ActionExecutor {
    constructor(fileManager, editor) {
        console.log('⚡ ActionExecutor: Initialized');
        
        this.fileManager = fileManager;
        this.editor = editor;
        this.chatMessages = document.getElementById('chat-messages');
    }
    
    /**
     * Execute array of actions
     */
    async executeActions(actions) {
        if (!actions || actions.length === 0) {
            return;
        }
        
        console.log('[ActionExecutor] Executing', actions.length, 'actions');
        
        for (const action of actions) {
            try {
                await this.executeAction(action);
            } catch (error) {
                console.error('[ActionExecutor] Error executing action:', error);
                this.showErrorMessage(`Failed to execute ${action.type}: ${error.message}`);
            }
        }
    }
    
    /**
     * Execute single action based on type
     */
    async executeAction(action) {
        console.log('[ActionExecutor] Executing:', action.type, action.file || action.command);
        
        switch (action.type) {
            case 'edit':
                return await this.executeEdit(action);
            case 'create':
                return await this.executeCreate(action);
            case 'terminal':
                return await this.executeTerminal(action);
            case 'plan':
                return await this.displayPlan(action);
            default:
                console.warn('[ActionExecutor] Unknown action type:', action.type);
        }
    }
    
    /**
     * Execute file edit action
     */
    async executeEdit(action) {
        // Find the file
        const file = this.fileManager.files.find(f => f.name === action.file);
        
        if (!file) {
            this.showErrorMessage(`File not found: ${action.file}`);
            return;
        }
        
        // Create diff preview
        const diffPreview = this.createDiffPreview(file.content, action.content);
        
        // Show action card with preview
        this.showActionCard({
            type: 'edit',
            title: `Edit: ${action.file}`,
            icon: '✏️',
            preview: diffPreview,
            onApply: () => {
                // Update file content
                file.content = action.content;
                this.fileManager.saveFilesToStorage();
                
                // Update editor if this file is currently open
                if (this.fileManager.getCurrentFile()?.id === file.id) {
                    this.editor.setValue(action.content);
                }
                
                // If using project sync, save to database
                if (window.projectSyncManager && window.projectSyncManager.currentProjectId) {
                    window.projectSyncManager.saveToWebsite();
                }
                
                this.showSuccessMessage(`✅ Updated ${action.file}`);
            },
            onReject: () => {
                this.showInfoMessage('Edit cancelled');
            }
        });
    }
    
    /**
     * Execute file creation action
     */
    async executeCreate(action) {
        // Check if file already exists
        const exists = this.fileManager.files.some(f => f.name === action.file);
        
        if (exists) {
            this.showActionCard({
                type: 'create',
                title: `⚠️ File exists: ${action.file}`,
                icon: '⚠️',
                preview: `<p>A file named <strong>${action.file}</strong> already exists. Do you want to overwrite it?</p>
                         ${this.createCodePreview(action.content)}`,
                onApply: () => {
                    // Overwrite existing file
                    const file = this.fileManager.files.find(f => f.name === action.file);
                    file.content = action.content;
                    this.fileManager.saveFilesToStorage();
                    
                    // Update editor if open
                    if (this.fileManager.getCurrentFile()?.id === file.id) {
                        this.editor.setValue(action.content);
                    }
                    
                    // Save to project if synced
                    if (window.projectSyncManager?.currentProjectId) {
                        window.projectSyncManager.saveToWebsite();
                    }
                    
                    this.showSuccessMessage(`✅ Overwrote ${action.file}`);
                },
                onReject: () => {
                    this.showInfoMessage('File creation cancelled');
                }
            });
            return;
        }
        
        // Show creation preview
        this.showActionCard({
            type: 'create',
            title: `Create: ${action.file}`,
            icon: '✨',
            preview: this.createCodePreview(action.content),
            onApply: () => {
                // Create the file
                this.fileManager.createNewFile(action.file, action.content);
                
                // Save to project if synced
                if (window.projectSyncManager?.currentProjectId) {
                    window.projectSyncManager.saveToWebsite();
                }
                
                this.showSuccessMessage(`✅ Created ${action.file}`);
            },
            onReject: () => {
                this.showInfoMessage('File creation cancelled');
            }
        });
    }
    
    /**
     * Execute terminal command
     */
    async executeTerminal(action) {
        this.showActionCard({
            type: 'terminal',
            title: 'Run Terminal Command',
            icon: '🖥️',
            preview: `<code class="terminal-command">$ ${this.escapeHtml(action.command)}</code>
                     <p><em>Execute this command in the terminal?</em></p>`,
            onApply: async () => {
                if (window.terminalManager) {
                    try {
                        const result = await window.terminalManager.executeCommand(action.command);
                        this.showTerminalOutput(action.command, result);
                    } catch (error) {
                        this.showErrorMessage(`Terminal error: ${error.message}`);
                    }
                } else {
                    this.showErrorMessage('Terminal not available');
                }
            },
            onReject: () => {
                this.showInfoMessage('Command cancelled');
            }
        });
    }
    
    /**
     * Display project plan
     */
    async displayPlan(action) {
        const planHtml = this.formatPlan(action.content, action.tasks);
        
        this.showActionCard({
            type: 'plan',
            title: 'Project Plan',
            icon: '📋',
            preview: planHtml,
            onApply: () => {
                // Save plan to a new file
                const planContent = `# Project Plan\n\nCreated: ${new Date().toLocaleString()}\n\n${action.content}`;
                
                // Check if PROJECT_PLAN.md already exists
                const existingPlan = this.fileManager.files.find(f => f.name === 'PROJECT_PLAN.md');
                
                if (existingPlan) {
                    existingPlan.content = planContent;
                    this.showSuccessMessage('✅ Updated PROJECT_PLAN.md');
                } else {
                    this.fileManager.createNewFile('PROJECT_PLAN.md', planContent);
                    this.showSuccessMessage('✅ Created PROJECT_PLAN.md');
                }
                
                // Save to project if synced
                if (window.projectSyncManager?.currentProjectId) {
                    window.projectSyncManager.saveToWebsite();
                }
            },
            onReject: () => {
                this.showInfoMessage('Plan discarded');
            }
        });
    }
    
    /**
     * Show action card UI
     */
    showActionCard(config) {
        if (!this.chatMessages) return;
        
        const card = document.createElement('div');
        card.className = `action-card ${config.type}-action`;
        card.innerHTML = `
            <div class="action-header">
                <span class="action-icon">${config.icon}</span>
                <strong class="action-title">${config.title}</strong>
            </div>
            <div class="action-preview">
                ${config.preview}
            </div>
            <div class="action-buttons">
                <button class="action-btn apply-btn">Apply</button>
                <button class="action-btn reject-btn">Cancel</button>
            </div>
        `;
        
        // Add to chat
        this.chatMessages.appendChild(card);
        this.scrollToBottom();
        
        // Wire up buttons
        const applyBtn = card.querySelector('.apply-btn');
        const rejectBtn = card.querySelector('.reject-btn');
        
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                config.onApply();
                card.classList.add('action-applied');
                applyBtn.disabled = true;
                rejectBtn.disabled = true;
            });
        }
        
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                config.onReject();
                card.classList.add('action-rejected');
                applyBtn.disabled = true;
                rejectBtn.disabled = true;
            });
        }
    }
    
    /**
     * Create diff preview for file edits
     */
    createDiffPreview(oldContent, newContent) {
        // Simple diff: show first few lines of new content
        const lines = newContent.split('\n');
        const preview = lines.slice(0, 10).join('\n');
        const hasMore = lines.length > 10;
        
        return `
            <div class="diff-preview">
                <div class="diff-stats">
                    <span>Lines: ${lines.length}</span>
                    ${hasMore ? '<span>(showing first 10 lines)</span>' : ''}
                </div>
                <pre><code>${this.escapeHtml(preview)}</code></pre>
                ${hasMore ? `<div class="diff-more">... ${lines.length - 10} more lines</div>` : ''}
            </div>
        `;
    }
    
    /**
     * Create code preview for file creation
     */
    createCodePreview(content) {
        const lines = content.split('\n');
        const preview = lines.slice(0, 15).join('\n');
        const hasMore = lines.length > 15;
        
        return `
            <div class="code-preview">
                <div class="code-stats">
                    <span>Lines: ${lines.length}</span>
                    <span>Size: ${content.length} characters</span>
                </div>
                <pre><code>${this.escapeHtml(preview)}</code></pre>
                ${hasMore ? `<div class="code-more">... ${lines.length - 15} more lines</div>` : ''}
            </div>
        `;
    }
    
    /**
     * Format plan content
     */
    formatPlan(content, tasks) {
        let html = '<div class="plan-content">';
        
        if (tasks && tasks.length > 0) {
            // Grouped by phase
            const phases = {};
            let noPhase = [];
            
            for (const task of tasks) {
                if (task.phase) {
                    if (!phases[task.phase]) {
                        phases[task.phase] = [];
                    }
                    phases[task.phase].push(task);
                } else {
                    noPhase.push(task);
                }
            }
            
            // Render phases
            for (const [phase, phaseTasks] of Object.entries(phases)) {
                html += `<div class="plan-phase"><strong>${this.escapeHtml(phase)}</strong></div>`;
                html += '<ul class="plan-tasks">';
                for (const task of phaseTasks) {
                    const checkbox = task.completed ? '☑' : '☐';
                    html += `<li>${checkbox} ${this.escapeHtml(task.description)}</li>`;
                }
                html += '</ul>';
            }
            
            // Render tasks without phase
            if (noPhase.length > 0) {
                html += '<ul class="plan-tasks">';
                for (const task of noPhase) {
                    const checkbox = task.completed ? '☑' : '☐';
                    html += `<li>${checkbox} ${this.escapeHtml(task.description)}</li>`;
                }
                html += '</ul>';
            }
        } else {
            // Fallback: just show the content
            html += `<pre>${this.escapeHtml(content)}</pre>`;
        }
        
        html += '</div>';
        return html;
    }
    
    /**
     * Show terminal output
     */
    showTerminalOutput(command, result) {
        if (!this.chatMessages) return;
        
        const outputDiv = document.createElement('div');
        outputDiv.className = 'terminal-output-card';
        outputDiv.innerHTML = `
            <div class="terminal-header">
                <span class="terminal-icon">🖥️</span>
                <strong>Terminal Output</strong>
            </div>
            <div class="terminal-command">$ ${this.escapeHtml(command)}</div>
            <pre class="terminal-result">${this.escapeHtml(result.output || '')}</pre>
            ${result.error ? `<div class="terminal-error">${this.escapeHtml(result.error)}</div>` : ''}
        `;
        
        this.chatMessages.appendChild(outputDiv);
        this.scrollToBottom();
    }
    
    /**
     * Show success message
     */
    showSuccessMessage(message) {
        this.showStatusMessage(message, 'success');
    }
    
    /**
     * Show info message
     */
    showInfoMessage(message) {
        this.showStatusMessage(message, 'info');
    }
    
    /**
     * Show error message
     */
    showErrorMessage(message) {
        this.showStatusMessage(message, 'error');
    }
    
    /**
     * Show status message
     */
    showStatusMessage(message, type = 'info') {
        if (!this.chatMessages) return;
        
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}-message`;
        statusDiv.textContent = message;
        
        this.chatMessages.appendChild(statusDiv);
        this.scrollToBottom();
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            statusDiv.classList.add('fade-out');
            setTimeout(() => statusDiv.remove(), 300);
        }, 5000);
    }
    
    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        if (this.chatMessages) {
            setTimeout(() => {
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }, 100);
        }
    }
    
    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
