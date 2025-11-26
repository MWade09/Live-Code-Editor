/**
 * EmbeddingsManager - Hybrid embeddings system for intelligent context retrieval
 * 
 * Features:
 * - IndexedDB for fast local caching (per-project)
 * - Supabase pgvector for persistent cloud storage
 * - Background Web Worker for non-blocking embedding generation
 * - Project-switching logic with clean swap
 * - Semantic similarity search for relevant file retrieval
 * 
 * Architecture:
 * - Local-first: Check IndexedDB cache first
 * - Cloud backup: Sync to Supabase for persistence
 * - Lazy generation: Generate embeddings on first AI query or background
 */
export class EmbeddingsManager {
    constructor(fileManager, projectSyncManager = null) {
        console.log('🧠 EmbeddingsManager: Initializing hybrid embeddings system...');
        
        this.fileManager = fileManager;
        this.projectSyncManager = projectSyncManager;
        
        // Current project context
        this.currentProjectId = null;
        this.embeddings = new Map(); // file path -> { embedding, content, hash }
        
        // IndexedDB configuration
        this.dbName = 'LiveEditorEmbeddings';
        this.dbVersion = 1;
        this.db = null;
        
        // Web Worker for background processing
        this.worker = null;
        this.workerReady = false;
        this.pendingRequests = new Map();
        this.requestId = 0;
        
        // Embedding configuration
        this.embeddingModel = 'text-embedding-3-small'; // OpenAI model via OpenRouter
        this.embeddingDimension = 1536;
        this.chunkSize = 1000; // Characters per chunk
        this.chunkOverlap = 200; // Overlap between chunks
        
        // State tracking
        this.isGenerating = false;
        this.generationProgress = { current: 0, total: 0 };
        this.lastSyncTime = null;
        
        // API configuration
        this.apiEndpoint = '/api/embeddings';
        
        // Initialize
        this.initIndexedDB();
        this.initWorker();
        
        // Listen for project changes
        this.setupProjectChangeListener();
        
        console.log('✅ EmbeddingsManager: Initialized');
    }
    
    /**
     * Initialize IndexedDB for local caching
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('[EmbeddingsManager] IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('[EmbeddingsManager] IndexedDB connected');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create embeddings store
                if (!db.objectStoreNames.contains('embeddings')) {
                    const embeddingsStore = db.createObjectStore('embeddings', { 
                        keyPath: ['projectId', 'filePath', 'chunkIndex'] 
                    });
                    embeddingsStore.createIndex('projectId', 'projectId', { unique: false });
                    embeddingsStore.createIndex('filePath', ['projectId', 'filePath'], { unique: false });
                }
                
                // Create project metadata store
                if (!db.objectStoreNames.contains('projectMeta')) {
                    const metaStore = db.createObjectStore('projectMeta', { keyPath: 'projectId' });
                    metaStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
                }
                
                console.log('[EmbeddingsManager] IndexedDB schema created');
            };
        });
    }
    
    /**
     * Initialize Web Worker for background embedding generation
     */
    initWorker() {
        try {
            // Check if Web Workers are supported
            if (typeof Worker === 'undefined') {
                console.warn('[EmbeddingsManager] Web Workers not supported, using main thread');
                return;
            }
            
            // Create worker from blob (inline worker code)
            const workerCode = this.getWorkerCode();
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            this.worker = new Worker(workerUrl);
            
            this.worker.onmessage = (event) => {
                this.handleWorkerMessage(event.data);
            };
            
            this.worker.onerror = (error) => {
                console.error('[EmbeddingsManager] Worker error:', error);
            };
            
            this.workerReady = true;
            console.log('[EmbeddingsManager] Web Worker initialized');
            
        } catch (error) {
            console.warn('[EmbeddingsManager] Failed to initialize worker:', error);
        }
    }
    
