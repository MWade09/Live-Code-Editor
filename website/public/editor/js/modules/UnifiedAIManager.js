/**
 * UnifiedAIManager - Single AI assistant that can chat AND edit files
 * Replaces separate Chat and Agent modes with one intelligent system
 * 
 * Features:
 * - Natural conversations
 * - Direct file editing
 * - File creation
 * - Terminal commands
 * - Project planning
 * - Special commands (/plan, /create, etc.)
 */
export class UnifiedAIManager {
    constructor(editor, fileManager, projectContextManager = null) {
        console.log('🤖 UnifiedAIManager: Initializing unified AI assistant...');
        
        this.editor = editor;
        this.fileManager = fileManager;
        this.projectContextManager = projectContextManager;
        
        // Dependencies (set externally)
        this.responseParser = null;  // Will be set by app.js
        this.actionExecutor = null;  // Will be set by app.js
        this.commandParser = null;   // Will be set by app.js (Phase 2)
        
        // Chat UI elements
        this.chatMessages = document.getElementById('chat-messages');
        
        // Conversation history
        this.messages = [];
        
        // File context system
        this.selectedFileIds = new Set();
        this.maxContextSize = 100 * 1024; // 100KB max
        this.warningThreshold = 50 * 1024; // 50KB warning
        
        // Project context
        this.includeProjectContext = false;
        
        // API configuration
        this.apiKey = localStorage.getItem('openrouter_api_key') || '';
        this.platformKey = ''; // Set from environment/config
        
        // Free models (use platform key)
        this.freeModels = [
            'deepseek/deepseek-r1-0528:free',
            'deepseek/deepseek-chat-v3-0324:free',
            'google/gemma-3-27b-it:free'
        ];
        
        // Load chat history
        this.loadChatHistory();
        
        // Initialize file context UI
        this.initializeFileContextSelector();
        this.initializeFileContextToggle();
        
        // Initialize project context toggle
        this.initializeProjectContextToggle();
        
        // Expose globally for debugging
        window.unifiedAI = this;
        window.clearAIChat = () => this.clearChat();
        
        console.log('✅ UnifiedAIManager: Ready');
    }
    
    /**
     * Main entry point - handles all user messages
     * Routes to command handler or general AI handler
     */
    async handleMessage(userMessage) {
        if (!userMessage || !userMessage.trim()) {
            return;
        }
        
        try {
            // Add user message to chat
            this.addMessage('user', userMessage);
            
            // Check for special commands (Phase 2)
            if (userMessage.startsWith('/') && this.commandParser) {
                return await this.handleCommand(userMessage);
            }
            
            // Show loading indicator
            this.showLoadingIndicator();
            
            // Build full context
            const context = this.buildContext();
            
            // Call AI with unified prompt
            const aiResponse = await this.callAI(userMessage, context);
            
            // Parse response for actions
            if (this.responseParser) {
                const { conversation, actions } = this.responseParser.parse(aiResponse);
                
                // Display conversational part
                if (conversation && conversation.trim()) {
                    this.addMessage('assistant', conversation);
                }
                
                // Execute actions (edits, creates, terminal, etc.)
                if (actions && actions.length > 0 && this.actionExecutor) {
                    await this.actionExecutor.executeActions(actions);
                }
            } else {
                // Fallback if parser not ready yet
                this.addMessage('assistant', aiResponse);
            }
            
            // Save chat history
            this.saveChatHistory();
            
        } catch (error) {
            console.error('UnifiedAI Error:', error);
            this.addMessage('system', `Error: ${error.message}. Please try again.`);
        } finally {
            this.hideLoadingIndicator();
        }
    }
    
    /**
     * Handle special commands (Phase 2)
     */
    async handleCommand(message) {
        if (!this.commandParser) {
            this.addMessage('system', 'Commands not yet available. Coming soon!');
            return;
        }
        
        const parsed = this.commandParser.parse(message);
        
        if (parsed.error) {
            this.addMessage('system', parsed.error);
            return;
        }
        
        this.addMessage('system', `Executing: /${parsed.command}...`);
        
        // Build context with command-specific prompt
        const context = this.buildContext();
        context.commandPrompt = parsed.systemPrompt;
        
        // Call AI
        const aiResponse = await this.callAI(parsed.description || '', context);
        
        // Parse and execute
        const { conversation, actions } = this.responseParser.parse(aiResponse);
        
        if (conversation) {
            this.addMessage('assistant', conversation);
        }
        
        if (actions && actions.length > 0) {
            await this.actionExecutor.executeActions(actions);
        }
        
        this.saveChatHistory();
    }
    
