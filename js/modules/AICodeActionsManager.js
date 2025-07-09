/**
 * AICodeActionsManager - Professional AI-powered code actions with real-time streaming
 * 
 * Features a Cursor-rivaling experience with:
 * - Real-time character-by-character streaming responses
 * - Professional UI with clear loading states and progress indicators
 * - Robust error handling and graceful fallbacks
 * - Unified architecture for all AI code actions
 * - Comprehensive context analysis and intelligent prompting
 * - Keyboard shortcuts and context menu integration
 * 
 * Supported Actions:
 * - Explain Code: Clear, educational explanations
 * - Refactor Code: Actionable improvement suggestions
 * - Generate Tests: Comprehensive test suite generation
 * - Add Documentation: Professional JSDoc/docstring generation
 * - Fix Code: Intelligent bug detection and resolution
 */

export class AICodeActionsManager {
    constructor(editor, aiManager, fileManager) {
        this.editor = editor;
        this.aiManager = aiManager;
        this.fileManager = fileManager;
        this.cm = editor.codeMirror;
        
        // Core configuration
        this.enabled = true;
        this.contextMenuVisible = false;
        this.currentSelection = null;
        this.activeStreams = new Map(); // Track active streaming sessions
        this.cancelTokens = new Map(); // Track cancellation tokens
        
        // Performance and reliability settings
        this.config = {
            streamingTimeout: 30000, // 30 seconds max for streams
            retryAttempts: 3,
            retryDelay: 1000,
            maxContentLength: 8192,
            throttleDelay: 16, // ~60fps for smooth streaming
        };
        
        // Bind methods with proper context
        this.handleSelectionChange = this.handleSelectionChange.bind(this);
        this.handleRightClick = this.handleRightClick.bind(this);
        this.handleKeyboardShortcuts = this.handleKeyboardShortcuts.bind(this);
        this.handleStreamingError = this.handleStreamingError.bind(this);
        this.cleanup = this.cleanup.bind(this);
        
        // Initialize the system
        this.init();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', this.cleanup);
    }
    
    init() {
        if (!this.cm) {
            console.error('AICodeActionsManager: CodeMirror instance not available');
            return;
        }
        
        console.log('✨ AICodeActionsManager: Initializing professional streaming system');
        
        // Set up event listeners
        this.cm.on('cursorActivity', this.handleSelectionChange);
        
        // Add context menu for right-click actions
        if (this.cm.getWrapperElement) {
            const wrapper = this.cm.getWrapperElement();
            wrapper.addEventListener('contextmenu', this.handleRightClick);
            wrapper.addEventListener('keydown', this.handleKeyboardShortcuts);
        }
        
        // Initialize UI components
        this.initializeUI();
        
        console.log('✅ AI Code Actions system ready - professional streaming enabled');
    }
    
    initializeUI() {
        // Add action button to chat panel
        this.addActionButton();
        
        // Ensure chat panel has required structure
        this.ensureChatPanelStructure();
        
        // Add required CSS classes and styling
        this.injectRequiredStyles();
        
        console.log('🎨 AI Code Actions UI initialized');
    }
    
    ensureChatPanelStructure() {
        // Try both possible selectors for the chat panel
        const chatPanel = document.querySelector('.chat-pane') || document.getElementById('chat-panel');
        if (!chatPanel) {
            console.warn('Chat panel not found - AI Code Actions may not display properly');
            return;
        }
        
        // Ensure chat messages container exists
        let chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) {
            const chatContent = chatPanel.querySelector('.chat-content') || chatPanel;
            chatMessages = document.createElement('div');
            chatMessages.id = 'chat-messages';
            chatMessages.className = 'chat-messages';
            chatContent.appendChild(chatMessages);
        }
        
