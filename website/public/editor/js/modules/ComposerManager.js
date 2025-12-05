/**
 * ComposerManager - Coordinated Multi-File Operations
 * 
 * Phase 4 Implementation: Cursor-Level AI Roadmap
 * 
 * Features:
 * - Composer panel with file change tree visualization
 * - Per-file and batch approve/reject controls
 * - Change dependency tracking and visualization
 * - Atomic batch application (all-or-nothing)
 * - Rollback mechanism for all changes
 * - Progress tracking for batch operations
 * - "Generate more" for incomplete plans
 * 
 * Integration:
 * - Works with AgentOrchestrator for complex task execution
 * - Extends MultiFileEditManager for batch operations
 * - Uses DiffManager for change previews
 */
export class ComposerManager {
    // Composer states
    static STATES = {
        IDLE: 'idle',
        COLLECTING: 'collecting',      // Collecting changes from AI
        REVIEWING: 'reviewing',        // User reviewing changes
        APPLYING: 'applying',          // Applying changes
        ROLLING_BACK: 'rolling_back',  // Rolling back changes
        COMPLETE: 'complete',
        ERROR: 'error'
    };

    // Change types
    static CHANGE_TYPES = {
        CREATE: 'create',
        MODIFY: 'modify',
        DELETE: 'delete',
        RENAME: 'rename'
    };

    constructor(fileManager, editor, diffManager = null, agentOrchestrator = null) {
        console.log('🎼 ComposerManager: Initializing multi-file coordinator...');
        
        this.fileManager = fileManager;
        this.editor = editor;
        this.diffManager = diffManager;
        this.agentOrchestrator = agentOrchestrator;
        
        // State management
        this.state = ComposerManager.STATES.IDLE;
        
        // Session tracking
        this.currentSession = null;
        this.sessionHistory = [];
        this.maxSessionHistory = 10;
        
        // Change tracking
        this.pendingChanges = [];
        this.appliedChanges = [];
        this.rollbackStack = [];
        
        // Dependency graph
        this.dependencyGraph = new Map();
        
        // UI elements
        this.panel = null;
        this.isOpen = false;
        
        // Configuration
        this.config = {
            atomicMode: false,          // All-or-nothing application
            autoExpandDiffs: true,      // Auto-expand first diff
            showDependencies: true,     // Show dependency visualization
            maxDiffLines: 100,          // Max lines to show in diff preview
            preserveOriginals: true     // Keep original content for rollback
        };
        
        // Event callbacks
        this.onSessionStart = null;
        this.onSessionEnd = null;
        this.onChangeApplied = null;
        this.onRollback = null;
        this.onError = null;
        
        // Initialize UI
        this.initializePanel();
        
        console.log('✅ ComposerManager: Ready');
    }

    /**
     * Initialize the Composer panel UI
     */
    initializePanel() {
        // Create composer panel container
        this.panel = document.createElement('div');
        this.panel.id = 'composer-panel';
        this.panel.className = 'composer-panel hidden';
        
        this.panel.innerHTML = `
            <div class="composer-header">
                <div class="composer-title">
                    <span class="composer-icon">🎼</span>
                    <span>Composer</span>
                    <span class="composer-session-badge"></span>
                </div>
                <div class="composer-header-actions">
                    <button class="composer-btn composer-settings-btn" title="Settings">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="composer-btn composer-minimize-btn" title="Minimize">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="composer-btn composer-close-btn" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="composer-toolbar">
                <div class="composer-status">
                    <span class="status-indicator"></span>
                    <span class="status-text">Ready</span>
                </div>
                <div class="composer-toolbar-actions">
                    <label class="composer-toggle" title="Atomic Mode: Apply all or nothing">
                        <input type="checkbox" id="composer-atomic-mode">
                        <span class="toggle-label">Atomic</span>
                    </label>
                </div>
            </div>
            <div class="composer-body">
                <div class="composer-empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">No changes pending</div>
                    <div class="empty-hint">Ask the AI to make multi-file changes to see them here</div>
                </div>
                <div class="composer-changes-list hidden"></div>
                <div class="composer-dependency-graph hidden"></div>
            </div>
            <div class="composer-footer hidden">
                <div class="composer-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <span class="progress-text">0 / 0 changes</span>
                </div>
                <div class="composer-footer-actions">
                    <button class="composer-btn composer-reject-all">
                        <i class="fas fa-times"></i> Reject All
                    </button>
                    <button class="composer-btn composer-generate-more">
                        <i class="fas fa-plus"></i> Generate More
                    </button>
                    <button class="composer-btn composer-apply-all primary">
                        <i class="fas fa-check-double"></i> Apply All
                    </button>
                </div>
            </div>
            <div class="composer-rollback-bar hidden">
                <span class="rollback-text">
                    <i class="fas fa-history"></i> Changes can be rolled back
                </span>
                <button class="composer-btn composer-rollback-btn">
                    <i class="fas fa-undo"></i> Rollback All
                </button>
            </div>
        `;
        
        // Insert into DOM
        const editorContainer = document.querySelector('.editor-container') || document.body;
        editorContainer.appendChild(this.panel);
        
        // Bind events
        this.bindEvents();
        
        // Expose globally for inline onclick handlers
        window.composerManager = this;
    }