    /**
     * Build complete context for AI
     */
    buildContext() {
        const context = {
            // Current file
            currentFile: this.getCurrentFileContext(),
            
            // All project files (names only)
            allFiles: this.fileManager.files.map(f => ({
                name: f.name,
                type: f.type,
                size: f.content.length
            })),
            
            // Selected files (full content)
            selectedFiles: this.getSelectedFilesContext(),
            
            // Project structure
            projectStructure: this.includeProjectContext && this.projectContextManager 
                ? this.projectContextManager.getProjectSummary()
                : null,
            
            // Recent conversation
            recentMessages: this.messages.slice(-10),
            
            // Editor state
            cursorPosition: this.editor ? {
                line: this.editor.getCursor().line,
                ch: this.editor.getCursor().ch
            } : null
        };
        
        return context;
    }
    
    /**
     * Get current file context
     */
    getCurrentFileContext() {
        const currentFile = this.fileManager.getCurrentFile();
        
        if (!currentFile) {
            return null;
        }
        
        return {
            name: currentFile.name,
            type: currentFile.type,
            content: currentFile.content,
            size: currentFile.content.length,
            language: this.getLanguageFromType(currentFile.type)
        };
    }
    
    /**
     * Get selected files context
     */
    getSelectedFilesContext() {
        const selectedFiles = [];
        
        for (const fileId of this.selectedFileIds) {
            const file = this.fileManager.files.find(f => f.id === fileId);
            if (file) {
                selectedFiles.push({
                    name: file.name,
                    type: file.type,
                    content: file.content,
                    size: file.content.length
                });
            }
        }
        
        return selectedFiles;
    }
    
    /**
     * Build system prompt for unified AI
     */
    buildSystemPrompt(context) {
        let prompt = `You are an advanced AI coding assistant integrated into a code editor.

CAPABILITIES:
- Have natural conversations about code and projects
- Edit existing files directly
- Create new files
- Suggest project plans
- Explain code and concepts

RESPONSE FORMATS:
You can respond in multiple ways:

1. CONVERSATIONAL: Natural language explanation (always include this)

2. FILE_EDIT: To edit an existing file
   Format: FILE_EDIT: filename.ext
           [complete new file content]
           END_FILE_EDIT

3. CREATE_FILE: To create a new file
   Format: CREATE_FILE: filename.ext
           [file content]
           END_CREATE_FILE

4. PLAN: To create a project plan
   Format: PLAN:
           - [ ] Task 1
           - [ ] Task 2
           END_PLAN

GUIDELINES:
- Be concise and actionable
- Edit files directly when user requests changes
- Always explain what you're doing and why
- Suggest next steps after completing actions
- Maintain code quality and best practices

CURRENT CONTEXT:`;

        // Add current file info
        if (context.currentFile) {
            prompt += `\n- Current file: ${context.currentFile.name} (${context.currentFile.type})`;
            prompt += `\n- File size: ${context.currentFile.size} characters`;
        }
        
        // Add project files
        if (context.allFiles && context.allFiles.length > 0) {
            prompt += `\n- Project files (${context.allFiles.length}): ${context.allFiles.map(f => f.name).join(', ')}`;
        }
        
        // Add selected files for context
        if (context.selectedFiles && context.selectedFiles.length > 0) {
            prompt += `\n- Files attached for context: ${context.selectedFiles.map(f => f.name).join(', ')}`;
        }
        
        // Add project structure
        if (context.projectStructure) {
            prompt += `\n- Project type: ${context.projectStructure.type || 'Unknown'}`;
            if (context.projectStructure.framework) {
                prompt += `\n- Framework: ${context.projectStructure.framework}`;
            }
        }
        
        // Add command-specific prompt if present
        if (context.commandPrompt) {
            prompt += `\n\nSPECIAL INSTRUCTION:\n${context.commandPrompt}`;
        }
        
        return prompt;
    }
    
