/**
 * ProjectContextManager class - Analyzes project structure and provides context for AI
 * Detects frameworks, analyzes dependencies, maps file relationships
 */
export class ProjectContextManager {
    constructor(fileManager) {
        console.log('🗂️ ProjectContextManager: Initializing...');
        this.fileManager = fileManager;
        this.projectStructure = null;
        this.dependencies = null;
        this.frameworkInfo = null;
        this.lastAnalysisTime = null;
        this.cacheTimeout = 30000; // 30 seconds cache
    }
    
    /**
     * Analyze the entire project and cache results
     * @returns {Object} Project analysis
     */
    analyzeProject() {
        // Use cache if recent
        const now = Date.now();
        if (this.lastAnalysisTime && (now - this.lastAnalysisTime) < this.cacheTimeout) {
            console.log('🗂️ Using cached project analysis');
            return {
                structure: this.projectStructure,
                dependencies: this.dependencies,
                framework: this.frameworkInfo
            };
        }
        
        console.log('🗂️ Analyzing project structure...');
        
        // Analyze project structure
        this.projectStructure = this.buildFileTree();
        
        // Detect framework
        this.frameworkInfo = this.detectFramework();
        
        // Parse dependencies
        this.dependencies = this.parseDependencies();
        
        // Map imports/exports
        const importMap = this.parseImportExports();
        
        this.lastAnalysisTime = now;
        
        return {
            structure: this.projectStructure,
            dependencies: this.dependencies,
            framework: this.frameworkInfo,
            imports: importMap
        };
    }
    
    /**
     * Build a hierarchical file tree structure
     * @returns {Object} File tree
     */
    buildFileTree() {
        const tree = {
            name: 'root',
            type: 'folder',
            children: [],
            fileCount: 0,
            totalSize: 0
        };
        
        // Group files by directory
        const folders = new Map();
        
        this.fileManager.files.forEach(file => {
            const pathParts = file.name.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const folderPath = pathParts.slice(0, -1).join('/');
            
            if (!folders.has(folderPath)) {
                folders.set(folderPath, []);
            }
            
            folders.get(folderPath).push({
                name: fileName,
                fullPath: file.name,
                type: 'file',
                extension: this.getFileExtension(fileName),
                size: this.getFileSize(file.content),
                language: file.language || file.type
            });
            
            tree.fileCount++;
            tree.totalSize += this.getFileSize(file.content);
        });
        
        // Build nested structure
        folders.forEach((files, folderPath) => {
            if (folderPath === '') {
                // Root level files
                tree.children.push(...files);
            } else {
                // Nested files
                const parts = folderPath.split('/');
                let current = tree;
                
                parts.forEach((part, index) => {
                    let folder = current.children.find(c => c.name === part && c.type === 'folder');
                    if (!folder) {
                        folder = {
                            name: part,
                            type: 'folder',
                            children: [],
                            path: parts.slice(0, index + 1).join('/')
                        };
                        current.children.push(folder);
                    }
                    current = folder;
                });
                
                current.children.push(...files);
            }
        });
        
        return tree;
    }
    
