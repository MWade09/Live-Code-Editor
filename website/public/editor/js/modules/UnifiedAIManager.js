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
 * - STREAMING RESPONSES for real-time token display
 * - SEMANTIC CONTEXT - Auto-retrieves relevant files via embeddings
 * - INTELLIGENT ROUTING - ModelRouter for optimal model selection (Phase 5)
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
        this.embeddingsManager = null; // Will be set by app.js (Phase 2)
        this.modelRouter = null;     // Will be set by app.js (Phase 5)
        this.memoryManager = null;   // Will be set by app.js (Phase 6)
        
        // Chat UI elements
        this.chatMessages = document.getElementById('chat-messages');
        
        // Conversation history
        this.messages = [];
        
        // File context system
        this.selectedFileIds = new Set();
        this.maxContextSize = 100 * 1024; // 100KB max
        this.warningThreshold = 50 * 1024; // 50KB warning
        
        // Auto-context settings
        this.autoContextEnabled = true; // Enable automatic semantic context
        this.maxAutoContextFiles = 5;
        this.autoContextThreshold = 0.4; // Minimum similarity score
        
        // Project context
        this.includeProjectContext = false;
        
        // Streaming configuration
        this.useStreaming = true; // Enable streaming by default
        this.currentStreamController = null; // For cancelling streams
        
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
        
        console.log('✅ UnifiedAIManager: Ready (streaming:', this.useStreaming, ')');
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
            
            // Build full context (includes auto-context from embeddings)
            const context = await this.buildContextWithSemanticSearch(userMessage);
            
            // Call AI with streaming or non-streaming based on setting
            if (this.useStreaming) {
                await this.callAIStreaming(userMessage, context);
            } else {
                // Show loading indicator for non-streaming
                this.showLoadingIndicator();
                const aiResponse = await this.callAI(userMessage, context);
                this.hideLoadingIndicator();
                
                // Parse response for actions
                if (this.responseParser) {
                    const { conversation, actions } = this.responseParser.parse(aiResponse);
                    
                    if (conversation && conversation.trim()) {
                        this.addMessage('assistant', conversation);
                        
                        // Track AI response in memory
                        if (this.memoryManager) {
                            this.memoryManager.trackMessage({
                                role: 'assistant',
                                content: conversation
                            });
                        }
                    }
                    
                    if (actions && actions.length > 0 && this.actionExecutor) {
                        await this.actionExecutor.executeActions(actions);
                    }
                } else {
                    this.addMessage('assistant', aiResponse);
                    
                    // Track AI response in memory
                    if (this.memoryManager) {
                        this.memoryManager.trackMessage({
                            role: 'assistant',
                            content: aiResponse
                        });
                    }
                }
            }
            
            // Save chat history
            this.saveChatHistory();
            
        } catch (error) {
            console.error('UnifiedAI Error:', error);
            this.hideLoadingIndicator();
            this.addMessage('system', `Error: ${error.message}. Please try again.`);
        }
    }
    
    /**
     * Build context with semantic search for auto-context
     */
    async buildContextWithSemanticSearch(userMessage) {
        // Start with basic context
        const context = this.buildContext();
        
        // Add memory context first (Phase 6)
        if (this.memoryManager) {
            try {
                const memoryContext = await this.memoryManager.buildMemoryContext(userMessage);
                if (memoryContext) {
                    context.push({
                        type: 'memory',
                        content: memoryContext
                    });
                }
                
                // Track message for potential summarization
                this.memoryManager.trackMessage({
                    role: 'user',
                    content: userMessage
                });
            } catch (error) {
                console.warn('[UnifiedAI] Memory context failed:', error);
            }
        }
        
        // Add auto-context from embeddings if available and enabled
        if (this.autoContextEnabled && this.embeddingsManager) {
            try {
                const suggested = await this.embeddingsManager.getSuggestedContext(userMessage, {
                    maxFiles: this.maxAutoContextFiles,
                    maxTotalSize: 50000 // 50KB max for auto-context
                });
                
                if (suggested.files && suggested.files.length > 0) {
                    // Merge with manually selected files (avoid duplicates)
                    const existingNames = new Set(context.selectedFiles.map(f => f.name));
                    
                    for (const file of suggested.files) {
                        if (!existingNames.has(file.name)) {
                            context.selectedFiles.push({
                                name: file.name,
                                content: file.content,
                                type: this.getFileType(file.name),
                                size: file.content.length,
                                autoContext: true, // Mark as auto-added
                                score: file.score
                            });
                            existingNames.add(file.name);
                        }
                    }
                    
                    // Store for UI display
                    context.autoContextFiles = suggested.files.map(f => ({
                        name: f.name,
                        score: f.score,
                        isPartial: f.isPartial
                    }));
                    
                    console.log(`[UnifiedAI] Auto-context: Added ${suggested.files.length} relevant files`);
                }
            } catch (error) {
                console.warn('[UnifiedAI] Auto-context error:', error);
                // Continue without auto-context
            }
        }
        
        return context;
    }
    
    /**
     * Get file type from filename
     */
    getFileType(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        const typeMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust'
        };
        return typeMap[ext] || 'text';
    }
    
    /**
     * Call AI with streaming response
     */
    async callAIStreaming(userMessage, context) {
        const startTime = Date.now();
        
        // Use ModelRouter for intelligent model selection if available
        let selectedModel;
        let routingResult = null;
        
        if (this.modelRouter) {
            routingResult = await this.modelRouter.route(userMessage, {
                totalSize: this.modelRouter.calculateContextSize(context),
                fileCount: context.selectedFiles?.length || 0,
                userHasApiKey: !!this.apiKey
            });
            selectedModel = routingResult.model.id;
            
            // Show routing indicator
            this.showRoutingIndicator(routingResult);
            
            // Compress context if needed
            const maxTokens = routingResult.model.maxTokens || 4000;
            context = this.modelRouter.compressContext(context, maxTokens);
        } else {
            selectedModel = this.getSelectedModel();
        }
        
        const systemPrompt = this.buildSystemPrompt(context);
        
        // Determine which API endpoint to use
        const isFreeModel = this.freeModels.includes(selectedModel) || 
            (routingResult?.model?.free === true);
        const endpoint = isFreeModel ? '/api/ai/free' : '/api/ai/premium';
        
        console.log(`[UnifiedAI] Streaming from ${endpoint} with model: ${selectedModel}`);
        if (routingResult) {
            console.log(`[UnifiedAI] Intent: ${routingResult.intent}, Complexity: ${routingResult.complexity.level}, Tier: ${routingResult.tier}`);
        }
        
        // Show auto-context indicator if files were auto-added
        if (context.autoContextFiles && context.autoContextFiles.length > 0) {
            this.showAutoContextIndicator(context.autoContextFiles);
        }
        
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
        
        // Add current user message with file context
        let userContent = userMessage;
        
        if (context.selectedFiles && context.selectedFiles.length > 0) {
            userContent += '\n\n=== ATTACHED FILES FOR CONTEXT ===\n';
            for (const file of context.selectedFiles) {
                userContent += `\n--- ${file.name} ---\n${file.content}\n`;
            }
        }
        
        if (context.currentFile && !context.selectedFiles.some(f => f.name === context.currentFile.name)) {
            userContent += `\n\n=== CURRENT FILE: ${context.currentFile.name} ===\n${context.currentFile.content}`;
        }
        
        messages.push({ role: 'user', content: userContent });
        
        // Create abort controller for cancellation
        this.currentStreamController = new AbortController();
        
        // Create streaming message element
        const streamingMessage = this.createStreamingMessage();
        let fullResponse = '';
        
        try {
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
                    max_tokens: 4000,
                    stream: true,
                    apiKey: isFreeModel ? undefined : this.apiKey
                }),
                signal: this.currentStreamController.signal
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`API Error: ${response.status} - ${error}`);
            }
            
            // Process the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }
                
                // Decode the chunk
                const chunk = decoder.decode(value, { stream: true });
                
                // Parse SSE events
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            continue;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            
                            if (content) {
                                fullResponse += content;
                                this.updateStreamingMessage(streamingMessage, fullResponse);
                            }
                        } catch (e) {
                            void e; // Ignore JSON parse errors for incomplete chunks
                        }
                    }
                }
            }
            
            // Finalize the streaming message
            this.finalizeStreamingMessage(streamingMessage, fullResponse);
            
            // Record success metrics
            if (this.modelRouter && selectedModel) {
                const latency = Date.now() - startTime;
                const inputTokens = this.modelRouter.countTokens(userContent);
                const outputTokens = this.modelRouter.countTokens(fullResponse);
                this.modelRouter.recordSuccess(selectedModel, latency, inputTokens, outputTokens);
            }
            
            // Parse for actions after stream completes
            if (this.responseParser && fullResponse) {
                const { conversation, actions } = this.responseParser.parse(fullResponse);
                
                // Update the message with cleaned conversation (remove action markers)
                if (conversation && conversation !== fullResponse) {
                    this.updateStreamingMessageFinal(streamingMessage, conversation);
                }
                
                // Execute actions
                if (actions && actions.length > 0 && this.actionExecutor) {
                    await this.actionExecutor.executeActions(actions);
                }
            }
            
            // Store in history
            this.messages.push({
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[UnifiedAI] Stream cancelled by user');
                this.finalizeStreamingMessage(streamingMessage, fullResponse + '\n\n[Stream cancelled]');
            } else {
                // Record failure metrics
                if (this.modelRouter && selectedModel) {
                    this.modelRouter.recordFailure(selectedModel, error);
                }
                throw error;
            }
        } finally {
            this.currentStreamController = null;
        }
    }
    
    /**
     * Show routing indicator in chat
     */
    showRoutingIndicator(routingResult) {
        if (!this.chatMessages) return;
        
        // Remove any existing indicator
        const existing = this.chatMessages.querySelector('.routing-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.className = 'routing-indicator';
        
        const tierEmoji = {
            'fast': '⚡',
            'standard': '🔧',
            'powerful': '🚀'
        };
        
        indicator.innerHTML = `
            <span class="routing-tier">${tierEmoji[routingResult.tier] || '🤖'}</span>
            <span class="routing-model">${routingResult.model.name || routingResult.model.id.split('/').pop()}</span>
            <span class="routing-intent">${routingResult.intent.replace(/_/g, ' ')}</span>
        `;
        
        this.chatMessages.appendChild(indicator);
        
        // Auto-remove after a few seconds
        setTimeout(() => {
            indicator.classList.add('fade-out');
            setTimeout(() => indicator.remove(), 300);
        }, 3000);
    }
    
    /**
     * Create a streaming message element in the chat
     */
    createStreamingMessage() {
        if (!this.chatMessages) return null;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message assistant-message streaming';
        messageDiv.innerHTML = `
            <span class="message-icon">🤖</span>
            <div class="message-content">
                <span class="streaming-cursor">▊</span>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    /**
     * Show auto-context indicator for semantically retrieved files
     */
    showAutoContextIndicator(autoContextFiles) {
        if (!this.chatMessages || !autoContextFiles || autoContextFiles.length === 0) return;
        
        // Remove any existing indicator
        const existing = this.chatMessages.querySelector('.auto-context-indicator');
        if (existing) {
            existing.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.className = 'auto-context-indicator';
        
        const fileTags = autoContextFiles.map(f => {
            const scorePercent = Math.round(f.score * 100);
            const partialClass = f.isPartial ? ' partial' : '';
            return `<span class="auto-context-file-tag${partialClass}">
                ${f.name}
                <span class="score">${scorePercent}%</span>
            </span>`;
        }).join('');
        
        indicator.innerHTML = `
            <span class="context-icon">🧠</span>
            <span class="context-label">Auto-context:</span>
            <div class="context-files">${fileTags}</div>
            <button class="auto-context-toggle-btn ${this.autoContextEnabled ? 'active' : ''}" 
                    title="Toggle auto-context">
                ${this.autoContextEnabled ? 'ON' : 'OFF'}
            </button>
        `;
        
        // Add toggle functionality
        const toggleBtn = indicator.querySelector('.auto-context-toggle-btn');
        toggleBtn.addEventListener('click', () => {
            this.autoContextEnabled = !this.autoContextEnabled;
            toggleBtn.classList.toggle('active', this.autoContextEnabled);
            toggleBtn.textContent = this.autoContextEnabled ? 'ON' : 'OFF';
            console.log('[UnifiedAI] Auto-context:', this.autoContextEnabled ? 'enabled' : 'disabled');
        });
        
        this.chatMessages.appendChild(indicator);
        this.scrollToBottom();
    }
    
    /**
     * Show embeddings generation progress
     */
    showEmbeddingsProgress(progress) {
        if (!this.chatMessages) return;
        
        let progressEl = this.chatMessages.querySelector('.embeddings-progress');
        
        if (!progressEl) {
            progressEl = document.createElement('div');
            progressEl.className = 'embeddings-progress';
            progressEl.innerHTML = `
                <span class="progress-icon">🧠</span>
                <div class="embeddings-progress-bar">
                    <div class="embeddings-progress-fill"></div>
                </div>
                <span class="embeddings-progress-text"></span>
            `;
            this.chatMessages.appendChild(progressEl);
        }
        
        const fill = progressEl.querySelector('.embeddings-progress-fill');
        const text = progressEl.querySelector('.embeddings-progress-text');
        const percent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
        
        fill.style.width = `${percent}%`;
        text.textContent = `Indexing files... ${progress.current}/${progress.total}`;
        
        // Remove when complete
        if (progress.current >= progress.total) {
            setTimeout(() => {
                progressEl.remove();
            }, 1500);
        }
    }
    
    /**
     * Update streaming message with new content
     */
    updateStreamingMessage(messageDiv, content) {
        if (!messageDiv) return;
        
        const contentDiv = messageDiv.querySelector('.message-content');
        if (contentDiv) {
            const formattedContent = this.formatMessageContent(content);
            contentDiv.innerHTML = formattedContent + '<span class="streaming-cursor">▊</span>';
            this.scrollToBottom();
        }
    }
    
    /**
     * Finalize streaming message (remove cursor)
     */
    finalizeStreamingMessage(messageDiv, content) {
        if (!messageDiv) return;
        
        messageDiv.classList.remove('streaming');
        const contentDiv = messageDiv.querySelector('.message-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.formatMessageContent(content);
        }
    }
    
    /**
     * Update streaming message with final cleaned content
     */
    updateStreamingMessageFinal(messageDiv, content) {
        if (!messageDiv) return;
        
        const contentDiv = messageDiv.querySelector('.message-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.formatMessageContent(content);
        }
    }
    
    /**
     * Cancel current streaming response
     */
    cancelStream() {
        if (this.currentStreamController) {
            this.currentStreamController.abort();
            console.log('[UnifiedAI] Stream cancellation requested');
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
            const manualFiles = context.selectedFiles.filter(f => !f.autoContext);
            const autoFiles = context.selectedFiles.filter(f => f.autoContext);
            
            if (manualFiles.length > 0) {
                prompt += `\n- Files attached by user: ${manualFiles.map(f => f.name).join(', ')}`;
            }
            
            if (autoFiles.length > 0) {
                prompt += `\n- Files auto-included by semantic relevance: ${autoFiles.map(f => `${f.name} (${Math.round(f.score * 100)}% match)`).join(', ')}`;
            }
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
        this.renderChatHistory();
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
        
        // Preserve the welcome message if there are no messages
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        
        this.chatMessages.innerHTML = '';
        
        // Restore welcome message if no chat history
        if (this.messages.length === 0 && welcomeMessage) {
            this.chatMessages.appendChild(welcomeMessage);
        } else {
            // Render all messages
            this.messages.forEach(message => this.renderMessage(message));
        }
        
        this.scrollToBottom();
    }
    
    /**
     * Clear chat history
     */
    clearChat() {
        this.messages = [];
        this.saveChatHistory();
        // Use renderChatHistory to restore welcome message
        this.renderChatHistory();
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
