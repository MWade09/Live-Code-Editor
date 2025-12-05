/**
 * MemoryUI - Memory Management Panel Component
 * 
 * Phase 6: Cursor-Level AI Roadmap
 * 
 * Features:
 * - View all project memories
 * - Create explicit memories ("Remember this")
 * - Edit/delete memories
 * - Search memories
 * - Memory statistics
 */
export class MemoryUI {
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
        this.container = null;
        this.isOpen = false;
        this.searchTerm = '';
        this.selectedType = 'all';
        
        this.init();
    }

    init() {
        // Listen for memory events
        document.addEventListener('memoryCreated', () => this.refresh());
        document.addEventListener('memoryDeleted', () => this.refresh());
        document.addEventListener('memoriesCleared', () => this.refresh());
    }

    /**
     * Create the memory panel DOM
     */
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'memory-panel';
        panel.innerHTML = `
            <div class="memory-panel-header">
                <div class="memory-panel-title">
                    <span class="memory-icon">🧠</span>
                    <span>Project Memory</span>
                </div>
                <div class="memory-panel-actions">
                    <button class="memory-btn memory-btn-add" title="Add Memory">
                        <span>+ Remember</span>
                    </button>
                    <button class="memory-btn-close" title="Close">×</button>
                </div>
            </div>
            
            <div class="memory-panel-toolbar">
                <div class="memory-search">
                    <input type="text" placeholder="Search memories..." class="memory-search-input">
                </div>
                <select class="memory-type-filter">
                    <option value="all">All Types</option>
                    <option value="explicit">📌 User Notes</option>
                    <option value="conversation">💬 Sessions</option>
                    <option value="learned">🧠 Learned</option>
                </select>
            </div>
            
            <div class="memory-stats">
                <span class="memory-stat" title="Total Memories">
                    <span class="stat-icon">📊</span>
                    <span class="stat-value total-count">0</span>
                </span>
                <span class="memory-stat" title="User Notes">
                    <span class="stat-icon">📌</span>
                    <span class="stat-value explicit-count">0</span>
                </span>
                <span class="memory-stat" title="Session Summaries">
                    <span class="stat-icon">💬</span>
                    <span class="stat-value conversation-count">0</span>
                </span>
            </div>
            
            <div class="memory-list">
                <div class="memory-empty">
                    <span class="empty-icon">🧠</span>
                    <p>No memories yet</p>
                    <p class="empty-hint">Click "+ Remember" to save something or chat with AI to create automatic memories.</p>
                </div>
            </div>
            
            <div class="memory-panel-footer">
                <button class="memory-btn-clear">Clear All</button>
            </div>
        `;

        // Bind events
        this.bindPanelEvents(panel);
        
        return panel;
    }

    /**
     * Bind panel events
     */
    bindPanelEvents(panel) {
        // Close button
        panel.querySelector('.memory-btn-close').addEventListener('click', () => {
            this.close();
        });

        // Add memory button
        panel.querySelector('.memory-btn-add').addEventListener('click', () => {
            this.showAddMemoryDialog();
        });

        // Search input
        const searchInput = panel.querySelector('.memory-search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.renderMemories();
        });

        // Type filter
        panel.querySelector('.memory-type-filter').addEventListener('change', (e) => {
            this.selectedType = e.target.value;
            this.renderMemories();
        });

        // Clear all button
        panel.querySelector('.memory-btn-clear').addEventListener('click', () => {
            this.confirmClearAll();
        });

        // Close on escape
        const handleEscape = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Open the memory panel
     */
    async open() {
        if (this.isOpen) return;

        // Create panel if needed
        if (!this.container) {
            this.container = this.createPanel();
            document.body.appendChild(this.container);
        }

        // Show panel
        this.container.classList.add('open');
        this.isOpen = true;

        // Load and render memories
        await this.refresh();
    }

    /**
     * Close the memory panel
     */
    close() {
        if (!this.isOpen) return;

        this.container.classList.remove('open');
        this.isOpen = false;
    }

    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Refresh memories display
     */
    async refresh() {
        if (!this.isOpen || !this.container) return;

        await this.updateStats();
        await this.renderMemories();
    }

    /**
     * Update statistics display
     */
    async updateStats() {
        try {
            const stats = await this.memoryManager.getMemoryStats();
            
            this.container.querySelector('.total-count').textContent = stats.total;
            this.container.querySelector('.explicit-count').textContent = stats.byType.explicit;
            this.container.querySelector('.conversation-count').textContent = stats.byType.conversation;
        } catch (error) {
            console.error('[MemoryUI] Failed to update stats:', error);
        }
    }

    /**
     * Render memories list
     */
    async renderMemories() {
        const listContainer = this.container.querySelector('.memory-list');
        const emptyState = this.container.querySelector('.memory-empty');
        
        try {
            let memories = await this.memoryManager.getAllMemories();

            // Apply filters
            if (this.selectedType !== 'all') {
                memories = memories.filter(m => m.memory_type === this.selectedType);
            }

            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                memories = memories.filter(m => 
                    m.content.toLowerCase().includes(term)
                );
            }

            // Sort by created date, newest first
            memories.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            if (memories.length === 0) {
                emptyState.style.display = 'flex';
                // Clear any existing items except empty state
                const items = listContainer.querySelectorAll('.memory-item');
                items.forEach(item => item.remove());
                return;
            }

            emptyState.style.display = 'none';

            // Build memory items
            const html = memories.map(memory => this.renderMemoryItem(memory)).join('');
            
            // Keep empty state, replace items
            const items = listContainer.querySelectorAll('.memory-item');
            items.forEach(item => item.remove());
            listContainer.insertAdjacentHTML('afterbegin', html);

            // Bind item events
            this.bindItemEvents();

        } catch (error) {
            console.error('[MemoryUI] Failed to render memories:', error);
        }
    }

    /**
     * Render a single memory item
     */
    renderMemoryItem(memory) {
        const typeIcons = {
            explicit: '📌',
            conversation: '💬',
            learned: '🧠'
        };

        const typeLabels = {
            explicit: 'User Note',
            conversation: 'Session',
            learned: 'Learned'
        };

        const icon = typeIcons[memory.memory_type] || '📝';
        const label = typeLabels[memory.memory_type] || 'Memory';
        const date = this.formatDate(memory.created_at);
        const importance = Math.round(memory.importance * 100);

        return `
            <div class="memory-item" data-id="${memory.id}">
                <div class="memory-item-header">
                    <span class="memory-item-type">
                        <span class="type-icon">${icon}</span>
                        <span class="type-label">${label}</span>
                    </span>
                    <span class="memory-item-date">${date}</span>
                </div>
                <div class="memory-item-content">${this.escapeHtml(memory.content)}</div>
                <div class="memory-item-footer">
                    <div class="memory-importance" title="Importance: ${importance}%">
                        <div class="importance-bar" style="width: ${importance}%"></div>
                    </div>
                    <div class="memory-item-actions">
                        <button class="memory-action-btn edit-btn" title="Edit">✏️</button>
                        <button class="memory-action-btn delete-btn" title="Delete">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind events to memory items
     */
    bindItemEvents() {
        const items = this.container.querySelectorAll('.memory-item');
        
        items.forEach(item => {
            const id = item.dataset.id;

            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmDelete(id);
            });

            item.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditDialog(id);
            });
        });
    }

    /**
     * Show add memory dialog
     */
    showAddMemoryDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'memory-dialog';
        dialog.innerHTML = `
            <div class="memory-dialog-content">
                <div class="memory-dialog-header">
                    <span>📌 Remember Something</span>
                    <button class="memory-dialog-close">×</button>
                </div>
                <div class="memory-dialog-body">
                    <textarea 
                        class="memory-input" 
                        placeholder="What should I remember about this project?"
                        rows="4"
                    ></textarea>
                    <div class="memory-importance-control">
                        <label>Importance:</label>
                        <select class="importance-select">
                            <option value="0.3">Low</option>
                            <option value="0.5" selected>Medium</option>
                            <option value="0.7">High</option>
                            <option value="0.9">Critical</option>
                        </select>
                    </div>
                </div>
                <div class="memory-dialog-footer">
                    <button class="memory-btn cancel-btn">Cancel</button>
                    <button class="memory-btn save-btn primary">Remember</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        
        // Focus textarea
        const textarea = dialog.querySelector('.memory-input');
        textarea.focus();

        // Bind events
        dialog.querySelector('.memory-dialog-close').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('.save-btn').addEventListener('click', async () => {
            const content = textarea.value.trim();
            if (!content) return;

            const importance = parseFloat(dialog.querySelector('.importance-select').value);
            
            await this.memoryManager.rememberThis(content, importance);
            showToast('Memory saved!', 'success');
            dialog.remove();
            this.refresh();
        });

        // Close on backdrop click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });

        // Close on escape
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dialog.remove();
            }
        });
    }

    /**
     * Show edit dialog
     */
    async showEditDialog(memoryId) {
        const memories = await this.memoryManager.getAllMemories();
        const memory = memories.find(m => m.id === memoryId);
        
        if (!memory) return;

        const dialog = document.createElement('div');
        dialog.className = 'memory-dialog';
        dialog.innerHTML = `
            <div class="memory-dialog-content">
                <div class="memory-dialog-header">
                    <span>✏️ Edit Memory</span>
                    <button class="memory-dialog-close">×</button>
                </div>
                <div class="memory-dialog-body">
                    <textarea 
                        class="memory-input" 
                        rows="4"
                    >${this.escapeHtml(memory.content)}</textarea>
                    <div class="memory-importance-control">
                        <label>Importance:</label>
                        <select class="importance-select">
                            <option value="0.3" ${memory.importance <= 0.3 ? 'selected' : ''}>Low</option>
                            <option value="0.5" ${memory.importance > 0.3 && memory.importance <= 0.5 ? 'selected' : ''}>Medium</option>
                            <option value="0.7" ${memory.importance > 0.5 && memory.importance <= 0.7 ? 'selected' : ''}>High</option>
                            <option value="0.9" ${memory.importance > 0.7 ? 'selected' : ''}>Critical</option>
                        </select>
                    </div>
                </div>
                <div class="memory-dialog-footer">
                    <button class="memory-btn cancel-btn">Cancel</button>
                    <button class="memory-btn save-btn primary">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Bind events
        dialog.querySelector('.memory-dialog-close').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('.save-btn').addEventListener('click', async () => {
            const importance = parseFloat(dialog.querySelector('.importance-select').value);
            await this.memoryManager.updateImportance(memoryId, importance);
            showToast('Memory updated!', 'success');
            dialog.remove();
            this.refresh();
        });

        // Close on backdrop click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    /**
     * Confirm delete action
     */
    confirmDelete(memoryId) {
        if (confirm('Delete this memory?')) {
            this.memoryManager.deleteMemory(memoryId);
            showToast('Memory deleted', 'info');
        }
    }

    /**
     * Confirm clear all action
     */
    confirmClearAll() {
        if (confirm('Clear all project memories? This cannot be undone.')) {
            this.memoryManager.clearProjectMemories();
            showToast('All memories cleared', 'info');
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return 'Today';
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Escape HTML for safe rendering
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * KeyboardShortcutsManager - Global Keyboard Shortcuts
 * 
 * Phase 6: Cursor-Level AI Roadmap
 */
export class KeyboardShortcutsManager {
    constructor() {
        this.shortcuts = new Map();
        this.isEnabled = true;
        this.activeContext = 'global';
        
        this.init();
    }

    init() {
        // Register default shortcuts
        this.registerDefaults();
        
        // Bind global handler
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        console.log('⌨️ KeyboardShortcutsManager: Ready');
    }

    /**
     * Register default shortcuts
     */
    registerDefaults() {
        // AI Actions
        this.register('Escape', 'global', () => {
            this.cancelActiveAI();
        }, 'Cancel AI operation');

        this.register('Ctrl+Shift+A', 'global', () => {
            this.focusAIChat();
        }, 'Focus AI chat');

        this.register('Ctrl+Shift+M', 'global', () => {
            this.openMemoryPanel();
        }, 'Open memory panel');

        // Composer
        this.register('Ctrl+Shift+C', 'global', () => {
            this.toggleComposer();
        }, 'Toggle Composer');

        this.register('Ctrl+Enter', 'chat', () => {
            this.submitAIMessage();
        }, 'Submit AI message');

        // File Actions
        this.register('Ctrl+S', 'global', () => {
            this.saveProject();
        }, 'Save project');

        this.register('Ctrl+Shift+S', 'global', () => {
            this.saveProjectAs();
        }, 'Save project as');

        // Editor
        this.register('Ctrl+/', 'editor', () => {
            this.toggleComment();
        }, 'Toggle comment');

        this.register('Ctrl+D', 'editor', () => {
            this.duplicateLine();
        }, 'Duplicate line');
    }

    /**
     * Register a keyboard shortcut
     */
    register(shortcut, context, callback, description = '') {
        const key = this.normalizeShortcut(shortcut);
        
        if (!this.shortcuts.has(context)) {
            this.shortcuts.set(context, new Map());
        }
        
        this.shortcuts.get(context).set(key, {
            shortcut,
            callback,
            description
        });
    }

    /**
     * Unregister a shortcut
     */
    unregister(shortcut, context = 'global') {
        const key = this.normalizeShortcut(shortcut);
        const contextShortcuts = this.shortcuts.get(context);
        if (contextShortcuts) {
            contextShortcuts.delete(key);
        }
    }

    /**
     * Normalize shortcut string
     */
    normalizeShortcut(shortcut) {
        return shortcut
            .toLowerCase()
            .split('+')
            .sort()
            .join('+');
    }

    /**
     * Get shortcut from event
     */
    getShortcutFromEvent(e) {
        const parts = [];
        
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        if (e.metaKey) parts.push('meta');
        
        // Get key, handling special cases
        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        if (key === 'escape') key = 'escape';
        
        // Don't include modifier keys alone
        if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
            parts.push(key);
        }
        
        return parts.sort().join('+');
    }

    /**
     * Handle keydown event
     */
    handleKeydown(e) {
        if (!this.isEnabled) return;

        const shortcut = this.getShortcutFromEvent(e);
        
        // Check active context first, then global
        const contexts = [this.activeContext, 'global'];
        
        for (const context of contexts) {
            const contextShortcuts = this.shortcuts.get(context);
            if (contextShortcuts && contextShortcuts.has(shortcut)) {
                const { callback } = contextShortcuts.get(shortcut);
                
                // Prevent default for registered shortcuts
                e.preventDefault();
                e.stopPropagation();
                
                callback(e);
                return;
            }
        }
    }

    /**
     * Set active context
     */
    setContext(context) {
        this.activeContext = context;
    }

    /**
     * Enable/disable shortcuts
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    /**
     * Get all shortcuts for display
     */
    getAllShortcuts() {
        const all = [];
        
        for (const [context, shortcuts] of this.shortcuts) {
            for (const [_key, data] of shortcuts) {
                void _key; // Used for iteration
                all.push({
                    context,
                    shortcut: data.shortcut,
                    description: data.description
                });
            }
        }
        
        return all;
    }

    /**
     * Show shortcuts help panel
     */
    showHelp() {
        const shortcuts = this.getAllShortcuts();
        
        const dialog = document.createElement('div');
        dialog.className = 'shortcuts-help-dialog';
        dialog.innerHTML = `
            <div class="shortcuts-help-content">
                <div class="shortcuts-help-header">
                    <span>⌨️ Keyboard Shortcuts</span>
                    <button class="shortcuts-help-close">×</button>
                </div>
                <div class="shortcuts-help-body">
                    ${shortcuts.map(s => `
                        <div class="shortcut-row">
                            <kbd>${s.shortcut}</kbd>
                            <span class="shortcut-desc">${s.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('.shortcuts-help-close').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });

        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dialog.remove();
            }
        });
    }

    // Action implementations

    cancelActiveAI() {
        // Cancel any streaming AI operation
        if (window.unifiedAI && window.unifiedAI.isStreaming) {
            window.unifiedAI.cancelStream();
            showToast('AI operation cancelled', 'info');
        }
        
        // Also close any open dialogs/modals
        document.querySelectorAll('.memory-dialog, .shortcuts-help-dialog').forEach(el => {
            el.remove();
        });
    }

    focusAIChat() {
        const chatInput = document.querySelector('.ai-chat-input, #ai-prompt, .chat-input textarea');
        if (chatInput) {
            chatInput.focus();
        }
    }

    openMemoryPanel() {
        if (window.memoryUI) {
            window.memoryUI.toggle();
        }
    }

    toggleComposer() {
        if (window.composerManager) {
            window.composerManager.toggle();
        }
    }

    submitAIMessage() {
        const sendButton = document.querySelector('.ai-send-btn, #send-ai-btn, .chat-submit');
        if (sendButton) {
            sendButton.click();
        }
    }

    saveProject() {
        const saveButton = document.querySelector('#save-btn, .save-button, [data-action="save"]');
        if (saveButton) {
            saveButton.click();
        }
    }

    saveProjectAs() {
        // Trigger save-as if available
        const saveAsButton = document.querySelector('[data-action="save-as"]');
        if (saveAsButton) {
            saveAsButton.click();
        }
    }

    toggleComment() {
        // Use CodeMirror's toggle comment if available
        if (window.editorView) {
            document.execCommand('toggleComment');
        }
    }

    duplicateLine() {
        // Use editor's duplicate line function
        if (window.editorView) {
            // This would be handled by CodeMirror
        }
    }
}

/**
 * ToastManager - Toast Notification System
 * 
 * Phase 6: Cursor-Level AI Roadmap
 */
export class ToastManager {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
        
        this.isInitialized = true;
        
        // Process any queued toasts
        this.processQueue();
    }

    /**
     * Show a toast notification
     */
    show(message, type = 'info', duration = 3000) {
        if (!this.isInitialized) {
            this.queue.push({ message, type, duration });
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close">×</button>
        `;

        // Add close handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.dismiss(toast);
        });

        // Add to container
        this.container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Dismiss a toast
     */
    dismiss(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Process queued toasts
     */
    processQueue() {
        while (this.queue.length > 0) {
            const { message, type, duration } = this.queue.shift();
            this.show(message, type, duration);
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

    /**
     * Convenience methods
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Global toast function for convenience
window.showToast = function(message, type = 'info', duration = 3000) {
    if (window.toastManager) {
        window.toastManager.show(message, type, duration);
    } else {
        console.log(`[Toast ${type}] ${message}`);
    }
};

/**
 * OnboardingTooltips - First-time User Guidance
 */
export class OnboardingTooltips {
    constructor() {
        this.storageKey = 'onboarding_completed';
        this.currentStep = 0;
        this.steps = [];
        
        this.init();
    }

    init() {
        // Define onboarding steps
        this.steps = [
            {
                target: '.ai-chat-panel, #chat-panel',
                title: 'AI Assistant',
                content: 'Chat with AI to get coding help. It understands your project context!',
                position: 'left'
            },
            {
                target: '#file-tree, .file-explorer',
                title: 'File Explorer',
                content: 'Manage your project files here. Right-click for options.',
                position: 'right'
            },
            {
                target: '.editor-container, #editor',
                title: 'Code Editor',
                content: 'Write code here with syntax highlighting and AI-powered suggestions.',
                position: 'bottom'
            },
            {
                target: '#preview-frame, .preview-panel',
                title: 'Live Preview',
                content: 'See your changes in real-time as you code.',
                position: 'left'
            },
            {
                target: '#terminal, .terminal-container',
                title: 'Integrated Terminal',
                content: 'Run commands and see output directly in the editor.',
                position: 'top'
            }
        ];
    }

    /**
     * Check if onboarding is needed
     */
    shouldShowOnboarding() {
        return !localStorage.getItem(this.storageKey);
    }

    /**
     * Start onboarding tour
     */
    start() {
        if (!this.shouldShowOnboarding()) return;
        
        this.currentStep = 0;
        this.showStep();
    }

    /**
     * Show current step
     */
    showStep() {
        const step = this.steps[this.currentStep];
        if (!step) {
            this.complete();
            return;
        }

        const target = document.querySelector(step.target);
        if (!target) {
            // Skip this step if target not found
            this.currentStep++;
            this.showStep();
            return;
        }

        this.showTooltip(target, step);
    }

    /**
     * Show tooltip for a step
     */
    showTooltip(target, step) {
        // Remove any existing tooltip
        this.hideTooltip();

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = `onboarding-tooltip position-${step.position}`;
        tooltip.innerHTML = `
            <div class="onboarding-tooltip-content">
                <h4 class="onboarding-title">${step.title}</h4>
                <p class="onboarding-text">${step.content}</p>
                <div class="onboarding-footer">
                    <span class="onboarding-progress">${this.currentStep + 1} / ${this.steps.length}</span>
                    <div class="onboarding-actions">
                        <button class="onboarding-skip">Skip Tour</button>
                        <button class="onboarding-next">
                            ${this.currentStep < this.steps.length - 1 ? 'Next' : 'Finish'}
                        </button>
                    </div>
                </div>
            </div>
            <div class="onboarding-arrow"></div>
        `;

        // Position tooltip
        document.body.appendChild(tooltip);
        this.positionTooltip(tooltip, target, step.position);

        // Bind events
        tooltip.querySelector('.onboarding-skip').addEventListener('click', () => {
            this.complete();
        });

        tooltip.querySelector('.onboarding-next').addEventListener('click', () => {
            this.currentStep++;
            this.showStep();
        });

        // Highlight target
        target.classList.add('onboarding-highlight');
    }

    /**
     * Position tooltip relative to target
     */
    positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;

        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 10;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + 10;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - 10;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + 10;
                break;
        }

        // Keep within viewport
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    /**
     * Hide current tooltip
     */
    hideTooltip() {
        const existing = document.querySelector('.onboarding-tooltip');
        if (existing) {
            existing.remove();
        }

        // Remove highlight
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
    }

    /**
     * Complete onboarding
     */
    complete() {
        this.hideTooltip();
        localStorage.setItem(this.storageKey, 'true');
        showToast('Welcome! You\'re all set up.', 'success');
    }

    /**
     * Reset onboarding (for testing)
     */
    reset() {
        localStorage.removeItem(this.storageKey);
    }
}
