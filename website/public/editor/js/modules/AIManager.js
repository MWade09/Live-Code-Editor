/**
 * AIManager class - Handles AI assistant functionality
 * New model: Free models use platform key, paid models require user key
 */
export class AIManager {
    constructor(editor, fileManager, projectContextManager = null) {
        console.log('🤖 AIManager: Initializing...');
        this.editor = editor;
        this.fileManager = fileManager;
        this.projectContextManager = projectContextManager;
        this.multiFileEditManager = null; // Will be set externally after initialization
        this.fileCreationManager = null; // Will be set externally after initialization
        this.aiModal = document.getElementById('aiModal');
        this.aiStatus = document.getElementById('ai-status');
        
        // Use the correct chat container - try chat-messages first (current panel), then fallback to chat-history (old modal)
        this.chatHistory = document.getElementById('chat-messages') || document.getElementById('chat-history');
        
        console.log('💬 AIManager: Chat container found:', this.chatHistory ? this.chatHistory.id : 'none');
        
        // Initialize chat messages array
        this.messages = [];
        
        // File context system
        this.selectedFileIds = new Set(); // Track selected files for context
        this.maxContextSize = 100 * 1024; // 100KB max context size
        this.warningThreshold = 50 * 1024; // 50KB warning threshold
        
        // Project context system
        this.includeProjectContext = false; // Toggle for project structure context
        
        // Load chat history from local storage if available
        this.loadChatHistory();
        
        // Load API key from local storage if available
        this.apiKey = localStorage.getItem('openrouter_api_key') || '';
        const apiKeyElement = document.getElementById('ai-api-key');
        if (this.apiKey && apiKeyElement) {
            apiKeyElement.value = this.apiKey;
        }
        
        // Platform's OpenRouter key for free models (keep secure in production!)
        this.platformKey = 'sk-or-v1-your-platform-key-here'; // TODO: Move to environment variable
        
        // Define which models are free (use platform key) vs paid (require user key)
        this.freeModels = [
            'mistralai/devstral-2512:free',
            'kwaipilot/kat-coder-pro:free',
            'z-ai/glm-4.5-air:free',
            'openai/gpt-oss-120b:free'
        ];
        
        // Expose clearCorruptedData to global scope for debugging
        window.clearAIChat = () => this.clearCorruptedData();
        
        // Expose aiManager instance globally for code insertion from messages
        window.aiManager = this;
        
        // Set up file change listener to refresh file context list
        this.fileManager.onFilesChanged = () => {
            this.updateFileList();
        };
        
        // Initialize file context selector
        this.initializeFileContextSelector();
        
        // Initialize project context toggle
        this.initializeProjectContextToggle();
        
        // Add event listener for Send button and Enter key
        const sendButton = document.getElementById('send-message-btn');
        const aiPrompt = document.getElementById('ai-prompt');
        
        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        if (aiPrompt) {
            aiPrompt.addEventListener('keydown', (e) => {
                // Send on Enter (not Shift+Enter for new line)
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        // Add clear chat button
        const aiModalTitle = this.aiModal.querySelector('h3');
        if (aiModalTitle) {
            const clearButton = document.createElement('button');
            clearButton.className = 'clear-chat-btn';
            clearButton.textContent = 'Clear Chat';
            clearButton.addEventListener('click', () => this.clearChat());
            aiModalTitle.appendChild(clearButton);
        }
        
        // Initialize insert at cursor functionality
        const insertCodeBtn = document.getElementById('insert-code-btn');
        if (insertCodeBtn) {
            insertCodeBtn.addEventListener('click', () => this.insertLastCodeAtCursor());
        }
    }
    
    showAIModal() {
        this.aiModal.style.display = 'flex';
        setTimeout(() => {
            this.aiModal.classList.add('show');
        }, 10);
        // Focus the prompt input
        setTimeout(() => {
            document.getElementById('ai-prompt').focus();
        }, 300);
    }
    
    hideAIModal() {
        this.aiModal.classList.remove('show');
        setTimeout(() => {
            this.aiModal.style.display = 'none';
        }, 300);
    }
    
    updateStatus(message, status) {
        this.aiStatus.textContent = message;
        this.aiStatus.className = 'ai-status';
        
        if (status) {
            this.aiStatus.classList.add(status);
        }
    }      loadChatHistory() {
        try {
            const savedMessages = localStorage.getItem('ai_chat_history');
            if (savedMessages) {
                this.messages = JSON.parse(savedMessages);
                
                // Filter out any messages that might contain problematic content
                this.messages = this.messages.filter(message => {
                    if (typeof message.content !== 'string') return false;
                    // Remove messages that contain references to missing brand images
                    if (message.content.includes('brand1.png') || 
                        message.content.includes('brand2.png') || 
                        message.content.includes('brand3.png')) {
                        return false;
                    }
                    return true;
                });
                
                // Add backward compatibility for messages without codeBlock property
                this.messages = this.messages.map(message => {
                    if (!message.hasOwnProperty('codeBlock')) {
                        // For old messages, try to extract code if it's an AI message
                        if (message.role === 'assistant') {
                            const extractedCode = this.extractCodeFromResponse(message.content);
                            message.codeBlock = extractedCode;
                        } else {
                            message.codeBlock = null;
                        }
                    }
                    return message;
                });
                
                this.renderChatHistory();
            }
        } catch (err) {
            console.error('Error loading chat history:', err);
            this.messages = [];
            // Clear corrupted chat history
            localStorage.removeItem('ai_chat_history');
        }
    }
    
    saveChatHistory() {
        try {
            localStorage.setItem('ai_chat_history', JSON.stringify(this.messages));
        } catch (err) {
            console.error('Error saving chat history:', err);
        }
    }
    
    clearChat() {
        this.messages = [];
        this.saveChatHistory();
        this.chatHistory.innerHTML = '';
        console.log('Chat history cleared');
    }
    
    // Add method to clear potentially corrupted localStorage
    clearCorruptedData() {
        try {
            localStorage.removeItem('ai_chat_history');
            this.messages = [];
            this.chatHistory.innerHTML = '';
            console.log('Cleared potentially corrupted chat data');
        } catch (err) {
            console.error('Error clearing corrupted data:', err);
        }
    }
      addMessageToHistory(role, content, codeBlock = null) {
        const message = {
            role,
            content,
            codeBlock,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        this.saveChatHistory();
        this.renderMessage(message);
        
        // Scroll to the bottom
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
    
    // Add message to chat - supports both regular and code action messages
    addMessageToChat(messageData) {
        console.log('📨 AIManager.addMessageToChat called with:', {
            role: messageData.role,
            hasContent: !!messageData.content,
            hasMetadata: !!messageData.metadata,
            metadataType: messageData.metadata?.type
        });
        
        const message = {
            role: messageData.role || 'assistant',
            content: messageData.content,
            codeBlock: messageData.codeBlock || null,
            metadata: messageData.metadata || null,
            timestamp: new Date().toISOString()
        };
        
        console.log('💾 Saving message to history...');
        this.messages.push(message);
        this.saveChatHistory();
        
        console.log('🎨 Rendering message...');
        this.renderMessage(message);
        
        console.log('📜 Scrolling to bottom...');
        // Scroll to the bottom
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        
        console.log('✅ addMessageToChat completed');
    }
    
    renderChatHistory() {
        this.chatHistory.innerHTML = '';
        this.messages.forEach(message => {
            this.renderMessage(message);
        });
        
        // Scroll to the bottom
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }    renderMessage(message) {
        const messageEl = document.createElement('div');
        const isUserMessage = message.role === 'user';
        const isCodeAction = message.metadata && message.metadata.type === 'code-action';
        
        messageEl.className = `chat-message ${isUserMessage ? 'user-message' : 'ai-message'}${isCodeAction ? ' code-action' : ''}`;
        
        // Handle code action messages differently
        if (isCodeAction) {
            this.renderCodeActionMessage(messageEl, message);
            this.chatHistory.appendChild(messageEl);
            return;
        }
        
        // For AI messages with code blocks, remove code blocks from content before formatting
        let contentToFormat = message.content;
        if (!isUserMessage && message.codeBlock) {
            // Remove code blocks from the content since we'll show them separately
            contentToFormat = contentToFormat.replace(/```[\s\S]*?```/g, '').trim();
            
            // Also remove any remaining code fence markers
            contentToFormat = contentToFormat.replace(/^```.*$/gm, '').trim();
        }
        
        // Process content for markdown/code formatting
        let formattedContent = this.formatMessageContent(contentToFormat);
        
        // Add code preview container if there's a code block
        let codePreviewHTML = '';
        if (!isUserMessage && message.codeBlock) {
            const codeLines = message.codeBlock.split('\n');
            const previewLines = codeLines.slice(0, 8); // Show first 8 lines
            const hasMore = codeLines.length > 8;
            
            // Detect language (you can improve this detection)
            const language = this.detectCodeLanguage(message.codeBlock);
            
            // Apply syntax highlighting using Prism.js
            const highlightedPreview = this.highlightCode(previewLines.join('\n'), language);
            const highlightedFull = this.highlightCode(message.codeBlock, language);
            
            codePreviewHTML = `
                <div class="code-preview-container">
                    <div class="code-preview-header">
                        <span class="code-preview-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="16 18 22 12 16 6"></polyline>
                                <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                            Code Preview
                        </span>
                        <span class="language-badge">${language.toUpperCase()}</span>
                        ${hasMore ? `<span class="code-line-count">${codeLines.length} lines</span>` : ''}
                    </div>
                    <div class="code-preview-content ${hasMore ? 'expandable' : ''}">
                        <pre class="line-numbers"><code class="language-${language}">${highlightedPreview}</code></pre>
                        ${hasMore ? `
                            <div class="code-preview-expand" onclick="this.parentElement.classList.toggle('expanded')">
                                <span class="expand-text">Show ${codeLines.length - 8} more lines</span>
                                <span class="collapse-text">Show less</span>
                                <svg class="expand-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                            <div class="code-preview-full">
                                <pre class="line-numbers"><code class="language-${language}">${highlightedFull}</code></pre>
                            </div>
                        ` : ''}
                    </div>
                    <div class="code-preview-actions">
                        <button class="copy-code-btn" onclick="window.aiManager.copyCodeToClipboard('${message.timestamp}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy Code
                        </button>
                        <button class="insert-code-btn" onclick="window.aiManager.insertCodeFromMessage('${message.timestamp}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Insert Code
                        </button>
                    </div>
                </div>
            `;
        }
        
        messageEl.innerHTML = `
            ${formattedContent}
            ${codePreviewHTML}
            <div class="message-time">
                ${this.formatTimestamp(message.timestamp)}
            </div>
        `;
        
        this.chatHistory.appendChild(messageEl);
    }
      renderCodeActionMessage(messageEl, message) {
        console.log('🎭 Rendering code action message:', {
            actionType: message.metadata?.actionType,
            title: message.metadata?.title,
            hasContent: !!message.content
        });
        
        const metadata = message.metadata;
        const actionIcons = {
            explain: '💡',
            refactor: '🔧',
            tests: '🧪',
            fix: '🩹',
            documentation: '📝'
        };
        
        const icon = actionIcons[metadata.actionType] || '🤖';
        
        messageEl.innerHTML = `
            <div class="code-action-header">
                <span class="code-action-icon">${icon}</span>
                <span class="code-action-title">${metadata.title}</span>
            </div>
            
            <div class="code-action-original">
                <div class="code-action-original-title">
                    Original Code (lines ${metadata.lineNumbers.start}-${metadata.lineNumbers.end} in ${metadata.fileName})
                </div>
                <div class="code-action-original-code">${this.escapeHtml(metadata.originalCode)}</div>
            </div>
            
            <div class="code-action-content">
                ${this.formatMessageContent(message.content)}
            </div>
            
            <div class="message-time">
                ${this.formatTimestamp(message.timestamp)}
            </div>
        `;
        
        console.log('✅ Code action message HTML generated');
    }
    
    formatMessageContent(content) {
        // Escape HTML to prevent XSS and unwanted image loading
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        // First escape all HTML content
        let formatted = escapeHtml(content);
        
        // Then apply markdown-like formatting safely
        formatted = formatted
            // Handle code blocks with syntax highlighting
            .replace(/```(\w*)([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            // Handle inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Handle bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Handle italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Handle paragraphs
            .split('\n\n').join('</p><p>')
            // Handle line breaks
            .split('\n').join('<br>');
        
        // Wrap in paragraph if not already wrapped
        if (!formatted.startsWith('<p>')) {
            formatted = `<p>${formatted}</p>`;
        }
        
        return formatted;
    }
    
    formatTimestamp(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    }
    
    showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        typingIndicator.id = 'typing-indicator';
        this.chatHistory.appendChild(typingIndicator);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
    
    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    async sendMessage() {
        const promptInput = document.getElementById('ai-prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            return;
        }
        
        // Get API key
        const apiKey = document.getElementById('ai-api-key').value.trim();
        if (!apiKey) {
            this.updateStatus('Please enter your OpenRoute API key', 'error');
            return;
        }
        
        // Save API key for future use
        localStorage.setItem('openrouter_api_key', apiKey);
        this.apiKey = apiKey;
        
        // Add user message to chat
        this.addMessageToHistory('user', prompt);
        
        // Clear input field
        promptInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Update status
            this.updateStatus('Generating response...', 'loading');
            
            // Get the current file to include context
            const currentFile = this.fileManager.getCurrentFile();
            
            // Get the current model
            const model = document.getElementById('ai-model').value;
            
            // Build the system message with context
            let systemMessage = "You are an AI coding assistant. Help with creating, improving, and explaining code.";
            
            if (currentFile) {
                systemMessage += ` The user is currently editing a ${currentFile.type} file named "${currentFile.name}".`;
                
                // If the file has content, include a summary
                if (currentFile.content && currentFile.content.length > 0) {
                    systemMessage += ` Here's a summary of the current file: ${currentFile.content.slice(0, 200)}...`;
                }
            }
            
            // Build file context from selected files
            const fileContext = this.buildContextFromFiles();
            if (fileContext) {
                systemMessage += fileContext;
                console.log(`📁 Including ${this.selectedFileIds.size} file(s) in context`);
            }
            
            // Build project context if enabled
            const projectContext = this.buildProjectContext();
            if (projectContext) {
                systemMessage += projectContext;
                console.log('🗂️ Including project structure in context');
            }
            
            // Create messages array for the API
            const apiMessages = [
                { role: "system", content: systemMessage }
            ];
            
            // Add conversation history (limit to the last 10 messages to avoid token limits)
            const recentMessages = this.messages.slice(-10);
            recentMessages.forEach(msg => {
                apiMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            });
            
            // Call OpenRoute API
            const response = await this.callOpenRouteAPI(model, apiMessages);
            
            // Remove typing indicator
            this.removeTypingIndicator();            if (response && response.choices && response.choices.length > 0) {
                // Extract response content
                const aiResponse = response.choices[0].message.content;
                
                // Extract code block if present
                const extractedCode = this.extractCodeFromResponse(aiResponse);
                
                // Check for multi-file edit proposals
                if (this.multiFileEditManager) {
                    const edits = this.multiFileEditManager.parseEditProposals(aiResponse);
                    if (edits.length > 0) {
                        console.log(`📝 Found ${edits.length} file edit proposal(s) in AI response`);
                        this.multiFileEditManager.showDiffViewer(edits);
                    }
                }
                
                // Check for file creation proposals
                if (this.fileCreationManager) {
                    const creations = this.fileCreationManager.parseFileCreations(aiResponse);
                    if (creations.length > 0) {
                        console.log(`✨ Found ${creations.length} file creation proposal(s) in AI response`);
                        this.fileCreationManager.showCreationDialog(creations);
                    }
                }
                
                // Add AI message to chat with code block only if code was found
                this.addMessageToHistory('assistant', aiResponse, extractedCode);
                
                // Update status
                this.updateStatus('Response generated successfully', 'success');
                
                // Store the last code block for backward compatibility
                this.lastCodeBlock = extractedCode;
            } else {
                this.updateStatus('Failed to generate response: Invalid response from API', 'error');
            }
        } catch (error) {
            console.error('Error generating response:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
            this.removeTypingIndicator();
        }
    }
    
    async generateCode() {
        // Get values from form
        const apiKey = document.getElementById('ai-api-key').value.trim();
        const model = document.getElementById('ai-model').value;
        const prompt = document.getElementById('ai-prompt').value.trim();
        
        // Validate inputs
        if (!apiKey) {
            this.updateStatus('Please enter your OpenRoute API key', 'error');
            return;
        }
        
        if (!prompt) {
            this.updateStatus('Please enter a description of what you want to create', 'error');
            return;
        }
        
        // Save API key for future use
        localStorage.setItem('openrouter_api_key', apiKey);
        this.apiKey = apiKey;
        
        // Add user message to chat
        this.addMessageToHistory('user', prompt);
        
        // Clear input field
        document.getElementById('ai-prompt').value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Update status
            this.updateStatus('Generating code', 'loading');
            
            // Get the current file to determine what type of code to generate
            const currentFile = this.fileManager.getCurrentFile();
            let fileType = currentFile ? currentFile.type : 'html';
            
            // Prepare the prompt for the API
            const promptPrefix = this.getPromptPrefix(fileType);
            const fullPrompt = promptPrefix + prompt;
            
            // Create system message
            const systemMessage = {
                role: "system",
                content: `You are an AI coding assistant. Generate clean, efficient ${fileType} code based on the user's request. Return only the code with minimal explanation.`
            };
            
            // Create messages array for the API
            const apiMessages = [
                systemMessage,
                { role: "user", content: fullPrompt }
            ];
            
            // Call OpenRoute API
            const response = await this.callOpenRouteAPI(model, apiMessages);
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            if (response && response.choices && response.choices.length > 0) {
                // Extract code from response
                const aiResponse = response.choices[0].message.content;
                const generatedCode = this.extractCodeFromResponse(aiResponse, fileType);
                
                // Add AI message to chat
                this.addMessageToHistory('assistant', aiResponse);
                
                // Update the editor with the generated code
                this.editor.codeMirror.setValue(generatedCode);
                
                // Store the code for the "Insert at Cursor" button
                this.lastCodeBlock = generatedCode;
                
                // Update status
                this.updateStatus('Code generation complete!', 'success');
                
                // Close the modal after a short delay
                setTimeout(() => {
                    this.hideAIModal();
                }, 1500);
            } else {
                this.updateStatus('Failed to generate code: Invalid response from API', 'error');
            }
        } catch (error) {
            console.error('Error generating code:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
            this.removeTypingIndicator();
        }
    }
    
    insertLastCodeAtCursor() {
        if (!this.lastCodeBlock) {
            this.updateStatus('No code available to insert', 'error');
            return;
        }
        
        // Get current cursor position
        const cursor = this.editor.codeMirror.getCursor();
        
        // Insert the code at cursor position
        this.editor.codeMirror.replaceRange(this.lastCodeBlock, cursor);
        
        // Update status
        this.updateStatus('Code inserted at cursor position', 'success');
        
        // Close the modal
        this.hideAIModal();
        
        // Focus the editor
        setTimeout(() => {
            this.editor.focus();
        }, 100);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    insertCodeFromMessage(timestamp) {
        // Find the message with the matching timestamp
        const message = this.messages.find(msg => msg.timestamp === timestamp);
        if (message && message.codeBlock) {
            // Get current cursor position
            const cursor = this.editor.codeMirror.getCursor();
            
            // Insert the code at cursor position
            this.editor.codeMirror.replaceRange(message.codeBlock, cursor);
            
            // Update status
            this.updateStatus('Code inserted at cursor position', 'success');
            
            // Focus the editor
            setTimeout(() => {
                this.editor.codeMirror.focus();
            }, 100);
        } else {
            this.updateStatus('Code not found for this message', 'error');
        }
    }
    
    async callOpenRouteAPI(model, messages) {
        // Determine which endpoint to use based on model
        const isFreeModel = this.freeModels.includes(model);
        
        // Use same-origin API (editor is now served from same domain)
        const apiBase = '/api';
        
        if (isFreeModel) {
            // Use backend /api/ai/free endpoint for free models
            console.log('🆓 Using free tier endpoint for model:', model);
            
            const response = await fetch(`${apiBase}/ai/free`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later or use your own API key for premium models.');
                }
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Display remaining requests if available
            const remaining = response.headers.get('X-RateLimit-Remaining');
            if (remaining) {
                console.log(`ℹ️ Free tier requests remaining: ${remaining}`);
            }
            
            return data;
            
        } else {
            // Use backend /api/ai/premium endpoint for paid models
            console.log('💳 Using premium tier endpoint for model:', model);
            
            const userApiKey = localStorage.getItem('openrouter_api_key');
            if (!userApiKey) {
                throw new Error('This model requires your OpenRouter API key. Please add it in the panel above.');
            }
            
            const response = await fetch(`${apiBase}/ai/premium`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    apiKey: userApiKey
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your OpenRouter API key.');
                }
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Display billing info if available
            if (data._billing) {
                console.log('💰 Request cost:', {
                    tokens: data._billing.tokens,
                    base: `$${data._billing.base_cost.toFixed(6)}`,
                    markup: `$${data._billing.markup.toFixed(6)} (${data._billing.markup_percentage}%)`,
                    total: `$${data._billing.total.toFixed(6)}`
                });
            }
            
            return data;
        }
    }
    
    // ============================================
    // FILE CONTEXT SYSTEM
    // ============================================
    
    /**
     * Initialize the file context selector UI and event listeners
     */
    initializeFileContextSelector() {
        console.log('📁 AIManager: Initializing file context selector...');
        
        const contextSelector = document.getElementById('file-context-selector');
        const contextHeader = document.getElementById('context-header');
        const contextToggleBtn = document.getElementById('context-toggle-btn');
        const selectAllBtn = document.getElementById('select-all-files-btn');
        const clearAllBtn = document.getElementById('clear-all-files-btn');
        const fileList = document.getElementById('context-file-list');
        
        if (!contextSelector || !fileList) {
            console.warn('⚠️ File context selector elements not found');
            return;
        }
        
        // Toggle file selector collapse/expand
        if (contextHeader && contextToggleBtn) {
            contextHeader.addEventListener('click', () => {
                contextSelector.classList.toggle('collapsed');
                // Save state to localStorage
                localStorage.setItem('fileContextCollapsed', contextSelector.classList.contains('collapsed'));
            });
        }
        
        // Load collapsed state from localStorage
        const isCollapsed = localStorage.getItem('fileContextCollapsed') === 'true';
        if (isCollapsed) {
            contextSelector.classList.add('collapsed');
        }
        
        // Select all files
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.fileManager.files.forEach(file => {
                    this.selectedFileIds.add(file.id);
                });
                this.updateFileList();
                this.updateContextSize();
            });
        }
        
        // Clear all files
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.selectedFileIds.clear();
                this.updateFileList();
                this.updateContextSize();
            });
        }
        
        // Initial render
        this.updateFileList();
        
        console.log('✅ AIManager: File context selector initialized');
    }
    
    /**
     * Update the file list in the context selector
     */
    updateFileList() {
        const fileList = document.getElementById('context-file-list');
        const contextBadge = document.getElementById('context-badge');
        
        if (!fileList) return;
        
        // Clear existing list
        fileList.innerHTML = '';
        
        // Check if there are any files
        if (this.fileManager.files.length === 0) {
            fileList.innerHTML = `
                <div class="file-list-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                    <p>No files in project</p>
                </div>
            `;
            return;
        }
        
        // Render each file
        this.fileManager.files.forEach(file => {
            const isSelected = this.selectedFileIds.has(file.id);
            const fileSize = this.formatFileSize(this.getFileSize(file.content));
            
            const fileItem = document.createElement('div');
            fileItem.className = `file-item ${isSelected ? 'selected' : ''}`;
            fileItem.innerHTML = `
                <input type="checkbox" ${isSelected ? 'checked' : ''} data-file-id="${file.id}">
                <svg class="file-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <div class="file-item-info">
                    <div class="file-item-name">${this.escapeHtml(file.name)}</div>
                    <div class="file-item-size">${fileSize}</div>
                </div>
            `;
            
            // Add checkbox event listener
            const checkbox = fileItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation(); // Prevent triggering the file item click
                if (checkbox.checked) {
                    this.selectedFileIds.add(file.id);
                    fileItem.classList.add('selected');
                } else {
                    this.selectedFileIds.delete(file.id);
                    fileItem.classList.remove('selected');
                }
                this.updateContextSize();
            });
            
            // Add file item click to toggle checkbox
            fileItem.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
            
            fileList.appendChild(fileItem);
        });
        
        // Update badge count
        if (contextBadge) {
            contextBadge.textContent = this.selectedFileIds.size;
        }
        
        // Update context size
        this.updateContextSize();
    }
    
    /**
     * Update the total context size display and warning
     */
    updateContextSize() {
        const sizeInfo = document.getElementById('context-size-info');
        const warning = document.getElementById('context-warning');
        const badge = document.getElementById('context-badge');
        
        let totalSize = 0;
        this.selectedFileIds.forEach(fileId => {
            const file = this.fileManager.files.find(f => f.id === fileId);
            if (file) {
                totalSize += this.getFileSize(file.content);
            }
        });
        
        // Update size display
        if (sizeInfo) {
            sizeInfo.textContent = this.formatFileSize(totalSize);
        }
        
        // Update badge
        if (badge) {
            badge.textContent = this.selectedFileIds.size;
        }
        
        // Show/hide warning
        if (warning) {
            if (totalSize > this.warningThreshold) {
                warning.style.display = 'flex';
            } else {
                warning.style.display = 'none';
            }
        }
    }
    
    /**
     * Build context string from selected files
     * @returns {string} Formatted context for AI
     */
    buildContextFromFiles() {
        if (this.selectedFileIds.size === 0) {
            return '';
        }
        
        let context = '\n\n## Project Files Context\n\n';
        context += `The user has included ${this.selectedFileIds.size} file(s) for context:\n\n`;
        
        this.selectedFileIds.forEach(fileId => {
            const file = this.fileManager.files.find(f => f.id === fileId);
            if (file) {
                context += `### File: ${file.name}\n`;
                context += '```' + (file.language || 'text') + '\n';
                context += file.content;
                context += '\n```\n\n';
            }
        });
        
        context += '\nPlease use the above files as context when answering the user\'s question.\n';
        
        return context;
    }
    
    /**
     * Get file size in bytes
     * @param {string} content - File content
     * @returns {number} Size in bytes
     */
    getFileSize(content) {
        return new Blob([content]).size;
    }
    
    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
    
    // ============================================
    // PROJECT CONTEXT SYSTEM
    // ============================================
    
    /**
     * Initialize the project context toggle button
     */
    initializeProjectContextToggle() {
        console.log('🗂️ AIManager: Initializing project context toggle...');
        
        if (!this.projectContextManager) {
            console.warn('⚠️ ProjectContextManager not available');
            return;
        }
        
        const toggleBtn = document.getElementById('project-context-toggle-btn');
        const sizeBadge = document.getElementById('project-context-size');
        
        if (!toggleBtn) {
            console.warn('⚠️ Project context toggle button not found');
            return;
        }
        
        if (!sizeBadge) {
            console.warn('⚠️ Project context size badge not found');
        }
        
        // Load saved state from localStorage
        const savedState = localStorage.getItem('includeProjectContext');
        this.includeProjectContext = savedState === 'true';
        
        // Set initial button state
        if (this.includeProjectContext) {
            toggleBtn.classList.add('active');
        }
        
        // Update size badge
        this.updateProjectContextSize();
        
        // Add click event listener
        toggleBtn.addEventListener('click', () => {
            this.includeProjectContext = !this.includeProjectContext;
            
            // Update button state
            if (this.includeProjectContext) {
                toggleBtn.classList.add('active');
                console.log('✅ Project context enabled');
            } else {
                toggleBtn.classList.remove('active');
                console.log('❌ Project context disabled');
            }
            
            // Save state
            localStorage.setItem('includeProjectContext', this.includeProjectContext);
            
            // Update size badge
            this.updateProjectContextSize();
        });
        
        console.log('✅ AIManager: Project context toggle initialized');
    }
    
    /**
     * Update the project context size badge
     */
    updateProjectContextSize() {
        const sizeBadge = document.getElementById('project-context-size');
        
        if (!sizeBadge || !this.projectContextManager) {
            return;
        }
        
        try {
            const summary = this.projectContextManager.generateProjectSummary();
            const size = this.getFileSize(summary);
            sizeBadge.textContent = `~${this.formatFileSize(size)}`;
        } catch (e) {
            console.warn('Failed to calculate project context size', e);
            sizeBadge.textContent = '~2KB';
        }
    }
    
    /**
     * Build project context string for AI
     * @returns {string} Project context
     */
    buildProjectContext() {
        if (!this.includeProjectContext || !this.projectContextManager) {
            return '';
        }
        
        try {
            const summary = this.projectContextManager.generateProjectSummary();
            return '\n' + summary;
        } catch (e) {
            console.error('Error generating project context:', e);
            return '';
        }
    }
    
    // ============================================
    // SYNTAX HIGHLIGHTING SYSTEM
    // ============================================
    
    /**
     * Detect programming language from code content
     * @param {string} code - Code content
     * @returns {string} Language identifier
     */
    detectCodeLanguage(code) {
        // Check for common patterns
        if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
        if (code.includes('function') && code.includes('=>')) return 'javascript';
        if (code.includes('const ') || code.includes('let ') || code.includes('var ')) return 'javascript';
        if (code.includes('import ') && code.includes('from ')) return 'javascript';
        if (code.includes('interface ') || code.includes(': string') || code.includes(': number')) return 'typescript';
        if (code.includes('def ') || code.includes('import ') && code.includes('print(')) return 'python';
        if (code.match(/\.(class|id)\s*\{/) || code.includes('@media')) return 'css';
        if (code.includes('{') && code.includes(':') && code.includes('}') && !code.includes('function')) return 'json';
        if (code.includes('```') || code.includes('#')) return 'markdown';
        if (code.includes('#!/bin/bash') || code.includes('echo ')) return 'bash';
        
        // Default to javascript
        return 'javascript';
    }
    
    /**
     * Highlight code using Prism.js
     * @param {string} code - Code to highlight
     * @param {string} language - Language identifier
     * @returns {string} Highlighted HTML
     */
    highlightCode(code, language) {
        // Check if Prism is available
        if (typeof Prism === 'undefined') {
            console.warn('Prism.js not loaded, returning escaped code');
            return this.escapeHtml(code);
        }
        
        try {
            // Get the grammar for the language
            const grammar = Prism.languages[language] || Prism.languages.javascript;
            
            // Highlight the code
            const highlighted = Prism.highlight(code, grammar, language);
            
            return highlighted;
        } catch (e) {
            console.warn('Error highlighting code:', e);
            return this.escapeHtml(code);
        }
    }
    
    /**
     * Copy code to clipboard
     * @param {string} timestamp - Message timestamp to find code
     */
    copyCodeToClipboard(timestamp) {
        const message = this.messages.find(m => m.timestamp === timestamp);
        
        if (!message || !message.codeBlock) {
            console.warn('No code found for timestamp:', timestamp);
            return;
        }
        
        // Copy to clipboard
        navigator.clipboard.writeText(message.codeBlock).then(() => {
            console.log('✅ Code copied to clipboard');
            this.updateStatus('Code copied to clipboard!', 'success');
            
            // Visual feedback - update button text temporarily
            const copyBtn = event?.target?.closest('.copy-code-btn');
            if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied!
                `;
                copyBtn.style.background = '#28a745';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.style.background = '';
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy code:', err);
            this.updateStatus('Failed to copy code', 'error');
        });
    }
}
