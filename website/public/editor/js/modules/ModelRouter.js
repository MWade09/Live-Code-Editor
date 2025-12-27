/**
 * ModelRouter - Intelligent Model Routing and Optimization
 * 
 * Phase 5 Implementation: Cursor-Level AI Roadmap
 * 
 * Features:
 * - Intent classification for fast routing
 * - Complexity scoring for model selection
 * - Fallback chains for API failures
 * - Performance metrics tracking
 * - Token counting and budget management
 * - Context optimization and compression
 * - Model-specific prompt templates
 * 
 * Model Tiers:
 * - FAST: Quick responses, intent detection, simple Q&A
 * - STANDARD: General coding tasks, explanations
 * - POWERFUL: Complex generation, multi-file operations
 */
export class ModelRouter {
    // Intent categories
    static INTENTS = {
        SIMPLE_QUESTION: 'simple_question',      // "What is X?"
        CODE_EXPLANATION: 'code_explanation',    // "Explain this code"
        CODE_GENERATION: 'code_generation',      // "Write a function that..."
        CODE_REFACTOR: 'code_refactor',          // "Refactor this to..."
        BUG_FIX: 'bug_fix',                      // "Fix this error..."
        MULTI_FILE: 'multi_file',                // Multiple file operations
        PLANNING: 'planning',                    // Project planning, architecture
        TERMINAL: 'terminal',                    // Terminal commands
        CHAT: 'chat'                             // General conversation
    };

    // Model tiers
    static TIERS = {
        FAST: 'fast',
        STANDARD: 'standard',
        POWERFUL: 'powerful'
    };