    /**
     * Get Web Worker code as string
     */
    getWorkerCode() {
        return `
            // Embeddings Web Worker
            // Handles chunking and embedding requests in background
            
            self.onmessage = async function(event) {
                const { id, type, data } = event.data;
                
                try {
                    switch (type) {
                        case 'chunk':
                            const chunks = chunkText(data.content, data.chunkSize, data.overlap);
                            self.postMessage({ id, type: 'chunk-result', data: chunks });
                            break;
                            
                        case 'hash':
                            const hash = await hashContent(data.content);
                            self.postMessage({ id, type: 'hash-result', data: hash });
                            break;
                            
                        case 'similarity':
                            const scores = computeSimilarity(data.query, data.embeddings);
                            self.postMessage({ id, type: 'similarity-result', data: scores });
                            break;
                            
                        default:
                            self.postMessage({ id, type: 'error', error: 'Unknown message type' });
                    }
                } catch (error) {
                    self.postMessage({ id, type: 'error', error: error.message });
                }
            };
            
            function chunkText(text, chunkSize, overlap) {
                const chunks = [];
                const lines = text.split('\\n');
                let currentChunk = '';
                let currentLength = 0;
                let chunkIndex = 0;
                
                for (const line of lines) {
                    if (currentLength + line.length > chunkSize && currentChunk) {
                        chunks.push({
                            index: chunkIndex++,
                            content: currentChunk.trim(),
                            startLine: chunks.length > 0 ? chunks[chunks.length - 1].endLine + 1 : 0
                        });
                        
                        // Keep overlap
                        const overlapLines = currentChunk.split('\\n').slice(-3).join('\\n');
                        currentChunk = overlapLines + '\\n' + line;
                        currentLength = currentChunk.length;
                    } else {
                        currentChunk += (currentChunk ? '\\n' : '') + line;
                        currentLength = currentChunk.length;
                    }
                }
                
                if (currentChunk.trim()) {
                    chunks.push({
                        index: chunkIndex,
                        content: currentChunk.trim()
                    });
                }
                
                return chunks;
            }
            
            async function hashContent(content) {
                const encoder = new TextEncoder();
                const data = encoder.encode(content);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
            
            function computeSimilarity(queryEmbedding, embeddings) {
                return embeddings.map(item => ({
                    ...item,
                    score: cosineSimilarity(queryEmbedding, item.embedding)
                })).sort((a, b) => b.score - a.score);
            }
            
            function cosineSimilarity(a, b) {
                if (!a || !b || a.length !== b.length) return 0;
                
                let dotProduct = 0;
                let normA = 0;
                let normB = 0;
                
                for (let i = 0; i < a.length; i++) {
                    dotProduct += a[i] * b[i];
                    normA += a[i] * a[i];
                    normB += b[i] * b[i];
                }
                
                return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
            }
        `;
    }
    
    /**
     * Handle messages from Web Worker
     */
    handleWorkerMessage(message) {
        const { id, data, error } = message;
        
        const pending = this.pendingRequests.get(id);
        if (!pending) return;
        
        this.pendingRequests.delete(id);
        
        if (error) {
            pending.reject(new Error(error));
        } else {
            pending.resolve(data);
        }
    }
    