        // Add accessibility attributes
        chatMessages.setAttribute('role', 'log');
        chatMessages.setAttribute('aria-live', 'polite');
        chatMessages.setAttribute('aria-label', 'AI Code Actions Response');
    }
    
    
    handleSelectionChange() {
        if (!this.enabled) return;
        
        const selection = this.cm.getSelection();
        const hasSelection = selection && selection.trim().length > 0;
        
        if (hasSelection) {
            // Extract rich context about the selection
            const from = this.cm.getCursor('from');
            const to = this.cm.getCursor('to');
            
            this.currentSelection = {
                text: selection,
                from,
                to,
                timestamp: Date.now(),
                lineCount: to.line - from.line + 1,
                charCount: selection.length
            };
            
            // Update UI to show that code actions are available
            this.updateCodeActionAvailability(true);
            
            // Log selection for debugging
            console.log(`📝 Code selected: ${this.currentSelection.lineCount} lines, ${this.currentSelection.charCount} chars`);
        } else {
            this.currentSelection = null;
            this.updateCodeActionAvailability(false);
        }
    }
    
    handleRightClick(event) {
        if (!this.enabled || !this.currentSelection) return;
        
        event.preventDefault();
        this.showContextMenu(event.clientX, event.clientY);
    }
    
    handleKeyboardShortcuts(event) {
        if (!this.enabled) return;
        
        const { ctrlKey, shiftKey, key, metaKey } = event;
        const modifier = ctrlKey || metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)
        
        if (!modifier || !shiftKey) return;
        
        // Keyboard shortcuts for AI actions
        const shortcuts = {
            'E': () => this.executeAction('explain'),
            'R': () => this.executeAction('refactor'), 
            'T': () => this.executeAction('tests'),
            'D': () => this.executeAction('documentation'),
            'F': () => this.executeAction('fix')
        };
        
        const action = shortcuts[key.toUpperCase()];
        if (action) {
            event.preventDefault();
            action();
            console.log(`⌨️ Keyboard shortcut triggered: ${key.toUpperCase()}`);
        }
    }
    
    
    showContextMenu(x, y) {
        if (!this.currentSelection) return;
        
        // Remove any existing context menu
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'ai-code-actions-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', 'AI Code Actions');
        
        const actions = [
            { 
                id: 'explain', 
                icon: '💡', 
                text: 'Explain this code', 
                shortcut: 'Ctrl+Shift+E',
                description: 'Get a clear explanation of what this code does'
            },
            { 
                id: 'refactor', 
                icon: '🔧', 
                text: 'Refactor this code', 
                shortcut: 'Ctrl+Shift+R',
                description: 'Get suggestions to improve code quality'
            },
            { 
                id: 'tests', 
                icon: '🧪', 
                text: 'Generate tests', 
                shortcut: 'Ctrl+Shift+T',
                description: 'Create comprehensive test cases'
            },
            { 
                id: 'documentation', 
                icon: '📝', 
                text: 'Add documentation', 
                shortcut: 'Ctrl+Shift+D',
                description: 'Generate professional code documentation'
            },
            { 
                id: 'fix', 
                icon: '🩹', 
                text: 'Fix this code', 
                shortcut: 'Ctrl+Shift+F',
                description: 'Identify and fix potential issues'
            }
        ];
        
        menu.innerHTML = `
            <div class="menu-header">
                <span class="menu-title">AI Code Actions</span>
                <span class="selection-info">${this.currentSelection.lineCount} lines selected</span>
            </div>
            ${actions.map(action => `
                <div class="action-item" data-action="${action.id}" role="menuitem" tabindex="0" 
                     title="${action.description}">
                    <span class="action-icon">${action.icon}</span>
                    <div class="action-content">
                        <span class="action-text">${action.text}</span>
                        <span class="action-description">${action.description}</span>
                    </div>
                    <span class="action-shortcut">${action.shortcut}</span>
                </div>
            `).join('')}
            <div class="menu-footer">
                <span class="menu-tip">💡 Tip: Use keyboard shortcuts for faster access</span>
            </div>
        `;
        
        // Position the menu
        menu.style.position = 'fixed';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.zIndex = '999999';
        
        // Add event listeners
        menu.addEventListener('click', this.handleMenuClick.bind(this));
        menu.addEventListener('keydown', this.handleMenuKeyboard.bind(this));
        
        // Add to document
        document.body.appendChild(menu);
        this.contextMenuVisible = true;
        
        // Auto-hide menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.hideContextMenu();
            }, { once: true });
        }, 0);
        
        // Ensure menu stays within viewport
        this.adjustMenuPosition(menu);
        
        // Focus first item for accessibility
        const firstItem = menu.querySelector('.action-item');
        if (firstItem) firstItem.focus();
    }
    
    handleMenuClick(event) {
        const actionItem = event.target.closest('.action-item');
        if (actionItem) {
            const action = actionItem.dataset.action;
            this.executeAction(action);
            this.hideContextMenu();
        }
    }
    
    handleMenuKeyboard(event) {
        const items = Array.from(event.currentTarget.querySelectorAll('.action-item'));
        const currentIndex = items.indexOf(document.activeElement);
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                const nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].focus();
                break;
            case 'ArrowUp':
                event.preventDefault();
                const prevIndex = (currentIndex - 1 + items.length) % items.length;
                items[prevIndex].focus();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (document.activeElement.classList.contains('action-item')) {
                    const action = document.activeElement.dataset.action;
                    this.executeAction(action);
                    this.hideContextMenu();
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.hideContextMenu();
                break;
        }
    }
    
    adjustMenuPosition(menu) {
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 10;
        
        // Adjust horizontal position
        if (rect.right > viewportWidth - padding) {
            menu.style.left = Math.max(padding, viewportWidth - rect.width - padding) + 'px';
        }
        
        // Adjust vertical position
        if (rect.bottom > viewportHeight - padding) {
            menu.style.top = Math.max(padding, viewportHeight - rect.height - padding) + 'px';
        }
    }
    
    hideContextMenu() {
        const existingMenu = document.querySelector('.ai-code-actions-menu');
        if (existingMenu) {
            existingMenu.remove();
            this.contextMenuVisible = false;
        }
    }
    
    
    executeAction(action) {
        if (!this.currentSelection) {
            this.showNotification('Please select some code first', 'warning');
            return;
        }
        
        // Validate action
        const validActions = ['explain', 'refactor', 'tests', 'documentation', 'fix'];
        if (!validActions.includes(action)) {
            console.warn('Unknown action:', action);
            this.showNotification('Unknown action requested', 'error');
            return;
        }
        
        console.log(`🚀 Executing AI action: ${action}`);
        
        // Start professional streaming response
        this.startStreamingAction(action);
    }
    
    // ====================================================================
    // PROFESSIONAL STREAMING SYSTEM - Cursor-Level Quality
    // ====================================================================
    
    async startStreamingAction(actionType) {
        try {
            // Validate API configuration
            if (!this.validateConfiguration()) {
                return;
            }
            
            // Create streaming session
            const session = this.createStreamingSession(actionType);
            
            // Build rich context
            const context = this.buildRichContext(this.currentSelection);
            
            // Execute with proper error handling and retry logic
            await this.executeStreamingWithRetry(session, context);
            
        } catch (error) {
            console.error(`❌ Failed to start ${actionType}:`, error);
            this.showNotification(`Failed to start ${actionType}: ${error.message}`, 'error');
        }
    }
    
    validateConfiguration() {
        const apiKey = localStorage.getItem('openrouter_api_key');
        if (!apiKey || apiKey.trim() === '') {
            this.showConfigurationError();
            return false;
        }
        
        // Verify chat panel is available
        const chatPanel = document.querySelector('.chat-pane') || document.getElementById('chat-panel');
        if (!chatPanel) {
            this.showNotification('Chat panel not available', 'error');
            return false;
        }
        
        return true;
    }
    
    showConfigurationError() {
        const message = `
            <div class="config-error">
                <h3>🔑 API Key Required</h3>
                <p>Please configure your OpenRouter API key in the chat panel to use AI Code Actions.</p>
                <p>You can get a free API key at <a href="https://openrouter.ai" target="_blank">openrouter.ai</a></p>
            </div>
        `;
        
        this.displayInChatPanel('Configuration Required', message, 'config', this.currentSelection);
    }
    
    createStreamingSession(actionType) {
        const sessionId = `stream_${actionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const session = {
            id: sessionId,
            actionType,
            title: this.getActionTitle(actionType),
            startTime: Date.now(),
            state: 'initializing', // initializing -> thinking -> streaming -> complete -> error
            content: '',
            element: null,
            retryCount: 0,
            cancelToken: new AbortController()
        };
        
        // Track active session
        this.activeStreams.set(sessionId, session);
        this.cancelTokens.set(sessionId, session.cancelToken);
        
        // Create UI immediately
        this.createStreamingUI(session);
        
        console.log(`✨ Created streaming session: ${sessionId} for ${actionType}`);
        return session;
    }
    
    getActionTitle(actionType) {
        const titles = {
            explain: 'Code Explanation',
            refactor: 'Refactoring Suggestions', 
            tests: 'Test Generation',
            documentation: 'Documentation Generation',
            fix: 'Code Analysis & Fixes'
        };
        return titles[actionType] || 'AI Code Action';
    }
    
    createStreamingUI(session) {
        // Ensure chat panel is visible
        this.ensureChatPanelVisible();
        
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) {
            console.error('❌ Chat messages container not found');
            return;
        }
        
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = 'message ai-message code-action-message streaming-active';
        messageEl.setAttribute('data-session-id', session.id);
        messageEl.setAttribute('role', 'article');
        messageEl.setAttribute('aria-live', 'polite');
        
        const actionIcons = {
            explain: '💡',
            refactor: '🔧', 
            tests: '🧪',
            documentation: '📝',
            fix: '🩹'
        };
        
        const icon = actionIcons[session.actionType] || '🤖';
        
        messageEl.innerHTML = `
            <div class="code-action-header">
                <div class="action-info">
                    <span class="action-icon" role="img" aria-label="${session.actionType}">${icon}</span>
                    <span class="action-title">${session.title}</span>
                </div>
                <div class="streaming-status">
                    <div class="status-indicator thinking active" aria-label="AI is thinking">
                        <div class="thinking-animation">
                            <div class="thinking-dot"></div>
                            <div class="thinking-dot"></div>
                            <div class="thinking-dot"></div>
                        </div>
                        <span class="status-text">Analyzing code...</span>
                    </div>
                    <div class="status-indicator writing" aria-label="AI is writing response">
                        <div class="writing-cursor">|</div>
                        <span class="status-text">Writing response...</span>
                    </div>
                    <div class="status-indicator complete" aria-label="Response complete">
                        <span class="complete-icon">✅</span>
                        <span class="status-text">Complete</span>
                    </div>
                    <div class="status-indicator error" aria-label="Error occurred">
                        <span class="error-icon">❌</span>
                        <span class="status-text">Error</span>
                    </div>
                </div>
                <button class="cancel-button" title="Cancel this request" aria-label="Cancel AI request">
                    <span class="cancel-icon">×</span>
                </button>
            </div>
            
            <div class="code-context">
                <div class="context-header">
                    <span class="context-icon">📄</span>
                    <span class="context-title">Selected Code</span>
                    <span class="context-meta">
                        ${this.currentSelection.lineCount} lines • 
                        ${this.currentSelection.charCount} characters • 
                        ${this.getFileInfo()}
                    </span>
                </div>
                <div class="context-code">
                    <pre><code>${this.escapeHtml(this.currentSelection.text)}</code></pre>
                </div>
            </div>
            
            <div class="streaming-content-container">
                <div class="content-header">
                    <span class="content-icon">🤖</span>
                    <span class="content-title">AI Response</span>
                </div>
                <div class="streaming-content" role="region" aria-label="AI generated content"></div>
            </div>
            
            <div class="message-footer">
                <span class="timestamp">${this.formatTimestamp(new Date())}</span>
                <div class="action-controls">
                    <button class="control-btn retry-btn" title="Retry this request" disabled>
                        <span class="retry-icon">🔄</span>
                        Retry
                    </button>
                    <button class="control-btn copy-btn" title="Copy response" disabled>
                        <span class="copy-icon">📋</span>
                        Copy
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.setupStreamingEventListeners(messageEl, session);
        
        // Add to chat
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store reference
        session.element = messageEl;
        
        console.log(`🎨 Created streaming UI for session: ${session.id}`);
    }
    
    setupStreamingEventListeners(messageEl, session) {
        // Cancel button
        const cancelBtn = messageEl.querySelector('.cancel-button');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelStreaming(session);
            });
        }
        
        // Retry button (enabled after completion or error)
        const retryBtn = messageEl.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.retryAction(session);
            });
        }
        
        // Copy button (enabled after completion)
        const copyBtn = messageEl.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyResponse(session);
            });
        }
    }
    
    ensureChatPanelVisible() {
        const chatPanel = document.querySelector('.chat-pane') || document.getElementById('chat-panel');
        if (chatPanel) {
            if (chatPanel.style.display === 'none' || !chatPanel.style.display) {
                chatPanel.style.display = 'flex';
                console.log('�️ Chat panel made visible for AI Code Actions');
            }
        }
    }
    
    getFileInfo() {
        const file = this.fileManager.getCurrentFile();
        const fileName = file?.name || 'untitled';
        const language = this.detectLanguage(fileName);
        const lines = `${this.currentSelection.from.line + 1}-${this.currentSelection.to.line + 1}`;
        
        return `${fileName} (${language}) • lines ${lines}`;
    }
    
    detectLanguage(fileName) {
        const extensions = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript', 
            '.jsx': 'React JSX',
            '.tsx': 'React TSX',
            '.py': 'Python',
            '.java': 'Java',
            '.c': 'C',
            '.cpp': 'C++',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.json': 'JSON',
            '.xml': 'XML',
            '.sql': 'SQL',
            '.sh': 'Shell',
            '.md': 'Markdown',
            '.yaml': 'YAML',
            '.yml': 'YAML'
        };
        
        const ext = fileName.substring(fileName.lastIndexOf('.'));
        return extensions[ext] || 'Plain Text';
    }
    
    buildRichContext(selection) {
        const file = this.fileManager.getCurrentFile();
        const fileName = file?.name || 'untitled';
        const language = this.detectLanguage(fileName);
        
        // Get surrounding context for better understanding
        const surroundingLines = 5;
        const startLine = Math.max(0, selection.from.line - surroundingLines);
        const endLine = Math.min(this.cm.lineCount() - 1, selection.to.line + surroundingLines);
        
        let beforeContext = '';
        let afterContext = '';
        
        // Get context before selection
        for (let i = startLine; i < selection.from.line; i++) {
            beforeContext += this.cm.getLine(i) + '\n';
        }
        
        // Get context after selection
        for (let i = selection.to.line + 1; i <= endLine; i++) {
            afterContext += this.cm.getLine(i) + '\n';
        }
        
        return {
            selectedCode: selection.text,
            beforeContext: beforeContext.trim(),
            afterContext: afterContext.trim(),
            fileName,
            language,
            lineNumbers: {
                start: selection.from.line + 1,
                end: selection.to.line + 1
            },
            selectionMeta: {
                lineCount: selection.lineCount,
                charCount: selection.charCount,
                hasMultipleLines: selection.lineCount > 1
            }
        };
    }
    
    async executeStreamingWithRetry(session, context) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                session.retryCount = attempt - 1;
                
                // Update UI for retry attempts
                if (attempt > 1) {
                    this.updateStreamingStatus(session, 'thinking', `Retrying... (${attempt}/${this.config.retryAttempts})`);
                    await this.delay(this.config.retryDelay * attempt);
                }
                
                // Execute the streaming request
                await this.executeStreamingRequest(session, context);
                
                // If we get here, it was successful
                console.log(`✅ Streaming successful on attempt ${attempt}`);
                return;
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Streaming attempt ${attempt} failed:`, error.message);
                
                // Check if it's a cancellation
                if (error.name === 'AbortError' || session.cancelToken.signal.aborted) {
                    console.log('🚫 Streaming was cancelled by user');
                    this.updateStreamingStatus(session, 'cancelled');
                    return;
                }
                
                // If this is the last attempt, don't continue
                if (attempt === this.config.retryAttempts) {
                    break;
                }
            }
        }
        
        // All attempts failed
        console.error(`❌ All ${this.config.retryAttempts} streaming attempts failed`);
        this.handleStreamingError(session, lastError);
    }
    
    async executeStreamingRequest(session, context) {
        // Build the prompt and messages
        const prompt = this.buildPrompt(session.actionType, context);
        const messages = [
            {
                role: "system",
                content: this.getSystemMessage(session.actionType)
            },
            {
                role: "user", 
                content: prompt
            }
        ];
        
        // Get API configuration
        const apiKey = localStorage.getItem('openrouter_api_key');
        const model = this.getSelectedModel();
        
        console.log(`🚀 Starting streaming request for ${session.actionType} with model: ${model}`);
        
        // Update status to thinking
        this.updateStreamingStatus(session, 'thinking');
        
        // Execute the streaming fetch
        await this.performStreamingFetch(session, model, messages, apiKey);
    }
    
    async performStreamingFetch(session, model, messages, apiKey) {
        const API_URL = "https://openrouter.ai/api/v1/chat/completions";
        
        const requestBody = {
            model: model,
            messages: messages,
            stream: true,
            temperature: 0.7,
            max_tokens: this.config.maxContentLength,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1
        };
        
        console.log(`� Sending streaming request to ${model}`);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Live Editor Claude - AI Code Actions'
            },
            body: JSON.stringify(requestBody),
            signal: session.cancelToken.signal // Support cancellation
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        if (!response.body) {
            throw new Error('Response body is not readable');
        }

        // Process the streaming response
        await this.processStreamingResponse(session, response);
    }
    
    async processStreamingResponse(session, response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let firstChunkReceived = false;
        
        try {
            while (true) {
                // Check for cancellation
                if (session.cancelToken.signal.aborted) {
                    throw new Error('Request was cancelled');
                }
                
                const { done, value } = await reader.read();
                
                if (done) {
                    console.log('✅ Streaming response completed');
                    this.completeStreaming(session);
                    break;
                }
                
                // Switch to streaming status on first chunk
                if (!firstChunkReceived) {
                    this.updateStreamingStatus(session, 'streaming');
                    firstChunkReceived = true;
                }
                
                // Decode and process chunks
                buffer += decoder.decode(value, { stream: true });
                await this.processStreamingChunks(session, buffer);
                
                // Clear processed chunks from buffer
                const lastNewlineIndex = buffer.lastIndexOf('\n');
                if (lastNewlineIndex !== -1) {
                    buffer = buffer.substring(lastNewlineIndex + 1);
                }
                
                // Throttle updates for performance
                await this.delay(this.config.throttleDelay);
            }
        } finally {
            reader.releaseLock();
        }
    }
    
    async processStreamingChunks(session, buffer) {
        const lines = buffer.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                    console.log('🏁 Received [DONE] signal');
                    this.completeStreaming(session);
                    return;
                }
                
                if (data && data !== '') {
                    try {
                        const parsed = JSON.parse(data);
                        
                        if (parsed.choices?.[0]?.delta?.content) {
                            const newContent = parsed.choices[0].delta.content;
                            this.appendStreamingContent(session, newContent);
                        }
                        
                        // Check for finish reason
                        if (parsed.choices?.[0]?.finish_reason) {
                            console.log(`🏁 Stream finished with reason: ${parsed.choices[0].finish_reason}`);
                            this.completeStreaming(session);
                            return;
                        }
                        
                    } catch (parseError) {
                        // Skip invalid JSON chunks - this is normal in streaming
                        continue;
                    }
                }
            }
        }
    }
    
    appendStreamingContent(session, newContent) {
        if (!session.element || !newContent) return;
        
        // Accumulate content
        session.content += newContent;
        
        // Update UI with new content
        const contentContainer = session.element.querySelector('.streaming-content');
        if (contentContainer) {
            // Apply professional formatting
            const formattedContent = this.formatStreamingContent(session.content);
            contentContainer.innerHTML = formattedContent;
            
            // Auto-scroll to show new content
            this.scrollToBottom();
        }
    }
    
    updateStreamingStatus(session, status, customText = null) {
        if (!session.element) return;
        
        session.state = status;
        
        // Hide all status indicators
        const indicators = session.element.querySelectorAll('.status-indicator');
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Show the current status
        const currentIndicator = session.element.querySelector(`.status-indicator.${status}`);
        if (currentIndicator) {
            currentIndicator.classList.add('active');
            
            // Update text if provided
            if (customText) {
                const statusText = currentIndicator.querySelector('.status-text');
                if (statusText) {
                    statusText.textContent = customText;
                }
            }
        }
        
        console.log(`📊 Status updated for ${session.id}: ${status}`);
    }
    
    completeStreaming(session) {
        if (!session.element || session.state === 'complete') return;
        
        console.log(`✅ Completing streaming session: ${session.id}`);
        
        // Update status
        this.updateStreamingStatus(session, 'complete');
        
        // Remove streaming active class
        session.element.classList.remove('streaming-active');
        session.element.classList.add('streaming-complete');
        
        // Enable action controls
        this.enableActionControls(session);
        
        // Show completion notification
        const duration = this.getSessionDuration(session);
        this.showNotification(`${session.title} completed in ${duration}`, 'success');
        
        // Update timestamp with duration
        this.updateTimestampWithDuration(session);
        
        // Clean up
        this.activeStreams.delete(session.id);
        this.cancelTokens.delete(session.id);
        
        console.log(`🎉 ${session.title} completed successfully in ${duration}`);
    }
    
    enableActionControls(session) {
        if (!session.element) return;
        
        const retryBtn = session.element.querySelector('.retry-btn');
        const copyBtn = session.element.querySelector('.copy-btn');
        const cancelBtn = session.element.querySelector('.cancel-button');
        
        if (retryBtn) retryBtn.disabled = false;
        if (copyBtn) copyBtn.disabled = false;
        if (cancelBtn) cancelBtn.style.display = 'none'; // Hide cancel button when complete
    }
    
    updateTimestampWithDuration(session) {
        const timestampEl = session.element.querySelector('.timestamp');
        if (timestampEl) {
            const duration = this.getSessionDuration(session);
            timestampEl.innerHTML = `
                ${this.formatTimestamp(new Date(session.startTime))} • 
                <span class="duration">${duration}</span>
            `;
        }
    }
    
    // ====================================================================
    // ERROR HANDLING AND CONTROL METHODS
    // ====================================================================
    
    handleStreamingError(session, error) {
        console.error(`❌ Streaming error in session ${session.id}:`, error);
        
        if (!session.element) return;
        
        // Update status
        this.updateStreamingStatus(session, 'error', error.message);
        
        // Remove streaming classes
        session.element.classList.remove('streaming-active');
        session.element.classList.add('streaming-error');
        
        // Show error content
        const contentContainer = session.element.querySelector('.streaming-content');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="error-content">
                    <div class="error-header">
                        <span class="error-icon">❌</span>
                        <span class="error-title">Request Failed</span>
                    </div>
                    <div class="error-message">${this.escapeHtml(error.message)}</div>
                    <div class="error-suggestions">
                        <p>Possible solutions:</p>
                        <ul>
                            <li>Check your internet connection</li>
                            <li>Verify your API key is valid</li>
                            <li>Try selecting a smaller code snippet</li>
                            <li>Click the retry button to try again</li>
                        </ul>
                    </div>
                </div>
            `;
        }
        
        // Enable retry button
        const retryBtn = session.element.querySelector('.retry-btn');
        if (retryBtn) retryBtn.disabled = false;
        
        // Hide cancel button
        const cancelBtn = session.element.querySelector('.cancel-button');
        if (cancelBtn) cancelBtn.style.display = 'none';
        
        // Show error notification
        this.showNotification(`${session.title} failed: ${error.message}`, 'error');
        
        // Clean up
        this.activeStreams.delete(session.id);
        this.cancelTokens.delete(session.id);
    }
    
    cancelStreaming(session) {
        console.log(`🚫 Cancelling streaming session: ${session.id}`);
        
        // Cancel the request
        if (session.cancelToken) {
            session.cancelToken.abort();
        }
        
        // Update UI
        this.updateStreamingStatus(session, 'cancelled', 'Cancelled by user');
        
        if (session.element) {
            session.element.classList.remove('streaming-active');
            session.element.classList.add('streaming-cancelled');
            
            // Hide cancel button
            const cancelBtn = session.element.querySelector('.cancel-button');
            if (cancelBtn) cancelBtn.style.display = 'none';
            
            // Enable retry button
            const retryBtn = session.element.querySelector('.retry-btn');
            if (retryBtn) retryBtn.disabled = false;
        }
        
        // Show notification
        this.showNotification(`${session.title} was cancelled`, 'info');
        
        // Clean up
        this.activeStreams.delete(session.id);
        this.cancelTokens.delete(session.id);
    }
    
    async retryAction(session) {
        console.log(`🔄 Retrying action: ${session.actionType}`);
        
        // Reset session state
        session.content = '';
        session.state = 'initializing';
        session.retryCount = 0;
        session.cancelToken = new AbortController();
        
        // Update tracking
        this.activeStreams.set(session.id, session);
        this.cancelTokens.set(session.id, session.cancelToken);
        
        // Reset UI
        if (session.element) {
            session.element.classList.remove('streaming-complete', 'streaming-error', 'streaming-cancelled');
            session.element.classList.add('streaming-active');
            
            // Clear content
            const contentContainer = session.element.querySelector('.streaming-content');
            if (contentContainer) {
                contentContainer.innerHTML = '';
            }
            
            // Show cancel button again
            const cancelBtn = session.element.querySelector('.cancel-button');
            if (cancelBtn) cancelBtn.style.display = 'block';
            
            // Disable action controls
            const retryBtn = session.element.querySelector('.retry-btn');
            const copyBtn = session.element.querySelector('.copy-btn');
            if (retryBtn) retryBtn.disabled = true;
            if (copyBtn) copyBtn.disabled = true;
        }
        
        // Build context again (selection might have changed)
        const context = this.buildRichContext(this.currentSelection);
        
        // Execute with retry logic
        await this.executeStreamingWithRetry(session, context);
    }
    
    async copyResponse(session) {
        if (!session.content) {
            this.showNotification('No content to copy', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(session.content);
            this.showNotification('Response copied to clipboard', 'success');
            
            // Visual feedback
            const copyBtn = session.element.querySelector('.copy-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span class="copy-icon">✅</span> Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
            
        } catch (error) {
            console.error('❌ Failed to copy to clipboard:', error);
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }
    
    // ====================================================================
    // PROMPT BUILDING AND SYSTEM MESSAGES
    // ====================================================================
    
    buildPrompt(actionType, context) {
        const baseInfo = `File: ${context.fileName} (${context.language})
Lines: ${context.lineNumbers.start}-${context.lineNumbers.end}
Selection: ${context.selectionMeta.lineCount} lines, ${context.selectionMeta.charCount} characters

Selected Code:
\`\`\`${context.language}
${context.selectedCode}
\`\`\``;

        const contextInfo = context.beforeContext || context.afterContext ? `

Context:
${context.beforeContext ? `Before:\n\`\`\`${context.language}\n${context.beforeContext}\n\`\`\`` : ''}
${context.afterContext ? `After:\n\`\`\`${context.language}\n${context.afterContext}\n\`\`\`` : ''}` : '';

        const prompts = {
            explain: `${baseInfo}${contextInfo}

Please explain this code clearly and concisely:
- What does this code do?
- How does it work?
- What are the key concepts or patterns?
- Are there any notable implementation details?

Provide a helpful explanation that would be useful for understanding and learning.`,

            refactor: `${baseInfo}${contextInfo}

Please analyze this code and suggest specific improvements:
- Code structure and organization
- Performance optimizations
- Readability and maintainability
- Best practices compliance
- Error handling improvements

Provide actionable refactoring suggestions with clear explanations.`,

            tests: `${baseInfo}${contextInfo}

Please generate comprehensive test cases for this code:
- Unit tests for normal operation
- Edge cases and boundary conditions
- Error handling scenarios
- Input validation tests

Generate practical, runnable test code that thoroughly validates the functionality.`,

            documentation: `${baseInfo}${contextInfo}

Please generate professional documentation for this code:
- Clear function/method descriptions
- Parameter types and descriptions
- Return value documentation
- Usage examples
- Any important notes or warnings

Generate JSDoc-style comments or appropriate documentation for the language.`,

            fix: `${baseInfo}${contextInfo}

Please analyze this code for potential issues and provide fixes:
- Syntax errors
- Logic bugs
- Performance problems
- Security vulnerabilities
- Best practice violations

Identify specific issues and provide corrected code with explanations.`
        };

        return prompts[actionType] || prompts.explain;
    }
    
    getSystemMessage(actionType) {
        const systemMessages = {
            explain: "You are a senior software engineer specializing in clear code explanations. Provide educational, comprehensive explanations that help developers understand code structure, purpose, and implementation. Be thorough but concise.",
            
            refactor: "You are an expert code reviewer specializing in refactoring and optimization. Analyze code for improvements in structure, performance, readability, and best practices. Provide specific, actionable suggestions with clear justifications.",
            
            tests: "You are a testing expert who creates comprehensive test suites. Generate thorough, practical test cases that validate functionality, handle edge cases, and ensure robust code quality. Focus on real-world testing scenarios.",
            
            documentation: "You are a technical documentation specialist. Create clear, comprehensive documentation that helps developers understand and use code effectively. Follow documentation best practices for the specific programming language.",
            
            fix: "You are a debugging and code quality expert. Systematically identify issues in code including bugs, performance problems, security vulnerabilities, and best practice violations. Provide precise fixes with clear explanations."
        };
        
        return systemMessages[actionType] || systemMessages.explain;
    }
    
    // ====================================================================
    // UI AND UTILITY METHODS
    // ====================================================================
    
    injectRequiredStyles() {
        // Check if styles are already injected
        if (document.getElementById('ai-code-actions-styles')) {
            return;
        }
        
        const styles = `
            <style id="ai-code-actions-styles">
                /* AI Code Actions Menu */
                .ai-code-actions-menu {
                    background: var(--secondary-bg, #1e1e1e);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 8px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    min-width: 280px;
                    max-width: 350px;
                    z-index: 999999;
                    overflow: hidden;
                    backdrop-filter: blur(8px);
                }
                
                .menu-header {
                    padding: 12px 16px;
                    background: var(--tertiary-bg, #2a2a2a);
                    border-bottom: 1px solid var(--border-color, #333);
                }
                
                .menu-title {
                    font-weight: 600;
                    color: var(--primary-text, #fff);
                    font-size: 14px;
                }
                
                .selection-info {
                    font-size: 12px;
                    color: var(--secondary-text, #999);
                    margin-top: 2px;
                    display: block;
                }
                
                .action-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    cursor: pointer;
                    border: none;
                    background: none;
                    color: var(--primary-text, #fff);
                    transition: all 0.2s ease;
                    text-align: left;
                    width: 100%;
                }
                
                .action-item:hover,
                .action-item:focus {
                    background: var(--accent-color, #4c9af0);
                    outline: none;
                }
                
                .action-icon {
                    font-size: 16px;
                    margin-right: 12px;
                    flex-shrink: 0;
                }
                
                .action-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .action-text {
                    font-weight: 500;
                    display: block;
                    font-size: 14px;
                }
                
                .action-description {
                    font-size: 12px;
                    color: var(--secondary-text, #999);
                    margin-top: 2px;
                    display: block;
                }
                
                .action-shortcut {
                    font-size: 11px;
                    color: var(--secondary-text, #999);
                    background: var(--tertiary-bg, #333);
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                    flex-shrink: 0;
                }
                
                .menu-footer {
                    padding: 8px 16px;
                    background: var(--tertiary-bg, #2a2a2a);
                    border-top: 1px solid var(--border-color, #333);
                }
                
                .menu-tip {
                    font-size: 11px;
                    color: var(--secondary-text, #999);
                }
                
                /* Streaming Code Action Messages */
                .code-action-message {
                    border: 1px solid var(--border-color, #333);
                    border-radius: 8px;
                    margin: 16px 0;
                    overflow: visible;
                    background: var(--secondary-bg, #1e1e1e);
                }
                
                .code-action-header {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    background: var(--tertiary-bg, #2a2a2a);
                    border-bottom: 1px solid var(--border-color, #333);
                }
                
                .action-info {
                    display: flex;
                    align-items: center;
                    flex: 1;
                }
                
                .action-icon {
                    font-size: 18px;
                    margin-right: 10px;
                }
                
                .action-title {
                    font-weight: 600;
                    font-size: 16px;
                    color: var(--primary-text, #fff);
                }
                
                .streaming-status {
                    display: flex;
                    align-items: center;
                    margin-left: 16px;
                }
                
                .status-indicator {
                    display: none;
                    align-items: center;
                    font-size: 12px;
                    color: var(--secondary-text, #999);
                }
                
                .status-indicator.active {
                    display: flex;
                }
                
                .thinking-animation {
                    display: flex;
                    margin-right: 8px;
                }
                
                .thinking-dot {
                    width: 4px;
                    height: 4px;
                    background: var(--accent-color, #4c9af0);
                    border-radius: 50%;
                    margin: 0 1px;
                    animation: thinking-pulse 1.5s infinite;
                }
                
                .thinking-dot:nth-child(2) { animation-delay: 0.3s; }
                .thinking-dot:nth-child(3) { animation-delay: 0.6s; }
                
                @keyframes thinking-pulse {
                    0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
                    30% { opacity: 1; transform: scale(1); }
                }
                
                .writing-cursor {
                    animation: blink 1s infinite;
                    margin-right: 8px;
                    color: var(--accent-color, #4c9af0);
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                
                .cancel-button {
                    background: none;
                    border: none;
                    color: var(--secondary-text, #999);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    margin-left: 12px;
                }
                
                .cancel-button:hover {
                    background: var(--error-color, #dc3545);
                    color: white;
                }
                
                .code-context,
                .streaming-content-container {
                    padding: 16px;
                }
                
                .context-header,
                .content-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--primary-text, #fff);
                }
                
                .context-icon,
                .content-icon {
                    margin-right: 8px;
                }
                
                .context-meta {
                    margin-left: auto;
                    font-size: 12px;
                    color: var(--secondary-text, #999);
                }
                
                .context-code {
                    background: var(--code-bg, #000);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 6px;
                    overflow: auto;
                    max-height: 300px;
                }
                
                .context-code pre {
                    margin: 0;
                    padding: 12px;
                    font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .streaming-content {
                    min-height: 60px;
                    max-height: none;
                    line-height: 1.6;
                    color: var(--primary-text, #fff);
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    white-space: pre-wrap;
                    overflow-y: auto;
                }
                
                .streaming-content-container {
                    padding: 16px;
                    max-height: none;
                    overflow: visible;
                }
                
                /* Ensure the entire message can expand */
                .code-action-message.streaming-active {
                    min-height: auto;
                    height: auto;
                }
                
                .message-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: var(--tertiary-bg, #2a2a2a);
                    border-top: 1px solid var(--border-color, #333);
                    font-size: 12px;
                }
                
                .timestamp {
                    color: var(--secondary-text, #999);
                }
                
                .action-controls {
                    display: flex;
                    gap: 8px;
                }
                
                .control-btn {
                    background: var(--tertiary-bg, #333);
                    border: 1px solid var(--border-color, #555);
                    color: var(--primary-text, #fff);
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: all 0.2s ease;
                }
                
                .control-btn:hover:not(:disabled) {
                    background: var(--accent-color, #4c9af0);
                }
                
                .control-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .control-btn.copied {
                    background: var(--success-color, #28a745);
                }
                
                /* Error States */
                .error-content {
                    padding: 16px;
                    color: var(--error-color, #dc3545);
                }
                
                .error-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;
                    font-weight: 600;
                }
                
                .error-icon {
                    margin-right: 8px;
                }
                
                .error-message {
                    background: rgba(220, 53, 69, 0.1);
                    border: 1px solid var(--error-color, #dc3545);
                    border-radius: 4px;
                    padding: 8px;
                    margin-bottom: 12px;
                    font-family: monospace;
                    font-size: 12px;
                }
                
                .error-suggestions ul {
                    margin: 8px 0;
                    padding-left: 20px;
                }
                
                .error-suggestions li {
                    margin-bottom: 4px;
                    font-size: 12px;
                }
            </style>
        `;
        
        document.head.appendChild(document.createRange().createContextualFragment(styles));
    }
    
    // ====================================================================
    // UTILITY METHODS  
    // ====================================================================
    
    addActionButton() {
        // Add AI Code Actions button to chat panel
        const chatHeader = document.querySelector('.chat-header');
        if (!chatHeader) return;
        
        const actionButton = document.createElement('button');
        actionButton.className = 'action-btn ai-code-actions-btn';
        actionButton.innerHTML = '🔧 Code Actions';
        actionButton.title = 'AI Code Actions (select code first)';
        
        actionButton.addEventListener('click', () => {
            if (this.currentSelection) {
                this.showActionMenu();
            } else {
                this.showNotification('Select some code first to see available actions', 'info');
            }
        });
        
        chatHeader.appendChild(actionButton);
    }
    
    showActionMenu() {
        // Show a menu with all available actions
        const rect = document.querySelector('.ai-code-actions-btn').getBoundingClientRect();
        this.showContextMenu(rect.left, rect.bottom + 5);
    }
    
    updateCodeActionAvailability(hasSelection) {
        const actionButton = document.querySelector('.ai-code-actions-btn');
        if (actionButton) {
            if (hasSelection) {
                actionButton.classList.add('active');
                actionButton.style.opacity = '1';
            } else {
                actionButton.classList.remove('active');
                actionButton.style.opacity = '0.6';
            }
        }
    }
    
    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `ai-action-notification ${type}`;
        notification.textContent = message;
        
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '999999';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '6px';
        notification.style.fontWeight = '500';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        
        // Style based on type
        const styles = {
            info: { background: '#4361ee', color: 'white' },
            success: { background: '#28a745', color: 'white' },
            warning: { background: '#ffc107', color: '#000' },
            error: { background: '#dc3545', color: 'white' }
        };
        
        const style = styles[type] || styles.info;
        notification.style.backgroundColor = style.background;
        notification.style.color = style.color;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    displayInChatPanel(title, content, actionType, selection) {
        console.log('📺 Displaying in chat panel:', title);
        
        // Create a special message for the chat panel
        const messageData = {
            role: 'assistant',
            content: content,
            metadata: {
                type: 'code-action',
                actionType: actionType,
                title: title,
                originalCode: selection.text,
                fileName: this.fileManager.getCurrentFile()?.name || 'untitled',
                lineNumbers: {
                    start: selection.from.line + 1,
                    end: selection.to.line + 1
                }
            }
        };
        
        console.log('📋 Message data prepared:', { title, actionType, hasContent: !!content });
        
        // Show chat panel if hidden
        const chatPanel = document.querySelector('.chat-pane') || document.getElementById('chat-panel');
        if (chatPanel && chatPanel.style.display === 'none') {
            chatPanel.style.display = 'flex';
            console.log('👁️ Chat panel shown');
        }
        
        // Add message to chat
        console.log('➕ Adding message to chat...');
        this.aiManager.addMessageToChat(messageData);
        console.log('✅ Message added to chat');
        
        // Scroll to bottom of chat (try both possible containers)
        const chatHistory = document.getElementById('chat-history');
        const chatMessages = document.getElementById('chat-messages');
        
        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
            console.log('📜 Scrolled chat-history to bottom');
        }
        
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
            console.log('📜 Scrolled chat-messages to bottom');
        }
        
        // Show success notification
        this.showNotification(`${title} completed successfully!`, 'success');
    }
    
    cleanup() {
        // Cancel all active streams
        for (const [sessionId, cancelToken] of this.cancelTokens) {
            try {
                cancelToken.abort();
                console.log(`🚫 Cancelled active stream: ${sessionId}`);
            } catch (error) {
                console.warn(`Failed to cancel stream ${sessionId}:`, error);
            }
        }
        
        // Clear tracking maps
        this.activeStreams.clear();
        this.cancelTokens.clear();
        
        // Call destroy method
        this.destroy();
    }
    
    enable() {
        this.enabled = true;
        console.log('✨ AI Code Actions enabled');
    }
    
    disable() {
        this.enabled = false;
        this.hideContextMenu();
        console.log('🚫 AI Code Actions disabled');
    }
    
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    }
    
    destroy() {
        // Clean up event listeners
        if (this.cm) {
            this.cm.off('cursorActivity', this.handleSelectionChange);
            
            if (this.cm.getWrapperElement) {
                const wrapper = this.cm.getWrapperElement();
                wrapper.removeEventListener('contextmenu', this.handleRightClick);
                wrapper.removeEventListener('keydown', this.handleKeyboardShortcuts);
            }
        }
        
        // Remove context menu if visible
        this.hideContextMenu();
        
        // Remove action button
        const actionButton = document.querySelector('.ai-code-actions-btn');
        if (actionButton) {
            actionButton.remove();
        }
        
        // Remove cleanup listener
        window.removeEventListener('beforeunload', this.cleanup);
        
        console.log('🧹 AICodeActionsManager destroyed');
    }
    
    // ====================================================================
    // MISSING UTILITY METHODS
    // ====================================================================
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTimestamp(date) {
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: '2-digit'
        });
    }
    
    formatStreamingContent(content) {
        // Simple markdown-like formatting for streaming content
        return content
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code class="language-$1">$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
    
    getSelectedModel() {
        // Get the selected model from the chat panel or use default
        const modelSelect = document.getElementById('chat-ai-model');
        if (modelSelect && modelSelect.value) {
            return modelSelect.value;
        }
        
        // Fallback to a good default model
        return 'google/gemini-2.5-flash-preview-05-20';
    }
    
    getSessionDuration(session) {
        const duration = Date.now() - session.startTime;
        if (duration < 1000) {
            return `${duration}ms`;
        } else if (duration < 60000) {
            return `${(duration / 1000).toFixed(1)}s`;
        } else {
            return `${(duration / 60000).toFixed(1)}m`;
        }
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            // Use requestAnimationFrame for smooth scrolling
            requestAnimationFrame(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }
    }
}