    /**
     * Call AI API with unified prompt
     */
    async callAI(userMessage, context) {
        const systemPrompt = this.buildSystemPrompt(context);
        const selectedModel = this.getSelectedModel();
        
        // Determine which API endpoint to use
        const isFreeModel = this.freeModels.includes(selectedModel);
        const endpoint = isFreeModel ? '/api/ai/free' : '/api/ai/premium';
        
        console.log(`[UnifiedAI] Calling ${endpoint} with model: ${selectedModel}`);
        
        // Build messages array
        const messages = [
            { role: 'system', content: systemPrompt }
        ];
        
        // Add recent conversation history
        const recentMessages = this.messages.slice(-10);
        messages.push(...recentMessages.map(m => ({
            role: m.role,
            content: m.content
        })));
        
        // Add current user message
        messages.push({
            role: 'user',
            content: userMessage
        });
        
        // Add selected files content to context
        if (context.selectedFiles && context.selectedFiles.length > 0) {
            let filesContext = '\n\n=== ATTACHED FILES FOR CONTEXT ===\n';
            for (const file of context.selectedFiles) {
                filesContext += `\n--- ${file.name} ---\n${file.content}\n`;
            }
            messages[messages.length - 1].content += filesContext;
        }
        
        // Add current file content if available
        if (context.currentFile && !context.selectedFiles.some(f => f.name === context.currentFile.name)) {
            messages[messages.length - 1].content += `\n\n=== CURRENT FILE: ${context.currentFile.name} ===\n${context.currentFile.content}`;
        }
        
        // Make API call
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(isFreeModel ? {} : { 'X-API-Key': this.apiKey })
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4000
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }
        
        const data = await response.json();
        
        // Extract response text
        const aiResponse = data.choices?.[0]?.message?.content || data.content || '';
        
        console.log('[UnifiedAI] Response received:', aiResponse.substring(0, 200) + '...');
        
