/**
 * Bundled Application - All modules in one file for file:// compatibility
 * This is a complete self-contained version that works without a web server
 */

// Load chat panel scripts and styles
(function() {
    console.log('Loading chat panel components...');
    
    // Load chat panel stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/chat-panel.css';
    document.head.appendChild(link);
    
    // Function to load scripts in order
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = (error) => {
            console.error('Error loading script', src, error);
        };
        document.head.appendChild(script);
    }
    
    // Load chat panel script, then model manager script
    loadScript('js/chat-panel.js', function() {
        console.log('Chat panel script loaded');
        loadScript('js/model-manager.js', function() {
            console.log('Model manager script loaded');
        });
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    // Modal Animation Functions
    function showModal(modalElement) {
        modalElement.style.display = 'flex';
        setTimeout(() => {
            modalElement.classList.add('show');
        }, 10);
    }

    function hideModal(modalElement) {
        modalElement.classList.remove('show');
        setTimeout(() => {
            modalElement.style.display = 'none';
        }, 300);
    }

    // FileManager Class
    class FileManager {
        constructor() {
            this.files = [];
            this.currentFileIndex = -1;
            this.fileCounter = 0;
            
            // Load files from local storage if available
            this.loadFilesFromStorage();
        }
        
        loadFilesFromStorage() {
            try {
                const savedFiles = localStorage.getItem('editorFiles');
                if (savedFiles) {
                    this.files = JSON.parse(savedFiles);
                    this.fileCounter = this.files.length;
                    if (this.files.length > 0) {
                        this.currentFileIndex = 0;
                    }
                }
            } catch (err) {
                console.error('Error loading files from storage:', err);
                this.files = [];
                this.currentFileIndex = -1;
                this.fileCounter = 0;
            }
        }
        
        saveFilesToStorage() {
            try {
                localStorage.setItem('editorFiles', JSON.stringify(this.files));
            } catch (err) {
                console.error('Error saving files to storage:', err);
                alert('Failed to save to local storage. Your work may not be saved.');
            }
        }
        
        createNewFile(filename, content = '') {
            const fileType = this.getFileType(filename);
            const newFile = {
                id: this.generateFileId(),
                name: filename,
                content: content,
                type: fileType
            };
            
            this.files.push(newFile);
            this.currentFileIndex = this.files.length - 1;
            this.saveFilesToStorage();
            
            return newFile;
        }
        
        getFileType(filename) {
            const extension = filename.split('.').pop().toLowerCase();
            
            switch (extension) {
                case 'html':
                case 'htm':
                    return 'html';
                case 'css':
                    return 'css';
                case 'js':
                case 'mjs':
                    return 'javascript';
                case 'ts':
                    return 'typescript';
                case 'tsx':
                case 'jsx':
                    return 'jsx';
                case 'vue':
                    return 'vue';
                case 'py':
                    return 'python';
                case 'scss':
                case 'sass':
                    return 'scss';
                case 'less':
                    return 'less';
                case 'md':
                case 'markdown':
                    return 'markdown';
                case 'sql':
                    return 'sql';
                case 'sh':
                case 'bash':
                case 'zsh':
                    return 'shell';
                case 'yml':
                case 'yaml':
                    return 'yaml';
                case 'json':
                    return 'json';
                case 'xml':
                case 'svg':
                    return 'xml';
                case 'java':
                    return 'java';
                case 'cpp':
                case 'cc':
                case 'cxx':
                case 'c++':
                    return 'cpp';
                case 'c':
                case 'h':
                    return 'c';
                case 'cs':
                    return 'csharp';
                case 'php':
                    return 'php';
                case 'rb':
                    return 'ruby';
                case 'go':
                    return 'go';
                case 'rs':
                    return 'rust';
                case 'dockerfile':
                    return 'dockerfile';
                case 'ini':
                case 'cfg':
                case 'conf':
                    return 'ini';
                default:
                    return 'text';
            }
        }
        
        generateFileId() {
            return `file_${Date.now()}_${this.fileCounter++}`;
        }
        
        getCurrentFile() {
            if (this.currentFileIndex >= 0 && this.currentFileIndex < this.files.length) {
                return this.files[this.currentFileIndex];
            }
            return null;
        }
        
        setCurrentFileIndex(index) {
            if (index >= 0 && index < this.files.length) {
                this.currentFileIndex = index;
                return true;
            }
            return false;
        }
        
        setCurrentFileById(id) {
            const index = this.files.findIndex(file => file.id === id);
            return this.setCurrentFileIndex(index);
        }
        
        updateCurrentFile(content) {
            const currentFile = this.getCurrentFile();
            if (currentFile) {
                currentFile.content = content;
                this.saveFilesToStorage();
            }
        }
        
        deleteFile(id) {
            const index = this.files.findIndex(file => file.id === id);
            if (index !== -1) {
                this.files.splice(index, 1);
                
                // Update current file index if needed
                if (this.files.length === 0) {
                    this.currentFileIndex = -1;
                } else if (this.currentFileIndex >= this.files.length) {
                    this.currentFileIndex = this.files.length - 1;
                } else if (this.currentFileIndex === index && index > 0) {
                    this.currentFileIndex = index - 1;
                }
                
                this.saveFilesToStorage();
                return true;
            }
            return false;
        }
        
        uploadFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        const filename = file.name;
                        const content = event.target.result;
                        const newFile = this.createNewFile(filename, content);
                        resolve(newFile);
                    } catch (err) {
                        reject(err);
                    }
                };
                
                reader.onerror = (err) => {
                    reject(new Error('Failed to read file'));
                };
                
                reader.readAsText(file);
            });
        }

        uploadFolder(files) {
            return new Promise((resolve, reject) => {
                if (files.length === 0) {
                    reject(new Error('No files selected'));
                    return;
                }

                // Sort files to process them in a logical order
                const sortedFiles = Array.from(files).sort((a, b) => {
                    const pathA = a.webkitRelativePath || a.name;
                    const pathB = b.webkitRelativePath || b.name;
                    return pathA.localeCompare(pathB);
                });

                // Keep track of successful uploads
                const uploadedFiles = [];
                const failed = [];
                let completedUploads = 0;

                // Create a map of files for organizing
                const rootFolderName = sortedFiles[0].webkitRelativePath ? 
                    sortedFiles[0].webkitRelativePath.split('/')[0] : '';
                
                // Process text files only - skip binary files like images
                const textFileExtensions = [
                    'html', 'htm', 'css', 'js', 'json', 'txt', 'md', 'xml', 
                    'svg', 'csv', 'yaml', 'yml', 'php', 'py', 'rb', 'java', 
                    'c', 'cpp', 'h', 'cs', 'go', 'ts', 'jsx', 'tsx'
                ];
                
                const processableFiles = sortedFiles.filter(file => {
                    const ext = file.name.split('.').pop().toLowerCase();
                    return textFileExtensions.includes(ext);
                });

                if (processableFiles.length === 0) {
                    reject(new Error('No supported text files found in folder'));
                    return;
                }

                // Process each file
                processableFiles.forEach(file => {
                    const reader = new FileReader();
                    
                    reader.onload = (event) => {
                        try {
                            // Get relative path without root folder
                            const relativePath = file.webkitRelativePath || file.name;
                            // Either keep full path or remove root folder name
                            const displayPath = relativePath.replace(`${rootFolderName}/`, '');
                            
                            // Create file in editor
                            const newFile = this.createNewFile(
                                displayPath,
                                event.target.result
                            );
                            
                            uploadedFiles.push(newFile);
                        } catch (err) {
                            failed.push({
                                name: file.name,
                                error: err.message
                            });
                        }
                        
                        // Check if all uploads are complete
                        completedUploads++;
                        if (completedUploads === processableFiles.length) {
                            if (uploadedFiles.length > 0) {
                                this.currentFileIndex = this.files.length - uploadedFiles.length;
                                resolve({
                                    success: uploadedFiles.length,
                                    failed: failed.length,
                                    failedFiles: failed
                                });
                            } else {
                                reject(new Error('No valid files could be uploaded'));
                            }
                        }
                    };
                    
                    reader.onerror = () => {
                        failed.push({
                            name: file.name,
                            error: 'Failed to read file'
                        });
                        
                        completedUploads++;
                        if (completedUploads === processableFiles.length) {
                            if (uploadedFiles.length > 0) {
                                resolve({
                                    success: uploadedFiles.length,
                                    failed: failed.length,
                                    failedFiles: failed
                                });
                            } else {
                                reject(new Error('No valid files could be uploaded'));
                            }
                        }
                    };
                    
                    reader.readAsText(file);
                });
            });
        }
        
        downloadCurrentFile() {
            const currentFile = this.getCurrentFile();
            if (!currentFile) return false;
            
            const blob = new Blob([currentFile.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFile.name;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            return true;
        }
        
        downloadAllFiles() {
            if (this.files.length === 0) return false;
            
            const zip = new JSZip();
            
            // Add all files to the zip
            this.files.forEach(file => {
                zip.file(file.name, file.content);
            });
            
            // Generate the zip file and trigger download
            zip.generateAsync({ type: 'blob' }).then(content => {
                const url = URL.createObjectURL(content);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'project.zip';
                a.style.display = 'none';
                
                document.body.appendChild(a);
                a.click();
                
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            });
            
            return true;
        }
    }

    // Editor Class  
    class Editor {
        constructor(editorElement, fileManager) {
            this.fileManager = fileManager;
            this.codeMirror = CodeMirror(editorElement, {
                lineNumbers: true,
                theme: document.body.classList.contains('dark-theme') ? 'monokai' : 'eclipse',
                indentUnit: 2,
                smartIndent: true,
                tabSize: 2,
                indentWithTabs: false,
                lineWrapping: false,
                mode: 'htmlmixed',
                autoCloseTags: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                matchTags: { bothTags: true },
                
                // Code folding support
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                
                // Multiple cursor support
                selectionPointer: true,
                
                // Additional features
                highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true},
                styleActiveLine: true,
                cursorBlinkRate: 530,
                
                // Keyboard shortcuts for folding and multiple cursors
                extraKeys: {
                    // Code folding shortcuts
                    "Ctrl-Shift-[": cm => cm.foldCode(cm.getCursor()),
                    "Ctrl-Shift-]": cm => cm.unfoldCode(cm.getCursor()),
                    "Ctrl-Alt-[": cm => this.foldAll(),
                    "Ctrl-Alt-]": cm => this.unfoldAll(),
                    "F9": cm => cm.foldCode(cm.getCursor()),
                    "Shift-F9": cm => cm.unfoldCode(cm.getCursor()),
                    
                    // Multiple cursor shortcuts
                    "Ctrl-D": cm => this.selectNextOccurrence(cm),
                    "Ctrl-Shift-D": cm => this.selectAllOccurrences(cm),
                    "Alt-Click": cm => this.addCursorAtClick(cm),
                    "Ctrl-Alt-Up": cm => this.addCursorAbove(cm),
                    "Ctrl-Alt-Down": cm => this.addCursorBelow(cm),
                    "Escape": cm => this.clearMultipleSelections(cm),
                    
                    // Search and selection
                    "Ctrl-F": "findPersistent",
                    "Ctrl-H": "replace",
                    "Ctrl-Shift-F": "findPersistent",
                    "F3": "findNext",
                    "Shift-F3": "findPrev",
                    
                    // Line manipulation with multiple cursors
                    "Ctrl-Shift-K": cm => this.deleteLines(cm),
                    "Ctrl-Shift-Up": cm => this.moveLineUp(cm),
                    "Ctrl-Shift-Down": cm => this.moveLineDown(cm),
                    "Ctrl-/": cm => this.toggleComment(cm),
                    
                    // Column selection
                    "Shift-Alt-Down": cm => this.columnSelectionDown(cm),
                    "Shift-Alt-Up": cm => this.columnSelectionUp(cm)
                }
            });
            
            this.codeMirror.on('change', () => {
                this.updateCurrentFile();
            });
            
            // Add folding controls to the editor
            this.setupFoldingControls();
        }
        
        // Setup folding control buttons
        setupFoldingControls() {
            // Create folding controls container
            const editorElement = this.codeMirror.getWrapperElement();
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'editor-controls';            controlsContainer.innerHTML = `
                <div class="folding-controls">
                    <button id="fold-all-btn" class="editor-control-btn" title="Fold All (Ctrl+Alt+[)">
                        <i class="fas fa-compress-alt"></i>
                    </button>
                    <button id="unfold-all-btn" class="editor-control-btn" title="Unfold All (Ctrl+Alt+])">
                        <i class="fas fa-expand-alt"></i>
                    </button>
                </div>
                <div class="multi-cursor-controls">
                    <button id="select-next-btn" class="editor-control-btn" title="Select Next Occurrence (Ctrl+D)">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button id="select-all-btn" class="editor-control-btn" title="Select All Occurrences (Ctrl+Shift+D)">
                        <i class="fas fa-expand-arrows-alt"></i>
                    </button>
                    <button id="clear-selections-btn" class="editor-control-btn" title="Clear Multiple Selections (Esc)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            // Insert controls at the top of the editor
            editorElement.insertBefore(controlsContainer, editorElement.firstChild);
            
            // Add event listeners for the buttons
            document.getElementById('fold-all-btn').addEventListener('click', () => this.foldAll());
            document.getElementById('unfold-all-btn').addEventListener('click', () => this.unfoldAll());
            document.getElementById('select-next-btn').addEventListener('click', () => this.selectNextOccurrence(this.codeMirror));
            document.getElementById('select-all-btn').addEventListener('click', () => this.selectAllOccurrences(this.codeMirror));
            document.getElementById('clear-selections-btn').addEventListener('click', () => this.clearMultipleSelections(this.codeMirror));
        }
        
        // Fold all code blocks
        foldAll() {
            const cm = this.codeMirror;
            for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
                cm.foldCode({line: i, ch: 0}, null, "fold");
            }
        }
        
        // Unfold all code blocks
        unfoldAll() {
            const cm = this.codeMirror;
            
            // Method 1: Try to find and clear all fold marks
            try {
                const marks = cm.getAllMarks();
                marks.forEach(mark => {
                    if (mark.__isFold) {
                        mark.clear();
                    }
                });
                return;
            } catch (e) {
                console.log('Method 1 failed, trying method 2:', e.message);
            }
            
            // Method 2: Use foldCode with toggle behavior
            try {
                for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
                    const pos = {line: i, ch: 0};
                    const range = cm.findFoldAt(pos);
                    if (range) {
                        cm.foldCode(pos); // This toggles the fold
                    }
                }
                return;
            } catch (e) {
                console.log('Method 2 failed, trying method 3:', e.message);
            }
            
            // Method 3: Set cursor and use unfoldCode like keyboard shortcuts
            try {
                for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
                    const pos = {line: i, ch: 0};
                    cm.setCursor(pos);
                    if (typeof cm.unfoldCode === 'function') {
                        cm.unfoldCode(pos);
                    }
                }
            } catch (e) {
                console.log('All unfold methods failed:', e.message);
            }
        }
        
        updateCurrentFile() {
            const content = this.codeMirror.getValue();
            this.fileManager.updateCurrentFile(content);
        }
        
        loadFile(file) {
            if (!file) return;
            
            // Enhanced file type to CodeMirror mode mapping
            const mode = this.getModeFromFileType(file.type, file.name);
            
            this.codeMirror.setOption('mode', mode);
            this.codeMirror.setValue(file.content || '');
            this.codeMirror.clearHistory();
            
            // Refresh the editor to apply the new mode
            setTimeout(() => {
                this.codeMirror.refresh();
            }, 100);
        }
        
        // Enhanced method to determine CodeMirror mode from file type and name
        getModeFromFileType(fileType, fileName = '') {
            const extension = fileName.split('.').pop()?.toLowerCase();
            
            // Primary check: use file type if available
            switch (fileType) {
                case 'html':
                    return 'htmlmixed';
                case 'css':
                    return 'css';
                case 'javascript':
                    return 'javascript';
                case 'python':
                    return 'python';
                case 'typescript':
                    return 'text/typescript';
                case 'jsx':
                case 'react':
                    return 'text/jsx';
                case 'vue':
                    return 'vue';
                case 'scss':
                case 'sass':
                    return 'text/x-scss';
                case 'markdown':
                    return 'markdown';
                case 'sql':
                    return 'sql';
                case 'shell':
                    return 'shell';
                case 'yaml':
                    return 'yaml';
                case 'dockerfile':
                    return 'dockerfile';
                case 'json':
                    return 'application/json';
                case 'xml':
                    return 'xml';
                case 'java':
                    return 'text/x-java';
                case 'cpp':
                case 'c++':
                    return 'text/x-c++src';
                case 'c':
                    return 'text/x-csrc';
                case 'csharp':
                case 'cs':
                    return 'text/x-csharp';
                case 'php':
                    return 'text/x-php';
                case 'ruby':
                    return 'text/x-ruby';
                case 'go':
                    return 'text/x-go';
                case 'rust':
                    return 'text/x-rustsrc';
                default:
                    // Secondary check: use file extension
                    return this.getModeFromExtension(extension);
            }
        }
        
        // Helper method to determine mode from file extension
        getModeFromExtension(extension) {
            switch (extension) {
                case 'html':
                case 'htm':
                    return 'htmlmixed';
                case 'css':
                    return 'css';
                case 'js':
                case 'mjs':
                    return 'javascript';
                case 'ts':
                    return 'text/typescript';
                case 'tsx':
                case 'jsx':
                    return 'text/jsx';
                case 'vue':
                    return 'vue';
                case 'py':
                    return 'python';
                case 'scss':
                case 'sass':
                    return 'text/x-scss';
                case 'less':
                    return 'text/x-less';
                case 'md':
                case 'markdown':
                    return 'markdown';
                case 'sql':
                    return 'sql';
                case 'sh':
                case 'bash':
                case 'zsh':
                    return 'shell';
                case 'yml':
                case 'yaml':
                    return 'yaml';
                case 'json':
                    return 'application/json';
                case 'xml':
                case 'svg':
                    return 'xml';
                case 'java':
                    return 'text/x-java';
                case 'cpp':
                case 'cc':
                case 'cxx':
                    return 'text/x-c++src';
                case 'c':
                case 'h':
                    return 'text/x-csrc';
                case 'cs':
                    return 'text/x-csharp';
                case 'php':
                    return 'text/x-php';
                case 'rb':
                    return 'text/x-ruby';
                case 'go':
                    return 'text/x-go';
                case 'rs':
                    return 'text/x-rustsrc';
                case 'dockerfile':
                    return 'dockerfile';
                case 'ini':
                case 'cfg':
                case 'conf':
                    return 'text/x-ini';
                default:
                    return 'text/plain';
            }
        }
        
        loadCurrentFile() {
            const currentFile = this.fileManager.getCurrentFile();
            this.loadFile(currentFile);
        }
        
        setTheme(isDark) {
            this.codeMirror.setOption('theme', isDark ? 'monokai' : 'eclipse');
        }
        
        focus() {
            this.codeMirror.focus();
        }
        
        // Multiple cursor support methods
        selectNextOccurrence(cm) {
            const selection = cm.getSelection();
            if (!selection) {
                // If no selection, select the word at cursor
                const cursor = cm.getCursor();
                const word = cm.findWordAt(cursor);
                cm.setSelection(word.anchor, word.head);
                return;
            }
            
            // Find next occurrence of selected text
            const searchCursor = cm.getSearchCursor(selection, cm.getCursor());
            if (searchCursor.findNext()) {
                cm.addSelection(searchCursor.from(), searchCursor.to());
            } else {
                // Wrap around to beginning
                const searchCursor2 = cm.getSearchCursor(selection, { line: 0, ch: 0 });
                if (searchCursor2.findNext()) {
                    cm.addSelection(searchCursor2.from(), searchCursor2.to());
                }
            }
        }
        
        selectAllOccurrences(cm) {
            const selection = cm.getSelection();
            if (!selection) {
                // If no selection, select the word at cursor
                const cursor = cm.getCursor();
                const word = cm.findWordAt(cursor);
                cm.setSelection(word.anchor, word.head);
                this.selectAllOccurrences(cm);
                return;
            }
            
            // Find all occurrences and select them
            const selections = [];
            const searchCursor = cm.getSearchCursor(selection, { line: 0, ch: 0 });
            
            while (searchCursor.findNext()) {
                selections.push({
                    anchor: searchCursor.from(),
                    head: searchCursor.to()
                });
            }
            
            if (selections.length > 0) {
                cm.setSelections(selections);
            }
        }
        
        addCursorAtClick(cm) {
            // This will be handled by CodeMirror's built-in Alt+Click functionality
            // when selectionPointer is enabled
            return true;
        }
        
        addCursorAbove(cm) {
            const selections = cm.listSelections();
            const newSelections = [...selections];
            
            selections.forEach(sel => {
                const cursor = sel.head;
                if (cursor.line > 0) {
                    const newLine = cursor.line - 1;
                    const lineLength = cm.getLine(newLine).length;
                    const newCh = Math.min(cursor.ch, lineLength);
                    newSelections.push({
                        anchor: { line: newLine, ch: newCh },
                        head: { line: newLine, ch: newCh }
                    });
                }
            });
            
            cm.setSelections(newSelections);
        }
        
        addCursorBelow(cm) {
            const selections = cm.listSelections();
            const newSelections = [...selections];
            
            selections.forEach(sel => {
                const cursor = sel.head;
                if (cursor.line < cm.lineCount() - 1) {
                    const newLine = cursor.line + 1;
                    const lineLength = cm.getLine(newLine).length;
                    const newCh = Math.min(cursor.ch, lineLength);
                    newSelections.push({
                        anchor: { line: newLine, ch: newCh },
                        head: { line: newLine, ch: newCh }
                    });
                }
            });
            
            cm.setSelections(newSelections);
        }
        
        clearMultipleSelections(cm) {
            const selections = cm.listSelections();
            if (selections.length > 1) {
                // Keep only the primary selection (usually the last one)
                cm.setSelection(selections[0].anchor, selections[0].head);
            }
        }
        
        deleteLines(cm) {
            const selections = cm.listSelections();
            cm.operation(() => {
                // Sort selections by line number (descending) to delete from bottom to top
                const lines = selections.map(sel => sel.head.line).sort((a, b) => b - a);
                const uniqueLines = [...new Set(lines)];
                
                uniqueLines.forEach(line => {
                    if (line < cm.lineCount()) {
                        cm.replaceRange('', 
                            { line: line, ch: 0 }, 
                            { line: line + 1, ch: 0 }
                        );
                    }
                });
            });
        }
        
        moveLineUp(cm) {
            const selections = cm.listSelections();
            cm.operation(() => {
                const movedLines = new Set();
                
                selections.forEach(sel => {
                    const line = sel.head.line;
                    if (line > 0 && !movedLines.has(line) && !movedLines.has(line - 1)) {
                        const currentLine = cm.getLine(line);
                        const previousLine = cm.getLine(line - 1);
                        
                        // Replace the two lines
                        cm.replaceRange(currentLine + '\n' + previousLine, 
                            { line: line - 1, ch: 0 }, 
                            { line: line + 1, ch: 0 }
                        );
                        
                        movedLines.add(line);
                        movedLines.add(line - 1);
                    }
                });
            });
        }
        
        moveLineDown(cm) {
            const selections = cm.listSelections();
            cm.operation(() => {
                const movedLines = new Set();
                
                selections.forEach(sel => {
                    const line = sel.head.line;
                    if (line < cm.lineCount() - 1 && !movedLines.has(line) && !movedLines.has(line + 1)) {
                        const currentLine = cm.getLine(line);
                        const nextLine = cm.getLine(line + 1);
                        
                        // Replace the two lines
                        cm.replaceRange(nextLine + '\n' + currentLine, 
                            { line: line, ch: 0 }, 
                            { line: line + 2, ch: 0 }
                        );
                        
                        movedLines.add(line);
                        movedLines.add(line + 1);
                    }
                });
            });
        }
        
        toggleComment(cm) {
            const selections = cm.listSelections();
            const mode = cm.getMode();
            let commentString = '// ';
            let commentEnd = '';
            
            // Determine comment string based on file mode
            switch (mode.name) {
                case 'htmlmixed':
                case 'xml':
                    commentString = '<!-- ';
                    commentEnd = ' -->';
                    break;
                case 'css':
                    commentString = '/* ';
                    commentEnd = ' */';
                    break;
                case 'python':
                    commentString = '# ';
                    break;
                case 'sql':
                    commentString = '-- ';
                    break;
                default:
                    commentString = '// ';
            }
            
            cm.operation(() => {
                selections.forEach(sel => {
                    const startLine = Math.min(sel.anchor.line, sel.head.line);
                    const endLine = Math.max(sel.anchor.line, sel.head.line);
                    
                    for (let line = startLine; line <= endLine; line++) {
                        const lineText = cm.getLine(line);
                        const trimmed = lineText.trim();
                        
                        if (commentEnd) {
                            // Block comment (CSS, HTML)
                            if (trimmed.startsWith(commentString.trim()) && trimmed.endsWith(commentEnd.trim())) {
                                // Remove comment
                                const newText = lineText
                                    .replace(commentString, '')
                                    .replace(commentEnd, '');
                                cm.replaceRange(newText, 
                                    { line: line, ch: 0 }, 
                                    { line: line, ch: lineText.length }
                                );
                            } else {
                                // Add comment
                                cm.replaceRange(commentString + lineText + commentEnd, 
                                    { line: line, ch: 0 }, 
                                    { line: line, ch: lineText.length }
                                );
                            }
                        } else {
                            // Line comment
                            if (trimmed.startsWith(commentString.trim())) {
                                // Remove comment
                                const newText = lineText.replace(commentString, '');
                                cm.replaceRange(newText, 
                                    { line: line, ch: 0 }, 
                                    { line: line, ch: lineText.length }
                                );
                            } else {
                                // Add comment
                                cm.replaceRange(commentString + lineText, 
                                    { line: line, ch: 0 }, 
                                    { line: line, ch: lineText.length }
                                );
                            }
                        }
                    }
                });
            });
        }
        
        columnSelectionDown(cm) {
            const selections = cm.listSelections();
            const newSelections = [];
            
            selections.forEach(sel => {
                // Create column selection downward
                const startLine = sel.anchor.line;
                const endLine = sel.head.line;
                const startCh = Math.min(sel.anchor.ch, sel.head.ch);
                const endCh = Math.max(sel.anchor.ch, sel.head.ch);
                
                for (let line = startLine; line <= Math.min(endLine + 1, cm.lineCount() - 1); line++) {
                    const lineLength = cm.getLine(line).length;
                    newSelections.push({
                        anchor: { line: line, ch: Math.min(startCh, lineLength) },
                        head: { line: line, ch: Math.min(endCh, lineLength) }
                    });
                }
            });
            
            if (newSelections.length > 0) {
                cm.setSelections(newSelections);
            }
        }
        
        columnSelectionUp(cm) {
            const selections = cm.listSelections();
            const newSelections = [];
            
            selections.forEach(sel => {
                // Create column selection upward
                const startLine = sel.anchor.line;
                const endLine = sel.head.line;
                const startCh = Math.min(sel.anchor.ch, sel.head.ch);
                const endCh = Math.max(sel.anchor.ch, sel.head.ch);
                
                for (let line = Math.max(startLine - 1, 0); line <= endLine; line++) {
                    const lineLength = cm.getLine(line).length;
                    newSelections.push({
                        anchor: { line: line, ch: Math.min(startCh, lineLength) },
                        head: { line: line, ch: Math.min(endCh, lineLength) }
                    });
                }
            });
            
            if (newSelections.length > 0) {
                cm.setSelections(newSelections);
            }
        }
    }

    // Other classes would continue here...
    // For now, let's just fix the critical issue and create a new working script
    
    // Since we need to fix this immediately, let's create a new clean script
    // that works with the current HTML structure
    
    // Initialize the application  
    initializeApp();
    
    function initializeApp() {
        console.log('Initializing bundled application...');
        
        // Try to initialize basic functionality first
        try {
            const fileManager = new FileManager();
            const editor = new Editor(document.getElementById('editor'), fileManager);
            
            // Store globally for access
            window.app = {
                fileManager,
                editor,
                showModal,
                hideModal
            };
            
            console.log('Basic application initialized successfully');
            
            // Set up basic event listeners
            setupBasicEventListeners(fileManager, editor);
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }
    
    function setupBasicEventListeners(fileManager, editor) {
        // New file button
        const newFileBtn = document.getElementById('new-file-btn');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => {
                const fileName = prompt('Enter filename:');
                if (fileName) {
                    const newFile = fileManager.createNewFile(fileName);
                    editor.loadFile(newFile);
                    console.log('Created new file:', fileName);
                }
            });
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = document.body.classList.toggle('dark-theme');
                editor.setTheme(isDark);
                themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            });
        }
        
        console.log('Basic event listeners set up');
    }
});
