/**
 * ResponseParser - Parse AI responses for different action types
 * 
 * Detects and extracts:
 * - FILE_EDIT markers (edit existing files)
 * - CREATE_FILE markers (create new files)
 * - TERMINAL markers (run terminal commands)
 * - PLAN markers (project planning)
 * 
 * Separates conversational text from action markers
 * 
 * STREAMING SUPPORT:
 * - detectPartialActions() for real-time marker detection
 * - Tracks incomplete markers during stream
 */
export class ResponseParser {
    constructor() {
        console.log('📝 ResponseParser: Initialized with streaming support');
        
        // Patterns for action markers
        this.patterns = {
            fileEdit: /FILE_EDIT:\s*([^\n]+)\n([\s\S]*?)END_FILE_EDIT/gi,
            fileCreate: /CREATE_FILE:\s*([^\n]+)\n([\s\S]*?)END_CREATE_FILE/gi,
            terminal: /TERMINAL:\s*([^\n]+)/gi,
            plan: /PLAN:\n([\s\S]*?)END_PLAN/gi
        };
        
        // Partial marker patterns for streaming detection
        this.partialPatterns = {
            fileEditStart: /FILE_EDIT:\s*([^\n]+)\n/i,
            fileEditEnd: /END_FILE_EDIT/i,
            fileCreateStart: /CREATE_FILE:\s*([^\n]+)\n/i,
            fileCreateEnd: /END_CREATE_FILE/i,
            planStart: /PLAN:\n/i,
            planEnd: /END_PLAN/i
        };
    }
    
    /**
     * Parse unified AI response
     * @param {string} aiResponse - Raw AI response text
     * @returns {Object} { conversation: string, actions: Array }
     */
    parse(aiResponse) {
        if (!aiResponse) {
            return { conversation: '', actions: [] };
        }
        
        const actions = [];
        
        // Extract FILE_EDIT actions
        const fileEdits = this.extractFileEdits(aiResponse);
        actions.push(...fileEdits);
        
        // Extract CREATE_FILE actions
        const fileCreations = this.extractFileCreations(aiResponse);
        actions.push(...fileCreations);
        
        // Extract TERMINAL commands
        const terminalCommands = this.extractTerminalCommands(aiResponse);
        actions.push(...terminalCommands);
        
        // Extract PLAN sections
        const plans = this.extractPlans(aiResponse);
        actions.push(...plans);
        
        // Remove action markers from conversation
        const conversation = this.cleanConversation(aiResponse, actions);
        
        console.log('[ResponseParser] Parsed:', {
            conversationLength: conversation.length,
            actionsCount: actions.length,
            actionTypes: actions.map(a => a.type)
        });
        
        return { conversation, actions };
    }
    
    /**
     * Detect partial/in-progress actions during streaming
     * Used to show visual indicators while markers are being typed
     * @param {string} partialResponse - Partial response during streaming
     * @returns {Object} { hasPartialAction: boolean, partialType: string|null, progress: string }
     */
    detectPartialActions(partialResponse) {
        if (!partialResponse) {
            return { hasPartialAction: false, partialType: null, progress: '' };
        }
        
        // Check for incomplete FILE_EDIT
        if (this.partialPatterns.fileEditStart.test(partialResponse)) {
            if (!this.partialPatterns.fileEditEnd.test(partialResponse.split(/FILE_EDIT:/i).pop())) {
                const match = partialResponse.match(/FILE_EDIT:\s*([^\n]+)/i);
                return {
                    hasPartialAction: true,
                    partialType: 'edit',
                    progress: `Editing: ${match ? match[1].trim() : 'file'}...`
                };
            }
        }
        
        // Check for incomplete CREATE_FILE
        if (this.partialPatterns.fileCreateStart.test(partialResponse)) {
            if (!this.partialPatterns.fileCreateEnd.test(partialResponse.split(/CREATE_FILE:/i).pop())) {
                const match = partialResponse.match(/CREATE_FILE:\s*([^\n]+)/i);
                return {
                    hasPartialAction: true,
                    partialType: 'create',
                    progress: `Creating: ${match ? match[1].trim() : 'file'}...`
                };
            }
        }
        
        // Check for incomplete PLAN
        if (this.partialPatterns.planStart.test(partialResponse)) {
            if (!this.partialPatterns.planEnd.test(partialResponse.split(/PLAN:/i).pop())) {
                return {
                    hasPartialAction: true,
                    partialType: 'plan',
                    progress: 'Generating plan...'
                };
            }
        }
        
        return { hasPartialAction: false, partialType: null, progress: '' };
    }
    
