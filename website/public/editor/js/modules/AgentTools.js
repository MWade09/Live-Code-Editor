/**
 * AgentTools - Tool definitions and utilities for the AI agent
 * 
 * Provides a clean interface for registering and executing tools.
 * Each tool has:
 * - id: Unique identifier
 * - name: Human-readable name
 * - description: What the tool does (for AI context)
 * - schema: Parameter schema for validation
 * - requiresApproval: Whether user approval is needed
 * - execute: Async function to run the tool
 */
export class AgentTools {
    constructor() {
        this.tools = new Map();
    }

    /**
     * Register a new tool
     */
    register(toolDefinition) {
        const { id, name, description, schema, requiresApproval, execute } = toolDefinition;
        
        if (!id || !execute) {
            throw new Error('Tool must have id and execute function');
        }
        
        this.tools.set(id, {
            id,
            name: name || id,
            description: description || '',
            schema: schema || {},
            requiresApproval: requiresApproval ?? false,
            execute
        });
        
        return this;
    }

    /**
     * Get a tool by ID
     */
    get(id) {
        return this.tools.get(id);
    }

    /**
     * Check if a tool exists
     */
    has(id) {
        return this.tools.has(id);
    }

    /**
     * Execute a tool with validation
     */
    async execute(id, params) {
        const tool = this.tools.get(id);
        
        if (!tool) {
            throw new Error(`Unknown tool: ${id}`);
        }
        
        // Validate params against schema
        this.validateParams(tool, params);
        
        // Execute the tool
        return await tool.execute(params);
    }

    /**
     * Validate parameters against schema
     */
    validateParams(tool, params) {
        const { schema } = tool;
        
        if (!schema.required) return;
        
        for (const required of schema.required) {
            if (!(required in params)) {
                throw new Error(`Missing required parameter: ${required}`);
            }
        }
    }

    /**
     * Get all tool descriptions for AI context
     */
    getDescriptions() {
        const descriptions = [];
        
        for (const [id, tool] of this.tools) {
            descriptions.push({
                id,
                name: tool.name,
                description: tool.description,
                parameters: tool.schema,
                requiresApproval: tool.requiresApproval
            });
        }
        
        return descriptions;
    }

    /**
     * Get tool descriptions as formatted string for prompts
     */
    getDescriptionsForPrompt() {
        let text = '';
        
        for (const tool of this.getDescriptions()) {
            text += `\n### ${tool.name} (${tool.id})\n`;
            text += `${tool.description}\n`;
            
            if (tool.parameters.properties) {
                text += 'Parameters:\n';
                for (const [name, prop] of Object.entries(tool.parameters.properties)) {
                    const required = tool.parameters.required?.includes(name) ? ' (required)' : '';
                    text += `  - ${name}: ${prop.description || prop.type}${required}\n`;
                }
            }
            
            text += `Requires approval: ${tool.requiresApproval ? 'Yes' : 'No'}\n`;
        }
        
        return text;
    }

    /**
     * Create standard file system tools
     */
    static createFileSystemTools(fileManager) {
        const tools = new AgentTools();
        
        // Read file
        tools.register({
            id: 'read_file',
            name: 'Read File',
            description: 'Read the contents of a file from the project',
            schema: {
                type: 'object',
                properties: {
                    filename: { type: 'string', description: 'The filename to read' }
                },
                required: ['filename']
            },
            requiresApproval: false,
            execute: async ({ filename }) => {
                const file = fileManager.files.find(f => f.name === filename);
                if (!file) {
                    throw new Error(`File not found: ${filename}`);
                }
                return {
                    filename: file.name,
                    content: file.content,
                    type: file.type,
                    size: file.content.length
                };
            }
        });
        
        // Write file
        tools.register({
            id: 'write_file',
            name: 'Write File',
            description: 'Modify an existing file or create a new one',
            schema: {
                type: 'object',
                properties: {
                    filename: { type: 'string', description: 'The filename to write' },
                    content: { type: 'string', description: 'The file content' }
                },
                required: ['filename', 'content']
            },
            requiresApproval: true,
            execute: async ({ filename, content }) => {
                let file = fileManager.files.find(f => f.name === filename);
                
                if (file) {
                    // Update existing file
                    file.content = content;
                    fileManager.saveFile(file.id);
                    return { action: 'updated', filename };
                } else {
                    // Create new file
                    fileManager.createFile(filename, content);
                    return { action: 'created', filename };
                }
            }
        });
        
        // Delete file
        tools.register({
            id: 'delete_file',
            name: 'Delete File',
            description: 'Delete a file from the project',
            schema: {
                type: 'object',
                properties: {
                    filename: { type: 'string', description: 'The filename to delete' }
                },
                required: ['filename']
            },
            requiresApproval: true,
            execute: async ({ filename }) => {
                const file = fileManager.files.find(f => f.name === filename);
                if (!file) {
                    throw new Error(`File not found: ${filename}`);
                }
                fileManager.deleteFile(file.id);
                return { action: 'deleted', filename };
            }
        });
        
        // List files
        tools.register({
            id: 'list_files',
            name: 'List Files',
            description: 'List all files in the project',
            schema: {
                type: 'object',
                properties: {
                    pattern: { type: 'string', description: 'Optional glob pattern to filter files' }
                }
            },
            requiresApproval: false,
            execute: async ({ pattern }) => {
                let files = fileManager.files;
                
                if (pattern) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    files = files.filter(f => regex.test(f.name));
                }
                
                return {
                    files: files.map(f => ({
                        name: f.name,
                        type: f.type,
                        size: f.content.length
                    })),
                    count: files.length
                };
            }
        });
        
