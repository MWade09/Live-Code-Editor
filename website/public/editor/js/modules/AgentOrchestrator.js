/**
 * AgentOrchestrator - Autonomous AI agent with human-in-loop checkpoints
 * 
 * Implements the Plan → Execute → Observe → Iterate loop for complex tasks.
 * 
 * State Machine:
 *   IDLE → PLANNING → AWAITING_APPROVAL → EXECUTING → OBSERVING → COMPLETE
 *                          ↓                              ↓
 *                      CANCELLED                    PLANNING (on error)
 * 
 * Features:
 * - Multi-step task execution with approval gates
 * - Tool-based architecture (read, write, search, terminal)
 * - Action queue with dependency ordering
 * - Automatic retry on errors with AI-suggested fixes
 * - Full execution history for debugging
 */
export class AgentOrchestrator {
    // Agent states
    static STATES = {
        IDLE: 'idle',
        PLANNING: 'planning',
        AWAITING_APPROVAL: 'awaiting_approval',
        EXECUTING: 'executing',
        OBSERVING: 'observing',
        COMPLETE: 'complete',
        CANCELLED: 'cancelled',
        ERROR: 'error'
    };

    constructor(unifiedAI, fileManager, terminalManager = null) {
        console.log('🤖 AgentOrchestrator: Initializing autonomous agent...');
        
        this.unifiedAI = unifiedAI;
        this.fileManager = fileManager;
        this.terminalManager = terminalManager;
        
        // State management
        this.state = AgentOrchestrator.STATES.IDLE;
        this.previousState = null;
        
        // Current task context
        this.currentTask = null;
        this.currentPlan = null;
        this.actionQueue = [];
        this.completedActions = [];
        this.failedActions = [];
        
        // Execution tracking
        this.executionHistory = [];
        this.maxRetries = 3;
        this.retryCount = 0;
        
        // Configuration
        this.autoApproveReads = true;  // Auto-approve file reads
        this.autoApproveAnalysis = true; // Auto-approve code analysis
        this.requireApprovalForWrites = true; // Always require approval for writes
        this.requireApprovalForTerminal = true; // Always require approval for terminal
        
        // Event callbacks
        this.onStateChange = null;
        this.onPlanReady = null;
        this.onActionComplete = null;
        this.onError = null;
        this.onComplete = null;
        
        // UI elements
        this.statusContainer = null;
        this.planContainer = null;
        
        // Tools registry
        this.tools = new Map();
        this.initializeDefaultTools();
        
        console.log('✅ AgentOrchestrator: Ready');
    }