    /**
     * Extract completed actions from partial response (for early execution)
     * @param {string} partialResponse - Partial response during streaming
     * @returns {Object} { completedActions: Array, remainingText: string }
     */
    extractCompletedActions(partialResponse) {
        const completedActions = [];
        let remainingText = partialResponse;
        
        // Find completed FILE_EDITs
        const editPattern = /FILE_EDIT:\s*([^\n]+)\n([\s\S]*?)END_FILE_EDIT/gi;
        let match;
        
        while ((match = editPattern.exec(partialResponse)) !== null) {
            completedActions.push({
                type: 'edit',
                file: match[1].trim(),
                content: match[2].trim(),
                raw: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        }
        
        // Find completed CREATE_FILEs
        const createPattern = /CREATE_FILE:\s*([^\n]+)\n([\s\S]*?)END_CREATE_FILE/gi;
        
        while ((match = createPattern.exec(partialResponse)) !== null) {
            completedActions.push({
                type: 'create',
                file: match[1].trim(),
                content: match[2].trim(),
                raw: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        }
        
        return { completedActions, remainingText };
    }
    
    /**
     * Extract FILE_EDIT actions
     * Format: FILE_EDIT: filename.ext
     *         [new file content]
     *         END_FILE_EDIT
     */
    extractFileEdits(response) {
        const pattern = /FILE_EDIT:\s*([^\n]+)\n([\s\S]*?)END_FILE_EDIT/gi;
        const edits = [];
        let match;
        
        while ((match = pattern.exec(response)) !== null) {
            const filename = match[1].trim();
            const content = match[2].trim();
            
            edits.push({
                type: 'edit',
                file: filename,
                content: content,
                raw: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
            
            console.log('[ResponseParser] Found FILE_EDIT:', filename);
        }
        
        return edits;
    }
    
    /**
     * Extract CREATE_FILE actions
     * Format: CREATE_FILE: filename.ext
     *         [file content]
     *         END_CREATE_FILE
     */
    extractFileCreations(response) {
        const pattern = /CREATE_FILE:\s*([^\n]+)\n([\s\S]*?)END_CREATE_FILE/gi;
        const creations = [];
        let match;
        
        while ((match = pattern.exec(response)) !== null) {
            const filename = match[1].trim();
            const content = match[2].trim();
            
            creations.push({
                type: 'create',
                file: filename,
                content: content,
                raw: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
            
            console.log('[ResponseParser] Found CREATE_FILE:', filename);
        }
        
        return creations;
    }
    
    /**
     * Extract TERMINAL commands
     * Format: TERMINAL: command
     */
    extractTerminalCommands(response) {
        const pattern = /TERMINAL:\s*([^\n]+)/gi;
        const commands = [];
        let match;
        
        while ((match = pattern.exec(response)) !== null) {
            const command = match[1].trim();
            
            commands.push({
                type: 'terminal',
                command: command,
                raw: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
            
            console.log('[ResponseParser] Found TERMINAL:', command);
        }
        
        return commands;
    }
    
    /**
     * Extract PLAN sections
     * Format: PLAN:
     *         - [ ] Task 1
     *         - [ ] Task 2
     *         END_PLAN
     */
    extractPlans(response) {
        const pattern = /PLAN:\n([\s\S]*?)END_PLAN/gi;
        const plans = [];
        let match;
        
        while ((match = pattern.exec(response)) !== null) {
            const planContent = match[1].trim();
            
            // Parse plan into structured tasks
            const tasks = this.parsePlanTasks(planContent);
            
            plans.push({
                type: 'plan',
                content: planContent,
                tasks: tasks,
                raw: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
            
            console.log('[ResponseParser] Found PLAN with', tasks.length, 'tasks');
        }
        
        return plans;
    }
    
    /**
     * Parse plan content into structured tasks
     */
    parsePlanTasks(planContent) {
        const tasks = [];
        const lines = planContent.split('\n');
        let currentPhase = null;
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Phase header (e.g., "Phase 1: Setup")
            if (trimmed.match(/^(Phase|Step)\s+\d+:/i)) {
                currentPhase = trimmed;
                continue;
            }
            
            // Task item (e.g., "- [ ] Task description")
            const taskMatch = trimmed.match(/^-\s*\[([ x])\]\s*(.+)$/);
            if (taskMatch) {
                const completed = taskMatch[1].toLowerCase() === 'x';
                const description = taskMatch[2].trim();
                
                tasks.push({
                    phase: currentPhase,
                    description: description,
                    completed: completed
                });
            }
        }
        
        return tasks;
    }
    
    /**
     * Remove action markers from conversation text
     */
    cleanConversation(text, actions) {
        let cleaned = text;
        
        // Sort actions by position (reverse order to maintain indices)
        const sortedActions = [...actions].sort((a, b) => b.startIndex - a.startIndex);
        
        // Remove each action marker from the text
        for (const action of sortedActions) {
            if (action.raw) {
                cleaned = cleaned.substring(0, action.startIndex) + 
                         cleaned.substring(action.endIndex);
            }
        }
        
        // Clean up extra whitespace
        cleaned = cleaned
            .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
            .replace(/^\s+|\s+$/g, '')   // Trim
            .trim();
        
        return cleaned;
    }
    
    /**
     * Validate action before execution
     */
    validateAction(action) {
        if (!action || !action.type) {
            return { valid: false, error: 'Invalid action: missing type' };
        }
        
        switch (action.type) {
            case 'edit':
                if (!action.file || !action.content) {
                    return { valid: false, error: 'FILE_EDIT requires filename and content' };
                }
                break;
                
            case 'create':
                if (!action.file || !action.content) {
                    return { valid: false, error: 'CREATE_FILE requires filename and content' };
                }
                // Validate filename
                if (action.file.includes('..') || action.file.includes('/') || action.file.includes('\\')) {
                    return { valid: false, error: 'Invalid filename: no path traversal allowed' };
                }
                break;
                
            case 'terminal':
                if (!action.command) {
                    return { valid: false, error: 'TERMINAL requires command' };
                }
                break;
                
            case 'plan':
                if (!action.content) {
                    return { valid: false, error: 'PLAN requires content' };
                }
                break;
                
            default:
                return { valid: false, error: `Unknown action type: ${action.type}` };
        }
        
        return { valid: true };
    }
    
    /**
     * Get action summary for display
     */
    getActionSummary(action) {
        switch (action.type) {
            case 'edit':
                return `Edit ${action.file}`;
            case 'create':
                return `Create ${action.file}`;
            case 'terminal':
                return `Run: ${action.command}`;
            case 'plan':
                return `Project Plan (${action.tasks?.length || 0} tasks)`;
            default:
                return `Unknown action`;
        }
    }
    
    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