        // Search in files
        tools.register({
            id: 'search_files',
            name: 'Search Files',
            description: 'Search for text patterns across project files',
            schema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'The text or regex pattern to search for' },
                    isRegex: { type: 'boolean', description: 'Whether to treat query as regex' },
                    filePattern: { type: 'string', description: 'Optional pattern to filter files' }
                },
                required: ['query']
            },
            requiresApproval: false,
            execute: async ({ query, isRegex, filePattern }) => {
                const results = [];
                const searchRegex = isRegex ? new RegExp(query, 'gi') : null;
                
                for (const file of fileManager.files) {
                    if (filePattern) {
                        const filterRegex = new RegExp(filePattern.replace(/\*/g, '.*'));
                        if (!filterRegex.test(file.name)) continue;
                    }
                    
                    const lines = file.content.split('\n');
                    lines.forEach((line, index) => {
                        const matches = isRegex 
                            ? line.match(searchRegex)
                            : line.toLowerCase().includes(query.toLowerCase());
                        
                        if (matches) {
                            results.push({
                                file: file.name,
                                line: index + 1,
                                content: line.trim(),
                                match: isRegex ? matches[0] : query
                            });
                        }
                    });
                }
                
                return {
                    query,
                    results,
                    matchCount: results.length
                };
            }
        });
        
        return tools;
    }

    /**
     * Create terminal tools
     */
    static createTerminalTools(terminalManager) {
        const tools = new AgentTools();
        
        tools.register({
            id: 'run_command',
            name: 'Run Terminal Command',
            description: 'Execute a shell command in the terminal',
            schema: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'The command to execute' },
                    cwd: { type: 'string', description: 'Working directory for the command' }
                },
                required: ['command']
            },
            requiresApproval: true,
            execute: async ({ command, cwd }) => {
                if (!terminalManager) {
                    throw new Error('Terminal not available');
                }
                
                const result = await terminalManager.executeCommand(command, { cwd });
                
                return {
                    command,
                    output: result.output,
                    exitCode: result.exitCode,
                    error: result.error,
                    duration: result.duration
                };
            }
        });
        
        tools.register({
            id: 'get_terminal_output',
            name: 'Get Terminal Output',
            description: 'Get the recent output from the terminal',
            schema: {
                type: 'object',
                properties: {
                    lines: { type: 'number', description: 'Number of lines to retrieve (default: 50)' }
                }
            },
            requiresApproval: false,
            execute: async ({ lines = 50 }) => {
                if (!terminalManager) {
                    throw new Error('Terminal not available');
                }
                
                const output = terminalManager.getRecentOutput(lines);
                return { output, lineCount: output.split('\n').length };
            }
        });
        
        return tools;
    }

    /**
     * Create analysis tools
     */
    static createAnalysisTools(fileManager, embeddingsManager = null) {
        const tools = new AgentTools();
        
        // Analyze file structure
        tools.register({
            id: 'analyze_file',
            name: 'Analyze File',
            description: 'Analyze a file\'s structure, imports, exports, and patterns',
            schema: {
                type: 'object',
                properties: {
                    filename: { type: 'string', description: 'The file to analyze' }
                },
                required: ['filename']
            },
            requiresApproval: false,
            execute: async ({ filename }) => {
                const file = fileManager.files.find(f => f.name === filename);
                if (!file) {
                    throw new Error(`File not found: ${filename}`);
                }
                
                const analysis = {
                    filename: file.name,
                    type: file.type,
                    lineCount: file.content.split('\n').length,
                    size: file.content.length,
                    imports: [],
                    exports: [],
                    functions: [],
                    classes: [],
                    dependencies: []
                };
                
                // Extract imports
                const importMatches = file.content.matchAll(/import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g);
                for (const match of importMatches) {
                    analysis.imports.push(match[1]);
                }
                
                // Extract exports
                const exportMatches = file.content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/g);
                for (const match of exportMatches) {
                    analysis.exports.push(match[1]);
                }
                
                // Extract functions
                const funcMatches = file.content.matchAll(/(?:async\s+)?function\s+(\w+)|(\w+)\s*(?:=|:)\s*(?:async\s+)?\([^)]*\)\s*(?:=>|{)/g);
                for (const match of funcMatches) {
                    if (match[1] || match[2]) {
                        analysis.functions.push(match[1] || match[2]);
                    }
                }
                
                // Extract classes
                const classMatches = file.content.matchAll(/class\s+(\w+)/g);
                for (const match of classMatches) {
                    analysis.classes.push(match[1]);
                }
                
                return analysis;
            }
        });
        
        // Semantic search (if embeddings available)
        if (embeddingsManager) {
            tools.register({
                id: 'semantic_search',
                name: 'Semantic Search',
                description: 'Search the codebase using natural language',
                schema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Natural language search query' },
                        maxResults: { type: 'number', description: 'Maximum results to return (default: 5)' }
                    },
                    required: ['query']
                },
                requiresApproval: false,
                execute: async ({ query, maxResults = 5 }) => {
                    const results = await embeddingsManager.searchRelevantFiles(query, {
                        topK: maxResults
                    });
                    
                    return {
                        query,
                        results: results.map(r => ({
                            file: r.filePath,
                            score: r.score,
                            preview: r.matchedContent?.substring(0, 200)
                        }))
                    };
                }
            });
        }
        
        return tools;
    }

    /**
     * Merge multiple tool sets
     */
    static merge(...toolSets) {
        const merged = new AgentTools();
        
        for (const toolSet of toolSets) {
            for (const [id, tool] of toolSet.tools) {
                merged.tools.set(id, tool);
            }
        }
        
        return merged;
    }
}