        return aiResponse;
    }
    
    /**
     * Get selected AI model
     */
    getSelectedModel() {
        const modelSelect = document.getElementById('chat-ai-model');
        return modelSelect ? modelSelect.value : 'deepseek/deepseek-chat-v3-0324:free';
    }
    
    /**
     * Add message to chat history
     */
    addMessage(role, content) {
        const message = {
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }
    
    /**
     * Render a single message
     */
    renderMessage(message) {
        if (!this.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${message.role}-message`;
        
        // Add icon based on role
        let icon = '';
        if (message.role === 'user') {
            icon = '<span class="message-icon">👤</span>';
        } else if (message.role === 'assistant') {
            icon = '<span class="message-icon">🤖</span>';
        } else if (message.role === 'system') {
            icon = '<span class="message-icon">ℹ️</span>';
        }
        
        // Format content with markdown
        const formattedContent = this.formatMessageContent(message.content);
        
        messageDiv.innerHTML = `
            ${icon}
            <div class="message-content">
                ${formattedContent}
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
    }
    
    /**
     * Format message content with basic markdown
     */
    formatMessageContent(content) {
        // Simple markdown formatting
        let formatted = content;
        
        // Code blocks
        formatted = formatted.replace(/```(\w+)?\n([\s\S]+?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
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
     * Show loading indicator
     */
    showLoadingIndicator() {
        if (!this.chatMessages) return;
        
        const loader = document.createElement('div');
        loader.className = 'chat-message loading-message';
        loader.id = 'ai-loading';
        loader.innerHTML = `
            <span class="message-icon">🤖</span>
            <div class="message-content">
                <span class="loading-dots">Thinking</span>
            </div>
        `;
        
        this.chatMessages.appendChild(loader);
        this.scrollToBottom();
    }
    
    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        const loader = document.getElementById('ai-loading');
        if (loader) {
            loader.remove();
        }
    }
    
    /**
     * Load chat history from localStorage
     */
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('unified_ai_history');
            if (saved) {
                this.messages = JSON.parse(saved);
                this.renderChatHistory();
                console.log('[UnifiedAI] Loaded', this.messages.length, 'messages from history');
            }
        } catch (error) {
            console.error('[UnifiedAI] Error loading chat history:', error);
            this.messages = [];
        }
    }
    
    /**
     * Save chat history to localStorage
     */
    saveChatHistory() {
        try {
            localStorage.setItem('unified_ai_history', JSON.stringify(this.messages));
        } catch (error) {
            console.error('[UnifiedAI] Error saving chat history:', error);
        }
    }
    
    /**
     * Render all chat history
     */
    renderChatHistory() {
        if (!this.chatMessages) return;
        
        this.chatMessages.innerHTML = '';
        this.messages.forEach(message => this.renderMessage(message));
        this.scrollToBottom();
    }
    
    /**
     * Clear chat history
     */
    clearChat() {
        this.messages = [];
        this.saveChatHistory();
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
        console.log('[UnifiedAI] Chat cleared');
    }
    
    /**
     * Initialize file context selector UI
     */
    initializeFileContextSelector() {
        // File context selector (reuse existing implementation)
        this.fileManager.onFilesChanged = () => {
            this.updateFileList();
        };
        
        this.updateFileList();
    }
    
    /**
     * Initialize file context toggle button
     */
    initializeFileContextToggle() {
        const toggleBtn = document.getElementById('chat-file-context-toggle-btn');
        const selector = document.getElementById('chat-file-context-selector');
        
        if (!toggleBtn || !selector) {
            console.warn('[UnifiedAI] File context toggle elements not found');
            return;
        }
        
        toggleBtn.addEventListener('click', () => {
            if (selector.style.display === 'none' || !selector.style.display) {
                selector.style.display = 'block';
                this.updateFileList();
            } else {
                selector.style.display = 'none';
            }
        });
        
        console.log('✅ [UnifiedAI] File context toggle initialized');
    }
    
    /**
     * Update file list in context selector
     */
    updateFileList() {
        const fileListContainer = document.getElementById('chat-file-context-list');
        if (!fileListContainer) return;
        
        fileListContainer.innerHTML = '';
        
        if (this.fileManager.files.length === 0) {
            fileListContainer.innerHTML = '<div class="no-files">No files in project</div>';
            return;
        }
        
        this.fileManager.files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-context-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `file-ctx-${file.id}`;
            checkbox.checked = this.selectedFileIds.has(file.id);
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedFileIds.add(file.id);
                } else {
                    this.selectedFileIds.delete(file.id);
                }
                this.updateContextSize();
            });
            
            const label = document.createElement('label');
            label.htmlFor = `file-ctx-${file.id}`;
            label.textContent = file.name;
            
            const size = document.createElement('span');
            size.className = 'file-size';
            size.textContent = this.formatBytes(file.content.length);
            
            fileItem.appendChild(checkbox);
            fileItem.appendChild(label);
            fileItem.appendChild(size);
            
            fileListContainer.appendChild(fileItem);
        });
        
        this.updateContextSize();
    }
    
    /**
     * Update context size display
     */
    updateContextSize() {
        let totalSize = 0;
        
        for (const fileId of this.selectedFileIds) {
            const file = this.fileManager.files.find(f => f.id === fileId);
            if (file) {
                totalSize += file.content.length;
            }
        }
        
        // Update file count badge
        const countBadge = document.getElementById('chat-file-context-count');
        if (countBadge) {
            countBadge.textContent = this.selectedFileIds.size;
        }
        
        const sizeDisplay = document.getElementById('chat-context-size-value');
        if (sizeDisplay) {
            sizeDisplay.textContent = this.formatBytes(totalSize);
            
            if (totalSize > this.maxContextSize) {
                sizeDisplay.classList.add('error');
            } else if (totalSize > this.warningThreshold) {
                sizeDisplay.classList.add('warning');
            } else {
                sizeDisplay.classList.remove('error', 'warning');
            }
        }
    }
    
    /**
     * Initialize project context toggle
     */
    initializeProjectContextToggle() {
        const toggle = document.getElementById('project-context-toggle-btn');
        if (toggle) {
            toggle.classList.toggle('active', this.includeProjectContext);
            toggle.addEventListener('click', () => {
                this.includeProjectContext = !this.includeProjectContext;
                toggle.classList.toggle('active', this.includeProjectContext);
                console.log('[UnifiedAI] Project context:', this.includeProjectContext ? 'enabled' : 'disabled');
            });
        } else {
            console.warn('[UnifiedAI] Project context toggle button not found');
        }
    }
    
    /**
     * Utility: Format bytes
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    /**
     * Utility: Get language from file type
     */
    getLanguageFromType(type) {
        const languageMap = {
            'javascript': 'javascript',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'markdown': 'markdown',
            'python': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'php': 'php',
            'ruby': 'ruby',
            'go': 'go',
            'rust': 'rust',
            'typescript': 'typescript'
        };
        
        return languageMap[type] || 'text';
    }
}
