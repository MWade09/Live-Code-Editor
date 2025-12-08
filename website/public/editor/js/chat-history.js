/**
 * Chat History Manager
 * Handles saving, loading, and managing chat sessions.
 */

class ChatHistoryManager {
    constructor() {
        this.storageKey = 'live_editor_chat_history';
        this.currentChatId = null;
        this.chats = this.loadChats();
    }

    /**
     * Load chats from local storage
     */
    loadChats() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Failed to load chat history:', e);
            return {};
        }
    }

    /**
     * Save chats to local storage
     */
    saveChats() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.chats));
        } catch (e) {
            console.error('Failed to save chat history:', e);
        }
    }

    /**
     * Create a new chat session
     */
    createChat(title = 'New Chat') {
        const id = Date.now().toString();
        this.chats[id] = {
            id,
            title,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.currentChatId = id;
        this.saveChats();
        return id;
    }

    /**
     * Get a specific chat
     */
    getChat(id) {
        return this.chats[id];
    }

    /**
     * Get all chats sorted by date
     */
    getAllChats() {
        return Object.values(this.chats).sort((a, b) => b.updatedAt - a.updatedAt);
    }

    /**
     * Add a message to the current chat
     */
    addMessage(role, content, model = null) {
        if (!this.currentChatId) {
            this.createChat();
        }

        const chat = this.chats[this.currentChatId];
        const message = {
            id: Date.now().toString(),
            role,
            content,
            timestamp: Date.now(),
            model
        };

        chat.messages.push(message);
        chat.updatedAt = Date.now();
        
        // Update title if it's the first user message and title is default
        if (role === 'user' && chat.messages.filter(m => m.role === 'user').length === 1 && chat.title === 'New Chat') {
            chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
        }

        this.saveChats();
        return message;
    }

    /**
     * Delete a chat
     */
    deleteChat(id) {
        if (this.chats[id]) {
            delete this.chats[id];
            this.saveChats();
            if (this.currentChatId === id) {
                this.currentChatId = null;
            }
            return true;
        }
        return false;
    }

    /**
     * Clear all history
     */
    clearAll() {
        this.chats = {};
        this.currentChatId = null;
        this.saveChats();
    }
    
    /**
     * Set current chat ID
     */
    setCurrentChat(id) {
        if (this.chats[id]) {
            this.currentChatId = id;
            return true;
        }
        return false;
    }
    
    /**
     * Get current chat
     */
    getCurrentChat() {
        return this.currentChatId ? this.chats[this.currentChatId] : null;
    }
}

// Export as global instance
window.chatHistory = new ChatHistoryManager();
