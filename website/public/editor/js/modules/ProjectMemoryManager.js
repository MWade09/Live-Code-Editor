/**
 * ProjectMemoryManager - Cross-Session AI Memory System
 * 
 * Phase 6 Implementation: Cursor-Level AI Roadmap
 * 
 * Features:
 * - Conversation summarization for long-term memory
 * - Project-specific memory storage in Supabase
 * - "Remember this" explicit memory creation
 * - Semantic memory retrieval for context
 * - Memory importance scoring and decay
 * - Memory management UI integration
 * 
 * Memory Types:
 * - conversation: Auto-summarized from chat history
 * - explicit: User-created "remember this" memories
 * - learned: AI-discovered patterns and preferences
 */
export class ProjectMemoryManager {
    // Memory types
    static MEMORY_TYPES = {
        CONVERSATION: 'conversation',
        EXPLICIT: 'explicit',
        LEARNED: 'learned'
    };

    // Memory importance levels
    static IMPORTANCE = {
        LOW: 0.3,
        MEDIUM: 0.5,
        HIGH: 0.7,
        CRITICAL: 0.9
    };

    constructor(projectSyncManager = null, embeddingsManager = null) {
        console.log('🧠 ProjectMemoryManager: Initializing memory system...');
        
        this.projectSyncManager = projectSyncManager;
        this.embeddingsManager = embeddingsManager;
        
        // Current project context
        this.currentProjectId = null;
        this.currentUserId = null;
        
        // Memory cache
        this.memoryCache = new Map();
        this.memoryCacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.lastCacheUpdate = null;
        
        // Local storage for offline support
        this.localStorageKey = 'project_memories';
        
        // Configuration
        this.config = {
            maxMemoriesPerProject: 100,
            summarizationThreshold: 10, // Summarize after 10 messages
            memoryDecayDays: 30,        // Reduce importance after 30 days
            minImportanceToKeep: 0.1,   // Delete below this
            maxRetrievedMemories: 5,    // Max memories to include in context
            autoSummarizeEnabled: true
        };
        
        // Summarization state
        this.pendingMessages = [];
        this.lastSummarization = null;
        
        // API endpoint
        this.apiBase = '/api';
        
        console.log('✅ ProjectMemoryManager: Ready');
    }

    /**
     * Initialize for a specific project
     */
    async initializeForProject(projectId, userId) {
        console.log(`[Memory] Initializing for project: ${projectId}`);
        
        this.currentProjectId = projectId;
        this.currentUserId = userId;
        
        // Load memories from cache or server
        await this.loadMemories();
        
        // Start decay check
        this.startDecayCheck();
    }

    /**
     * Load memories for current project
     */
    async loadMemories() {
        if (!this.currentProjectId) {
            console.warn('[Memory] No project ID set');
            return [];
        }

        // Check cache first
        const cacheKey = this.currentProjectId;
        const cached = this.memoryCache.get(cacheKey);
        
        if (cached && Date.now() - this.lastCacheUpdate < this.memoryCacheExpiry) {
            return cached;
        }

        try {
            // Try to load from server
            const memories = await this.fetchMemoriesFromServer();
            
            // Update cache
            this.memoryCache.set(cacheKey, memories);
            this.lastCacheUpdate = Date.now();
            
            // Also save to local storage for offline
            this.saveToLocalStorage(memories);
            
            return memories;
        } catch (error) {
            console.warn('[Memory] Failed to load from server, using local:', error);
            return this.loadFromLocalStorage();
        }
    }

