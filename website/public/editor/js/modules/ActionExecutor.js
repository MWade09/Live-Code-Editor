/**
 * ActionExecutor - Execute AI-suggested actions with user approval
 * 
 * Handles:
 * - File edits (with SMART DIFF preview)
 * - File creation (with content preview)
 * - Terminal commands (with confirmation)
 * - Project plans (with task list)
 * - Multi-file batch operations (via ComposerManager integration)
 * 
 * All actions require user approval via preview cards
 * 
 * PHASE 1 ENHANCEMENTS:
 * - Uses DiffManager for smart diff visualization
 * - Conflict detection for concurrent edits
 * - Undo support for AI changes
 * 
 * PHASE 4 ENHANCEMENTS:
 * - ComposerManager integration for multi-file operations
 * - Batch execution support
 * - Auto-routing to Composer for multiple changes
 */
export class ActionExecutor {
    constructor(fileManager, editor, diffManager = null) {
        console.log('⚡ ActionExecutor: Initialized with diff support');
        
        this.fileManager = fileManager;
        this.editor = editor;
        this.diffManager = diffManager;
        this.composerManager = null; // Set externally for multi-file ops
        this.chatMessages = document.getElementById('chat-messages');
        
        // Track original content for conflict detection
        this.originalContentCache = new Map();
        
        // Configuration
        this.config = {
            useComposerForMultiple: true,  // Route multi-file changes to Composer
            composerThreshold: 2            // Min files to trigger Composer
        };
        
        // Inject diff styles if DiffManager is available
        if (this.diffManager) {
            this.injectDiffStyles();
        }
    }
    
    /**
     * Set the ComposerManager (for multi-file operations)
     */
    setComposerManager(composerManager) {
        this.composerManager = composerManager;
    }
    
    /**
     * Set the DiffManager (can be set after construction)
     */
    setDiffManager(diffManager) {
        this.diffManager = diffManager;
        this.injectDiffStyles();
    }
    
