// Load chat panel scripts and styles - needs to be this way to ensure clean loading
(function() {
    console.log('Loading chat panel components...');
    
    // Load chat panel stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/chat-panel-clean.css';
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

    // File Manager Class
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
    }    // Editor Class
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
            controlsContainer.className = 'editor-controls';
            controlsContainer.innerHTML = `
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
    }

    // Preview Class
    class Preview {
        constructor(previewFrame, fileManager) {
            this.previewFrame = previewFrame;
            this.fileManager = fileManager;
            this.isLivePreview = true;
        }
        
        updatePreview() {
            const files = this.fileManager.files;
            if (files.length === 0) {
                this.clearPreview();
                return;
            }
            
            // Find HTML file or use the first file if none
            let htmlFile = files.find(file => file.type === 'html');
            if (!htmlFile) {
                htmlFile = files[0];
            }
            
            // Get CSS files
            const cssFiles = files.filter(file => file.type === 'css');
            
            // Get JS files
            const jsFiles = files.filter(file => file.type === 'javascript');
            
            // Create full HTML document
            let htmlContent = htmlFile.content;
            
            // If not already an HTML document, wrap the content
            if (!htmlContent.includes('<!DOCTYPE html>')) {
                let cssLinks = '';
                cssFiles.forEach(file => {
                    cssLinks += `<style>${file.content}</style>\n`;
                });
                
                let jsScripts = '';
                jsFiles.forEach(file => {
                    jsScripts += `<script>${file.content}</script>\n`;
                });
                
                htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    ${cssLinks}
</head>
<body>
    ${htmlFile.type === 'html' ? htmlFile.content : `<pre>${htmlFile.content}</pre>`}
    ${jsScripts}
</body>
</html>`;
            } else {
                // Inject CSS and JS files into existing HTML document
                // Assuming the HTML file already has proper structure
                let headEndPos = htmlContent.indexOf('</head>');
                if (headEndPos !== -1) {
                    let cssInjection = '';
                    cssFiles.forEach(file => {
                        if (file !== htmlFile) {
                            cssInjection += `<style>${file.content}</style>\n`;
                        }
                    });
                    
                    htmlContent = htmlContent.slice(0, headEndPos) + cssInjection + htmlContent.slice(headEndPos);
                }
                
                let bodyEndPos = htmlContent.indexOf('</body>');
                if (bodyEndPos !== -1) {
                    let jsInjection = '';
                    jsFiles.forEach(file => {
                        if (file !== htmlFile) {
                            jsInjection += `<script>${file.content}</script>\n`;
                        }
                    });
                    
                    htmlContent = htmlContent.slice(0, bodyEndPos) + jsInjection + htmlContent.slice(bodyEndPos);
                }
            }
            
            try {
                // Update the iframe
                const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
                frameDoc.open();
                frameDoc.write(htmlContent);
                frameDoc.close();
            } catch (err) {
                console.error('Error updating preview:', err);
            }
        }
        
        clearPreview() {
            try {
                const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
                frameDoc.open();
                frameDoc.write('<html><body><div style="text-align: center; padding: 20px; color: #666;">Preview will appear here</div></body></html>');
                frameDoc.close();
            } catch (err) {
                console.error('Error clearing preview:', err);
            }
        }
        
        toggleLivePreview() {
            this.isLivePreview = !this.isLivePreview;
            return this.isLivePreview;
        }
    }

    // Resizer Class
    class Resizer {
        constructor(resizerElement, editorPane, previewPane) {
            this.resizer = resizerElement;
            this.editorPane = editorPane;
            this.previewPane = previewPane;
            this.isHorizontal = window.innerWidth > 768;
            
            this.initResizer();
            this.addResponsiveListener();
        }
        
        initResizer() {
            let startPos, startEditorSize, startPreviewSize;
            
            const startResize = (e) => {
                e.preventDefault();
                
                if (this.isHorizontal) {
                    startPos = e.clientX;
                    startEditorSize = this.editorPane.getBoundingClientRect().width;
                    startPreviewSize = this.previewPane.getBoundingClientRect().width;
                } else {
                    startPos = e.clientY;
                    startEditorSize = this.editorPane.getBoundingClientRect().height;
                    startPreviewSize = this.previewPane.getBoundingClientRect().height;
                }
                
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
            };
            
            const resize = (e) => {
                if (this.isHorizontal) {
                    const dx = e.clientX - startPos;
                    const containerWidth = this.editorPane.parentElement.getBoundingClientRect().width;
                    
                    let editorWidth = startEditorSize + dx;
                    let previewWidth = startPreviewSize - dx;
                    
                    // Ensure minimum sizes
                    const minWidth = containerWidth * 0.1;
                    if (editorWidth < minWidth) editorWidth = minWidth;
                    if (previewWidth < minWidth) previewWidth = minWidth;
                    
                    const editorPct = (editorWidth / containerWidth) * 100;
                    const previewPct = (previewWidth / containerWidth) * 100;
                    
                    this.editorPane.style.flex = `0 0 ${editorPct}%`;
                    this.previewPane.style.flex = `0 0 ${previewPct}%`;
                } else {
                    const dy = e.clientY - startPos;
                    const containerHeight = this.editorPane.parentElement.getBoundingClientRect().height;
                    
                    let editorHeight = startEditorSize + dy;
                    let previewHeight = startPreviewSize - dy;
                    
                    // Ensure minimum sizes
                    const minHeight = containerHeight * 0.1;
                    if (editorHeight < minHeight) editorHeight = minHeight;
                    if (previewHeight < minHeight) previewHeight = minHeight;
                    
                    const editorPct = (editorHeight / containerHeight) * 100;
                    const previewPct = (previewHeight / containerHeight) * 100;
                    
                    this.editorPane.style.flex = `0 0 ${editorPct}%`;
                    this.previewPane.style.flex = `0 0 ${previewPct}%`;
                }
            };
            
            const stopResize = () => {
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stopResize);
            };
            
            this.resizer.addEventListener('mousedown', startResize);
        }
        
        addResponsiveListener() {
            const checkOrientation = () => {
                const wasHorizontal = this.isHorizontal;
                this.isHorizontal = window.innerWidth > 768;
                
                if (wasHorizontal !== this.isHorizontal) {
                    // Reset flex to default when changing orientation
                    this.editorPane.style.flex = '1';
                    this.previewPane.style.flex = '1';
                }
            };
            
            window.addEventListener('resize', checkOrientation);
        }
    }

    // Theme Manager Class
    class ThemeManager {
        constructor() {
            this.isDarkTheme = document.body.classList.contains('dark-theme');
        }
        
        toggleTheme() {
            this.isDarkTheme = !this.isDarkTheme;
            
            if (this.isDarkTheme) {
                document.body.classList.add('dark-theme');
                document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                document.body.classList.remove('dark-theme');
                document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
            }
            
            return this.isDarkTheme;
        }
        
        getTheme() {
            return this.isDarkTheme ? 'dark' : 'light';
        }
    }

    // Deploy Manager Class
    class DeployManager {
        constructor(fileManager) {
            this.fileManager = fileManager;
            this.deployModal = document.getElementById('deployModal');
            this.deployStatus = document.getElementById('deploy-status');
            this.deployLink = document.getElementById('deploy-link');
        }
        
        async deployToNetlify() {
            if (this.fileManager.files.length === 0) {
                this.updateStatus('No files to deploy', 'error');
                return;
            }
            
            try {
                this.updateStatus('Preparing files for deployment...', 'pending');
                
                // Create a zip file with all project files
                const zip = new JSZip();
                
                // Add each file to the zip
                this.fileManager.files.forEach(file => {
                    zip.file(file.name, file.content);
                });
                
                // Ensure we have an index.html
                if (!this.fileManager.files.some(file => file.name === 'index.html')) {
                    // Create a simple index that links to all files
                    let indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Files</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Project Files</h1>
    <ul>`;
                    
                    this.fileManager.files.forEach(file => {
                        indexContent += `
        <li><a href="./${file.name}">${file.name}</a></li>`;
                    });
                    
                    indexContent += `
    </ul>
</body>
</html>`;
                    
                    zip.file('index.html', indexContent);
                }
                
                this.updateStatus('Packaging files...', 'pending');
                
                // Generate the zip file
                const content = await zip.generateAsync({ type: 'blob' });
                
                this.prepareNetlifyDeploy(content);
                
            } catch (error) {
                console.error('Deployment error:', error);
                this.updateStatus(`Deployment error: ${error.message}`, 'error');
            }
        }
        
        prepareNetlifyDeploy(zipBlob) {
            // Create a download link for the zip
            const zipUrl = URL.createObjectURL(zipBlob);
            
            // Update status with instructions for Netlify Drop
            this.updateStatus('Files ready for deployment!', 'success');
            
            // Create instructions for manual deployment
            const deployInstructions = document.createElement('div');
            deployInstructions.innerHTML = `
                <p>To deploy to Netlify:</p>
                <ol>
                    <li><a href="${zipUrl}" download="website.zip">Download your site as a ZIP file</a></li>
                    <li>Visit <a href="https://app.netlify.com/drop" target="_blank">Netlify Drop</a></li>
                    <li>Drag and drop your ZIP file onto the Netlify page</li>
                    <li>Your site will be live in seconds!</li>
                </ol>
            `;
            
            this.deployLink.innerHTML = '';
            this.deployLink.appendChild(deployInstructions);
            this.deployLink.style.display = 'block';
        }
        
        updateStatus(message, status) {
            this.deployStatus.textContent = message;
            
            // Reset classes
            this.deployStatus.className = 'deploy-status';
            
            // Add status class
            if (status) {
                this.deployStatus.classList.add(`status-${status}`);
            }
        }
        
        showDeployModal() {
            showModal(this.deployModal);
            this.deployStatus.textContent = 'Ready to deploy.';
            this.deployStatus.className = 'deploy-status';
            this.deployLink.style.display = 'none';
        }
        
        hideDeployModal() {
            hideModal(this.deployModal);
        }
    }

    // AI Manager Class
    class AIManager {
        constructor(editor, fileManager) {
            this.editor = editor;
            this.fileManager = fileManager;
            this.aiModal = document.getElementById('aiModal');
            this.aiStatus = document.getElementById('ai-status');
            this.chatHistory = document.getElementById('chat-history');
            
            // Initialize chat messages array
            this.messages = [];
            
            // Load chat history from local storage if available
            this.loadChatHistory();
            
            // Load API key from local storage if available
            this.apiKey = localStorage.getItem('openroute_api_key') || '';
            if (this.apiKey) {
                document.getElementById('ai-api-key').value = this.apiKey;
            }
            
            // Add event listener for Send button and Enter key
            const sendButton = document.getElementById('send-message-btn');
            const aiPrompt = document.getElementById('ai-prompt');
            
            if (sendButton) {
                sendButton.addEventListener('click', () => this.sendMessage());
            }
            
            if (aiPrompt) {
                aiPrompt.addEventListener('keydown', (e) => {
                    // Send on Enter (not Shift+Enter for new line)
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
            }
            
            // Add clear chat button
            const aiModalTitle = this.aiModal.querySelector('h3');
            if (aiModalTitle) {
                const clearButton = document.createElement('button');
                clearButton.className = 'clear-chat-btn';
                clearButton.textContent = 'Clear Chat';
                clearButton.addEventListener('click', () => this.clearChat());
                aiModalTitle.appendChild(clearButton);
            }
            
            // Initialize insert at cursor functionality
            const insertCodeBtn = document.getElementById('insert-code-btn');
            if (insertCodeBtn) {
                insertCodeBtn.addEventListener('click', () => this.insertLastCodeAtCursor());
            }
        }
        
        showAIModal() {
            showModal(this.aiModal);
            // Focus the prompt input
            setTimeout(() => {
                document.getElementById('ai-prompt').focus();
            }, 300);
        }
        
        hideAIModal() {
            hideModal(this.aiModal);
        }
        
        updateStatus(message, status) {
            this.aiStatus.textContent = message;
            this.aiStatus.className = 'ai-status';
            
            if (status) {
                this.aiStatus.classList.add(status);
            }
        }
        
        loadChatHistory() {
            try {
                const savedMessages = localStorage.getItem('ai_chat_history');
                if (savedMessages) {
                    this.messages = JSON.parse(savedMessages);
                    this.renderChatHistory();
                }
            } catch (err) {
                console.error('Error loading chat history:', err);
                this.messages = [];
            }
        }
        
        saveChatHistory() {
            try {
                localStorage.setItem('ai_chat_history', JSON.stringify(this.messages));
            } catch (err) {
                console.error('Error saving chat history:', err);
            }
        }
        
        clearChat() {
            this.messages = [];
            this.saveChatHistory();
            this.chatHistory.innerHTML = '';
        }
        
        addMessageToHistory(role, content) {
            const message = {
                role,
                content,
                timestamp: new Date().toISOString()
            };
            
            this.messages.push(message);
            this.saveChatHistory();
            this.renderMessage(message);
            
            // Scroll to the bottom
            this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        }
        
        renderChatHistory() {
            this.chatHistory.innerHTML = '';
            this.messages.forEach(message => {
                this.renderMessage(message);
            });
            
            // Scroll to the bottom
            this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        }
        
        renderMessage(message) {
            const messageEl = document.createElement('div');
            const isUserMessage = message.role === 'user';
            
            messageEl.className = `chat-message ${isUserMessage ? 'user-message' : 'ai-message'}`;
            
            // Process content for markdown/code formatting
            let formattedContent = this.formatMessageContent(message.content);
            
            messageEl.innerHTML = `
                ${formattedContent}
                <div class="message-time">
                    ${this.formatTimestamp(message.timestamp)}
                </div>
            `;
            
            this.chatHistory.appendChild(messageEl);
        }
        
        formatMessageContent(content) {
            // Simple markdown-like formatting
            let formatted = content
                // Handle code blocks with syntax highlighting
                .replace(/```(\w*)([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                // Handle inline code
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                // Handle paragraphs
                .split('\n\n').join('</p><p>')
                // Handle line breaks
                .split('\n').join('<br>');
            
            // Wrap in paragraph if not already wrapped
            if (!formatted.startsWith('<p>')) {
                formatted = `<p>${formatted}</p>`;
            }
            
            return formatted;
        }
        
        formatTimestamp(timestamp) {
            try {
                const date = new Date(timestamp);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                return '';
            }
        }
        
        showTypingIndicator() {
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = '<span></span><span></span><span></span>';
            typingIndicator.id = 'typing-indicator';
            this.chatHistory.appendChild(typingIndicator);
            this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        }
        
        removeTypingIndicator() {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
        
        async sendMessage() {
            const promptInput = document.getElementById('ai-prompt');
            const prompt = promptInput.value.trim();
            
            if (!prompt) {
                return;
            }
            
            // Get API key
            const apiKey = document.getElementById('ai-api-key').value.trim();
            if (!apiKey) {
                this.updateStatus('Please enter your OpenRoute API key', 'error');
                return;
            }
            
            // Save API key for future use
            localStorage.setItem('openroute_api_key', apiKey);
            this.apiKey = apiKey;
            
            // Add user message to chat
            this.addMessageToHistory('user', prompt);
            
            // Clear input field
            promptInput.value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            try {
                // Update status
                this.updateStatus('Generating response...', 'loading');
                
                // Get the current file to include context
                const currentFile = this.fileManager.getCurrentFile();
                
                // Get the current model
                const model = document.getElementById('ai-model').value;
                
                // Build the system message with context
                let systemMessage = "You are an AI coding assistant. Help with creating, improving, and explaining code.";
                
                if (currentFile) {
                    systemMessage += ` The user is currently editing a ${currentFile.type} file named "${currentFile.name}".`;
                    
                    // If the file has content, include a summary
                    if (currentFile.content && currentFile.content.length > 0) {
                        systemMessage += ` Here's a summary of the current file: ${currentFile.content.slice(0, 200)}...`;
                    }
                }
                
                // Create messages array for the API
                const apiMessages = [
                    { role: "system", content: systemMessage }
                ];
                
                // Add conversation history (limit to the last 10 messages to avoid token limits)
                const recentMessages = this.messages.slice(-10);
                recentMessages.forEach(msg => {
                    apiMessages.push({
                        role: msg.role,
                        content: msg.content
                    });
                });
                
                // Call OpenRoute API
                const response = await this.callOpenRouteAPI(model, apiMessages);
                
                // Remove typing indicator
                this.removeTypingIndicator();
                
                if (response && response.choices && response.choices.length > 0) {
                    // Extract response content
                    const aiResponse = response.choices[0].message.content;
                    
                    // Add AI message to chat
                    this.addMessageToHistory('assistant', aiResponse);
                    
                    // Update status
                    this.updateStatus('Response generated successfully', 'success');
                    
                    // Store the last code block for the "Insert at Cursor" button
                    this.lastCodeBlock = this.extractCodeFromResponse(aiResponse);
                } else {
                    this.updateStatus('Failed to generate response: Invalid response from API', 'error');
                }
            } catch (error) {
                console.error('Error generating response:', error);
                this.updateStatus(`Error: ${error.message}`, 'error');
                this.removeTypingIndicator();
            }
        }
        
        async generateCode() {
            // Get values from form
            const apiKey = document.getElementById('ai-api-key').value.trim();
            const model = document.getElementById('ai-model').value;
            const prompt = document.getElementById('ai-prompt').value.trim();
            
            // Validate inputs
            if (!apiKey) {
                this.updateStatus('Please enter your OpenRoute API key', 'error');
                return;
            }
            
            if (!prompt) {
                this.updateStatus('Please enter a description of what you want to create', 'error');
                return;
            }
            
            // Save API key for future use
            localStorage.setItem('openroute_api_key', apiKey);
            this.apiKey = apiKey;
            
            // Add user message to chat
            this.addMessageToHistory('user', prompt);
            
            // Clear input field
            document.getElementById('ai-prompt').value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            try {
                // Update status
                this.updateStatus('Generating code', 'loading');
                
                // Get the current file to determine what type of code to generate
                const currentFile = this.fileManager.getCurrentFile();
                let fileType = currentFile ? currentFile.type : 'html';
                
                // Prepare the prompt for the API
                const promptPrefix = this.getPromptPrefix(fileType);
                const fullPrompt = promptPrefix + prompt;
                
                // Create system message
                const systemMessage = {
                    role: "system",
                    content: `You are an AI coding assistant. Generate clean, efficient ${fileType} code based on the user's request. Return only the code with minimal explanation.`
                };
                
                // Create messages array for the API
                const apiMessages = [
                    systemMessage,
                    { role: "user", content: fullPrompt }
                ];
                
                // Call OpenRoute API
                const response = await this.callOpenRouteAPI(model, apiMessages);
                
                // Remove typing indicator
                this.removeTypingIndicator();
                
                if (response && response.choices && response.choices.length > 0) {
                    // Extract code from response
                    const aiResponse = response.choices[0].message.content;
                    const generatedCode = this.extractCodeFromResponse(aiResponse, fileType);
                    
                    // Add AI message to chat
                    this.addMessageToHistory('assistant', aiResponse);
                    
                    // Update the editor with the generated code
                    this.editor.codeMirror.setValue(generatedCode);
                    
                    // Store the code for the "Insert at Cursor" button
                    this.lastCodeBlock = generatedCode;
                    
                    // Update status
                    this.updateStatus('Code generation complete!', 'success');
                    
                    // Close the modal after a short delay
                    setTimeout(() => {
                        this.hideAIModal();
                    }, 1500);
                } else {
                    this.updateStatus('Failed to generate code: Invalid response from API', 'error');
                }
            } catch (error) {
                console.error('Error generating code:', error);
                this.updateStatus(`Error: ${error.message}`, 'error');
                this.removeTypingIndicator();
            }
        }
        
        insertLastCodeAtCursor() {
            if (!this.lastCodeBlock) {
                this.updateStatus('No code available to insert', 'error');
                return;
            }
            
            // Get current cursor position
            const cursor = this.editor.codeMirror.getCursor();
            
            // Insert the code at cursor position
            this.editor.codeMirror.replaceRange(this.lastCodeBlock, cursor);
            
            // Update status
            this.updateStatus('Code inserted at cursor position', 'success');
            
            // Close the modal
            this.hideAIModal();
            
            // Focus the editor
            setTimeout(() => {
                this.editor.focus();
            }, 100);
        }
        
        async callOpenRouteAPI(model, messages) {
            // Define the API endpoint
            const API_URL = "https://openrouter.ai/api/v1/chat/completions";
            
            // Prepare the request body
            const requestBody = {
                model: model,
                messages: messages
            };
            
            // Make the API request
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.href // Required by OpenRouter
                },
                body: JSON.stringify(requestBody)
            });
            
            // Check if request was successful
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error?.message || `API request failed with status ${response.status}`);
            }
            
            // Parse and return the response
            return await response.json();
        }
          getPromptPrefix(fileType) {
            switch (fileType) {
                case 'html':
                    return "Generate clean, modern HTML code for the following: ";
                case 'css':
                case 'scss':
                case 'sass':
                case 'less':
                    return "Generate CSS/SCSS code for the following: ";
                case 'javascript':
                case 'jsx':
                case 'typescript':
                    return "Generate JavaScript/TypeScript code for the following: ";
                case 'python':
                    return "Generate Python code for the following: ";
                case 'vue':
                    return "Generate Vue.js component code for the following: ";
                case 'markdown':
                    return "Generate Markdown content for the following: ";
                case 'sql':
                    return "Generate SQL queries for the following: ";
                case 'shell':
                    return "Generate shell script for the following: ";
                case 'yaml':
                    return "Generate YAML configuration for the following: ";
                case 'json':
                    return "Generate JSON data structure for the following: ";
                case 'java':
                    return "Generate Java code for the following: ";
                case 'cpp':
                case 'c':
                    return "Generate C/C++ code for the following: ";
                case 'csharp':
                    return "Generate C# code for the following: ";
                case 'php':
                    return "Generate PHP code for the following: ";
                case 'ruby':
                    return "Generate Ruby code for the following: ";
                case 'go':
                    return "Generate Go code for the following: ";
                case 'rust':
                    return "Generate Rust code for the following: ";
                case 'dockerfile':
                    return "Generate Dockerfile for the following: ";
                default:
                    return "Generate code for the following: ";
            }
        }
        
        extractCodeFromResponse(responseText, fileType) {
            // Try to find code blocks in the response
            const codeBlockRegex = /```(?:html|css|js|javascript)?([\s\S]*?)```/;
            const match = responseText.match(codeBlockRegex);
            
            if (match && match[1]) {
                // Return the content inside the code block
                return match[1].trim();
            }
            
            // If no code block, return the whole response stripped of markdown stuff
            return responseText
                .replace(/^#+ .*$/gm, '') // Remove headers
                .replace(/\*\*/g, '')      // Remove bold markers
                .replace(/\*/g, '')        // Remove italic markers
                .trim();
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
});