    /**
     * Fetch memories from Supabase
     */
    async fetchMemoriesFromServer() {
        const response = await fetch(`${this.apiBase}/memories?project_id=${this.currentProjectId}`, {
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch memories: ${response.status}`);
        }
        
        const data = await response.json();
        return data.memories || [];
    }

    /**
     * Create a new memory
     */
    async createMemory(content, type = ProjectMemoryManager.MEMORY_TYPES.EXPLICIT, importance = ProjectMemoryManager.IMPORTANCE.MEDIUM) {
        const memory = {
            id: this.generateId(),
            project_id: this.currentProjectId,
            user_id: this.currentUserId,
            memory_type: type,
            content: content,
            importance: importance,
            created_at: new Date().toISOString(),
            last_accessed: new Date().toISOString()
        };

        console.log(`[Memory] Creating ${type} memory:`, content.substring(0, 50) + '...');

        try {
            // Generate embedding if available
            if (this.embeddingsManager) {
                memory.embedding = await this.embeddingsManager.generateEmbedding(content);
            }

            // Save to server
            const saved = await this.saveMemoryToServer(memory);
            
            // Update cache
            const memories = this.memoryCache.get(this.currentProjectId) || [];
            memories.push(saved);
            this.memoryCache.set(this.currentProjectId, memories);
            
            // Save locally
            this.saveToLocalStorage(memories);
            
            // Emit event
            this.dispatchMemoryEvent('memoryCreated', saved);
            
            return saved;
        } catch (error) {
            console.error('[Memory] Failed to create memory:', error);
            
            // Save locally for later sync
            this.saveOfflineMemory(memory);
            return memory;
        }
    }

    /**
     * Create an explicit "Remember this" memory from user
     */
    async rememberThis(content, importance = ProjectMemoryManager.IMPORTANCE.HIGH) {
        return this.createMemory(
            content,
            ProjectMemoryManager.MEMORY_TYPES.EXPLICIT,
            importance
        );
    }

    /**
     * Summarize conversation and create memory
     */
    async summarizeConversation(messages) {
        if (!messages || messages.length < this.config.summarizationThreshold) {
            return null;
        }

        console.log(`[Memory] Summarizing ${messages.length} messages`);

        // Build prompt for summarization
        const conversationText = messages.map(m => 
            `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`
        ).join('\n\n');

        const summaryPrompt = `Summarize the key points from this conversation that would be useful to remember for future sessions. Focus on:
- User's coding preferences and patterns
- Project decisions made
- Problems solved and solutions used
- Any explicit requests to remember something

Conversation:
${conversationText}

Provide a concise summary (2-3 sentences) of the most important points to remember:`;

        try {
            // Call AI for summarization (use a fast model)
            const summary = await this.callAIForSummary(summaryPrompt);
            
            if (summary && summary.trim()) {
                // Create conversation memory
                const memory = await this.createMemory(
                    summary,
                    ProjectMemoryManager.MEMORY_TYPES.CONVERSATION,
                    ProjectMemoryManager.IMPORTANCE.MEDIUM
                );
                
                this.lastSummarization = new Date();
                this.pendingMessages = [];
                
                return memory;
            }
        } catch (error) {
            console.error('[Memory] Failed to summarize:', error);
        }
        
        return null;
    }

    /**
     * Call AI for summarization
     */
    async callAIForSummary(prompt) {
        try {
            const response = await fetch('/api/ai/free', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-chat-v3-0324:free',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant that creates concise summaries.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 200
                })
            });

            if (!response.ok) {
                throw new Error('Summarization API failed');
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('[Memory] Summarization failed:', error);
            return null;
        }
    }

    /**
     * Track message for potential summarization
     */
    trackMessage(message) {
        if (!this.config.autoSummarizeEnabled) return;
        
        this.pendingMessages.push({
            ...message,
            timestamp: new Date().toISOString()
        });

        // Check if we should summarize
        if (this.pendingMessages.length >= this.config.summarizationThreshold) {
            // Debounce summarization
            if (this._summarizeTimeout) {
                clearTimeout(this._summarizeTimeout);
            }
            
            this._summarizeTimeout = setTimeout(() => {
                this.summarizeConversation(this.pendingMessages);
            }, 30000); // Wait 30s after last message
        }
    }

    /**
     * Retrieve relevant memories for a query
     */
    async retrieveRelevantMemories(query, maxResults = null) {
        maxResults = maxResults || this.config.maxRetrievedMemories;
        
        const memories = await this.loadMemories();
        
        if (!memories || memories.length === 0) {
            return [];
        }

        console.log(`[Memory] Searching ${memories.length} memories for: "${query.substring(0, 30)}..."`);

        // If we have embeddings, use semantic search
        if (this.embeddingsManager) {
            try {
                const queryEmbedding = await this.embeddingsManager.generateEmbedding(query);
                
                // Score each memory by similarity
                const scored = memories.map(memory => {
                    let score = 0;
                    
                    if (memory.embedding) {
                        score = this.cosineSimilarity(queryEmbedding, memory.embedding);
                    } else {
                        // Fallback to keyword matching
                        score = this.keywordSimilarity(query, memory.content);
                    }
                    
                    // Boost by importance
                    score *= (0.5 + memory.importance * 0.5);
                    
                    // Decay by age
                    const ageInDays = (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
                    if (ageInDays > this.config.memoryDecayDays) {
                        score *= 0.8;
                    }
                    
                    return { memory, score };
                });

                // Sort and filter
                scored.sort((a, b) => b.score - a.score);
                const relevant = scored
                    .filter(s => s.score > 0.3)
                    .slice(0, maxResults);

                // Update last_accessed for retrieved memories
                for (const { memory } of relevant) {
                    this.updateLastAccessed(memory.id);
                }

                return relevant.map(s => ({
                    ...s.memory,
                    relevanceScore: s.score
                }));
            } catch (error) {
                console.warn('[Memory] Semantic search failed, using fallback:', error);
            }
        }

        // Fallback to keyword-based retrieval
        return this.keywordSearch(query, memories, maxResults);
    }

    /**
     * Keyword-based search fallback
     */
    keywordSearch(query, memories, maxResults) {
        const queryWords = query.toLowerCase().split(/\s+/);
        
        const scored = memories.map(memory => {
            const contentWords = memory.content.toLowerCase().split(/\s+/);
            let matches = 0;
            
            for (const word of queryWords) {
                if (contentWords.some(w => w.includes(word) || word.includes(w))) {
                    matches++;
                }
            }
            
            const score = matches / queryWords.length;
            return { memory, score };
        });

        scored.sort((a, b) => b.score - a.score);
        
        return scored
            .filter(s => s.score > 0.2)
            .slice(0, maxResults)
            .map(s => ({
                ...s.memory,
                relevanceScore: s.score
            }));
    }

    /**
     * Keyword similarity score
     */
    keywordSimilarity(query, content) {
        const queryWords = new Set(query.toLowerCase().split(/\s+/));
        const contentWords = new Set(content.toLowerCase().split(/\s+/));
        
        let intersection = 0;
        for (const word of queryWords) {
            if (contentWords.has(word)) {
                intersection++;
            }
        }
        
        return intersection / Math.max(queryWords.size, 1);
    }

    /**
     * Cosine similarity between embeddings
     */
    cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) {
            return 0;
        }
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    /**
     * Build memory context for AI prompt
     */
    async buildMemoryContext(query) {
        const memories = await this.retrieveRelevantMemories(query);
        
        if (!memories || memories.length === 0) {
            return null;
        }

        let context = '=== PROJECT MEMORY ===\n';
        context += 'The following are relevant memories from previous sessions:\n\n';

        for (const memory of memories) {
            const typeLabel = memory.memory_type === 'explicit' ? '📌 User Note' :
                             memory.memory_type === 'learned' ? '🧠 Learned' :
                             '💬 Previous Session';
            
            const date = new Date(memory.created_at).toLocaleDateString();
            context += `${typeLabel} (${date}):\n${memory.content}\n\n`;
        }

        return context;
    }

    /**
     * Update memory importance
     */
    async updateImportance(memoryId, newImportance) {
        try {
            await fetch(`${this.apiBase}/memories/${memoryId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({ importance: newImportance })
            });

            // Update cache
            const memories = this.memoryCache.get(this.currentProjectId) || [];
            const memory = memories.find(m => m.id === memoryId);
            if (memory) {
                memory.importance = newImportance;
                this.saveToLocalStorage(memories);
            }
        } catch (error) {
            console.error('[Memory] Failed to update importance:', error);
        }
    }