    constructor() {
        console.log('🧠 ModelRouter: Initializing intelligent routing...');
        
        // Model configurations
        this.models = {
            fast: [
                { id: 'nex-agi/deepseek-v3.1-nex-n1:free', name: 'DeepSeek Chat', free: true, maxTokens: 4000 },
                { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', free: true, maxTokens: 4000 }
            ],
            standard: [
                { id: 'nex-agi/deepseek-v3.1-nex-n1:free', name: 'DeepSeek Chat', free: true, maxTokens: 8000 },
                { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', free: false, maxTokens: 4000 },
                { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', free: false, maxTokens: 4000 }
            ],
            powerful: [
                { id: 'mistralai/devstral-2512:free', name: 'Mistral Devstral 2512', free: true, maxTokens: 16000 },
                { id: 'kwaipilot/kat-coder-pro:free', name: 'Kwaipilot Kat Coder Pro', free: true, maxTokens: 16000 },
                { id: 'z-ai/glm-4.5-air:free', name: 'Z-AI GLM 4.5 Air', free: true, maxTokens: 16000 },
                { id: 'openai/gpt-oss-120b:free', name: 'OpenAI GPT OSS 120B', free: true, maxTokens: 16000 },
                { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1', free: true, maxTokens: 16000 },
                { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', free: false, maxTokens: 8000 },
                { id: 'openai/gpt-4o', name: 'GPT-4o', free: false, maxTokens: 8000 },
                { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', free: false, maxTokens: 4000 }
            ]
        };

        // Intent patterns for classification
        this.intentPatterns = this.initializeIntentPatterns();
        
        // Complexity indicators
        this.complexityIndicators = this.initializeComplexityIndicators();
        
        // Performance metrics
        this.metrics = {
            requests: new Map(),      // Model -> { count, successRate, avgLatency }
            failures: new Map(),      // Model -> recent failure timestamps
            tokenUsage: new Map()     // Model -> { inputTokens, outputTokens }
        };
        
        // Configuration
        this.config = {
            enableRouting: true,           // Use intelligent routing
            preferFreeModels: true,        // Prefer free models when possible
            maxRetries: 3,                 // Max retries on failure
            retryDelay: 1000,              // Delay between retries (ms)
            failureWindowMs: 60000,        // Window for failure tracking (1 min)
            maxFailuresBeforeSkip: 3,      // Skip model after this many failures
            tokenBudget: 100000,           // Default token budget per session
            contextCompressionThreshold: 50000  // Compress context above this size
        };
        
        // Token tracking
        this.sessionTokens = {
            input: 0,
            output: 0,
            budget: this.config.tokenBudget
        };
        
        // Load saved metrics
        this.loadMetrics();
        
        console.log('✅ ModelRouter: Ready');
    }

    /**
     * Initialize intent classification patterns
     */
    initializeIntentPatterns() {
        return {
            [ModelRouter.INTENTS.SIMPLE_QUESTION]: {
                patterns: [
                    /^what\s+(is|are|does|do)\b/i,
                    /^how\s+do\s+i\b/i,
                    /^can\s+(you|i)\b/i,
                    /^is\s+(it|this|there)\b/i,
                    /^where\s+(is|are|can)\b/i,
                    /^why\s+(is|does|do)\b/i,
                    /^when\s+(should|do|does)\b/i
                ],
                keywords: ['what', 'why', 'when', 'where', 'who', 'which', 'how'],
                weight: 1
            },
            [ModelRouter.INTENTS.CODE_EXPLANATION]: {
                patterns: [
                    /explain\s+(this|the|how)/i,
                    /what\s+does\s+this\s+(code|function|method)/i,
                    /how\s+does\s+this\s+(work|function)/i,
                    /walk\s+me\s+through/i,
                    /break\s+down\s+(this|the)/i
                ],
                keywords: ['explain', 'understand', 'breakdown', 'walk through', 'what does'],
                weight: 2
            },
            [ModelRouter.INTENTS.CODE_GENERATION]: {
                patterns: [
                    /^(create|write|generate|make|build|implement)\s+(a|an|the)?\s*(function|class|component|module|api|endpoint)/i,
                    /^add\s+(a|an|the)?\s*(new)?\s*(function|feature|component)/i,
                    /^implement\s+(a|an|the)?/i,
                    /^code\s+(a|an|the)?/i
                ],
                keywords: ['create', 'write', 'generate', 'make', 'build', 'implement', 'add new'],
                weight: 3
            },
            [ModelRouter.INTENTS.CODE_REFACTOR]: {
                patterns: [
                    /refactor\s+(this|the)/i,
                    /improve\s+(this|the)\s*(code)?/i,
                    /optimize\s+(this|the)/i,
                    /clean\s+up\s+(this|the)/i,
                    /simplify\s+(this|the)/i,
                    /restructure\s+(this|the)/i
                ],
                keywords: ['refactor', 'improve', 'optimize', 'clean up', 'simplify', 'restructure'],
                weight: 3
            },
            [ModelRouter.INTENTS.BUG_FIX]: {
                patterns: [
                    /fix\s+(this|the|a|an)?\s*(error|bug|issue|problem)/i,
                    /debug\s+(this|the)/i,
                    /why\s+(is|am|does)\s+(this|it)\s+(not\s+working|failing|broken)/i,
                    /getting\s+(an?\s*)?(error|exception)/i,
                    /not\s+working/i,
                    /doesn'?t\s+work/i
                ],
                keywords: ['fix', 'debug', 'error', 'bug', 'issue', 'problem', 'broken', 'failing'],
                weight: 3
            },
            [ModelRouter.INTENTS.MULTI_FILE]: {
                patterns: [
                    /multiple\s+files/i,
                    /all\s+(the\s+)?files/i,
                    /across\s+(the\s+)?(project|codebase)/i,
                    /entire\s+(project|codebase|app)/i,
                    /full\s+(project|application)/i
                ],
                keywords: ['multiple files', 'all files', 'entire project', 'whole codebase', 'across files'],
                weight: 4
            },
            [ModelRouter.INTENTS.PLANNING]: {
                patterns: [
                    /^(plan|design|architect)\s+(a|an|the)?/i,
                    /create\s+(a\s+)?plan/i,
                    /how\s+should\s+i\s+(structure|organize|architect)/i,
                    /what'?s\s+the\s+best\s+(way|approach)/i,
                    /project\s+(structure|architecture)/i
                ],
                keywords: ['plan', 'design', 'architect', 'structure', 'organize', 'approach', 'strategy'],
                weight: 4
            },
            [ModelRouter.INTENTS.TERMINAL]: {
                patterns: [
                    /run\s+(this|the|a)\s*(command)?/i,
                    /execute\s+(this|the|in\s+terminal)/i,
                    /terminal\s+command/i,
                    /npm\s+(install|run|start)/i,
                    /git\s+(add|commit|push|pull)/i
                ],
                keywords: ['run', 'execute', 'terminal', 'command', 'npm', 'yarn', 'git', 'shell'],
                weight: 2
            },
            [ModelRouter.INTENTS.CHAT]: {
                patterns: [
                    /^(hi|hello|hey|thanks|thank you)/i,
                    /^(good|great|awesome|nice)/i
                ],
                keywords: ['hi', 'hello', 'thanks', 'help me'],
                weight: 1
            }
        };
    }

    /**
     * Initialize complexity indicators
     */
    initializeComplexityIndicators() {
        return {
            high: {
                keywords: [
                    'full application', 'entire project', 'from scratch',
                    'complex', 'advanced', 'comprehensive', 'complete system',
                    'architecture', 'design pattern', 'optimization',
                    'performance', 'security', 'scalable'
                ],
                contextPatterns: [
                    /create\s+(a\s+)?(full|complete|entire)/i,
                    /build\s+(a\s+)?(full|complete|entire)/i,
                    /implement\s+(the\s+)?(whole|entire)/i
                ],
                fileCountThreshold: 5,  // More than 5 files = high complexity
                contextSizeThreshold: 30000  // More than 30KB context = high
            },
            medium: {
                keywords: [
                    'function', 'component', 'class', 'module',
                    'feature', 'endpoint', 'api', 'integration',
                    'refactor', 'improve', 'update'
                ],
                fileCountThreshold: 2,
                contextSizeThreshold: 10000
            },
            low: {
                keywords: [
                    'simple', 'quick', 'small', 'basic',
                    'explain', 'what is', 'how to', 'question'
                ],
                fileCountThreshold: 1,
                contextSizeThreshold: 5000
            }
        };
    }

    /**
     * Route a request to the optimal model
     */
    async route(message, context = {}) {
        if (!this.config.enableRouting) {
            return this.getDefaultModel();
        }

        console.log('[ModelRouter] Routing request...');

        // Classify intent
        const intent = this.classifyIntent(message);
        console.log(`[ModelRouter] Intent: ${intent}`);

        // Score complexity
        const complexity = this.scoreComplexity(message, context);
        console.log(`[ModelRouter] Complexity: ${complexity.score} (${complexity.level})`);

        // Determine tier based on intent and complexity
        const tier = this.determineTier(intent, complexity);
        console.log(`[ModelRouter] Selected tier: ${tier}`);

        // Select best model from tier
        const model = await this.selectModel(tier, context);
        console.log(`[ModelRouter] Selected model: ${model.id}`);

        return {
            model,
            intent,
            complexity,
            tier
        };
    }

    /**
     * Classify the intent of a message
     */
    classifyIntent(message) {
        const scores = {};
        
        for (const [intent, config] of Object.entries(this.intentPatterns)) {
            let score = 0;
            
            // Check patterns
            for (const pattern of config.patterns) {
                if (pattern.test(message)) {
                    score += config.weight * 2;
                }
            }
            
            // Check keywords
            const lowerMessage = message.toLowerCase();
            for (const keyword of config.keywords) {
                if (lowerMessage.includes(keyword.toLowerCase())) {
                    score += config.weight;
                }
            }
            
            scores[intent] = score;
        }
        
        // Find highest scoring intent
        let maxScore = 0;
        let bestIntent = ModelRouter.INTENTS.CHAT;
        
        for (const [intent, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                bestIntent = intent;
            }
        }
        
        return bestIntent;
    }

    /**
     * Score the complexity of a request
     */
    scoreComplexity(message, context) {
        let score = 0;
        const factors = [];
        
        // Check message keywords
        const lowerMessage = message.toLowerCase();
        
        for (const keyword of this.complexityIndicators.high.keywords) {
            if (lowerMessage.includes(keyword)) {
                score += 3;
                factors.push(`keyword: ${keyword}`);
            }
        }
        
        for (const pattern of this.complexityIndicators.high.contextPatterns) {
            if (pattern.test(message)) {
                score += 4;
                factors.push('complex pattern match');
            }
        }
        
        for (const keyword of this.complexityIndicators.medium.keywords) {
            if (lowerMessage.includes(keyword)) {
                score += 1;
            }
        }
        
        // Check context size
        const contextSize = context.totalSize || 0;
        if (contextSize > this.complexityIndicators.high.contextSizeThreshold) {
            score += 3;
            factors.push(`large context: ${Math.round(contextSize / 1024)}KB`);
        } else if (contextSize > this.complexityIndicators.medium.contextSizeThreshold) {
            score += 1;
            factors.push(`medium context: ${Math.round(contextSize / 1024)}KB`);
        }
        
        // Check file count
        const fileCount = context.fileCount || 0;
        if (fileCount > this.complexityIndicators.high.fileCountThreshold) {
            score += 3;
            factors.push(`many files: ${fileCount}`);
        } else if (fileCount > this.complexityIndicators.medium.fileCountThreshold) {
            score += 1;
            factors.push(`some files: ${fileCount}`);
        }
        
        // Check message length
        if (message.length > 500) {
            score += 2;
            factors.push('long message');
        } else if (message.length > 200) {
            score += 1;
        }
        
        // Determine level
        let level;
        if (score >= 8) {
            level = 'high';
        } else if (score >= 4) {
            level = 'medium';
        } else {
            level = 'low';
        }
        
        return { score, level, factors };
    }

    /**
     * Determine model tier based on intent and complexity
     */
    determineTier(intent, complexity) {
        // High complexity always uses powerful tier
        if (complexity.level === 'high') {
            return ModelRouter.TIERS.POWERFUL;
        }
        
        // Intent-based tier selection
        switch (intent) {
            case ModelRouter.INTENTS.MULTI_FILE:
            case ModelRouter.INTENTS.PLANNING:
                return ModelRouter.TIERS.POWERFUL;
                
            case ModelRouter.INTENTS.CODE_GENERATION:
            case ModelRouter.INTENTS.CODE_REFACTOR:
            case ModelRouter.INTENTS.BUG_FIX:
                return complexity.level === 'medium' ? 
                    ModelRouter.TIERS.POWERFUL : ModelRouter.TIERS.STANDARD;
                
            case ModelRouter.INTENTS.CODE_EXPLANATION:
            case ModelRouter.INTENTS.TERMINAL:
                return ModelRouter.TIERS.STANDARD;
                
            case ModelRouter.INTENTS.SIMPLE_QUESTION:
            case ModelRouter.INTENTS.CHAT:
            default:
                return ModelRouter.TIERS.FAST;
        }
    }

    /**
     * Select the best model from a tier
     */
    async selectModel(tier, context = {}) {
        const tierModels = this.models[tier] || this.models.standard;
        
        // Filter by availability (skip recently failed models)
        const availableModels = tierModels.filter(model => {
            return !this.isModelFailing(model.id);
        });
        
        if (availableModels.length === 0) {
            console.warn('[ModelRouter] All models in tier failing, using fallback');
            return this.getFallbackModel(tier);
        }
        
        // If preferring free models, sort them first
        if (this.config.preferFreeModels && !context.userHasApiKey) {
            availableModels.sort((a, b) => {
                if (a.free && !b.free) return -1;
                if (!a.free && b.free) return 1;
                return 0;
            });
        }
        
        // Score models by performance
        const scoredModels = availableModels.map(model => {
            const metrics = this.metrics.requests.get(model.id);
            let score = 100; // Base score
            
            if (metrics) {
                // Boost for high success rate
                score += metrics.successRate * 20;
                
                // Penalty for high latency
                if (metrics.avgLatency > 5000) {
                    score -= 10;
                } else if (metrics.avgLatency > 3000) {
                    score -= 5;
                }
            }
            
            // Boost for free models if preferred
            if (this.config.preferFreeModels && model.free) {
                score += 15;
            }
            
            return { model, score };
        });
        
        // Sort by score and return best
        scoredModels.sort((a, b) => b.score - a.score);
        return scoredModels[0].model;
    }

    /**
     * Check if a model is currently failing
     */
    isModelFailing(modelId) {
        const failures = this.metrics.failures.get(modelId) || [];
        const now = Date.now();
        const recentFailures = failures.filter(
            t => now - t < this.config.failureWindowMs
        );
        return recentFailures.length >= this.config.maxFailuresBeforeSkip;
    }

    /**
     * Get fallback model when primary tier fails
     */
    getFallbackModel(failedTier) {
        // Try next tier down
        const fallbackOrder = {
            [ModelRouter.TIERS.POWERFUL]: ModelRouter.TIERS.STANDARD,
            [ModelRouter.TIERS.STANDARD]: ModelRouter.TIERS.FAST,
            [ModelRouter.TIERS.FAST]: null
        };
        
        const nextTier = fallbackOrder[failedTier];
        if (nextTier && this.models[nextTier]?.length > 0) {
            return this.models[nextTier][0];
        }
        
        // Ultimate fallback - first available free model
        for (const tier of Object.values(this.models)) {
            const freeModel = tier.find(m => m.free);
            if (freeModel) return freeModel;
        }
        
        // Last resort
        return this.models.fast[0];
    }

    /**
     * Get default model (for when routing is disabled)
     */
    getDefaultModel() {
        const savedModel = localStorage.getItem('selected_model');
        if (savedModel) {
            // Find in our models
            for (const tier of Object.values(this.models)) {
                const model = tier.find(m => m.id === savedModel);
                if (model) return model;
            }
        }
        // Default to first standard model
        return this.models.standard[0];
    }

    /**
     * Record a successful request
     */
    recordSuccess(modelId, latencyMs, inputTokens = 0, outputTokens = 0) {
        // Update request metrics
        const metrics = this.metrics.requests.get(modelId) || {
            count: 0,
            successCount: 0,
            successRate: 1,
            totalLatency: 0,
            avgLatency: 0
        };
        
        metrics.count++;
        metrics.successCount++;
        metrics.successRate = metrics.successCount / metrics.count;
        metrics.totalLatency += latencyMs;
        metrics.avgLatency = metrics.totalLatency / metrics.count;
        
        this.metrics.requests.set(modelId, metrics);
        
        // Update token usage
        const tokenUsage = this.metrics.tokenUsage.get(modelId) || {
            inputTokens: 0,
            outputTokens: 0
        };
        tokenUsage.inputTokens += inputTokens;
        tokenUsage.outputTokens += outputTokens;
        this.metrics.tokenUsage.set(modelId, tokenUsage);
        
        // Update session tokens
        this.sessionTokens.input += inputTokens;
        this.sessionTokens.output += outputTokens;
        
        // Save metrics
        this.saveMetrics();
    }

    /**
     * Record a failed request
     */
    recordFailure(modelId, error) {
        // Update request metrics
        const metrics = this.metrics.requests.get(modelId) || {
            count: 0,
            successCount: 0,
            successRate: 1,
            totalLatency: 0,
            avgLatency: 0
        };
        
        metrics.count++;
        metrics.successRate = metrics.successCount / metrics.count;
        this.metrics.requests.set(modelId, metrics);
        
        // Track failure timestamp
        const failures = this.metrics.failures.get(modelId) || [];
        failures.push(Date.now());
        
        // Keep only recent failures
        const now = Date.now();
        const recentFailures = failures.filter(
            t => now - t < this.config.failureWindowMs
        );
        this.metrics.failures.set(modelId, recentFailures);
        
        console.warn(`[ModelRouter] Recorded failure for ${modelId}:`, error);
        
        // Save metrics
        this.saveMetrics();
    }

    /**
     * Count tokens in text (approximate)
     */
    countTokens(text) {
        if (!text) return 0;
        // Rough approximation: ~4 characters per token for English
        // More accurate would be to use tiktoken, but this is fast
        return Math.ceil(text.length / 4);
    }

    /**
     * Check if within token budget
     */
    isWithinBudget(additionalTokens = 0) {
        const total = this.sessionTokens.input + this.sessionTokens.output + additionalTokens;
        return total < this.sessionTokens.budget;
    }

    /**
     * Get remaining token budget
     */
    getRemainingBudget() {
        return Math.max(0, this.sessionTokens.budget - 
            (this.sessionTokens.input + this.sessionTokens.output));
    }

    /**
     * Reset session token count
     */
    resetSessionTokens() {
        this.sessionTokens.input = 0;
        this.sessionTokens.output = 0;
    }

    /**
     * Compress context to fit within limits
     */
    compressContext(context, maxTokens) {
        if (!context || !context.selectedFiles) {
            return context;
        }

        const compressed = { ...context };
        let totalSize = this.calculateContextSize(context);
        
        if (totalSize <= maxTokens * 4) { // Approximate chars per token
            return context;
        }

        console.log(`[ModelRouter] Compressing context from ${totalSize} chars`);

        // Sort files by relevance (auto-context files first, then by score)
        const sortedFiles = [...context.selectedFiles].sort((a, b) => {
            // Auto-context files have scores
            if (a.score !== undefined && b.score !== undefined) {
                return b.score - a.score;
            }
            if (a.autoContext && !b.autoContext) return -1;
            if (!a.autoContext && b.autoContext) return 1;
            return 0;
        });

        // Truncate or remove files until within budget
        const keptFiles = [];
        let currentSize = 0;
        const maxSize = maxTokens * 4;

        for (const file of sortedFiles) {
            const fileSize = file.content?.length || 0;
            
            if (currentSize + fileSize <= maxSize) {
                keptFiles.push(file);
                currentSize += fileSize;
            } else if (currentSize < maxSize * 0.8) {
                // Truncate file if we have room
                const availableSpace = maxSize - currentSize;
                const truncated = {
                    ...file,
                    content: file.content.slice(0, availableSpace - 100) + 
                        '\n\n// ... [truncated for context limit] ...',
                    isTruncated: true
                };
                keptFiles.push(truncated);
                break;
            } else {
                // No more room
                break;
            }
        }

        compressed.selectedFiles = keptFiles;
        compressed.wasCompressed = true;
        compressed.originalFileCount = context.selectedFiles.length;
        compressed.keptFileCount = keptFiles.length;

        console.log(`[ModelRouter] Compressed to ${keptFiles.length} files, ${currentSize} chars`);

        return compressed;
    }

    /**
     * Calculate total context size
     */
    calculateContextSize(context) {
        let size = 0;
        
        if (context.selectedFiles) {
            for (const file of context.selectedFiles) {
                size += file.content?.length || 0;
            }
        }
        
        if (context.currentFile) {
            size += context.currentFile.content?.length || 0;
        }
        
        if (context.projectContext) {
            size += JSON.stringify(context.projectContext).length;
        }
        
        return size;
    }

    /**
     * Get model-specific prompt template
     */
    getPromptTemplate(modelId) {
        // Different models may need different system prompts
        const templates = {
            'deepseek': {
                codeBlockFormat: 'markdown',
                preferredStyle: 'concise',
                systemPrefix: 'You are a helpful AI coding assistant.'
            },
            'anthropic': {
                codeBlockFormat: 'markdown',
                preferredStyle: 'detailed',
                systemPrefix: 'You are Claude, an AI assistant created by Anthropic to be helpful, harmless, and honest.'
            },
            'openai': {
                codeBlockFormat: 'markdown',
                preferredStyle: 'balanced',
                systemPrefix: 'You are a helpful assistant.'
            },
            'google': {
                codeBlockFormat: 'markdown',
                preferredStyle: 'concise',
                systemPrefix: 'You are a helpful AI assistant.'
            }
        };
        
        // Match by provider prefix
        for (const [provider, template] of Object.entries(templates)) {
            if (modelId.toLowerCase().includes(provider)) {
                return template;
            }
        }
        
        return templates['openai']; // Default
    }

    /**
     * Optimize prompt for specific model
     */
    optimizePrompt(prompt, modelId, _context = {}) {
        void _context; // Reserved for future context-aware optimizations
        const template = this.getPromptTemplate(modelId);
        let optimized = prompt;
        
        // Add model-specific formatting hints
        if (template.preferredStyle === 'concise') {
            if (!prompt.includes('brief') && !prompt.includes('concise')) {
                optimized += '\n\nBe concise in your response.';
            }
        }
        
        // Estimate tokens and warn if large
        const estimatedTokens = this.countTokens(optimized);
        if (estimatedTokens > 3000) {
            console.warn(`[ModelRouter] Large prompt: ~${estimatedTokens} tokens`);
        }
        
        return optimized;
    }

    /**
     * Get performance report
     */
    getPerformanceReport() {
        const report = {
            models: [],
            sessionTokens: { ...this.sessionTokens },
            budgetUsed: `${Math.round((1 - this.getRemainingBudget() / this.sessionTokens.budget) * 100)}%`
        };
        
        for (const [modelId, metrics] of this.metrics.requests) {
            const tokenUsage = this.metrics.tokenUsage.get(modelId) || {};
            report.models.push({
                id: modelId,
                requests: metrics.count,
                successRate: `${Math.round(metrics.successRate * 100)}%`,
                avgLatency: `${Math.round(metrics.avgLatency)}ms`,
                tokens: tokenUsage.inputTokens + tokenUsage.outputTokens
            });
        }
        
        return report;
    }

    /**
     * Save metrics to localStorage
     */
    saveMetrics() {
        try {
            const data = {
                requests: Array.from(this.metrics.requests.entries()),
                tokenUsage: Array.from(this.metrics.tokenUsage.entries()),
                savedAt: Date.now()
            };
            localStorage.setItem('modelRouter_metrics', JSON.stringify(data));
        } catch (e) {
            console.warn('[ModelRouter] Failed to save metrics:', e);
        }
    }

    /**
     * Load metrics from localStorage
     */
    loadMetrics() {
        try {
            const data = JSON.parse(localStorage.getItem('modelRouter_metrics') || '{}');
            
            // Only load if less than 24 hours old
            if (data.savedAt && Date.now() - data.savedAt < 24 * 60 * 60 * 1000) {
                if (data.requests) {
                    this.metrics.requests = new Map(data.requests);
                }
                if (data.tokenUsage) {
                    this.metrics.tokenUsage = new Map(data.tokenUsage);
                }
            }
        } catch (e) {
            console.warn('[ModelRouter] Failed to load metrics:', e);
        }
    }

    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics.requests.clear();
        this.metrics.failures.clear();
        this.metrics.tokenUsage.clear();
        this.resetSessionTokens();
        localStorage.removeItem('modelRouter_metrics');
    }
}
