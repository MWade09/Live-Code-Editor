/**
 * SnippetManager - Code snippets with tab triggers and placeholders
 * Provides VS Code-style snippet expansion with placeholder navigation
 */
export class SnippetManager {
    constructor(editor, codeMirror) {
        this.editor = editor;
        this.cm = codeMirror;
        this.snippets = this.loadSnippets();
        this.currentPlaceholders = [];
        this.currentPlaceholderIndex = 0;
        
        this.setupEventListeners();
        console.log('✅ SnippetManager initialized with', Object.keys(this.snippets).length, 'snippets');
    }

    /**
     * Load default snippets (can be overridden by user snippets from localStorage)
     */
    loadSnippets() {
        // Try to load user snippets from localStorage first
        const userSnippets = this.loadUserSnippets();
        
        // Merge with default snippets (user snippets take precedence)
        return {
            ...this.getDefaultSnippets(),
            ...userSnippets
        };
    }

    /**
     * Load user-defined snippets from localStorage
     */
    loadUserSnippets() {
        try {
            const stored = localStorage.getItem('editor-user-snippets');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading user snippets:', error);
            return {};
        }
    }

    /**
     * Save user snippets to localStorage
     */
    saveUserSnippets() {
        try {
            // Only save snippets that are not defaults
            const defaultSnippets = this.getDefaultSnippets();
            const userSnippets = {};
            
            Object.entries(this.snippets).forEach(([key, snippet]) => {
                if (!defaultSnippets[key] || JSON.stringify(defaultSnippets[key]) !== JSON.stringify(snippet)) {
                    userSnippets[key] = snippet;
                }
            });
            
            localStorage.setItem('editor-user-snippets', JSON.stringify(userSnippets));
            console.log('💾 User snippets saved');
        } catch (error) {
            console.error('Error saving user snippets:', error);
        }
    }