    /**
     * Update last accessed time
     */
    async updateLastAccessed(memoryId) {
        // Update locally first
        const memories = this.memoryCache.get(this.currentProjectId) || [];
        const memory = memories.find(m => m.id === memoryId);
        if (memory) {
            memory.last_accessed = new Date().toISOString();
        }

        // Update on server (fire and forget)
        fetch(`${this.apiBase}/memories/${memoryId}/accessed`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        }).catch(() => {});
    }

    /**
     * Delete a memory
     */
    async deleteMemory(memoryId) {
        try {
            await fetch(`${this.apiBase}/memories/${memoryId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            // Update cache
            const memories = this.memoryCache.get(this.currentProjectId) || [];
            const index = memories.findIndex(m => m.id === memoryId);
            if (index >= 0) {
                memories.splice(index, 1);
                this.memoryCache.set(this.currentProjectId, memories);
                this.saveToLocalStorage(memories);
            }

            this.dispatchMemoryEvent('memoryDeleted', { id: memoryId });
        } catch (error) {
            console.error('[Memory] Failed to delete memory:', error);
        }
    }

    /**
     * Clear all memories for current project
     */
    async clearProjectMemories() {
        if (!this.currentProjectId) return;

        try {
            await fetch(`${this.apiBase}/memories?project_id=${this.currentProjectId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            this.memoryCache.delete(this.currentProjectId);
            this.saveToLocalStorage([]);

            this.dispatchMemoryEvent('memoriesCleared', { projectId: this.currentProjectId });
        } catch (error) {
            console.error('[Memory] Failed to clear memories:', error);
        }
    }

    /**
     * Apply memory decay based on age and access
     */
    async applyMemoryDecay() {
        const memories = await this.loadMemories();
        const now = Date.now();
        const decayThreshold = this.config.memoryDecayDays * 24 * 60 * 60 * 1000;

        for (const memory of memories) {
            const lastAccess = new Date(memory.last_accessed).getTime();
            const age = now - lastAccess;

            if (age > decayThreshold) {
                // Reduce importance
                const decayFactor = Math.min(age / decayThreshold, 2);
                const newImportance = memory.importance * (1 / decayFactor);

                if (newImportance < this.config.minImportanceToKeep) {
                    // Delete memory
                    await this.deleteMemory(memory.id);
                    console.log(`[Memory] Deleted decayed memory: ${memory.id}`);
                } else if (newImportance < memory.importance) {
                    // Update importance
                    await this.updateImportance(memory.id, newImportance);
                }
            }
        }
    }

    /**
     * Start periodic decay check
     */
    startDecayCheck() {
        // Run decay check every hour
        if (this._decayInterval) {
            clearInterval(this._decayInterval);
        }

        this._decayInterval = setInterval(() => {
            this.applyMemoryDecay();
        }, 60 * 60 * 1000);

        // Also run immediately
        setTimeout(() => this.applyMemoryDecay(), 5000);
    }

    /**
     * Get all memories for display
     */
    async getAllMemories() {
        return this.loadMemories();
    }

    /**
     * Get memory statistics
     */
    async getMemoryStats() {
        const memories = await this.loadMemories();
        
        const stats = {
            total: memories.length,
            byType: {
                conversation: 0,
                explicit: 0,
                learned: 0
            },
            avgImportance: 0,
            oldestDate: null,
            newestDate: null
        };

        if (memories.length === 0) {
            return stats;
        }

        let totalImportance = 0;
        let oldest = new Date();
        let newest = new Date(0);

        for (const memory of memories) {
            stats.byType[memory.memory_type]++;
            totalImportance += memory.importance;

            const created = new Date(memory.created_at);
            if (created < oldest) oldest = created;
            if (created > newest) newest = created;
        }

        stats.avgImportance = totalImportance / memories.length;
        stats.oldestDate = oldest.toISOString();
        stats.newestDate = newest.toISOString();

        return stats;
    }

    /**
     * Save memory to server
     */
    async saveMemoryToServer(memory) {
        const response = await fetch(`${this.apiBase}/memories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders()
            },
            body: JSON.stringify(memory)
        });

        if (!response.ok) {
            throw new Error(`Failed to save memory: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Save offline memory for later sync
     */
    saveOfflineMemory(memory) {
        const offlineKey = `${this.localStorageKey}_offline`;
        const offline = JSON.parse(localStorage.getItem(offlineKey) || '[]');
        offline.push(memory);
        localStorage.setItem(offlineKey, JSON.stringify(offline));
    }

    /**
     * Sync offline memories
     */
    async syncOfflineMemories() {
        const offlineKey = `${this.localStorageKey}_offline`;
        const offline = JSON.parse(localStorage.getItem(offlineKey) || '[]');

        if (offline.length === 0) return;

        console.log(`[Memory] Syncing ${offline.length} offline memories`);

        const synced = [];
        for (const memory of offline) {
            try {
                await this.saveMemoryToServer(memory);
                synced.push(memory.id);
            } catch (error) {
                void error;
                console.warn('[Memory] Failed to sync:', memory.id);
            }
        }

        // Remove synced memories
        const remaining = offline.filter(m => !synced.includes(m.id));
        localStorage.setItem(offlineKey, JSON.stringify(remaining));
    }

    /**
     * Save to local storage
     */
    saveToLocalStorage(memories) {
        const key = `${this.localStorageKey}_${this.currentProjectId}`;
        try {
            localStorage.setItem(key, JSON.stringify(memories));
        } catch (error) {
            console.warn('[Memory] Failed to save to localStorage:', error);
            // Clear old data if storage is full
            this.cleanupLocalStorage();
        }
    }

    /**
     * Load from local storage
     */
    loadFromLocalStorage() {
        const key = `${this.localStorageKey}_${this.currentProjectId}`;
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (error) {
            void error;
            return [];
        }
    }

    /**
     * Cleanup old local storage data
     */
    cleanupLocalStorage() {
        const prefix = this.localStorageKey;
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }

        // Keep only current project
        for (const key of keys) {
            if (!key.includes(this.currentProjectId)) {
                localStorage.removeItem(key);
            }
        }
    }

    /**
     * Get auth headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem('auth_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'mem_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    /**
     * Dispatch memory event
     */
    dispatchMemoryEvent(type, detail) {
        const event = new CustomEvent(type, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        if (this._decayInterval) {
            clearInterval(this._decayInterval);
        }
        if (this._summarizeTimeout) {
            clearTimeout(this._summarizeTimeout);
        }
    }
}
