/**
 * Chat Panel Integration with AIManager
 * Connects the chat panel UI to use AIManager's advanced features
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔗 Initializing Chat Panel Integration with AIManager...');
    
    // Wait for AIManager to be initialized
    const waitForAIManager = setInterval(() => {
        if (window.aiManager) {
            clearInterval(waitForAIManager);
            initializeChatPanelIntegration();
        }
    }, 100);
});

function initializeChatPanelIntegration() {
    console.log('✅ AIManager found, setting up chat panel integration');
    
    const aiManager = window.aiManager;
    const fileManager = window.app?.fileManager;
    
    if (!aiManager) {
        console.error('AIManager not found - integration aborted');
        return;
    }
    
    if (!fileManager) {
        console.error('FileManager not found - integration aborted');
        return;
    }
    
    console.log('✅ AIManager and FileManager ready for integration');
    
    // Setup file context selector for chat panel
    setupChatFileContextSelector();
    
    // Setup project context toggle
    setupChatProjectContextToggle();
    
    // Override the chat panel's send message to use AIManager
    overrideChatPanelSendMessage();
    
    console.log('✅ Chat Panel Integration Complete');
}

/**
 * Setup file context selector for chat panel
 */
function setupChatFileContextSelector() {
    const toggleBtn = document.getElementById('chat-file-context-toggle-btn');
    const selector = document.getElementById('chat-file-context-selector');
    const fileList = document.getElementById('chat-file-context-list');
    const countBadge = document.getElementById('chat-file-context-count');
    
    if (!toggleBtn || !selector) {
        console.warn('Chat file context UI elements not found');
        return;
    }
    
    // Track selected files
    window.chatSelectedFileIds = new Set();
    
    // Toggle selector visibility
    toggleBtn.addEventListener('click', () => {
        if (selector.style.display === 'none') {
            selector.style.display = 'block';
            updateChatFileList();
        } else {
            selector.style.display = 'none';
        }
    });
    
    // Update file list when files change
    if (window.app?.fileManager) {
        const originalSave = window.app.fileManager.saveFilesToStorage;
        window.app.fileManager.saveFilesToStorage = function() {
            originalSave.call(this);
            if (selector.style.display !== 'none') {
                updateChatFileList();
            }
        };
    }
    
    /**
     * Update the file list in the selector
     */
    function updateChatFileList() {
        if (!fileList || !window.app?.fileManager) return;
        
        const files = window.app.fileManager.files || [];
        fileList.innerHTML = '';
        
        if (files.length === 0) {
            fileList.innerHTML = '<div class="no-files">No files in project</div>';
            return;
        }
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-context-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `chat-file-${file.name}`;
            checkbox.checked = window.chatSelectedFileIds.has(file.name);
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    window.chatSelectedFileIds.add(file.name);
                } else {
                    window.chatSelectedFileIds.delete(file.name);
                }
                updateChatContextSize();
            });
            
            const label = document.createElement('label');
            label.htmlFor = `chat-file-${file.name}`;
            label.textContent = file.name;
            
            const fileSize = document.createElement('span');
            fileSize.className = 'file-size';
            fileSize.textContent = formatFileSize(getFileSize(file.content));
            
            fileItem.appendChild(checkbox);
            fileItem.appendChild(label);
            fileItem.appendChild(fileSize);
            fileList.appendChild(fileItem);
        });
        
        updateChatContextSize();
    }
    
    /**
     * Update context size display
     */
    function updateChatContextSize() {
        const sizeValue = document.getElementById('chat-context-size-value');
        const warning = document.getElementById('chat-context-size-warning');
        const warningText = document.getElementById('chat-context-warning-text');
        
        if (!window.app?.fileManager) return;
        
        let totalSize = 0;
        const files = window.app.fileManager.files || [];
        
        window.chatSelectedFileIds.forEach(fileName => {
            const file = files.find(f => f.name === fileName);
            if (file) {
                totalSize += getFileSize(file.content);
            }
        });
        
        // Update badge count
        if (countBadge) {
            countBadge.textContent = window.chatSelectedFileIds.size;
        }
        
        // Update size display
        if (sizeValue) {
            sizeValue.textContent = formatFileSize(totalSize);
        }
        
        // Show warnings
        if (warning) {
            const maxSize = 100 * 1024; // 100KB
            const warningThreshold = 50 * 1024; // 50KB
            
            if (totalSize >= maxSize) {
                warning.style.display = 'flex';
                warning.style.color = '#dc3545';
                if (warningText) {
                    warningText.textContent = 'Context size exceeds maximum limit!';
                }
            } else if (totalSize >= warningThreshold) {
                warning.style.display = 'flex';
                warning.style.color = '#ffc107';
                if (warningText) {
                    warningText.textContent = 'Context size is approaching the limit.';
                }
            } else {
                warning.style.display = 'none';
            }
        }
    }
    
    function getFileSize(content) {
        return new Blob([content || '']).size;
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

/**
 * Setup project context toggle for chat panel
 */
function setupChatProjectContextToggle() {
    const toggleBtn = document.getElementById('project-context-toggle-btn');
    
    if (!toggleBtn) {
        console.warn('Project context toggle button not found');
        return;
    }
    
    // Track state
    window.chatIncludeProjectContext = false;
    
    toggleBtn.addEventListener('click', () => {
        window.chatIncludeProjectContext = !window.chatIncludeProjectContext;
        
        if (window.chatIncludeProjectContext) {
            toggleBtn.classList.add('active');
            toggleBtn.style.background = 'var(--accent-color)';
            toggleBtn.style.color = 'white';
            console.log('✅ Project context enabled for chat');
        } else {
            toggleBtn.classList.remove('active');
            toggleBtn.style.background = '';
            toggleBtn.style.color = '';
            console.log('❌ Project context disabled for chat');
        }
    });
}

/**
 * Override chat panel's send message function to use AIManager
 */
function overrideChatPanelSendMessage() {
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!chatSendBtn || !chatInput) {
        console.warn('Chat panel send button or input not found');
        return;
    }
    
    if (!chatMessages) {
        console.warn('Chat messages container not found');
        return;
    }
    
    // Remove old event listeners by cloning
    const newChatSendBtn = chatSendBtn.cloneNode(true);
    chatSendBtn.parentNode.replaceChild(newChatSendBtn, chatSendBtn);
    
    // Add new event listener that uses AIManager
    newChatSendBtn.addEventListener('click', () => {
        sendMessageWithAIManager();
    });
    
    // Also handle Enter key
    const newChatInput = chatInput.cloneNode(true);
    chatInput.parentNode.replaceChild(newChatInput, chatInput);
    
    newChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessageWithAIManager();
        }
    });
    
    /**
     * Send message using AIManager with all advanced features
     */
    async function sendMessageWithAIManager() {
        const input = document.getElementById('chat-input');
        const messages = document.getElementById('chat-messages');
        
        if (!input || !messages) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message to chat
        const userMsgDiv = document.createElement('div');
        userMsgDiv.className = 'message user-message';
        userMsgDiv.textContent = message;
        messages.appendChild(userMsgDiv);
        messages.scrollTop = messages.scrollHeight;
        
        // Build context
        let context = '';
        
        // Add project context if enabled
        if (window.chatIncludeProjectContext && window.aiManager.projectContextManager) {
            const projectContext = await window.aiManager.projectContextManager.analyzeProject();
            if (projectContext) {
                context += '\n\nPROJECT CONTEXT:\n' + projectContext + '\n';
            }
        }
        
        // Add selected files context
        if (window.chatSelectedFileIds && window.chatSelectedFileIds.size > 0) {
            context += '\n\nSELECTED FILES CONTEXT:\n';
            const files = window.app.fileManager.files || [];
            
            window.chatSelectedFileIds.forEach(fileName => {
                const file = files.find(f => f.name === fileName);
                if (file) {
                    context += `\n=== File: ${file.name} ===\n`;
                    context += file.content + '\n';
                }
            });
        }
        
        // Check current mode
        const currentMode = window.currentMode || 'chat';
        
        // Build full prompt
        let fullPrompt = message;
        if (context) {
            fullPrompt = context + '\n\nUSER REQUEST:\n' + message;
        }
        
        // Add mode-specific instructions
        if (currentMode === 'agent') {
            const currentFile = window.app?.fileManager?.getCurrentFile();
            if (currentFile) {
                fullPrompt = `You are in AGENT MODE. Edit the current file directly.\n\nCurrent file: ${currentFile.name}\n\n${fullPrompt}\n\nProvide the complete updated file content.`;
            }
        }
        
        // Show loading message
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message system-message';
        loadingDiv.textContent = currentMode === 'agent' ? 'Agent is editing your file...' : 'AI is thinking...';
        messages.appendChild(loadingDiv);
        messages.scrollTop = messages.scrollHeight;
        
        try {
            // Use AIManager's sendMessage method
            await window.aiManager.sendMessage(fullPrompt);
            
            // Remove loading message
            messages.removeChild(loadingDiv);
            
            // The AIManager will add the response to its own chat history
            // We need to also display it in the chat panel
            const latestMessage = window.aiManager.messages[window.aiManager.messages.length - 1];
            
            if (latestMessage && latestMessage.role === 'assistant') {
                // Render the AI response using AIManager's render method for syntax highlighting
                const aiMsgDiv = document.createElement('div');
                aiMsgDiv.className = 'message ai-message';
                
                // Use AIManager's rendering which includes syntax highlighting
                const renderedContent = renderMessageContent(latestMessage);
                aiMsgDiv.innerHTML = renderedContent;
                
                messages.appendChild(aiMsgDiv);
                messages.scrollTop = messages.scrollHeight;
                
                // If in agent mode and there's code, apply it to the current file
                if (currentMode === 'agent' && latestMessage.codeBlock) {
                    const currentFile = window.app?.fileManager?.getCurrentFile();
                    if (currentFile) {
                        currentFile.content = latestMessage.codeBlock;
                        window.app.fileManager.saveFilesToStorage();
                        if (window.app.fileManager.currentFile === currentFile.name) {
                            window.app.editor.editor.setValue(latestMessage.codeBlock);
                        }
                        
                        // Show success message
                        const successDiv = document.createElement('div');
                        successDiv.className = 'message system-message';
                        successDiv.textContent = `✅ Successfully updated ${currentFile.name}`;
                        successDiv.style.color = '#28a745';
                        messages.appendChild(successDiv);
                        messages.scrollTop = messages.scrollHeight;
                    }
                }
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            messages.removeChild(loadingDiv);
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message system-message';
            errorDiv.textContent = '❌ Error: ' + error.message;
            errorDiv.style.color = '#dc3545';
            messages.appendChild(errorDiv);
            messages.scrollTop = messages.scrollHeight;
        }
    }
    
    /**
     * Render message content with syntax highlighting
     */
    function renderMessageContent(message) {
        if (!message) return '';
        
        let html = message.text;
        
        // If there's a code block, render it with syntax highlighting
        if (message.codeBlock) {
            const language = detectLanguage(message.codeBlock);
            const highlightedCode = highlightCode(message.codeBlock, language);
            
            const codePreview = `
                <div class="code-preview-container">
                    <div class="code-preview-header">
                        <span>Code Preview</span>
                        <span class="language-badge">${language.toUpperCase()}</span>
                        <div class="code-actions">
                            <button class="copy-code-btn" onclick="copyToClipboard(\`${escapeForAttribute(message.codeBlock)}\`)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy
                            </button>
                        </div>
                    </div>
                    <pre class="line-numbers"><code class="language-${language}">${highlightedCode}</code></pre>
                </div>
            `;
            
            html += codePreview;
        }
        
        // Convert markdown-like syntax
        html = html
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const language = lang || 'text';
                const highlighted = highlightCode(code, language);
                return `<pre class="line-numbers"><code class="language-${language}">${highlighted}</code></pre>`;
            })
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        return html;
    }
    
    function detectLanguage(code) {
        if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
        if (code.includes('function') && code.includes('=>')) return 'javascript';
        if (code.includes('const ') || code.includes('let ') || code.includes('var ')) return 'javascript';
        if (code.includes('def ') || code.includes('import ') && code.includes('print(')) return 'python';
        if (code.match(/\.(class|id)\s*\{/) || code.includes('@media')) return 'css';
        return 'javascript';
    }
    
    function highlightCode(code, language) {
        if (typeof Prism === 'undefined') {
            return escapeHtml(code);
        }
        
        try {
            const grammar = Prism.languages[language] || Prism.languages.javascript;
            return Prism.highlight(code, grammar, language);
        } catch (e) {
            console.warn('Prism highlighting failed, falling back to plain text:', e);
            return escapeHtml(code);
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function escapeForAttribute(text) {
        return text.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\');
    }
    
    // Expose copy function globally
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('✅ Code copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };
}