    /**
     * Detect the framework being used
     * @returns {Object} Framework information
     */
    detectFramework() {
        const frameworks = {
            react: { detected: false, confidence: 0, indicators: [] },
            vue: { detected: false, confidence: 0, indicators: [] },
            angular: { detected: false, confidence: 0, indicators: [] },
            svelte: { detected: false, confidence: 0, indicators: [] },
            vanilla: { detected: false, confidence: 0, indicators: [] }
        };
        
        // Check for package.json
        const packageJson = this.fileManager.files.find(f => f.name === 'package.json');
        if (packageJson) {
            try {
                const pkg = JSON.parse(packageJson.content);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                
                if (deps.react || deps['react-dom']) {
                    frameworks.react.detected = true;
                    frameworks.react.confidence = 90;
                    frameworks.react.indicators.push('package.json has React dependencies');
                }
                if (deps.vue) {
                    frameworks.vue.detected = true;
                    frameworks.vue.confidence = 90;
                    frameworks.vue.indicators.push('package.json has Vue dependency');
                }
                if (deps['@angular/core']) {
                    frameworks.angular.detected = true;
                    frameworks.angular.confidence = 90;
                    frameworks.angular.indicators.push('package.json has Angular dependencies');
                }
                if (deps.svelte) {
                    frameworks.svelte.detected = true;
                    frameworks.svelte.confidence = 90;
                    frameworks.svelte.indicators.push('package.json has Svelte dependency');
                }
            } catch (e) {
                console.warn('Failed to parse package.json', e);
            }
        }
        
        // Check file contents for framework indicators
        this.fileManager.files.forEach(file => {
            const content = file.content.toLowerCase();
            
            // React indicators
            if (content.includes('import react') || content.includes('from \'react\'') || 
                content.includes('from "react"') || content.includes('jsx')) {
                frameworks.react.confidence += 10;
                frameworks.react.indicators.push(`${file.name} imports React`);
            }
            
            // Vue indicators
            if (file.name.endsWith('.vue') || content.includes('<template>') || 
                content.includes('vue.createapp')) {
                frameworks.vue.confidence += 10;
                frameworks.vue.indicators.push(`${file.name} is a Vue file`);
            }
            
            // Angular indicators
            if (content.includes('@component') || content.includes('@ngmodule') || 
                file.name.endsWith('.component.ts')) {
                frameworks.angular.confidence += 10;
                frameworks.angular.indicators.push(`${file.name} is an Angular component`);
            }
            
            // Svelte indicators
            if (file.name.endsWith('.svelte') || content.includes('svelte:')) {
                frameworks.svelte.confidence += 10;
                frameworks.svelte.indicators.push(`${file.name} is a Svelte file`);
            }
        });
        
        // Determine primary framework
        let primaryFramework = 'vanilla';
        let maxConfidence = 0;
        
        Object.keys(frameworks).forEach(fw => {
            if (frameworks[fw].confidence > maxConfidence) {
                maxConfidence = frameworks[fw].confidence;
                primaryFramework = fw;
            }
        });
        
        // If no framework detected with confidence > 20, it's vanilla JS
        if (maxConfidence < 20) {
            frameworks.vanilla.detected = true;
            frameworks.vanilla.confidence = 100;
            frameworks.vanilla.indicators.push('No framework detected - vanilla JavaScript');
            primaryFramework = 'vanilla';
        }
        
        return {
            primary: primaryFramework,
            details: frameworks
        };
    }
    
    /**
     * Parse dependencies from package.json
     * @returns {Object} Dependencies information
     */
    parseDependencies() {
        const packageJson = this.fileManager.files.find(f => f.name === 'package.json');
        
        if (!packageJson) {
            return {
                found: false,
                dependencies: [],
                devDependencies: []
            };
        }
        
        try {
            const pkg = JSON.parse(packageJson.content);
            return {
                found: true,
                dependencies: Object.keys(pkg.dependencies || {}).map(name => ({
                    name,
                    version: pkg.dependencies[name]
                })),
                devDependencies: Object.keys(pkg.devDependencies || {}).map(name => ({
                    name,
                    version: pkg.devDependencies[name]
                })),
                scripts: pkg.scripts || {}
            };
        } catch (e) {
            console.warn('Failed to parse package.json', e);
            return {
                found: false,
                error: 'Invalid JSON'
            };
        }
    }
    
