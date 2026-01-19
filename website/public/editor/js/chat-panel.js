document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing chat panel...');
    
    // Initialize DOM elements
    const editorToggle = document.getElementById('editor-toggle');
    const previewToggle = document.getElementById('preview-toggle');
    const editorElement = document.getElementById('editor');
    const previewFrame = document.getElementById('preview-frame');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatModelSelect = document.getElementById('chat-ai-model');
    const chatApiKey = document.getElementById('chat-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const architectModeToggle = document.getElementById('architect-mode-toggle');
    const modeDescriptionText = document.getElementById('mode-description-text');
    
    console.log('UI Elements found:', {
        editorToggle: !!editorToggle,
        previewToggle: !!previewToggle,
        saveApiKeyBtn: !!saveApiKeyBtn,
        architectModeToggle: !!architectModeToggle
    });
    
    // Initialize API key from localStorage
    initializeApiKey();
    
    // Initialize Architect Mode toggle
    initializeArchitectMode();
    
    // Wait for ModelRouter to be available, then initialize model list
    waitForModelRouter().then(() => {
        initializeModelList();
    });
    
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
        
        // Clear input
        chatInput.value = '';
        
        // Use UnifiedAI if available (NEW SYSTEM)
        if (window.unifiedAI) {
            console.log('[ChatPanel] Using Unified AI System');
            window.unifiedAI.handleMessage(message);
            return;
        }
        
        // UnifiedAI not initialized - show error
        console.error('[ChatPanel] UnifiedAI not available!');
        addSystemMessage('⚠️ AI system not initialized yet. Please refresh the page.');
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
    
    /**
     * Wait for ModelRouter to be available (loaded by app.js module)
     */
    function waitForModelRouter() {
        return new Promise((resolve) => {
            if (window.modelRouter && typeof window.modelRouter.getAllModels === 'function') {
                resolve();
            } else {
                console.log('⏳ Waiting for ModelRouter to load...');
                const checkInterval = setInterval(() => {
                    if (window.modelRouter && typeof window.modelRouter.getAllModels === 'function') {
                        clearInterval(checkInterval);
                        console.log('✅ ModelRouter loaded');
                        resolve();
                    }
                }, 100); // Check every 100ms
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn('⚠️ ModelRouter not loaded after 5s, using fallback');
                    resolve();
                }, 5000);
            }
        });
    }
    
    function initializeModelList() {
        if (!chatModelSelect) {
            console.error('Model select element not found');
            return;
        }
        
        // Clear existing options
        chatModelSelect.innerHTML = '';
        
        // Get models from ModelRouter if available
        if (window.modelRouter && typeof window.modelRouter.getAllModels === 'function') {
            const models = window.modelRouter.getAllModels();
            console.log('📋 Loading', models.length, 'models from ModelRouter');
            
            // Group models by free/paid
            const freeModels = models.filter(m => m.free);
            const paidModels = models.filter(m => !m.free);
            
            // Add free models
            if (freeModels.length > 0) {
                freeModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.displayName;
                    option.dataset.tier = 'free';
                    chatModelSelect.appendChild(option);
                });
            }
            
            // Add separator if we have both types
            if (freeModels.length > 0 && paidModels.length > 0) {
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = '─────── Requires API Key ───────';
                chatModelSelect.appendChild(separator);
            }
            
            // Add paid models
            if (paidModels.length > 0) {
                paidModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = `${model.displayName} (Requires API Key)`;
                    option.dataset.tier = 'paid';
                    chatModelSelect.appendChild(option);
                });
            }
            
            console.log('✅ Loaded', freeModels.length, 'free and', paidModels.length, 'paid models');
        } else {
            console.warn('ModelRouter not available, loading fallback models');
            // Fallback to a basic model if ModelRouter is not available
            const fallbackOption = document.createElement('option');
            fallbackOption.value = 'mistralai/devstral-2512:free';
            fallbackOption.textContent = '🆓 Mistral Devstral 2512';
            chatModelSelect.appendChild(fallbackOption);
        }
        
        // Add custom models from localStorage
        loadCustomModels();
        
        // Restore previously selected model
        const savedModel = localStorage.getItem('selected_model');
        if (savedModel && chatModelSelect.querySelector(`option[value="${savedModel}"]`)) {
            chatModelSelect.value = savedModel;
            console.log('✅ Restored saved model:', savedModel);
        } else if (chatModelSelect.options.length > 0) {
            // Select first available model
            chatModelSelect.selectedIndex = 0;
            // Save this initial selection
            if (chatModelSelect.value) {
                localStorage.setItem('selected_model', chatModelSelect.value);
            }
        }
        
        // Save model selection when changed
        chatModelSelect.addEventListener('change', function() {
            localStorage.setItem('selected_model', chatModelSelect.value);
            console.log('💾 Model selection saved:', chatModelSelect.value);
        });
    }
    
    function loadCustomModels() {
        if (!chatModelSelect) return;
        
        // Load custom models from localStorage
        const customModels = JSON.parse(localStorage.getItem('custom_models') || '[]');
        
        if (customModels.length === 0) return;
        
        console.log('📦 Loading custom models:', customModels.length);
        
        // Add separator before custom models
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '─────── Custom Models ───────';
        chatModelSelect.appendChild(separator);
        
        // Add custom models
        customModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `⭐ ${model.name}`;
            option.dataset.custom = 'true';
            chatModelSelect.appendChild(option);
        });
    }
    
    function initializeArchitectMode() {
        if (!architectModeToggle) {
            console.warn('Architect mode toggle not found');
            return;
        }
        
        // Load saved state
        const architectModeEnabled = localStorage.getItem('architect_mode_enabled') === 'true';
        architectModeToggle.checked = architectModeEnabled;
        updateModeDescription(architectModeEnabled);
        updateModelSelectState(architectModeEnabled);
        
        // Set initial state in ModelRouter if available
        if (window.modelRouter) {
            window.modelRouter.setRoutingEnabled(architectModeEnabled);
        }
        
        // Add change event listener
        architectModeToggle.addEventListener('change', function() {
            const isEnabled = architectModeToggle.checked;
            console.log('🧠 Architect Mode', isEnabled ? 'ENABLED' : 'DISABLED');
            
            // Update localStorage
            localStorage.setItem('architect_mode_enabled', isEnabled ? 'true' : 'false');
            
            // Update ModelRouter if available
            if (window.modelRouter) {
                window.modelRouter.setRoutingEnabled(isEnabled);
            }
            
            // Update UI
            updateModeDescription(isEnabled);
            updateModelSelectState(isEnabled);
            
            // Show notification
            showModeNotification(isEnabled);
        });
    }
    
    function updateModeDescription(isEnabled) {
        if (!modeDescriptionText) return;
        
        if (isEnabled) {
            modeDescriptionText.innerHTML = '🧠 <strong>AI automatically selects the best model</strong> based on task complexity';
            modeDescriptionText.style.color = '#4c9af0';
        } else {
            modeDescriptionText.innerHTML = 'Manually select a model from the list below';
            modeDescriptionText.style.color = '';
        }
    }
    
    function updateModelSelectState(architectModeEnabled) {
        if (!chatModelSelect) return;
        
        if (architectModeEnabled) {
            chatModelSelect.style.opacity = '0.5';
            chatModelSelect.style.pointerEvents = 'none';
            chatModelSelect.title = 'Disabled - Architect Mode is selecting models automatically';
        } else {
            chatModelSelect.style.opacity = '1';
            chatModelSelect.style.pointerEvents = 'auto';
            chatModelSelect.title = 'Select AI model';
        }
    }
    
    function showModeNotification(isEnabled) {
        const notification = document.createElement('div');
        notification.className = 'mode-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isEnabled ? '#4c9af0' : '#666'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        
        notification.innerHTML = isEnabled 
            ? '🧠 <strong>Architect Mode</strong> - AI will automatically select the best model for each task'
            : '👤 <strong>Manual Mode</strong> - You control which model to use';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Make functions globally accessible
    window.chatPanel = {
        addUserMessage,
        addAIMessage,
        refreshModelList: initializeModelList,  // Allow external refresh of model list
        addSystemMessage,
        loadCustomModels,
        saveApiKey
    };
});
