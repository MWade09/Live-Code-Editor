document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing chat panel...');
    
    // Initialize DOM elements
    const editorToggle = document.getElementById('editor-toggle');
    const previewToggle = document.getElementById('preview-toggle');
    const editorElement = document.getElementById('editor');
    const previewFrame = document.getElementById('preview-frame');
    const chatModeBtn = document.getElementById('chat-mode-btn');
    const agentModeBtn = document.getElementById('agent-mode-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatModelSelect = document.getElementById('chat-ai-model');
    const chatApiKey = document.getElementById('chat-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    
    console.log('UI Elements found:', {
        editorToggle: !!editorToggle,
        previewToggle: !!previewToggle,
        chatModeBtn: !!chatModeBtn,
        agentModeBtn: !!agentModeBtn,
        saveApiKeyBtn: !!saveApiKeyBtn
    });
    
    // Current mode (chat or agent)
    window.currentMode = 'chat';
    
    // Initialize API key from localStorage
    initializeApiKey();
    
    // Initialize custom models
    loadCustomModels();
    
    // Toggle between editor and preview
    if (editorToggle) {
        editorToggle.addEventListener('click', function() {
            console.log('Editor toggle clicked');
            if (!editorElement || !previewFrame) return;
            
            editorElement.classList.add('active-view');
            editorElement.classList.remove('hidden-view');
            previewFrame.classList.add('hidden-view');
            previewFrame.classList.remove('active-view');
            
            editorToggle.classList.add('active');
            previewToggle.classList.remove('active');
        });
    }
    
    if (previewToggle) {
        previewToggle.addEventListener('click', function() {
            console.log('Preview toggle clicked');
            if (!editorElement || !previewFrame) return;
            
            // Force preview to update before showing
            if (window.preview && typeof window.preview.updatePreview === 'function') {
                window.preview.updatePreview();
            }
            
            previewFrame.classList.add('active-view');
            previewFrame.classList.remove('hidden-view');
            editorElement.classList.add('hidden-view');
            editorElement.classList.remove('active-view');
            
            previewToggle.classList.add('active');
            editorToggle.classList.remove('active');
        });
    }    // Toggle between chat and agent mode
    if (chatModeBtn) {
        chatModeBtn.addEventListener('click', function() {
            console.log('Switching to chat mode');
            window.currentMode = 'chat';
            chatModeBtn.classList.add('active');
            agentModeBtn.classList.remove('active');
            addSystemMessage('💬 Chat Mode: Let\'s have a conversation! Ask me anything or brainstorm ideas together.');
        });
    }
    
    if (agentModeBtn) {
        agentModeBtn.addEventListener('click', function() {
            console.log('Switching to agent mode');
            window.currentMode = 'agent';
            agentModeBtn.classList.add('active');
            chatModeBtn.classList.remove('active');
            addSystemMessage('🤖 Agent Mode: I\'ll directly edit your current file based on your instructions.');
        });
    }
    
    // Save API key
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', function() {
            console.log('Save API key button clicked');
            saveApiKey();
        });
    }
    
    // Handle sending messages
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendMessage);
    }
    
    // Allow pressing Enter to send messages
    if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Functions
    function initializeApiKey() {
        if (!chatApiKey) return;
        
        const savedKey = localStorage.getItem('openrouter_api_key');
        if (savedKey) {
            chatApiKey.value = savedKey;
            console.log('API key loaded from localStorage');
        }
    }
    
    function saveApiKey() {
        if (!chatApiKey) {
            console.error('API key input element not found');
            return;
        }
        
        const apiKey = chatApiKey.value.trim();
        console.log('Saving API key', apiKey ? 'xxxxx' : '(empty)');
        
        if (apiKey) {
            localStorage.setItem('openrouter_api_key', apiKey);
            addSystemMessage('API key saved successfully!');
            console.log('API key saved to localStorage');
            
            // Also update the AI modal's API key if it exists
            const aiApiKey = document.getElementById('ai-api-key');
            if (aiApiKey) {
                aiApiKey.value = apiKey;
            }
        } else {
            addSystemMessage('Please enter a valid API key.');
        }
    }
    
    function sendMessage() {
        if (!chatInput || !chatMessages) return;
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addUserMessage(message);
        
        // Clear input
        chatInput.value = '';
        
        // Get API key
        const apiKey = chatApiKey.value.trim() || localStorage.getItem('openrouter_api_key');
        // If no API key, we'll still allow guest usage with a small local quota
        
        // Get selected model
        const selectedModel = chatModelSelect.value;
        
        console.log(`Processing message in ${window.currentMode} mode`);
        
        // Handle message based on mode
        if (window.currentMode === 'chat') {
            processWithAI(message, selectedModel, apiKey);
        } else {
            processWithAgentMode(message, selectedModel, apiKey);
        }
    }
    
    function addUserMessage(message) {
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addAIMessage(message) {
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        messageElement.innerHTML = formatMessage(message);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addSystemMessage(message) {
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message system-message';
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function formatMessage(message) {
        // Convert markdown-like code syntax to HTML
        return message
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
      async function processWithAI(message, model, apiKey) {
        addSystemMessage('AI is thinking...');
        try {
            // Check if this is a free model
            const freeModels = [
                'deepseek/deepseek-r1-0528:free',
                'deepseek/deepseek-chat-v3-0324:free',
                'google/gemma-3-27b-it:free'
            ];
            const isFreeModel = freeModels.includes(model);
            
            // Get current file context for better responses (only when relevant)
            const currentFile = window.app?.fileManager?.getCurrentFile();
            let fileContext = '';
            
            // Only add file context if the message seems related to coding/file editing
            const codingKeywords = ['code', 'html', 'css', 'javascript', 'function', 'class', 'file', 'edit', 'modify', 'fix', 'debug', 'styles', 'script'];
            const isCodeRelated = codingKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
            );
            
            if (isCodeRelated && currentFile) {
                fileContext = `\n\nNote: User is currently working on ${currentFile.name} (${currentFile.type} file).`;
            }
            
            const messages = [
                { 
                    role: 'system', 
                    content: `You are a helpful AI assistant. Have natural conversations and answer questions across any topic. When discussing code or programming, you can provide examples using markdown code blocks, but only when specifically relevant to the conversation.${fileContext}`
                },
                { role: 'user', content: message }
            ];
            
            let response;
            
            if (isFreeModel) {
                // Use backend /api/ai/free endpoint for free models (uses platform key)
                console.log('🆓 Chat using free tier for model:', model);
                
                response = await fetch('/api/ai/free', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages
                    })
                });
            } else {
                // Use backend /api/ai/premium endpoint for premium models (requires user key)
                if (!apiKey) {
                    addSystemMessage('This model requires an API key. Please add your OpenRouter API key above or select a free model (💰).');
                    return;
                }
                
                console.log('💳 Chat using premium tier for model:', model);
                
                response = await fetch('/api/ai/premium', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        apiKey
                    })
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                
                // Handle specific error cases
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later or use your own API key for premium models.');
                }
                if (response.status === 403) {
                    throw new Error(errorData.error || 'This model is not available for free tier. Please select a free model (🆓) or add your API key.');
                }
                
                throw new Error(errorData.error || `Chat API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Display remaining requests if available (free tier)
            const remaining = response.headers.get('X-RateLimit-Remaining');
            if (remaining) {
                console.log(`ℹ️ Free tier requests remaining: ${remaining}`);
            }
            
            // Remove thinking message
            if (chatMessages.lastChild && chatMessages.lastChild.classList.contains('system-message')) {
                chatMessages.removeChild(chatMessages.lastChild);
            }
            
            if (data.choices && data.choices[0]) {
                const aiResponse = data.choices[0].message.content;
                addAIMessage(aiResponse);
                  // In chat mode, add code insertion buttons for any code blocks
                extractCodeBlocksForInsertion(aiResponse);
            } else {
                addSystemMessage('Error: Received an unexpected response format from the AI service.');
            }
        } catch (error) {
            console.error('Error in chat mode:', error);
            // Remove thinking message
            if (chatMessages.lastChild && chatMessages.lastChild.classList.contains('system-message')) {
                chatMessages.removeChild(chatMessages.lastChild);
            }
            addSystemMessage(`Chat Error: ${error.message}`);
            console.log('API Key present:', !!apiKey);
            console.log('Selected model:', model);
        }
    }
    
    // Extract code blocks and create insertion buttons (for chat mode)
    function extractCodeBlocksForInsertion(response) {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;
        let hasCodeBlocks = false;
        
        while ((match = codeBlockRegex.exec(response)) !== null) {
            hasCodeBlocks = true;
            const language = match[1] || 'text';
            const code = match[2].trim();
            
            // Create button for inserting code at cursor
            const insertButton = document.createElement('button');
            insertButton.className = 'code-insert-btn';
            insertButton.innerHTML = `<i class="fas fa-code"></i> Insert ${language} code`;
            insertButton.addEventListener('click', function() {
                if (window.app?.editor?.codeMirror) {
                    // Get current cursor position
                    const cursor = window.app.editor.codeMirror.getCursor();
                    // Insert code at cursor position
                    window.app.editor.codeMirror.replaceRange(code, cursor);
                    // Switch to editor view to show the changes
                    if (editorToggle) {
                        editorToggle.click();
                    }
                    // Focus the editor
                    setTimeout(() => {
                        window.app.editor.codeMirror.focus();
                    }, 100);
                    
                    addSystemMessage(`✅ ${language} code inserted at cursor position`);
                } else {
                    addSystemMessage('Error: Editor not available');
                }
            });
            
            chatMessages.appendChild(insertButton);
        }
        
        // Scroll to bottom after adding buttons
        if (hasCodeBlocks) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }    async function processWithAgentMode(message, model, apiKey) {
        addSystemMessage('Agent is analyzing your request and editing the file...');
        
        try {
            // Check if this is a free model
            const freeModels = [
                'deepseek/deepseek-r1-0528:free',
                'deepseek/deepseek-chat-v3-0324:free',
                'google/gemma-3-27b-it:free'
            ];
            const isFreeModel = freeModels.includes(model);
            
            // Get current file context
            const currentFile = window.app?.fileManager?.getCurrentFile();
            let currentContent = currentFile?.content || '';
            const fileType = currentFile?.type || 'html';
            const fileName = currentFile?.name || 'untitled.html';
            
            // Detect if user wants to create a new file
            const createFileKeywords = ['create', 'new file', 'make a file', 'add a file', 'generate a file'];
            const isFileCreationRequest = createFileKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
            );
            
            // Limit content length to avoid API limits (max 2000 chars)
            if (currentContent.length > 2000) {
                currentContent = currentContent.substring(0, 2000) + '\n... (content truncated)';
            }
            
            // Build system prompt based on request type
            let systemPrompt;
            
            if (isFileCreationRequest) {
                systemPrompt = `You are a helpful coding assistant in agent mode. You can create new files or edit existing ones.

Current context:
- Working directory has existing file: "${fileName}"
- User has requested: "${message}"

Instructions:
1. If user wants to CREATE A NEW FILE:
   - Respond with JSON: {"action": "create", "filename": "name.ext", "content": "complete file content"}
   - Make sure to include the complete, working code
   - Choose appropriate filename and extension
   
2. If user wants to EDIT THE CURRENT FILE:
   - Just return the complete updated file content
   - No JSON, no explanations, just the code

IMPORTANT: Be smart about the request. If they say "create a new file" or "make a file", use JSON format. If they say "add this to my file" or "update my file", return the code directly.`;
            } else {
                systemPrompt = `You are a helpful coding assistant in agent mode editing a ${fileType} file.

Current file "${fileName}":
${currentContent}

User request: "${message}"

Return ONLY the complete updated file content. No explanations, no markdown code blocks, just the raw code that should replace the entire file.`;
            }

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ];
            
            let response;
            
            if (isFreeModel) {
                // Use backend /api/ai/free endpoint for free models (uses platform key)
                console.log('🆓 Agent using free tier for model:', model);
                
                response = await fetch('/api/ai/free', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages
                    })
                });
            } else {
                // Use backend /api/ai/premium endpoint for premium models (requires user key)
                if (!apiKey) {
                    addSystemMessage('This model requires an API key. Please add your OpenRouter API key above or select a free model (💰).');
                    return;
                }
                
                console.log('💳 Agent using premium tier for model:', model);
                
                response = await fetch('/api/ai/premium', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        apiKey
                    })
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                
                // Handle specific error cases
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later or use your own API key for premium models.');
                }
                if (response.status === 403) {
                    throw new Error(errorData.error || 'This model is not available for free tier. Please select a free model (🆓) or add your API key.');
                }
                
                throw new Error(errorData.error || `Agent API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Display remaining requests if available (free tier)
            const remaining = response.headers.get('X-RateLimit-Remaining');
            if (remaining) {
                console.log(`ℹ️ Free tier requests remaining: ${remaining}`);
            }
            
            // Remove thinking message
            if (chatMessages.lastChild && chatMessages.lastChild.classList.contains('system-message')) {
                chatMessages.removeChild(chatMessages.lastChild);
            }
            
            if (data.choices && data.choices[0]) {
                const aiResponse = data.choices[0].message.content;
                
                // Check if AI wants to create a new file (JSON format)
                let fileCreationData = null;
                try {
                    // Try to parse as JSON for file creation
                    const jsonMatch = aiResponse.match(/\{[\s\S]*"action"\s*:\s*"create"[\s\S]*\}/);
                    if (jsonMatch) {
                        fileCreationData = JSON.parse(jsonMatch[0]);
                    }
                } catch (e) {
                    // Not JSON, treat as regular file edit
                    console.log('Agent response is not JSON file creation format:', e.message);
                }
                
                if (fileCreationData && fileCreationData.action === 'create') {
                    // FILE CREATION MODE
                    const newFileName = fileCreationData.filename;
                    const newFileContent = fileCreationData.content;
                    
                    if (!newFileName || !newFileContent) {
                        addSystemMessage('Error: AI did not provide valid filename or content for new file.');
                        return;
                    }
                    
                    // Use AIFileCreationManager if available
                    if (window.aiFileCreationManager) {
                        console.log('📄 Agent creating new file:', newFileName);
                        
                        // Show preview dialog
                        const confirmed = await window.aiFileCreationManager.showFileCreationDialog({
                            filename: newFileName,
                            content: newFileContent,
                            reason: `Created based on request: "${message}"`
                        });
                        
                        if (confirmed) {
                            addSystemMessage(`✅ New file "${newFileName}" created successfully!`);
                            addAIMessage(`Done! I created "${newFileName}" with ${newFileContent.split('\n').length} lines of code. You can find it in your file explorer.`);
                        } else {
                            addSystemMessage(`⚠️ File creation cancelled.`);
                        }
                    } else {
                        // Fallback: create file directly
                        console.log('📄 Agent creating new file (direct):', newFileName);
                        
                        const fileType = newFileName.split('.').pop() || 'txt';
                        const newFile = {
                            name: newFileName,
                            type: fileType,
                            content: newFileContent,
                            lastModified: Date.now()
                        };
                        
                        if (window.app?.fileManager) {
                            window.app.fileManager.addFile(newFile);
                            window.app.fileManager.switchToFile(newFile);
                            
                            addSystemMessage(`✅ New file "${newFileName}" created successfully!`);
                            addAIMessage(`Done! Created "${newFileName}" and opened it in the editor. It has ${newFileContent.split('\n').length} lines.`);
                        } else {
                            addSystemMessage('Error: FileManager not available for file creation.');
                        }
                    }
                } else {
                    // FILE EDITING MODE (existing behavior)
                    if (window.app?.editor?.codeMirror) {
                        // Extract code from response (remove any explanation text)
                        const codeContent = extractMainCode(aiResponse, fileType);
                        
                        // Replace the entire file content
                        window.app.editor.codeMirror.setValue(codeContent);
                        
                        // Switch to editor view to show the changes
                        if (editorToggle) {
                            editorToggle.click();
                        }
                        
                        // Show success message
                        addSystemMessage(`✅ File updated with your changes. ${codeContent.split('\n').length} lines generated.`);
                        
                        // Show what was changed
                        addAIMessage(`Updated "${fileName}" (${codeContent.split('\n').length} lines). Changes are live in the editor.`);
                    } else {
                        addSystemMessage('Error: Editor not available for file modification.');
                    }
                }
            } else {
                addSystemMessage('Error: Received an unexpected response format from the AI service.');
            }
        } catch (error) {
            console.error('Error in agent mode:', error);
            // Remove thinking message
            if (chatMessages.lastChild && chatMessages.lastChild.classList.contains('system-message')) {
                chatMessages.removeChild(chatMessages.lastChild);
            }
            addSystemMessage(`Agent Error: ${error.message}`);
            console.log('API Key present:', !!apiKey);
            console.log('Selected model:', model);
            console.log('Current file:', window.app?.fileManager?.getCurrentFile()?.name || 'none');
        }
    }
    
    // Helper function to extract the main code content from AI response
    function extractMainCode(response, fileType) {
        // Try to find code blocks first
        const codeBlockRegex = new RegExp(`\`\`\`(?:${fileType}|html|css|js|javascript)?\\s*([\\s\\S]*?)\`\`\``, 'i');
        const match = response.match(codeBlockRegex);
        
        if (match && match[1]) {
            return match[1].trim();
        }
        
        // If no code blocks found, but response looks like code, return it
        const lines = response.split('\n');
        const codeIndicators = ['<!DOCTYPE', '<html', '<head', '<body', 'function', 'const', 'let', 'var', '{', '}'];
        const looksLikeCode = lines.some(line => 
            codeIndicators.some(indicator => line.trim().startsWith(indicator))
        );
        
        if (looksLikeCode) {
            return response.trim();
        }
        
        // If it doesn't look like code, wrap it appropriately
        if (fileType === 'html') {
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Content</title>
</head>
<body>
    <h1>Generated Content</h1>
    <p>${response.replace(/\n/g, '</p>\n    <p>')}</p>
</body>
</html>`;
        } else if (fileType === 'css') {
            return `/* Generated CSS */\n${response}`;
        } else if (fileType === 'javascript' || fileType === 'js') {
            return `// Generated JavaScript\n${response}`;
        } else {
            return response.trim();
        }    }
    
    function loadCustomModels() {
        if (!chatModelSelect) return;
        
        // Load custom models from localStorage
        const customModels = JSON.parse(localStorage.getItem('custom_models') || '[]');
        console.log('Loaded custom models:', customModels);
        
        // Clear existing custom models
        const options = chatModelSelect.querySelectorAll('option');
        for (let i = options.length - 1; i >= 0; i--) {
            if (options[i].dataset.custom === 'true' || options[i].disabled) {
                chatModelSelect.removeChild(options[i]);
            }
        }
        
        // Add custom models to dropdown
        if (customModels.length > 0) {
            // Add a separator
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '──────────';
            chatModelSelect.appendChild(separator);
            
            // Add custom models
            customModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                option.dataset.custom = 'true';
                chatModelSelect.appendChild(option);
            });
        }
    }
    
    // Make functions globally accessible
    window.chatPanel = {
        addUserMessage,
        addAIMessage,
        addSystemMessage,
        loadCustomModels,
        saveApiKey
    };
});
