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
    
    // History Elements
    const historySidebar = document.getElementById('chat-history-sidebar');
    const toggleHistoryBtn = document.getElementById('toggle-history-btn');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyList = document.getElementById('history-list');
    
    console.log('UI Elements found:', {
        editorToggle: !!editorToggle,
        previewToggle: !!previewToggle,
        saveApiKeyBtn: !!saveApiKeyBtn,
        historySidebar: !!historySidebar
    });
    
    // Initialize API key from localStorage
    initializeApiKey();
    
    // Initialize custom models
    loadCustomModels();
    
    // Initialize History
    initializeHistory();
    
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
    
    // History Event Listeners
    if (toggleHistoryBtn && historySidebar) {
        toggleHistoryBtn.addEventListener('click', () => {
            historySidebar.classList.toggle('hidden');
            renderHistoryList();
        });
    }
    
    if (closeHistoryBtn && historySidebar) {
        closeHistoryBtn.addEventListener('click', () => {
            historySidebar.classList.add('hidden');
        });
    }
    
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            createNewChat();
            if (window.innerWidth < 768) {
                historySidebar.classList.add('hidden');
            }
        });
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all chat history?')) {
                window.chatHistory.clearAll();
                createNewChat();
                renderHistoryList();
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
    
    // History Functions
    function initializeHistory() {
        if (!window.chatHistory) return;
        
        const chats = window.chatHistory.getAllChats();
        if (chats.length > 0) {
            // Load most recent chat
            loadChat(chats[0].id);
        } else {
            createNewChat();
        }
        
        renderHistoryList();
    }
    
    function renderHistoryList() {
        if (!historyList || !window.chatHistory) return;
        
        historyList.innerHTML = '';
        const chats = window.chatHistory.getAllChats();
        const currentChat = window.chatHistory.getCurrentChat();
        
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = `history-item ${currentChat && currentChat.id === chat.id ? 'active' : ''}`;
            item.onclick = () => loadChat(chat.id);
            
            const title = document.createElement('span');
            title.className = 'history-item-title';
            title.textContent = chat.title || 'New Chat';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'history-item-delete';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            };
            
            item.appendChild(title);
            item.appendChild(deleteBtn);
            historyList.appendChild(item);
        });
    }
    
    function loadChat(chatId) {
        if (!window.chatHistory) return;
        
        if (window.chatHistory.setCurrentChat(chatId)) {
            const chat = window.chatHistory.getCurrentChat();
            
            // Update UnifiedAI if available
            if (window.unifiedAI && window.unifiedAI.loadMessages) {
                window.unifiedAI.loadMessages(chat.messages);
            } else {
                // Fallback manual rendering
                chatMessages.innerHTML = '';
                chat.messages.forEach(msg => {
                    if (msg.role === 'user') addUserMessage(msg.content);
                    else if (msg.role === 'assistant') addAIMessage(msg.content);
                    else addSystemMessage(msg.content);
                });
            }
            
            renderHistoryList();
        }
    }
    
    function createNewChat() {
        if (!window.chatHistory) return;
        
        const newId = window.chatHistory.createChat();
        loadChat(newId);
        
        // Clear UnifiedAI context if needed
        if (window.unifiedAI && window.unifiedAI.clearChat) {
            window.unifiedAI.clearChat(); // This clears messages but we just loaded empty ones so it's fine
        }
    }
    
    function deleteChat(chatId) {
        if (!window.chatHistory) return;
        
        if (confirm('Delete this chat?')) {
            const wasActive = window.chatHistory.currentChatId === chatId;
            window.chatHistory.deleteChat(chatId);
            
            if (wasActive) {
                const chats = window.chatHistory.getAllChats();
                if (chats.length > 0) {
                    loadChat(chats[0].id);
                } else {
                    createNewChat();
                }
            } else {
                renderHistoryList();
            }
        }
    }
    
    // Make functions globally accessible
    window.chatPanel = {
        addUserMessage,
        addAIMessage,
        addSystemMessage,
        loadCustomModels,
        saveApiKey,
        refreshHistory: renderHistoryList
    };
});