    /**
     * Get default snippet library
     */
    getDefaultSnippets() {
        return {
            // =====================================================
            // HTML SNIPPETS
            // =====================================================
            'html5': {
                prefix: 'html5',
                body: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${1:Document}</title>
</head>
<body>
    \${2:<!-- Content -->}
</body>
</html>`,
                description: 'HTML5 boilerplate',
                language: 'html'
            },
            
            'div': {
                prefix: 'div',
                body: '<div class="\${1:className}">\n    \${2:content}\n</div>',
                description: 'Div with class',
                language: 'html'
            },
            
            'form': {
                prefix: 'form',
                body: `<form action="\${1:/submit}" method="\${2:post}">
    \${3:<!-- Form fields -->}
    <button type="submit">\${4:Submit}</button>
</form>`,
                description: 'HTML form',
                language: 'html'
            },
            
            'input': {
                prefix: 'input',
                body: '<input type="\${1:text}" name="\${2:name}" placeholder="\${3:placeholder}" />',
                description: 'Input field',
                language: 'html'
            },
            
            'link': {
                prefix: 'link',
                body: '<link rel="stylesheet" href="\${1:style.css}">',
                description: 'Link stylesheet',
                language: 'html'
            },
            
            'script': {
                prefix: 'script',
                body: '<script src="\${1:script.js}"></script>',
                description: 'Script tag',
                language: 'html'
            },

            // =====================================================
            // CSS SNIPPETS
            // =====================================================
            'flex': {
                prefix: 'flex',
                body: `display: flex;
justify-content: \${1:center};
align-items: \${2:center};`,
                description: 'Flexbox container',
                language: 'css'
            },
            
            'grid': {
                prefix: 'grid',
                body: `display: grid;
grid-template-columns: \${1:repeat(3, 1fr)};
gap: \${2:1rem};`,
                description: 'CSS Grid container',
                language: 'css'
            },
            
            'transition': {
                prefix: 'transition',
                body: 'transition: \${1:all} \${2:0.3s} \${3:ease};',
                description: 'CSS transition',
                language: 'css'
            },
            
            'animation': {
                prefix: 'animation',
                body: `@keyframes \${1:animationName} {
    0% {
        \${2:property}: \${3:value};
    }
    100% {
        \${2:property}: \${4:value};
    }
}`,
                description: 'CSS animation',
                language: 'css'
            },

            'media': {
                prefix: 'media',
                body: `@media (max-width: \${1:768px}) {
    \${2:/* Styles */}
}`,
                description: 'Media query',
                language: 'css'
            },

            // =====================================================
            // JAVASCRIPT SNIPPETS
            // =====================================================
            'func': {
                prefix: 'func',
                body: `function \${1:functionName}(\${2:params}) {
    \${3:// body}
}`,
                description: 'Function declaration',
                language: 'javascript'
            },
            
            'afunc': {
                prefix: 'afunc',
                body: `async function \${1:functionName}(\${2:params}) {
    \${3:// body}
}`,
                description: 'Async function',
                language: 'javascript'
            },
            
            'arrow': {
                prefix: 'arrow',
                body: 'const \${1:name} = (\${2:params}) => {\n    \${3:// body}\n};',
                description: 'Arrow function',
                language: 'javascript'
            },
            
            'arrowsingle': {
                prefix: 'arrowsingle',
                body: 'const \${1:name} = (\${2:param}) => \${3:expression};',
                description: 'Single-line arrow function',
                language: 'javascript'
            },
            
            'foreach': {
                prefix: 'foreach',
                body: '\${1:array}.forEach((\${2:item}) => {\n    \${3:// body}\n});',
                description: 'Array.forEach',
                language: 'javascript'
            },
            
            'map': {
                prefix: 'map',
                body: '\${1:array}.map((\${2:item}) => \${3:item});',
                description: 'Array.map',
                language: 'javascript'
            },
            
            'filter': {
                prefix: 'filter',
                body: '\${1:array}.filter((\${2:item}) => \${3:condition});',
                description: 'Array.filter',
                language: 'javascript'
            },
            
            'reduce': {
                prefix: 'reduce',
                body: '\${1:array}.reduce((\${2:acc}, \${3:item}) => \${4:acc}, \${5:initial});',
                description: 'Array.reduce',
                language: 'javascript'
            },
            
            'promise': {
                prefix: 'promise',
                body: `new Promise((resolve, reject) => {
    \${1:// async operation}
    resolve(\${2:value});
});`,
                description: 'Promise',
                language: 'javascript'
            },
            
            'trycatch': {
                prefix: 'trycatch',
                body: `try {
    \${1:// code}
} catch (error) {
    \${2:console.error(error);}
}`,
                description: 'Try-catch block',
                language: 'javascript'
            },
            
            'class': {
                prefix: 'class',
                body: `class \${1:ClassName} {
    constructor(\${2:params}) {
        \${3:// initialization}
    }
    
    \${4:methodName}() {
        \${5:// method body}
    }
}`,
                description: 'Class declaration',
                language: 'javascript'
            },
            
            'import': {
                prefix: 'import',
                body: 'import \${1:module} from \'\${2:./module}\';',
                description: 'ES6 import',
                language: 'javascript'
            },
            
            'export': {
                prefix: 'export',
                body: 'export \${1:default} \${2:name};',
                description: 'ES6 export',
                language: 'javascript'
            },
            
            'log': {
                prefix: 'log',
                body: 'console.log(\${1:value});',
                description: 'Console log',
                language: 'javascript'
            },
            
            'setinterval': {
                prefix: 'setinterval',
                body: 'setInterval(() => {\n    \${1:// code}\n}, \${2:1000});',
                description: 'Set interval',
                language: 'javascript'
            },
            
            'settimeout': {
                prefix: 'settimeout',
                body: 'setTimeout(() => {\n    \${1:// code}\n}, \${2:1000});',
                description: 'Set timeout',
                language: 'javascript'
            },

            // =====================================================
            // REACT SNIPPETS
            // =====================================================
            'rfc': {
                prefix: 'rfc',
                body: `import React from 'react';

function \${1:ComponentName}(props) {
    return (
        <div>
            \${2:// content}
        </div>
    );
}

export default \${1:ComponentName};`,
                description: 'React Functional Component',
                language: 'javascript'
            },
            
            'rfce': {
                prefix: 'rfce',
                body: `import React from 'react';

export default function \${1:ComponentName}() {
    return (
        <div>
            \${2:// content}
        </div>
    );
}`,
                description: 'React FC with export',
                language: 'javascript'
            },
            
            'usestate': {
                prefix: 'usestate',
                body: 'const [\${1:state}, set\${1/(.*)/${1:/capitalize}/}] = useState(\${2:initialValue});',
                description: 'useState hook',
                language: 'javascript'
            },
            
            'useeffect': {
                prefix: 'useeffect',
                body: `useEffect(() => {
    \${1:// effect}
    
    return () => {
        \${2:// cleanup}
    };
}, [\${3:dependencies}]);`,
                description: 'useEffect hook',
                language: 'javascript'
            },
            
            'usecontext': {
                prefix: 'usecontext',
                body: 'const \${1:context} = useContext(\${2:Context});',
                description: 'useContext hook',
                language: 'javascript'
            },

            // =====================================================
            // VUE SNIPPETS
            // =====================================================
            'vbase': {
                prefix: 'vbase',
                body: `<template>
    <div>
        \${1:<!-- content -->}
    </div>
</template>

<script>
export default {
    name: '\${2:ComponentName}',
    data() {
        return {
            \${3:// data}
        }
    },
    methods: {
        \${4:// methods}
    }
}
</script>

<style scoped>
\${5:/* styles */}
</style>`,
                description: 'Vue base component',
                language: 'vue'
            },
            
            'vdata': {
                prefix: 'vdata',
                body: `data() {
    return {
        \${1:key}: \${2:value}
    }
}`,
                description: 'Vue data',
                language: 'javascript'
            },
            
            'vmethod': {
                prefix: 'vmethod',
                body: `\${1:methodName}() {
    \${2:// method body}
}`,
                description: 'Vue method',
                language: 'javascript'
            },

            // =====================================================
            // PYTHON SNIPPETS
            // =====================================================
            'def': {
                prefix: 'def',
                body: `def \${1:function_name}(\${2:params}):
    \${3:pass}`,
                description: 'Python function',
                language: 'python'
            },
            
            'class': {
                prefix: 'classpy',
                body: `class \${1:ClassName}:
    def __init__(self, \${2:params}):
        \${3:pass}
    
    def \${4:method_name}(self):
        \${5:pass}`,
                description: 'Python class',
                language: 'python'
            },
            
            'for': {
                prefix: 'for',
                body: `for \${1:item} in \${2:iterable}:
    \${3:pass}`,
                description: 'Python for loop',
                language: 'python'
            },
            
            'if': {
                prefix: 'if',
                body: `if \${1:condition}:
    \${2:pass}`,
                description: 'Python if statement',
                language: 'python'
            }
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for Tab key to expand snippets or navigate placeholders
        this.cm.on('keydown', (cm, event) => {
            if (event.key === 'Tab' && !event.shiftKey) {
                // If we have placeholders, navigate to next
                if (this.currentPlaceholders.length > 0) {
                    event.preventDefault();
                    this.navigateToNextPlaceholder();
                    return;
                }
                
                // Otherwise try to expand snippet
                if (this.tryExpandSnippet()) {
                    event.preventDefault();
                }
            }
        });
    }

    /**
     * Try to expand snippet at cursor
     */
    tryExpandSnippet() {
        const cursor = this.cm.getCursor();
        const line = this.cm.getLine(cursor.line);
        const textBeforeCursor = line.substring(0, cursor.ch);
        
        // Get the word before cursor (snippet prefix)
        const match = textBeforeCursor.match(/\b(\w+)$/);
        if (!match) return false;
        
        const prefix = match[1];
        const snippet = this.snippets[prefix];
        
        if (!snippet) return false;
        
        // Check if snippet is for current language
        const mode = this.cm.getMode().name;
        if (snippet.language && !this.isCompatibleLanguage(mode, snippet.language)) {
            return false;
        }
        
        console.log('✨ Expanding snippet:', prefix);
        
        // Calculate positions
        const from = { line: cursor.line, ch: cursor.ch - prefix.length };
        const to = cursor;
        
        // Expand snippet
        this.expandSnippet(snippet, from, to);
        
        return true;
    }

    /**
     * Check if current mode is compatible with snippet language
     */
    isCompatibleLanguage(currentMode, snippetLang) {
        const compatibility = {
            'htmlmixed': ['html', 'css', 'javascript'],
            'javascript': ['javascript'],
            'jsx': ['javascript', 'react'],
            'css': ['css'],
            'python': ['python'],
            'vue': ['vue', 'html', 'css', 'javascript']
        };
        
        return compatibility[currentMode]?.includes(snippetLang) || false;
    }

    /**
     * Expand snippet at given position
     */
    expandSnippet(snippet, from, to) {
        const body = snippet.body;
        
        // Parse placeholders
        this.currentPlaceholders = [];
        let processedBody = body;
        
        // Find all placeholders ${1:default}, ${2:default}, etc.
        const placeholderRegex = /\$\{(\d+):([^}]*)\}/g;
        let match;
        
        while ((match = placeholderRegex.exec(body)) !== null) {
            const placeholderNum = parseInt(match[1]);
            const defaultText = match[2];
            const matchStart = match.index;
            
            this.currentPlaceholders.push({
                num: placeholderNum,
                text: defaultText,
                originalMatch: match[0],
                position: matchStart
            });
        }
        
        // Sort placeholders by number
        this.currentPlaceholders.sort((a, b) => a.num - b.num);
        
        // Replace placeholders with default text
        processedBody = processedBody.replace(/\$\{(\d+):([^}]*)\}/g, '$2');
        
        // Insert the snippet
        this.cm.replaceRange(processedBody, from, to);
        
        // Navigate to first placeholder
        if (this.currentPlaceholders.length > 0) {
            this.currentPlaceholderIndex = 0;
            this.selectPlaceholder(0);
        }
    }

    /**
     * Select a placeholder by index
     */
    selectPlaceholder(index) {
        if (index >= this.currentPlaceholders.length) {
            this.currentPlaceholders = [];
            this.currentPlaceholderIndex = 0;
            return;
        }
        
        const placeholder = this.currentPlaceholders[index];
        const cursor = this.cm.getCursor();
        
        // Find the placeholder text in the document
        const searchText = placeholder.text;
        const searchCursor = this.cm.getSearchCursor(searchText, cursor);
        
        if (searchCursor.findNext()) {
            const from = searchCursor.from();
            const to = searchCursor.to();
            
            // Select the placeholder text
            this.cm.setSelection(from, to);
            this.cm.focus();
            
            console.log(`📍 Selected placeholder ${placeholder.num}: "${placeholder.text}"`);
        }
    }

    /**
     * Navigate to next placeholder
     */
    navigateToNextPlaceholder() {
        this.currentPlaceholderIndex++;
        
        if (this.currentPlaceholderIndex >= this.currentPlaceholders.length) {
            // No more placeholders, clear and exit
            this.currentPlaceholders = [];
            this.currentPlaceholderIndex = 0;
            console.log('✅ Snippet completion finished');
            return;
        }
        
        this.selectPlaceholder(this.currentPlaceholderIndex);
    }

    /**
     * Add a custom snippet
     */
    addSnippet(prefix, body, description, language) {
        this.snippets[prefix] = {
            prefix,
            body,
            description,
            language
        };
        
        this.saveUserSnippets();
        console.log('➕ Added snippet:', prefix);
    }

    /**
     * Remove a snippet
     */
    removeSnippet(prefix) {
        delete this.snippets[prefix];
        this.saveUserSnippets();
        console.log('➖ Removed snippet:', prefix);
    }

    /**
     * Get all snippets
     */
    getAllSnippets() {
        return this.snippets;
    }

    /**
     * Get snippets for current language
     */
    getSnippetsForCurrentLanguage() {
        const mode = this.cm.getMode().name;
        const filtered = {};
        
        Object.entries(this.snippets).forEach(([key, snippet]) => {
            if (!snippet.language || this.isCompatibleLanguage(mode, snippet.language)) {
                filtered[key] = snippet;
            }
        });
        
        return filtered;
    }

    /**
     * Show snippet browser palette
     */
    showSnippetPalette() {
        // This will be called by the command palette
        // For now, just log available snippets
        const snippets = this.getSnippetsForCurrentLanguage();
        console.log('📚 Available snippets:', Object.keys(snippets));
        
        // TODO: Create a UI modal to browse and insert snippets
        alert(`Available snippets:\n\n${Object.entries(snippets).map(([key, s]) => `${key} - ${s.description}`).join('\n')}`);
    }
}