    /**
     * Parse import/export statements from JavaScript files
     * @returns {Object} Import map
     */
    parseImportExports() {
        const importMap = {
            files: [],
            entryPoints: [],
            externalDeps: new Set()
        };
        
        this.fileManager.files.forEach(file => {
            // Only analyze JS/TS files
            if (!this.isJavaScriptFile(file.name)) {
                return;
            }
            
            const fileInfo = {
                name: file.name,
                imports: [],
                exports: []
            };
            
            const lines = file.content.split('\n');
            
            lines.forEach(line => {
                const trimmed = line.trim();
                
                // Match import statements
                const importMatch = trimmed.match(/^import\s+.*?\s+from\s+['"](.+?)['"]/);
                if (importMatch) {
                    const importPath = importMatch[1];
                    if (importPath.startsWith('.') || importPath.startsWith('/')) {
                        // Local import
                        fileInfo.imports.push({
                            type: 'local',
                            path: importPath
                        });
                    } else {
                        // External dependency
                        importMap.externalDeps.add(importPath.split('/')[0]);
                        fileInfo.imports.push({
                            type: 'external',
                            module: importPath
                        });
                    }
                }
                
                // Match export statements
                if (trimmed.startsWith('export')) {
                    if (trimmed.includes('export default')) {
                        fileInfo.exports.push({ type: 'default' });
                    } else if (trimmed.includes('export class')) {
                        const className = trimmed.match(/export\s+class\s+(\w+)/)?.[1];
                        fileInfo.exports.push({ type: 'class', name: className });
                    } else if (trimmed.includes('export function')) {
                        const funcName = trimmed.match(/export\s+function\s+(\w+)/)?.[1];
                        fileInfo.exports.push({ type: 'function', name: funcName });
                    } else if (trimmed.includes('export const')) {
                        const constName = trimmed.match(/export\s+const\s+(\w+)/)?.[1];
                        fileInfo.exports.push({ type: 'const', name: constName });
                    }
                }
            });
            
            // Identify entry points (files with no imports or only external imports)
            if (fileInfo.imports.length === 0 || 
                fileInfo.imports.every(imp => imp.type === 'external')) {
                importMap.entryPoints.push(file.name);
            }
            
            importMap.files.push(fileInfo);
        });
        
        importMap.externalDeps = Array.from(importMap.externalDeps);
        
        return importMap;
    }
    
    /**
     * Generate a concise project summary for AI context
     * @returns {string} Formatted project summary
     */
    generateProjectSummary() {
        const analysis = this.analyzeProject();
        
        let summary = '\n## Project Structure Summary\n\n';
        
        // Basic info
        summary += `**Files:** ${analysis.structure.fileCount} files\n`;
        summary += `**Total Size:** ${this.formatFileSize(analysis.structure.totalSize)}\n`;
        summary += `**Framework:** ${analysis.framework.primary.charAt(0).toUpperCase() + analysis.framework.primary.slice(1)}\n\n`;
        
        // File structure
        summary += '**Directory Structure:**\n';
        summary += this.formatTree(analysis.structure, 0);
        summary += '\n';
        
        // Dependencies
        if (analysis.dependencies.found) {
            const depCount = analysis.dependencies.dependencies.length;
            const devDepCount = analysis.dependencies.devDependencies.length;
            
            if (depCount > 0) {
                summary += `**Dependencies (${depCount}):** `;
                summary += analysis.dependencies.dependencies
                    .slice(0, 5)
                    .map(d => d.name)
                    .join(', ');
                if (depCount > 5) {
                    summary += `, +${depCount - 5} more`;
                }
                summary += '\n';
            }
            
            if (devDepCount > 0) {
                summary += `**Dev Dependencies (${devDepCount}):** `;
                summary += analysis.dependencies.devDependencies
                    .slice(0, 3)
                    .map(d => d.name)
                    .join(', ');
                if (devDepCount > 3) {
                    summary += `, +${devDepCount - 3} more`;
                }
                summary += '\n';
            }
        }
        
        // Entry points
        if (analysis.imports && analysis.imports.entryPoints.length > 0) {
            summary += `\n**Entry Points:** ${analysis.imports.entryPoints.join(', ')}\n`;
        }
        
        // External dependencies used
        if (analysis.imports && analysis.imports.externalDeps.length > 0) {
            summary += `**Imported Modules:** ${analysis.imports.externalDeps.slice(0, 5).join(', ')}`;
            if (analysis.imports.externalDeps.length > 5) {
                summary += `, +${analysis.imports.externalDeps.length - 5} more`;
            }
            summary += '\n';
        }
        
        return summary;
    }
    
    /**
     * Format file tree for display
     * @param {Object} node - Tree node
     * @param {number} depth - Current depth
     * @returns {string} Formatted tree
     */
    formatTree(node, depth) {
        let result = '';
        const indent = '  '.repeat(depth);
        
        if (node.type === 'folder' && node.name !== 'root') {
            result += `${indent}📁 ${node.name}/\n`;
        }
        
        if (node.children) {
            // Sort: folders first, then files
            const sorted = [...node.children].sort((a, b) => {
                if (a.type === 'folder' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            });
            
            sorted.forEach(child => {
                if (child.type === 'folder') {
                    result += this.formatTree(child, depth + 1);
                } else {
                    result += `${indent}  📄 ${child.name}\n`;
                }
            });
        }
        
        return result;
    }
    
    /**
     * Helper: Get file extension
     */
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts[parts.length - 1] : '';
    }
    
    /**
     * Helper: Check if file is JavaScript/TypeScript
     */
    isJavaScriptFile(filename) {
        const ext = this.getFileExtension(filename).toLowerCase();
        return ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(ext);
    }
    
    /**
     * Helper: Get file size in bytes
     */
    getFileSize(content) {
        return new Blob([content]).size;
    }
    
    /**
     * Helper: Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}