    /**
     * Send message to worker and await response
     */
    async workerRequest(type, data) {
        if (!this.worker || !this.workerReady) {
            // Fallback to main thread
            return this.handleRequestMainThread(type, data);
        }
        
        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            this.pendingRequests.set(id, { resolve, reject });
            this.worker.postMessage({ id, type, data });
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Worker request timeout'));
                }
            }, 30000);
        });
    }
    
    /**
     * Fallback handler for main thread execution
     */
    handleRequestMainThread(type, data) {
        switch (type) {
            case 'chunk':
                return this.chunkTextMainThread(data.content, data.chunkSize, data.overlap);
            case 'hash':
                return this.hashContentMainThread(data.content);
            case 'similarity':
                return this.computeSimilarityMainThread(data.query, data.embeddings);
            default:
                throw new Error('Unknown request type');
        }
    }
    
    /**
     * Main thread chunking fallback
     * @param {string} text - The text to chunk
     * @param {number} chunkSize - Maximum characters per chunk
     * @param {number} overlapLines - Number of lines to overlap between chunks
     */
    chunkTextMainThread(text, chunkSize, overlapLines = 3) {
        const chunks = [];
        const lines = text.split('\n');
        let currentChunk = '';
        let chunkIndex = 0;
        
        for (const line of lines) {
            if (currentChunk.length + line.length > chunkSize && currentChunk) {
                chunks.push({
                    index: chunkIndex++,
                    content: currentChunk.trim()
                });
                
                // Keep specified number of lines as overlap for context
                const overlapContent = currentChunk.split('\n').slice(-overlapLines).join('\n');
                currentChunk = overlapContent + '\n' + line;
            } else {
                currentChunk += (currentChunk ? '\n' : '') + line;
            }
        }
        
        if (currentChunk.trim()) {
            chunks.push({
                index: chunkIndex,
                content: currentChunk.trim()
            });
        }
        
        return chunks;
    }
    
    /**
     * Main thread hashing fallback
     */
    async hashContentMainThread(content) {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Main thread similarity computation fallback
     */
    computeSimilarityMainThread(queryEmbedding, embeddings) {
        return embeddings.map(item => ({
            ...item,
            score: this.cosineSimilarity(queryEmbedding, item.embedding)
        })).sort((a, b) => b.score - a.score);
    }
    
    /**
     * Cosine similarity between two vectors
     */
    cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    /**
     * Setup listener for project changes
     */
    setupProjectChangeListener() {
        // Listen for project load events from ProjectSyncManager
        document.addEventListener('projectLoaded', async (event) => {
            const { projectId } = event.detail || {};
            if (projectId && projectId !== this.currentProjectId) {
                await this.switchProject(projectId);
            }
        });
    }
    
    /**
     * Switch to a different project (clean swap)
     */
    async switchProject(newProjectId) {
        console.log(`[EmbeddingsManager] Switching from project ${this.currentProjectId} to ${newProjectId}`);
        
        // Save current project embeddings if dirty
        if (this.currentProjectId && this.embeddings.size > 0) {
            await this.saveToIndexedDB(this.currentProjectId);
        }
        
        // Clear in-memory cache
        this.embeddings.clear();
        
        // Load new project embeddings
        this.currentProjectId = newProjectId;
        await this.loadFromIndexedDB(newProjectId);
        
        // Check if we need to sync from cloud
        const localMeta = await this.getProjectMeta(newProjectId);
        if (!localMeta || this.embeddings.size === 0) {
            // Try loading from Supabase
            await this.loadFromSupabase(newProjectId);
        }
        
        console.log(`[EmbeddingsManager] Project ${newProjectId} loaded with ${this.embeddings.size} embeddings`);
    }
    
    /**
     * Get project metadata from IndexedDB
     */
    async getProjectMeta(projectId) {
        if (!this.db) await this.initIndexedDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projectMeta'], 'readonly');
            const store = transaction.objectStore('projectMeta');
            const request = store.get(projectId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Save embeddings to IndexedDB
     */
    async saveToIndexedDB(projectId) {
        if (!this.db) await this.initIndexedDB();
        
        const transaction = this.db.transaction(['embeddings', 'projectMeta'], 'readwrite');
        const embeddingsStore = transaction.objectStore('embeddings');
        const metaStore = transaction.objectStore('projectMeta');
        
        // Save each embedding
        for (const [filePath, data] of this.embeddings) {
            for (const chunk of data.chunks || [data]) {
                await new Promise((resolve, reject) => {
                    const request = embeddingsStore.put({
                        projectId,
                        filePath,
                        chunkIndex: chunk.index || 0,
                        content: chunk.content,
                        embedding: chunk.embedding,
                        contentHash: data.hash,
                        updatedAt: Date.now()
                    });
                    request.onsuccess = resolve;
                    request.onerror = reject;
                });
            }
        }
        
        // Update project metadata
        await new Promise((resolve, reject) => {
            const request = metaStore.put({
                projectId,
                lastUpdated: Date.now(),
                fileCount: this.embeddings.size
            });
            request.onsuccess = resolve;
            request.onerror = reject;
        });
        
        console.log(`[EmbeddingsManager] Saved ${this.embeddings.size} file embeddings to IndexedDB`);
    }
    
    /**
     * Load embeddings from IndexedDB
     */
    async loadFromIndexedDB(projectId) {
        if (!this.db) await this.initIndexedDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['embeddings'], 'readonly');
            const store = transaction.objectStore('embeddings');
            const index = store.index('projectId');
            const request = index.getAll(projectId);
            
            request.onsuccess = () => {
                const results = request.result || [];
                
                // Group by file path
                const byFile = new Map();
                for (const item of results) {
                    if (!byFile.has(item.filePath)) {
                        byFile.set(item.filePath, {
                            hash: item.contentHash,
                            chunks: []
                        });
                    }
                    byFile.get(item.filePath).chunks.push({
                        index: item.chunkIndex,
                        content: item.content,
                        embedding: item.embedding
                    });
                }
                
                this.embeddings = byFile;
                console.log(`[EmbeddingsManager] Loaded ${byFile.size} files from IndexedDB`);
                resolve(byFile);
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Load embeddings from Supabase
     */
    async loadFromSupabase(projectId) {
        try {
            const response = await fetch(`${this.apiEndpoint}/project/${projectId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn('[EmbeddingsManager] Failed to load from Supabase:', response.status);
                return;
            }
            
            const data = await response.json();
            
            if (data.embeddings && data.embeddings.length > 0) {
                // Group by file path
                const byFile = new Map();
                for (const item of data.embeddings) {
                    if (!byFile.has(item.file_path)) {
                        byFile.set(item.file_path, {
                            hash: item.content_hash,
                            chunks: []
                        });
                    }
                    byFile.get(item.file_path).chunks.push({
                        index: item.chunk_index,
                        content: item.content,
                        embedding: item.embedding
                    });
                }
                
                this.embeddings = byFile;
                
                // Cache locally
                await this.saveToIndexedDB(projectId);
                
                console.log(`[EmbeddingsManager] Loaded ${byFile.size} files from Supabase`);
            }
        } catch (error) {
            console.warn('[EmbeddingsManager] Supabase load error:', error);
        }
    }
    
    /**
     * Generate embeddings for all project files
     */
    async generateProjectEmbeddings(options = {}) {
        const { force = false, onProgress = null } = options;
        
        if (this.isGenerating) {
            console.warn('[EmbeddingsManager] Generation already in progress');
            return;
        }
        
        this.isGenerating = true;
        const files = this.fileManager.files || [];
        this.generationProgress = { current: 0, total: files.length };
        
        console.log(`[EmbeddingsManager] Generating embeddings for ${files.length} files...`);
        
        try {
            for (const file of files) {
                // Skip if already embedded and not forced
                if (!force && this.embeddings.has(file.name)) {
                    const existing = this.embeddings.get(file.name);
                    const currentHash = await this.hashContentMainThread(file.content);
                    
                    if (existing.hash === currentHash) {
                        this.generationProgress.current++;
                        if (onProgress) onProgress(this.generationProgress);
                        continue;
                    }
                }
                
                // Generate embedding for file
                await this.generateFileEmbedding(file);
                
                this.generationProgress.current++;
                if (onProgress) onProgress(this.generationProgress);
            }
            
            // Save to IndexedDB
            if (this.currentProjectId) {
                await this.saveToIndexedDB(this.currentProjectId);
                
                // Sync to Supabase in background
                this.syncToSupabase(this.currentProjectId).catch(console.warn);
            }
            
            console.log(`[EmbeddingsManager] Generated embeddings for ${files.length} files`);
            
        } finally {
            this.isGenerating = false;
        }
    }
    
    /**
     * Generate embedding for a single file
     */
    async generateFileEmbedding(file) {
        const content = file.content || '';
        
        // Skip empty files
        if (!content.trim()) {
            return null;
        }
        
        // Compute content hash
        const hash = await this.workerRequest('hash', { content });
        
        // Chunk the content
        const chunks = await this.workerRequest('chunk', {
            content,
            chunkSize: this.chunkSize,
            overlap: this.chunkOverlap
        });
        
        // Generate embeddings for each chunk
        const embeddedChunks = [];
        
        for (const chunk of chunks) {
            try {
                const embedding = await this.callEmbeddingAPI(chunk.content);
                embeddedChunks.push({
                    ...chunk,
                    embedding
                });
            } catch (error) {
                console.warn(`[EmbeddingsManager] Failed to embed chunk for ${file.name}:`, error);
            }
        }
        
        // Store in memory
        this.embeddings.set(file.name, {
            hash,
            chunks: embeddedChunks
        });
        
        return embeddedChunks;
    }
    
    /**
     * Call embedding API
     */
    async callEmbeddingAPI(text) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                model: this.embeddingModel
            })
        });
        
        if (!response.ok) {
            throw new Error(`Embedding API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.embedding;
    }
    
    /**
     * Sync embeddings to Supabase
     */
    async syncToSupabase(projectId) {
        if (!projectId || this.embeddings.size === 0) return;
        
        try {
            const embeddings = [];
            
            for (const [filePath, data] of this.embeddings) {
                for (const chunk of data.chunks || []) {
                    embeddings.push({
                        project_id: projectId,
                        file_path: filePath,
                        chunk_index: chunk.index,
                        content: chunk.content,
                        embedding: chunk.embedding,
                        content_hash: data.hash
                    });
                }
            }
            
            const response = await fetch(`${this.apiEndpoint}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    projectId,
                    embeddings
                })
            });
            
            if (response.ok) {
                this.lastSyncTime = Date.now();
                console.log(`[EmbeddingsManager] Synced ${embeddings.length} embeddings to Supabase`);
            }
            
        } catch (error) {
            console.warn('[EmbeddingsManager] Supabase sync error:', error);
        }
    }
    
    /**
     * Search for relevant files based on query
     */
    async searchRelevantFiles(query, options = {}) {
        const { topK = 5, minScore = 0.3 } = options;
        
        // Ensure embeddings exist
        if (this.embeddings.size === 0) {
            console.log('[EmbeddingsManager] No embeddings, generating...');
            await this.generateProjectEmbeddings();
        }
        
        // Generate query embedding
        const queryEmbedding = await this.callEmbeddingAPI(query);
        
        // Collect all chunks with their file info
        const allChunks = [];
        for (const [filePath, data] of this.embeddings) {
            for (const chunk of data.chunks || []) {
                if (chunk.embedding) {
                    allChunks.push({
                        filePath,
                        chunkIndex: chunk.index,
                        content: chunk.content,
                        embedding: chunk.embedding
                    });
                }
            }
        }
        
        // Compute similarities
        const results = await this.workerRequest('similarity', {
            query: queryEmbedding,
            embeddings: allChunks
        });
        
        // Filter and deduplicate by file
        const seenFiles = new Set();
        const relevantFiles = [];
        
        for (const result of results) {
            if (result.score < minScore) break;
            if (seenFiles.has(result.filePath)) continue;
            
            seenFiles.add(result.filePath);
            relevantFiles.push({
                filePath: result.filePath,
                score: result.score,
                matchedContent: result.content
            });
            
            if (relevantFiles.length >= topK) break;
        }
        
        console.log(`[EmbeddingsManager] Found ${relevantFiles.length} relevant files for query`);
        return relevantFiles;
    }
    
    /**
     * Get suggested context files for a user message
     */
    async getSuggestedContext(userMessage, options = {}) {
        const { maxFiles = 5, maxTotalSize = 50000 } = options;
        
        try {
            const relevantFiles = await this.searchRelevantFiles(userMessage, { topK: maxFiles * 2 });
            
            // Get full file content and respect size limit
            const contextFiles = [];
            let totalSize = 0;
            
            for (const result of relevantFiles) {
                const file = this.fileManager.files.find(f => f.name === result.filePath);
                if (!file) continue;
                
                const fileSize = file.content.length;
                if (totalSize + fileSize > maxTotalSize) {
                    // File too large, try to include just the relevant chunk
                    if (result.matchedContent && result.matchedContent.length < maxTotalSize - totalSize) {
                        contextFiles.push({
                            name: file.name,
                            content: result.matchedContent,
                            score: result.score,
                            isPartial: true
                        });
                        totalSize += result.matchedContent.length;
                    }
                    continue;
                }
                
                contextFiles.push({
                    name: file.name,
                    content: file.content,
                    score: result.score,
                    isPartial: false
                });
                totalSize += fileSize;
                
                if (contextFiles.length >= maxFiles) break;
            }
            
            return {
                files: contextFiles,
                totalSize,
                searchQuery: userMessage
            };
            
        } catch (error) {
            console.warn('[EmbeddingsManager] Context suggestion error:', error);
            return { files: [], totalSize: 0, error: error.message };
        }
    }
    
    /**
     * Clear all embeddings for current project
     */
    async clearProjectEmbeddings() {
        this.embeddings.clear();
        
        if (this.currentProjectId && this.db) {
            const transaction = this.db.transaction(['embeddings', 'projectMeta'], 'readwrite');
            const embeddingsStore = transaction.objectStore('embeddings');
            const metaStore = transaction.objectStore('projectMeta');
            
            // Delete all embeddings for this project
            const index = embeddingsStore.index('projectId');
            const request = index.openCursor(this.currentProjectId);
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
            
            // Delete project metadata
            metaStore.delete(this.currentProjectId);
        }
        
        console.log('[EmbeddingsManager] Cleared project embeddings');
    }
    
    /**
     * Get embedding status for UI
     */
    getStatus() {
        return {
            isGenerating: this.isGenerating,
            progress: this.generationProgress,
            embeddedFileCount: this.embeddings.size,
            currentProjectId: this.currentProjectId,
            lastSyncTime: this.lastSyncTime,
            hasWorker: this.workerReady
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        this.embeddings.clear();
        this.pendingRequests.clear();
        
        console.log('[EmbeddingsManager] Destroyed');
    }
}
