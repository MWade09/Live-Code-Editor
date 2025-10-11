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
    
    console.log('UI Elements found:', {
        editorToggle: !!editorToggle,
        previewToggle: !!previewToggle,
        saveApiKeyBtn: !!saveApiKeyBtn
    });
    
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