    /**
     * Initialize default tool set
     */
    initializeDefaultTools() {
        // Read file tool - auto-approved
        this.registerTool('read_file', {
            name: 'Read File',
            description: 'Read the contents of a file',
            requiresApproval: false,
            execute: async (params) => {
                const file = this.fileManager.files.find(f => f.name === params.filename);
                if (!file) {
                    throw new Error(`File not found: ${params.filename}`);
                }
                return { content: file.content, filename: file.name };
            }
        });

        // Write file tool - requires approval
        this.registerTool('write_file', {
            name: 'Write File',
            description: 'Modify or create a file',
            requiresApproval: true,
            execute: async (params) => {
                const { filename, content, isNew } = params;
                
                if (isNew) {
                    // Create new file
                    this.fileManager.createFile(filename, content);
                } else {
                    // Update existing file
                    const file = this.fileManager.files.find(f => f.name === filename);
                    if (file) {
                        file.content = content;
                        this.fileManager.saveFile(file.id);
                    } else {
                        throw new Error(`File not found: ${filename}`);
                    }
                }
                
                return { success: true, filename };
            }
        });

        // Search codebase tool - auto-approved
        this.registerTool('search_codebase', {
            name: 'Search Codebase',
            description: 'Search for patterns in the codebase',
            requiresApproval: false,
            execute: async (params) => {
                const { query, filePattern } = params;
                const results = [];
                
                for (const file of this.fileManager.files) {
                    if (filePattern && !file.name.match(new RegExp(filePattern))) {
                        continue;
                    }
                    
                    const lines = file.content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.toLowerCase().includes(query.toLowerCase())) {
                            results.push({
                                file: file.name,
                                line: index + 1,
                                content: line.trim()
                            });
                        }
                    });
                }
                
                return { results, query };
            }
        });

        // Run terminal command tool - requires approval
        this.registerTool('run_terminal', {
            name: 'Run Terminal Command',
            description: 'Execute a command in the terminal',
            requiresApproval: true,
            execute: async (params) => {
                if (!this.terminalManager) {
                    throw new Error('Terminal not available');
                }
                
                const { command } = params;
                const result = await this.terminalManager.executeCommand(command);
                
                return {
                    command,
                    output: result.output,
                    exitCode: result.exitCode,
                    error: result.error
                };
            }
        });

        // Analyze code tool - auto-approved
        this.registerTool('analyze_code', {
            name: 'Analyze Code',
            description: 'Analyze code structure and patterns',
            requiresApproval: false,
            execute: async (params) => {
                const { filename } = params;
                const file = this.fileManager.files.find(f => f.name === filename);
                
                if (!file) {
                    throw new Error(`File not found: ${filename}`);
                }
                
                // Basic analysis
                const lines = file.content.split('\n');
                const analysis = {
                    filename: file.name,
                    lineCount: lines.length,
                    characterCount: file.content.length,
                    imports: [],
                    exports: [],
                    functions: [],
                    classes: []
                };
                
                // Extract imports
                const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
                let match;
                while ((match = importRegex.exec(file.content)) !== null) {
                    analysis.imports.push(match[1]);
                }
                
                // Extract exports
                const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
                while ((match = exportRegex.exec(file.content)) !== null) {
                    analysis.exports.push(match[1]);
                }
                
                // Extract function names
                const funcRegex = /(?:async\s+)?function\s+(\w+)|(\w+)\s*(?:=|:)\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>/g;
                while ((match = funcRegex.exec(file.content)) !== null) {
                    analysis.functions.push(match[1] || match[2]);
                }
                
                // Extract class names
                const classRegex = /class\s+(\w+)/g;
                while ((match = classRegex.exec(file.content)) !== null) {
                    analysis.classes.push(match[1]);
                }
                
                return analysis;
            }
        });

        // List files tool - auto-approved
        this.registerTool('list_files', {
            name: 'List Files',
            description: 'List all files in the project',
            requiresApproval: false,
            execute: async () => {
                return {
                    files: this.fileManager.files.map(f => ({
                        name: f.name,
                        type: f.type,
                        size: f.content.length
                    }))
                };
            }
        });
    }

    /**
     * Register a new tool
     */
    registerTool(id, tool) {
        this.tools.set(id, {
            id,
            ...tool
        });
        console.log(`[AgentOrchestrator] Registered tool: ${id}`);
    }

    /**
     * Get available tools for AI context
     */
    getToolDescriptions() {
        const descriptions = [];
        for (const [id, tool] of this.tools) {
            descriptions.push({
                id,
                name: tool.name,
                description: tool.description,
                requiresApproval: tool.requiresApproval
            });
        }
        return descriptions;
    }

    /**
     * Start a new task
     */
    async startTask(taskDescription) {
        if (this.state !== AgentOrchestrator.STATES.IDLE) {
            throw new Error(`Cannot start new task: agent is ${this.state}`);
        }

        console.log(`[AgentOrchestrator] Starting task: ${taskDescription}`);
        
        this.currentTask = {
            description: taskDescription,
            startedAt: new Date().toISOString(),
            id: this.generateTaskId()
        };
        
        this.actionQueue = [];
        this.completedActions = [];
        this.failedActions = [];
        this.retryCount = 0;
        
        // Transition to planning
        this.setState(AgentOrchestrator.STATES.PLANNING);
        
        try {
            // Generate plan using AI
            const plan = await this.generatePlan(taskDescription);
            this.currentPlan = plan;
            
            // Transition to awaiting approval
            this.setState(AgentOrchestrator.STATES.AWAITING_APPROVAL);
            
            // Notify listeners
            if (this.onPlanReady) {
                this.onPlanReady(plan);
            }
            
            return plan;
            
        } catch (error) {
            console.error('[AgentOrchestrator] Planning failed:', error);
            this.setState(AgentOrchestrator.STATES.ERROR);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }

    /**
     * Generate execution plan using AI
     */
    async generatePlan(taskDescription) {
        const toolDescriptions = this.getToolDescriptions();
        const projectFiles = this.fileManager.files.map(f => f.name);
        
        const planningPrompt = `You are an AI coding assistant planning a task. Generate a structured plan.

TASK: ${taskDescription}

AVAILABLE TOOLS:
${toolDescriptions.map(t => `- ${t.id}: ${t.description} (${t.requiresApproval ? 'requires approval' : 'auto-approved'})`).join('\n')}

PROJECT FILES:
${projectFiles.join('\n')}

Generate a plan in this JSON format:
{
  "summary": "Brief description of the plan",
  "steps": [
    {
      "id": 1,
      "description": "What this step does",
      "tool": "tool_id",
      "params": { /* tool-specific parameters */ },
      "dependsOn": [] // IDs of steps that must complete first
    }
  ],
  "estimatedActions": 5, // total number of actions
  "requiresApproval": true // whether any step needs user approval
}

IMPORTANT:
- Break complex tasks into small, atomic steps
- Use read operations before write operations
- Order steps by dependencies
- Group related changes together

Respond ONLY with valid JSON, no markdown or explanation.`;

        // Call AI for plan generation
        const response = await this.callAIForPlan(planningPrompt);
        
        // Parse the plan
        try {
            const plan = JSON.parse(response);
            
            // Validate plan structure
            if (!plan.steps || !Array.isArray(plan.steps)) {
                throw new Error('Invalid plan: missing steps array');
            }
            
            // Add metadata
            plan.taskId = this.currentTask.id;
            plan.generatedAt = new Date().toISOString();
            
            // Build action queue from steps
            this.actionQueue = plan.steps.map(step => ({
                ...step,
                status: 'pending',
                result: null,
                error: null
            }));
            
            return plan;
            
        } catch (parseError) {
            console.error('[AgentOrchestrator] Failed to parse plan:', parseError);
            console.log('[AgentOrchestrator] Raw response:', response);
            throw new Error('Failed to parse AI-generated plan');
        }
    }

    /**
     * Call AI for plan generation
     */
    async callAIForPlan(prompt) {
        // Use UnifiedAI's API calling infrastructure
        const response = await fetch('/api/ai/free', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat-v3-0324:free',
                messages: [
                    { role: 'system', content: 'You are a planning AI that generates structured execution plans in JSON format.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3, // Lower temperature for more structured output
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    /**
     * Approve the current plan and start execution
     */
    async approvePlan() {
        if (this.state !== AgentOrchestrator.STATES.AWAITING_APPROVAL) {
            throw new Error('No plan awaiting approval');
        }

        console.log('[AgentOrchestrator] Plan approved, starting execution');
        this.setState(AgentOrchestrator.STATES.EXECUTING);
        
        await this.executeNextAction();
    }

    /**
     * Reject the current plan
     */
    rejectPlan(reason = 'User rejected') {
        if (this.state !== AgentOrchestrator.STATES.AWAITING_APPROVAL) {
            throw new Error('No plan awaiting approval');
        }

        console.log(`[AgentOrchestrator] Plan rejected: ${reason}`);
        
        this.executionHistory.push({
            type: 'plan_rejected',
            reason,
            timestamp: new Date().toISOString()
        });
        
        this.setState(AgentOrchestrator.STATES.CANCELLED);
        this.reset();
    }

    /**
     * Execute the next action in the queue
     */
    async executeNextAction() {
        // Find next pending action whose dependencies are complete
        const nextAction = this.actionQueue.find(action => {
            if (action.status !== 'pending') return false;
            
            // Check dependencies
            if (action.dependsOn && action.dependsOn.length > 0) {
                return action.dependsOn.every(depId => {
                    const dep = this.actionQueue.find(a => a.id === depId);
                    return dep && dep.status === 'complete';
                });
            }
            
            return true;
        });

        if (!nextAction) {
            // No more actions, check if all complete
            const allComplete = this.actionQueue.every(a => a.status === 'complete');
            
            if (allComplete) {
                this.setState(AgentOrchestrator.STATES.COMPLETE);
                if (this.onComplete) {
                    this.onComplete({
                        task: this.currentTask,
                        plan: this.currentPlan,
                        completedActions: this.completedActions
                    });
                }
            } else {
                // Some actions failed or are stuck
                this.setState(AgentOrchestrator.STATES.ERROR);
            }
            
            return;
        }

        // Get the tool for this action
        const tool = this.tools.get(nextAction.tool);
        
        if (!tool) {
            nextAction.status = 'failed';
            nextAction.error = `Unknown tool: ${nextAction.tool}`;
            this.failedActions.push(nextAction);
            await this.executeNextAction();
            return;
        }

        // Check if approval is needed
        if (tool.requiresApproval && this.requireApprovalForWrites) {
            // Pause for approval
            this.setState(AgentOrchestrator.STATES.AWAITING_APPROVAL);
            this.pendingAction = nextAction;
            
            // Notify for approval
            if (this.onActionNeedsApproval) {
                this.onActionNeedsApproval(nextAction, tool);
            }
            
            return;
        }

        // Execute the action
        await this.executeAction(nextAction);
    }

    /**
     * Execute a single action
     */
    async executeAction(action) {
        console.log(`[AgentOrchestrator] Executing: ${action.description}`);
        
        action.status = 'executing';
        action.startedAt = new Date().toISOString();
        
        const tool = this.tools.get(action.tool);
        
        try {
            const result = await tool.execute(action.params);
            
            action.status = 'complete';
            action.result = result;
            action.completedAt = new Date().toISOString();
            
            this.completedActions.push(action);
            
            this.executionHistory.push({
                type: 'action_complete',
                action: action.id,
                tool: action.tool,
                result,
                timestamp: action.completedAt
            });
            
            if (this.onActionComplete) {
                this.onActionComplete(action);
            }
            
            // Transition to observing
            this.setState(AgentOrchestrator.STATES.OBSERVING);
            
            // Observe results and decide next step
            await this.observeAndContinue(action);
            
        } catch (error) {
            console.error(`[AgentOrchestrator] Action failed:`, error);
            
            action.status = 'failed';
            action.error = error.message;
            
            this.failedActions.push(action);
            
            this.executionHistory.push({
                type: 'action_failed',
                action: action.id,
                tool: action.tool,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            // Try to recover
            await this.handleActionError(action, error);
        }
    }

    /**
     * Approve a pending action
     */
    async approveAction() {
        if (!this.pendingAction) {
            throw new Error('No action pending approval');
        }

        const action = this.pendingAction;
        this.pendingAction = null;
        
        this.setState(AgentOrchestrator.STATES.EXECUTING);
        await this.executeAction(action);
    }

    /**
     * Reject a pending action
     */
    rejectAction(reason = 'User rejected') {
        if (!this.pendingAction) {
            throw new Error('No action pending approval');
        }

        this.pendingAction.status = 'rejected';
        this.pendingAction.error = reason;
        this.pendingAction = null;
        
        // Skip to next action
        this.setState(AgentOrchestrator.STATES.EXECUTING);
        this.executeNextAction();
    }

    /**
     * Observe action results and continue execution
     */
    async observeAndContinue(completedAction) {
        // Check for errors in terminal output
        if (completedAction.tool === 'run_terminal' && completedAction.result) {
            const { output, exitCode, error } = completedAction.result;
            
            if (exitCode !== 0 || error) {
                // Terminal command failed, might need AI assistance
                console.log('[AgentOrchestrator] Terminal command failed, considering retry');
                
                if (this.retryCount < this.maxRetries) {
                    const shouldRetry = await this.askAIForRetry(completedAction, error || output);
                    
                    if (shouldRetry) {
                        this.retryCount++;
                        // AI might suggest a fix, re-queue modified action
                        return;
                    }
                }
            }
        }
        
        // Continue with next action
        this.setState(AgentOrchestrator.STATES.EXECUTING);
        await this.executeNextAction();
    }

    /**
     * Handle action errors
     */
    async handleActionError(action, error) {
        if (this.retryCount >= this.maxRetries) {
            console.log('[AgentOrchestrator] Max retries reached, stopping');
            this.setState(AgentOrchestrator.STATES.ERROR);
            
            if (this.onError) {
                this.onError(error, action);
            }
            
            return;
        }

        // Ask AI for fix suggestion
        const fix = await this.askAIForFix(action, error);
        
        if (fix && fix.retry) {
            this.retryCount++;
            
            // Update action with fix
            if (fix.newParams) {
                action.params = { ...action.params, ...fix.newParams };
            }
            
            action.status = 'pending';
            action.error = null;
            
            console.log('[AgentOrchestrator] Retrying with AI-suggested fix');
            this.setState(AgentOrchestrator.STATES.EXECUTING);
            await this.executeAction(action);
            
        } else {
            // Cannot recover, move to error state
            this.setState(AgentOrchestrator.STATES.ERROR);
            
            if (this.onError) {
                this.onError(error, action);
            }
        }
    }

    /**
     * Ask AI if we should retry after an error
     */
    async askAIForRetry(action, errorOutput) {
        // Simple heuristic for now - could be enhanced with AI
        const recoverableErrors = [
            'ENOENT', // File not found
            'timeout', // Timeout
            'ECONNREFUSED' // Connection refused
        ];
        
        return recoverableErrors.some(e => errorOutput.includes(e));
    }

    /**
     * Ask AI for fix suggestion
     */
    async askAIForFix(action, error) {
        const prompt = `An action failed during execution. Suggest a fix.

ACTION: ${action.description}
TOOL: ${action.tool}
PARAMS: ${JSON.stringify(action.params)}
ERROR: ${error.message}

Should we retry? If yes, provide updated parameters.
Respond in JSON format:
{
  "retry": true/false,
  "reason": "explanation",
  "newParams": { /* updated params if retry */ }
}`;

        try {
            const response = await this.callAIForPlan(prompt);
            return JSON.parse(response);
        } catch (e) {
            console.warn('[AgentOrchestrator] Failed to get AI fix suggestion:', e);
            return { retry: false, reason: 'Failed to get AI suggestion' };
        }
    }

    /**
     * Cancel current execution
     */
    cancel() {
        console.log('[AgentOrchestrator] Cancelling execution');
        
        this.setState(AgentOrchestrator.STATES.CANCELLED);
        
        this.executionHistory.push({
            type: 'cancelled',
            timestamp: new Date().toISOString()
        });
        
        this.reset();
    }

    /**
     * Reset agent state
     */
    reset() {
        this.currentTask = null;
        this.currentPlan = null;
        this.actionQueue = [];
        this.pendingAction = null;
        this.retryCount = 0;
        
        this.setState(AgentOrchestrator.STATES.IDLE);
    }

    /**
     * Set agent state with notification
     */
    setState(newState) {
        this.previousState = this.state;
        this.state = newState;
        
        console.log(`[AgentOrchestrator] State: ${this.previousState} → ${newState}`);
        
        if (this.onStateChange) {
            this.onStateChange(newState, this.previousState);
        }
        
        this.updateStatusUI();
    }

    /**
     * Update status UI
     */
    updateStatusUI() {
        if (!this.statusContainer) return;
        
        const stateColors = {
            [AgentOrchestrator.STATES.IDLE]: '#6b7280',
            [AgentOrchestrator.STATES.PLANNING]: '#f59e0b',
            [AgentOrchestrator.STATES.AWAITING_APPROVAL]: '#3b82f6',
            [AgentOrchestrator.STATES.EXECUTING]: '#22c55e',
            [AgentOrchestrator.STATES.OBSERVING]: '#8b5cf6',
            [AgentOrchestrator.STATES.COMPLETE]: '#10b981',
            [AgentOrchestrator.STATES.CANCELLED]: '#6b7280',
            [AgentOrchestrator.STATES.ERROR]: '#ef4444'
        };
        
        const stateLabels = {
            [AgentOrchestrator.STATES.IDLE]: 'Ready',
            [AgentOrchestrator.STATES.PLANNING]: 'Planning...',
            [AgentOrchestrator.STATES.AWAITING_APPROVAL]: 'Awaiting Approval',
            [AgentOrchestrator.STATES.EXECUTING]: 'Executing...',
            [AgentOrchestrator.STATES.OBSERVING]: 'Observing...',
            [AgentOrchestrator.STATES.COMPLETE]: 'Complete',
            [AgentOrchestrator.STATES.CANCELLED]: 'Cancelled',
            [AgentOrchestrator.STATES.ERROR]: 'Error'
        };
        
        this.statusContainer.innerHTML = `
            <div class="agent-status" style="--status-color: ${stateColors[this.state]}">
                <span class="status-dot"></span>
                <span class="status-label">${stateLabels[this.state]}</span>
                ${this.currentTask ? `<span class="task-info">${this.completedActions.length}/${this.actionQueue.length} actions</span>` : ''}
            </div>
        `;
    }

    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get execution summary
     */
    getExecutionSummary() {
        return {
            state: this.state,
            task: this.currentTask,
            plan: this.currentPlan,
            progress: {
                total: this.actionQueue.length,
                completed: this.completedActions.length,
                failed: this.failedActions.length,
                pending: this.actionQueue.filter(a => a.status === 'pending').length
            },
            history: this.executionHistory
        };
    }
}