    /**
     * Inject CSS styles for diff display
     */
    injectDiffStyles() {
        if (document.getElementById('diff-manager-styles')) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'diff-manager-styles';
        styleEl.textContent = `
            .diff-container {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                border: 1px solid var(--border-color, #333);
                border-radius: 4px;
                overflow: hidden;
                background: var(--bg-secondary, #1e1e1e);
                margin-top: 8px;
            }
            
            .diff-stats {
                padding: 8px 12px;
                background: var(--bg-tertiary, #252525);
                border-bottom: 1px solid var(--border-color, #333);
                display: flex;
                gap: 12px;
            }
            
            .diff-stat {
                font-size: 11px;
            }
            
            .diff-stat.additions {
                color: #4ade80;
            }
            
            .diff-stat.deletions {
                color: #f87171;
            }
            
            .diff-stat.unchanged {
                color: var(--text-muted, #888);
            }
            
            .diff-lines {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .diff-line {
                display: flex;
                padding: 2px 8px;
                min-height: 20px;
                line-height: 20px;
            }
            
            .diff-line.diff-addition {
                background: rgba(74, 222, 128, 0.15);
            }
            
            .diff-line.diff-deletion {
                background: rgba(248, 113, 113, 0.15);
            }
            
            .diff-line.diff-collapse {
                background: var(--bg-tertiary, #252525);
                color: var(--text-muted, #888);
                font-style: italic;
            }
            
            .line-number {
                min-width: 40px;
                color: var(--text-muted, #666);
                text-align: right;
                padding-right: 8px;
                user-select: none;
            }
            
            .line-prefix {
                min-width: 16px;
                font-weight: bold;
            }
            
            .diff-addition .line-prefix {
                color: #4ade80;
            }
            
            .diff-deletion .line-prefix {
                color: #f87171;
            }
            
            .line-content {
                flex: 1;
                white-space: pre;
                overflow-x: auto;
            }
            
            .diff-truncated {
                padding: 8px 12px;
                text-align: center;
                color: var(--text-muted, #888);
                font-style: italic;
                background: var(--bg-tertiary, #252525);
            }
            
            .conflict-warning {
                background: rgba(251, 191, 36, 0.2);
                border: 1px solid #fbbf24;
                border-radius: 4px;
                padding: 8px 12px;
                margin-bottom: 8px;
                color: #fbbf24;
                font-size: 12px;
            }
            
            .undo-btn {
                background: var(--bg-tertiary, #333);
                color: var(--text-primary, #fff);
                border: 1px solid var(--border-color, #444);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                margin-left: 8px;
            }
            
            .undo-btn:hover {
                background: var(--bg-hover, #444);
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    /**
     * Execute array of actions
     * Routes to Composer for multi-file operations if enabled
     */
    async executeActions(actions) {
        if (!actions || actions.length === 0) {
            return;
        }
        
        console.log('[ActionExecutor] Executing', actions.length, 'actions');
        
        // Check if we should route to Composer
        const fileActions = actions.filter(a => a.type === 'edit' || a.type === 'create');
        
        if (this.config.useComposerForMultiple && 
            this.composerManager && 
            fileActions.length >= this.config.composerThreshold) {
            
            console.log('[ActionExecutor] Routing to Composer for', fileActions.length, 'file changes');
            return this.routeToComposer(actions);
        }
        
        // Execute individually
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
     * Route actions to ComposerManager for multi-file preview
     */
    async routeToComposer(actions) {
        // Start a composer session
        const fileActions = actions.filter(a => a.type === 'edit' || a.type === 'create');
        this.composerManager.startSession('AI suggested changes');
        
        // Add each file action as a change
        for (const action of fileActions) {
            this.composerManager.addChange({
                filename: action.file,
                type: action.type === 'create' ? 'create' : 'modify',
                content: action.content,
                description: action.description || `${action.type} ${action.file}`
            });
        }
        
        // Handle non-file actions separately (terminal commands, plans)
        const otherActions = actions.filter(a => a.type !== 'edit' && a.type !== 'create');
        for (const action of otherActions) {
            await this.executeAction(action);
        }
        
        this.showInfoMessage(`📝 ${fileActions.length} file changes ready for review in Composer`);
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
     * Execute file edit action with smart diff
     */
    async executeEdit(action) {
        // Find the file
        const file = this.fileManager.files.find(f => f.name === action.file);
        
        if (!file) {
            this.showErrorMessage(`File not found: ${action.file}`);
            return;
        }
        
        // Get original content (cached or current)
        const originalContent = this.originalContentCache.get(file.id) || file.content;
        const currentContent = file.content;
        const newContent = action.content;
        
        // Check for conflicts (user edited since AI saw the file)
        let hasConflict = false;
        let conflictWarning = '';
        
        if (this.diffManager && originalContent !== currentContent) {
            // User has made changes since AI generated response
            hasConflict = true;
            conflictWarning = `
                <div class="conflict-warning">
                    ⚠️ You've made changes to this file since the AI saw it. 
                    Review carefully before applying.
                </div>
            `;
        }
        
        // Generate diff preview
        let diffPreview;
        if (this.diffManager) {
            const diff = this.diffManager.generateDiff(currentContent, newContent);
            diffPreview = this.diffManager.generateDiffHTML(diff, {
                showLineNumbers: true,
                contextLines: 3,
                collapseUnchanged: true,
                maxLines: 50
            });
        } else {
            // Fallback to simple preview
            diffPreview = this.createDiffPreview(currentContent, newContent);
        }
        
        // Show action card with preview
        this.showActionCard({
            type: 'edit',
            title: `Edit: ${action.file}`,
            icon: '✏️',
            preview: conflictWarning + diffPreview,
            onApply: () => {
                // Record for undo before applying
                if (this.diffManager) {
                    this.diffManager.recordChange(file.name, currentContent, newContent, 'ai');
                }
                
                // Update original content cache
                this.originalContentCache.set(file.id, newContent);
                
                // Update file content
                file.content = newContent;
                this.fileManager.saveFilesToStorage();
                
                // Update editor if this file is currently open
                if (this.fileManager.getCurrentFile()?.id === file.id) {
                    this.editor.setValue(newContent);
                }
                
                // If using project sync, save to database
                if (window.projectSyncManager && window.projectSyncManager.currentProjectId) {
                    window.projectSyncManager.saveToWebsite();
                }
                
                this.showSuccessMessage(`✅ Updated ${action.file}`, true, file.name);
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
     * Show success message with optional undo button
     */
    showSuccessMessage(message, showUndo = false, filename = null) {
        if (!this.chatMessages) return;
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status-message success-message';
        
        let content = message;
        
        if (showUndo && filename && this.diffManager) {
            content += `<button class="undo-btn" data-filename="${this.escapeHtml(filename)}">Undo</button>`;
        }
        
        statusDiv.innerHTML = content;
        
        // Wire up undo button
        const undoBtn = statusDiv.querySelector('.undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.handleUndo(filename);
                undoBtn.disabled = true;
                undoBtn.textContent = 'Undone';
            });
        }
        
        this.chatMessages.appendChild(statusDiv);
        this.scrollToBottom();
        
        // Auto-remove after 10 seconds (longer for undo option)
        setTimeout(() => {
            statusDiv.classList.add('fade-out');
            setTimeout(() => statusDiv.remove(), 300);
        }, showUndo ? 10000 : 5000);
    }
    
    /**
     * Handle undo for a file change
     */
    handleUndo(filename) {
        if (!this.diffManager) {
            this.showErrorMessage('Undo not available');
            return;
        }
        
        const undoResult = this.diffManager.undoLastChange(filename);
        
        if (undoResult) {
            // Find the file
            const file = this.fileManager.files.find(f => f.name === filename);
            
            if (file) {
                // Restore content
                file.content = undoResult.content;
                this.fileManager.saveFilesToStorage();
                
                // Update editor if open
                if (this.fileManager.getCurrentFile()?.id === file.id) {
                    this.editor.setValue(undoResult.content);
                }
                
                // Sync if needed
                if (window.projectSyncManager?.currentProjectId) {
                    window.projectSyncManager.saveToWebsite();
                }
                
                this.showInfoMessage(`↩️ Undid changes to ${filename}`);
            }
        } else {
            this.showErrorMessage('Nothing to undo');
        }
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