    /**
     * Bind UI events
     */
    bindEvents() {
        // Close button
        this.panel.querySelector('.composer-close-btn').addEventListener('click', () => {
            this.close();
        });
        
        // Minimize button
        this.panel.querySelector('.composer-minimize-btn').addEventListener('click', () => {
            this.panel.classList.toggle('minimized');
        });
        
        // Settings button
        this.panel.querySelector('.composer-settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // Atomic mode toggle
        this.panel.querySelector('#composer-atomic-mode').addEventListener('change', (e) => {
            this.config.atomicMode = e.target.checked;
            this.updateUI();
        });
        
        // Apply all button
        this.panel.querySelector('.composer-apply-all').addEventListener('click', () => {
            this.applyAll();
        });
        
        // Reject all button
        this.panel.querySelector('.composer-reject-all').addEventListener('click', () => {
            this.rejectAll();
        });
        
        // Generate more button
        this.panel.querySelector('.composer-generate-more').addEventListener('click', () => {
            this.generateMore();
        });
        
        // Rollback button
        this.panel.querySelector('.composer-rollback-btn').addEventListener('click', () => {
            this.rollbackAll();
        });
    }

    /**
     * Open the Composer panel
     */
    open() {
        this.panel.classList.remove('hidden');
        this.isOpen = true;
        this.updateUI();
    }

    /**
     * Close the Composer panel
     */
    close() {
        if (this.pendingChanges.length > 0) {
            if (!confirm('You have pending changes. Close and discard them?')) {
                return;
            }
            this.rejectAll();
        }
        
        this.panel.classList.add('hidden');
        this.isOpen = false;
    }

    /**
     * Start a new composition session
     */
    startSession(taskDescription = '') {
        console.log('🎼 ComposerManager: Starting new session');
        
        // Save previous session if exists
        if (this.currentSession && this.currentSession.changes.length > 0) {
            this.saveSessionToHistory();
        }
        
        // Create new session
        this.currentSession = {
            id: this.generateSessionId(),
            startedAt: new Date().toISOString(),
            taskDescription,
            changes: [],
            appliedChanges: [],
            status: 'active'
        };
        
        // Reset state
        this.pendingChanges = [];
        this.appliedChanges = [];
        this.rollbackStack = [];
        this.dependencyGraph.clear();
        this.state = ComposerManager.STATES.COLLECTING;
        
        // Open panel
        this.open();
        this.updateSessionBadge();
        this.setStatus('collecting', 'Collecting changes...');
        
        // Callback
        if (this.onSessionStart) {
            this.onSessionStart(this.currentSession);
        }
        
        return this.currentSession;
    }

    /**
     * End the current session
     */
    endSession(status = 'completed') {
        if (!this.currentSession) return;
        
        console.log('🎼 ComposerManager: Ending session', status);
        
        this.currentSession.status = status;
        this.currentSession.endedAt = new Date().toISOString();
        this.saveSessionToHistory();
        
        this.state = ComposerManager.STATES.COMPLETE;
        this.setStatus('complete', 'Session complete');
        
        // Callback
        if (this.onSessionEnd) {
            this.onSessionEnd(this.currentSession);
        }
        
        this.currentSession = null;
    }

    /**
     * Add a change to the current session
     */
    addChange(change) {
        const normalizedChange = this.normalizeChange(change);
        
        // Validate change
        if (!this.validateChange(normalizedChange)) {
            console.error('Invalid change:', normalizedChange);
            return null;
        }
        
        // Check for duplicate
        const existingIndex = this.pendingChanges.findIndex(
            c => c.filename === normalizedChange.filename
        );
        
        if (existingIndex >= 0) {
            // Update existing change
            this.pendingChanges[existingIndex] = normalizedChange;
        } else {
            // Add new change
            this.pendingChanges.push(normalizedChange);
        }
        
        // Update dependency graph
        this.updateDependencyGraph(normalizedChange);
        
        // Update session
        if (this.currentSession) {
            this.currentSession.changes = [...this.pendingChanges];
        }
        
        // Update UI
        this.state = ComposerManager.STATES.REVIEWING;
        this.renderChanges();
        this.updateProgress();
        this.setStatus('reviewing', `${this.pendingChanges.length} change(s) pending review`);
        
        return normalizedChange;
    }

    /**
     * Add multiple changes at once
     */
    addChanges(changes) {
        const added = [];
        for (const change of changes) {
            const result = this.addChange(change);
            if (result) {
                added.push(result);
            }
        }
        return added;
    }

    /**
     * Normalize change object
     */
    normalizeChange(change) {
        return {
            id: change.id || this.generateChangeId(),
            filename: change.filename || change.file || '',
            type: change.type || change.action || ComposerManager.CHANGE_TYPES.MODIFY,
            content: change.content || '',
            originalContent: change.originalContent || null,
            language: change.language || this.detectLanguage(change.filename),
            description: change.description || '',
            dependsOn: change.dependsOn || [],
            status: 'pending',
            createdAt: new Date().toISOString(),
            appliedAt: null,
            diff: null
        };
    }

    /**
     * Validate a change object
     */
    validateChange(change) {
        if (!change.filename) {
            console.error('Change missing filename');
            return false;
        }
        
        if (change.type !== ComposerManager.CHANGE_TYPES.DELETE && !change.content) {
            console.error('Change missing content');
            return false;
        }
        
        return true;
    }

    /**
     * Update dependency graph
     */
    updateDependencyGraph(change) {
        // Register the change
        if (!this.dependencyGraph.has(change.filename)) {
            this.dependencyGraph.set(change.filename, {
                change,
                dependsOn: new Set(),
                requiredBy: new Set()
            });
        }
        
        // Add dependencies
        for (const dep of change.dependsOn) {
            const node = this.dependencyGraph.get(change.filename);
            node.dependsOn.add(dep);
            
            // Update reverse dependency
            if (this.dependencyGraph.has(dep)) {
                this.dependencyGraph.get(dep).requiredBy.add(change.filename);
            }
        }
        
        // Auto-detect dependencies based on imports
        this.detectImportDependencies(change);
    }

    /**
     * Detect dependencies from import statements
     */
    detectImportDependencies(change) {
        if (!change.content) return;
        
        // Match various import patterns
        const importPatterns = [
            /import\s+.*?\s+from\s+['"](\..*?)['"]/g,     // ES6 imports
            /require\s*\(['"](\..*?)['"]\)/g,              // CommonJS
            /import\s+['"](\..*?)['"]/g                    // CSS imports
        ];
        
        const node = this.dependencyGraph.get(change.filename);
        if (!node) return;
        
        for (const pattern of importPatterns) {
            let match;
            while ((match = pattern.exec(change.content)) !== null) {
                const importPath = match[1];
                const resolvedPath = this.resolveImportPath(change.filename, importPath);
                
                // Check if this import is also being changed
                const depChange = this.pendingChanges.find(c => c.filename === resolvedPath);
                if (depChange) {
                    node.dependsOn.add(resolvedPath);
                    
                    const depNode = this.dependencyGraph.get(resolvedPath);
                    if (depNode) {
                        depNode.requiredBy.add(change.filename);
                    }
                }
            }
        }
    }

    /**
     * Resolve relative import path
     */
    resolveImportPath(fromFile, importPath) {
        const fromDir = fromFile.split('/').slice(0, -1).join('/');
        const parts = importPath.split('/');
        const result = fromDir.split('/');
        
        for (const part of parts) {
            if (part === '..') {
                result.pop();
            } else if (part !== '.') {
                result.push(part);
            }
        }
        
        // Try common extensions
        const basePath = result.join('/');
        const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.css'];
        
        for (const ext of extensions) {
            const fullPath = basePath + ext;
            if (this.pendingChanges.some(c => c.filename === fullPath)) {
                return fullPath;
            }
        }
        
        return basePath;
    }

    /**
     * Get changes in dependency order
     */
    getOrderedChanges() {
        const ordered = [];
        const visited = new Set();
        const visiting = new Set();
        
        const visit = (filename) => {
            if (visited.has(filename)) return;
            if (visiting.has(filename)) {
                console.warn('Circular dependency detected:', filename);
                return;
            }
            
            visiting.add(filename);
            
            const node = this.dependencyGraph.get(filename);
            if (node) {
                for (const dep of node.dependsOn) {
                    visit(dep);
                }
            }
            
            visiting.delete(filename);
            visited.add(filename);
            
            const change = this.pendingChanges.find(c => c.filename === filename);
            if (change) {
                ordered.push(change);
            }
        };
        
        for (const change of this.pendingChanges) {
            visit(change.filename);
        }
        
        return ordered;
    }

    /**
     * Render changes in the panel
     */
    renderChanges() {
        const listEl = this.panel.querySelector('.composer-changes-list');
        const emptyState = this.panel.querySelector('.composer-empty-state');
        const footer = this.panel.querySelector('.composer-footer');
        
        if (this.pendingChanges.length === 0) {
            listEl.classList.add('hidden');
            emptyState.classList.remove('hidden');
            footer.classList.add('hidden');
            return;
        }
        
        listEl.classList.remove('hidden');
        emptyState.classList.add('hidden');
        footer.classList.remove('hidden');
        
        // Sort by dependencies
        const orderedChanges = this.getOrderedChanges();
        
        let html = '';
        orderedChanges.forEach((change, index) => {
            html += this.renderChangeItem(change, index);
        });
        
        listEl.innerHTML = html;
        
        // Bind individual change events
        this.bindChangeEvents();
        
        // Render dependency graph if enabled
        if (this.config.showDependencies) {
            this.renderDependencyGraph();
        }
    }

    /**
     * Render a single change item
     */
    renderChangeItem(change, index) {
        const typeIcon = this.getTypeIcon(change.type);
        const typeClass = change.type.toLowerCase();
        const statusClass = change.status;
        
        // Get file info
        const existingFile = this.fileManager.files.find(f => f.name === change.filename);
        const isNew = !existingFile;
        
        // Generate diff if modifying existing file
        let diffHtml = '';
        if (change.type === ComposerManager.CHANGE_TYPES.MODIFY && existingFile) {
            diffHtml = this.generateDiffPreview(existingFile.content, change.content, change.filename);
        } else if (change.type === ComposerManager.CHANGE_TYPES.CREATE) {
            diffHtml = this.generateNewFilePreview(change);
        }
        
        // Dependencies badge
        let depsBadge = '';
        const node = this.dependencyGraph.get(change.filename);
        if (node && node.dependsOn.size > 0) {
            depsBadge = `<span class="deps-badge" title="Depends on: ${[...node.dependsOn].join(', ')}">
                <i class="fas fa-link"></i> ${node.dependsOn.size}
            </span>`;
        }
        
        return `
            <div class="composer-change-item ${statusClass}" data-change-id="${change.id}" data-index="${index}">
                <div class="change-header" onclick="composerManager.toggleChangeExpand('${change.id}')">
                    <div class="change-info">
                        <span class="change-type-icon ${typeClass}">${typeIcon}</span>
                        <span class="change-filename">${change.filename}</span>
                        ${isNew ? '<span class="new-badge">NEW</span>' : ''}
                        ${depsBadge}
                    </div>
                    <div class="change-actions">
                        <button class="change-btn preview-btn" onclick="event.stopPropagation(); composerManager.previewChange('${change.id}')" title="Preview in editor">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="change-btn apply-btn" onclick="event.stopPropagation(); composerManager.applyChange('${change.id}')" title="Apply this change">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="change-btn reject-btn" onclick="event.stopPropagation(); composerManager.rejectChange('${change.id}')" title="Reject this change">
                            <i class="fas fa-times"></i>
                        </button>
                        <span class="change-expand-icon">
                            <i class="fas fa-chevron-down"></i>
                        </span>
                    </div>
                </div>
                ${change.description ? `<div class="change-description">${this.escapeHtml(change.description)}</div>` : ''}
                <div class="change-diff ${index === 0 && this.config.autoExpandDiffs ? 'expanded' : ''}">
                    ${diffHtml}
                </div>
            </div>
        `;
    }

    /**
     * Generate diff preview HTML
     */
    generateDiffPreview(oldContent, newContent, _filename) {
        void _filename; // Reserved for future use (e.g., language detection)
        if (this.diffManager) {
            const diff = this.diffManager.generateDiff(oldContent, newContent);
            return this.diffManager.generateDiffHTML(diff, {
                showLineNumbers: true,
                contextLines: 3,
                collapseUnchanged: true,
                maxLines: this.config.maxDiffLines
            });
        }
        
        // Fallback simple diff
        return this.generateSimpleDiff(oldContent, newContent);
    }

    /**
     * Simple fallback diff generator
     */
    generateSimpleDiff(oldContent, newContent) {
        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');
        
        let html = '<div class="simple-diff"><div class="diff-lines">';
        
        const maxLines = Math.min(Math.max(oldLines.length, newLines.length), this.config.maxDiffLines);
        
        for (let i = 0; i < maxLines; i++) {
            const oldLine = oldLines[i];
            const newLine = newLines[i];
            
            if (oldLine === undefined) {
                html += `<div class="diff-line diff-addition"><span class="line-number">${i + 1}</span><span class="line-prefix">+</span><span class="line-content">${this.escapeHtml(newLine)}</span></div>`;
            } else if (newLine === undefined) {
                html += `<div class="diff-line diff-deletion"><span class="line-number">${i + 1}</span><span class="line-prefix">-</span><span class="line-content">${this.escapeHtml(oldLine)}</span></div>`;
            } else if (oldLine !== newLine) {
                html += `<div class="diff-line diff-deletion"><span class="line-number">${i + 1}</span><span class="line-prefix">-</span><span class="line-content">${this.escapeHtml(oldLine)}</span></div>`;
                html += `<div class="diff-line diff-addition"><span class="line-number">${i + 1}</span><span class="line-prefix">+</span><span class="line-content">${this.escapeHtml(newLine)}</span></div>`;
            } else {
                html += `<div class="diff-line"><span class="line-number">${i + 1}</span><span class="line-prefix"> </span><span class="line-content">${this.escapeHtml(oldLine)}</span></div>`;
            }
        }
        
        if (Math.max(oldLines.length, newLines.length) > this.config.maxDiffLines) {
            html += `<div class="diff-truncated">... ${Math.max(oldLines.length, newLines.length) - this.config.maxDiffLines} more lines</div>`;
        }
        
        html += '</div></div>';
        return html;
    }

    /**
     * Generate preview for new file
     */
    generateNewFilePreview(change) {
        const lines = change.content.split('\n');
        const displayLines = lines.slice(0, this.config.maxDiffLines);
        
        let html = '<div class="new-file-preview"><div class="diff-lines">';
        
        displayLines.forEach((line, i) => {
            html += `<div class="diff-line diff-addition"><span class="line-number">${i + 1}</span><span class="line-prefix">+</span><span class="line-content">${this.escapeHtml(line)}</span></div>`;
        });
        
        if (lines.length > this.config.maxDiffLines) {
            html += `<div class="diff-truncated">... ${lines.length - this.config.maxDiffLines} more lines</div>`;
        }
        
        html += '</div></div>';
        return html;
    }

    /**
     * Render dependency graph visualization
     */
    renderDependencyGraph() {
        if (this.dependencyGraph.size < 2) return;
        
        const graphEl = this.panel.querySelector('.composer-dependency-graph');
        
        // Only show if there are actual dependencies
        let hasDeps = false;
        for (const [, node] of this.dependencyGraph) {
            if (node.dependsOn.size > 0 || node.requiredBy.size > 0) {
                hasDeps = true;
                break;
            }
        }
        
        if (!hasDeps) {
            graphEl.classList.add('hidden');
            return;
        }
        
        graphEl.classList.remove('hidden');
        
        let html = '<div class="graph-header"><i class="fas fa-project-diagram"></i> Dependencies</div>';
        html += '<div class="graph-nodes">';
        
        for (const [filename, node] of this.dependencyGraph) {
            const shortName = filename.split('/').pop();
            const depList = [...node.dependsOn].map(d => d.split('/').pop()).join(', ');
            
            if (node.dependsOn.size > 0) {
                html += `
                    <div class="graph-node">
                        <span class="node-file">${shortName}</span>
                        <span class="node-arrow">←</span>
                        <span class="node-deps">${depList}</span>
                    </div>
                `;
            }
        }
        
        html += '</div>';
        graphEl.innerHTML = html;
    }

    /**
     * Bind events for individual change items
     */
    bindChangeEvents() {
        // Event delegation handled by onclick attributes
    }

    /**
     * Toggle change item expansion
     */
    toggleChangeExpand(changeId) {
        const item = this.panel.querySelector(`[data-change-id="${changeId}"]`);
        if (item) {
            const diff = item.querySelector('.change-diff');
            diff.classList.toggle('expanded');
        }
    }

    /**
     * Preview change in editor
     */
    previewChange(changeId) {
        const change = this.pendingChanges.find(c => c.id === changeId);
        if (!change) return;
        
        // Open or create the file in a preview mode
        const existingFile = this.fileManager.files.find(f => f.name === change.filename);
        
        if (existingFile) {
            this.fileManager.openFileInTab(existingFile.id);
            // Show the proposed content temporarily
            this.editor.setValue(change.content);
            
            // Mark as preview
            this.showNotification(`Previewing changes to ${change.filename}. Press Esc to cancel.`, 'info');
            
            // Store original to restore on Esc
            this._previewOriginal = {
                fileId: existingFile.id,
                content: existingFile.content
            };
            
            // Listen for Esc
            this._escHandler = (e) => {
                if (e.key === 'Escape' && this._previewOriginal) {
                    this.editor.setValue(this._previewOriginal.content);
                    this.showNotification('Preview cancelled', 'info');
                    this._previewOriginal = null;
                    document.removeEventListener('keydown', this._escHandler);
                }
            };
            document.addEventListener('keydown', this._escHandler);
        } else {
            // Create temporary preview file
            this.showNotification(`Preview of new file: ${change.filename}`, 'info');
            const tempFile = this.fileManager.createNewFile(`[PREVIEW] ${change.filename}`, change.content);
            this.fileManager.openFileInTab(tempFile.id);
        }
    }

    /**
     * Apply a single change
     */
    async applyChange(changeId) {
        const changeIndex = this.pendingChanges.findIndex(c => c.id === changeId);
        if (changeIndex === -1) return;
        
        const change = this.pendingChanges[changeIndex];
        
        // Check dependencies first
        if (this.config.atomicMode) {
            const deps = this.getUnmetDependencies(change);
            if (deps.length > 0) {
                this.showNotification(
                    `Cannot apply: depends on ${deps.join(', ')} which must be applied first`,
                    'warning'
                );
                return;
            }
        }
        
        console.log('🎼 ComposerManager: Applying change', change.filename);
        
        try {
            // Store original for rollback
            const existingFile = this.fileManager.files.find(f => f.name === change.filename);
            const rollbackEntry = {
                changeId: change.id,
                filename: change.filename,
                type: change.type,
                originalContent: existingFile ? existingFile.content : null,
                appliedAt: new Date().toISOString()
            };
            
            // Apply the change
            await this.executeChange(change);
            
            // Move to applied
            change.status = 'applied';
            change.appliedAt = new Date().toISOString();
            this.appliedChanges.push(change);
            this.pendingChanges.splice(changeIndex, 1);
            
            // Add to rollback stack
            this.rollbackStack.push(rollbackEntry);
            
            // Update UI
            this.renderChanges();
            this.updateProgress();
            this.showRollbackBar();
            
            // Callback
            if (this.onChangeApplied) {
                this.onChangeApplied(change);
            }
            
            this.showNotification(`✅ Applied ${change.filename}`, 'success');
            
        } catch (error) {
            console.error('Error applying change:', error);
            change.status = 'error';
            this.showNotification(`❌ Failed to apply ${change.filename}: ${error.message}`, 'error');
            
            if (this.onError) {
                this.onError(error, change);
            }
        }
    }

    /**
     * Execute a change (apply to filesystem)
     */
    async executeChange(change) {
        switch (change.type) {
            case ComposerManager.CHANGE_TYPES.CREATE: {
                // Create new file
                const file = this.fileManager.createNewFile(change.filename, change.content);
                this.fileManager.openFileInTab(file.id);
                break;
            }
            
            case ComposerManager.CHANGE_TYPES.MODIFY: {
                // Modify existing file
                const file = this.fileManager.files.find(f => f.name === change.filename);
                if (!file) {
                    throw new Error(`File not found: ${change.filename}`);
                }
                
                // Record for undo if diffManager available
                if (this.diffManager) {
                    this.diffManager.recordChange(file.name, file.content, change.content, 'composer');
                }
                
                file.content = change.content;
                this.fileManager.saveFilesToStorage();
                
                // Update editor if file is open
                if (this.fileManager.getCurrentFile()?.id === file.id) {
                    this.editor.setValue(change.content);
                }
                break;
            }
            
            case ComposerManager.CHANGE_TYPES.DELETE: {
                // Delete file
                const file = this.fileManager.files.find(f => f.name === change.filename);
                if (file) {
                    this.fileManager.deleteFile(file.id);
                }
                break;
            }
            
            case ComposerManager.CHANGE_TYPES.RENAME: {
                // Rename file
                const file = this.fileManager.files.find(f => f.name === change.filename);
                if (file && change.newFilename) {
                    file.name = change.newFilename;
                    this.fileManager.saveFilesToStorage();
                }
                break;
            }
            
            default:
                throw new Error(`Unknown change type: ${change.type}`);
        }
        
        // Sync to cloud if available
        if (window.projectSyncManager && window.projectSyncManager.currentProjectId) {
            await window.projectSyncManager.saveToWebsite();
        }
    }

    /**
     * Reject a single change
     */
    rejectChange(changeId) {
        const changeIndex = this.pendingChanges.findIndex(c => c.id === changeId);
        if (changeIndex === -1) return;
        
        const change = this.pendingChanges[changeIndex];
        console.log('🎼 ComposerManager: Rejecting change', change.filename);
        
        // Remove from pending
        this.pendingChanges.splice(changeIndex, 1);
        
        // Remove from dependency graph
        this.dependencyGraph.delete(change.filename);
        
        // Update reverse dependencies
        for (const [, node] of this.dependencyGraph) {
            node.requiredBy.delete(change.filename);
        }
        
        // Update UI
        this.renderChanges();
        this.updateProgress();
        
        this.showNotification(`Rejected ${change.filename}`, 'info');
    }

    /**
     * Apply all pending changes
     */
    async applyAll() {
        if (this.pendingChanges.length === 0) return;
        
        const total = this.pendingChanges.length;
        this.state = ComposerManager.STATES.APPLYING;
        this.setStatus('applying', `Applying ${total} changes...`);
        
        // Get ordered changes
        const orderedChanges = this.getOrderedChanges();
        
        if (this.config.atomicMode) {
            // All-or-nothing mode
            await this.applyAtomic(orderedChanges);
        } else {
            // Apply one by one
            let applied = 0;
            for (const change of orderedChanges) {
                try {
                    await this.applyChange(change.id);
                    applied++;
                    this.updateProgressBar(applied / total);
                } catch (error) {
                    console.error('Error applying change:', error);
                    // Continue with next in non-atomic mode
                }
            }
            
            this.setStatus('complete', `Applied ${applied} of ${total} changes`);
        }
        
        // Check if all done
        if (this.pendingChanges.length === 0) {
            this.endSession('completed');
        }
    }

    /**
     * Apply all changes atomically (all-or-nothing)
     */
    async applyAtomic(orderedChanges) {
        const backup = [];
        let applied = 0;
        
        try {
            // Apply all changes
            for (const change of orderedChanges) {
                // Backup current state
                const existingFile = this.fileManager.files.find(f => f.name === change.filename);
                backup.push({
                    change,
                    originalContent: existingFile ? existingFile.content : null,
                    existed: !!existingFile
                });
                
                await this.executeChange(change);
                applied++;
                this.updateProgressBar(applied / orderedChanges.length);
            }
            
            // All succeeded - move to applied
            for (const change of orderedChanges) {
                change.status = 'applied';
                change.appliedAt = new Date().toISOString();
                this.appliedChanges.push(change);
            }
            
            this.pendingChanges = [];
            this.setStatus('complete', `Applied all ${applied} changes atomically`);
            this.showRollbackBar();
            this.renderChanges();
            
        } catch (error) {
            console.error('Atomic apply failed, rolling back:', error);
            this.setStatus('error', 'Atomic apply failed, rolling back...');
            
            // Rollback all changes
            for (let i = backup.length - 1; i >= 0; i--) {
                const entry = backup[i];
                try {
                    if (!entry.existed) {
                        // Delete created file
                        const file = this.fileManager.files.find(f => f.name === entry.change.filename);
                        if (file) {
                            this.fileManager.deleteFile(file.id);
                        }
                    } else {
                        // Restore original content
                        const file = this.fileManager.files.find(f => f.name === entry.change.filename);
                        if (file && entry.originalContent !== null) {
                            file.content = entry.originalContent;
                        }
                    }
                } catch (rollbackError) {
                    console.error('Rollback error:', rollbackError);
                }
            }
            
            this.fileManager.saveFilesToStorage();
            this.showNotification('Atomic apply failed. All changes rolled back.', 'error');
        }
    }

    /**
     * Reject all pending changes
     */
    rejectAll() {
        console.log('🎼 ComposerManager: Rejecting all changes');
        
        this.pendingChanges = [];
        this.dependencyGraph.clear();
        
        this.renderChanges();
        this.updateProgress();
        this.setStatus('idle', 'All changes rejected');
        
        this.showNotification('All changes rejected', 'info');
    }

    /**
     * Rollback all applied changes
     */
    async rollbackAll() {
        if (this.rollbackStack.length === 0) {
            this.showNotification('Nothing to rollback', 'info');
            return;
        }
        
        console.log('🎼 ComposerManager: Rolling back all changes');
        this.state = ComposerManager.STATES.ROLLING_BACK;
        this.setStatus('rolling_back', 'Rolling back changes...');
        
        // Rollback in reverse order
        while (this.rollbackStack.length > 0) {
            const entry = this.rollbackStack.pop();
            
            try {
                if (entry.type === ComposerManager.CHANGE_TYPES.CREATE) {
                    // Delete created file
                    const file = this.fileManager.files.find(f => f.name === entry.filename);
                    if (file) {
                        this.fileManager.deleteFile(file.id);
                    }
                } else if (entry.originalContent !== null) {
                    // Restore original content
                    const file = this.fileManager.files.find(f => f.name === entry.filename);
                    if (file) {
                        file.content = entry.originalContent;
                        
                        // Update editor if file is open
                        if (this.fileManager.getCurrentFile()?.id === file.id) {
                            this.editor.setValue(entry.originalContent);
                        }
                    }
                }
            } catch (error) {
                console.error('Rollback error:', error);
            }
        }
        
        this.fileManager.saveFilesToStorage();
        this.appliedChanges = [];
        this.hideRollbackBar();
        this.setStatus('idle', 'All changes rolled back');
        
        // Callback
        if (this.onRollback) {
            this.onRollback();
        }
        
        this.showNotification('All changes rolled back', 'success');
    }

    /**
     * Generate more changes (continue incomplete plan)
     */
    async generateMore() {
        if (!this.agentOrchestrator || !this.currentSession) {
            this.showNotification('No active session to continue', 'warning');
            return;
        }
        
        console.log('🎼 ComposerManager: Requesting more changes');
        this.setStatus('collecting', 'Generating more changes...');
        
        // Build context from current changes
        const context = {
            task: this.currentSession.taskDescription,
            appliedChanges: this.appliedChanges.map(c => ({
                filename: c.filename,
                type: c.type,
                description: c.description
            })),
            pendingChanges: this.pendingChanges.map(c => ({
                filename: c.filename,
                type: c.type,
                description: c.description
            }))
        };
        
        // Request continuation from agent
        try {
            // This would integrate with AgentOrchestrator to continue planning
            this.showNotification('Requesting additional changes from AI...', 'info');
            
            // Emit event for external handling
            const event = new CustomEvent('composerGenerateMore', { detail: context });
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('Generate more failed:', error);
            this.showNotification('Failed to generate more changes', 'error');
        }
    }

    /**
     * Get unmet dependencies for a change
     */
    getUnmetDependencies(change) {
        const node = this.dependencyGraph.get(change.filename);
        if (!node) return [];
        
        const unmet = [];
        for (const dep of node.dependsOn) {
            const depChange = this.pendingChanges.find(c => c.filename === dep);
            if (depChange && depChange.status === 'pending') {
                unmet.push(dep);
            }
        }
        
        return unmet;
    }

    /**
     * Update progress display
     */
    updateProgress() {
        const total = this.pendingChanges.length + this.appliedChanges.length;
        const applied = this.appliedChanges.length;
        
        this.panel.querySelector('.progress-text').textContent = 
            `${applied} / ${total} changes applied`;
        
        this.updateProgressBar(total > 0 ? applied / total : 0);
    }

    /**
     * Update progress bar
     */
    updateProgressBar(progress) {
        const fill = this.panel.querySelector('.progress-fill');
        fill.style.width = `${progress * 100}%`;
    }

    /**
     * Set status display
     */
    setStatus(status, text) {
        const indicator = this.panel.querySelector('.status-indicator');
        const textEl = this.panel.querySelector('.status-text');
        
        indicator.className = `status-indicator ${status}`;
        textEl.textContent = text;
    }

    /**
     * Update session badge
     */
    updateSessionBadge() {
        const badge = this.panel.querySelector('.composer-session-badge');
        if (this.currentSession) {
            badge.textContent = `Session ${this.currentSession.id.slice(-4)}`;
            badge.classList.add('active');
        } else {
            badge.textContent = '';
            badge.classList.remove('active');
        }
    }

    /**
     * Show rollback bar
     */
    showRollbackBar() {
        if (this.rollbackStack.length > 0) {
            this.panel.querySelector('.composer-rollback-bar').classList.remove('hidden');
        }
    }

    /**
     * Hide rollback bar
     */
    hideRollbackBar() {
        this.panel.querySelector('.composer-rollback-bar').classList.add('hidden');
    }

    /**
     * Show settings modal
     */
    showSettings() {
        // Create and show settings modal
        const modal = document.createElement('div');
        modal.className = 'composer-settings-overlay';
        modal.innerHTML = `
            <div class="composer-settings-modal">
                <h3>Composer Settings</h3>
                <label>
                    <input type="checkbox" ${this.config.atomicMode ? 'checked' : ''} onchange="composerManager.config.atomicMode = this.checked">
                    Atomic mode (all-or-nothing)
                </label>
                <label>
                    <input type="checkbox" ${this.config.autoExpandDiffs ? 'checked' : ''} onchange="composerManager.config.autoExpandDiffs = this.checked">
                    Auto-expand first diff
                </label>
                <label>
                    <input type="checkbox" ${this.config.showDependencies ? 'checked' : ''} onchange="composerManager.config.showDependencies = this.checked; composerManager.renderDependencyGraph()">
                    Show dependencies
                </label>
                <label>
                    Max diff lines:
                    <input type="number" value="${this.config.maxDiffLines}" min="10" max="500" onchange="composerManager.config.maxDiffLines = parseInt(this.value); composerManager.renderChanges()">
                </label>
                <button class="composer-btn primary" onclick="this.closest('.composer-settings-overlay').remove()">Close</button>
            </div>
        `;
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1100;';
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    /**
     * Update the UI
     */
    updateUI() {
        this.renderChanges();
        this.updateProgress();
        this.updateSessionBadge();
    }

    /**
     * Save session to history
     */
    saveSessionToHistory() {
        if (!this.currentSession) return;
        
        this.sessionHistory.unshift({...this.currentSession});
        
        // Trim history
        if (this.sessionHistory.length > this.maxSessionHistory) {
            this.sessionHistory.pop();
        }
    }

    // Utility methods
    
    generateSessionId() {
        return 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }
    
    generateChangeId() {
        return 'chg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }
    
    getTypeIcon(type) {
        const icons = {
            [ComposerManager.CHANGE_TYPES.CREATE]: '➕',
            [ComposerManager.CHANGE_TYPES.MODIFY]: '✏️',
            [ComposerManager.CHANGE_TYPES.DELETE]: '🗑️',
            [ComposerManager.CHANGE_TYPES.RENAME]: '📝'
        };
        return icons[type] || '📄';
    }
    
    detectLanguage(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        const langMap = {
            js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
            py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
            html: 'html', css: 'css', scss: 'scss', less: 'less',
            json: 'json', md: 'markdown', yaml: 'yaml', yml: 'yaml',
            sql: 'sql', sh: 'bash', bash: 'bash'
        };
        return langMap[ext] || 'text';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
