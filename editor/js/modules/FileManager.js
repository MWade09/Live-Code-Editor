/**
 * FileManager class - Handles file operations and storage
 */
export class FileManager {
    constructor() {
        this.files = [];
        this.currentFileIndex = -1;
        this.fileCounter = 0;
        this.recentFiles = []; // Array of {id, timestamp, name} objects
        
        // New: Track open tabs separately from project files
        this.openTabs = []; // Array of file IDs that are currently open in tabs
        this.activeTabIndex = -1; // Index within openTabs array
        
        // Load files from local storage if available
        this.loadFilesFromStorage();
    }
    loadFilesFromStorage() {
        try {
            // If a website project is being loaded (?project=...), skip loading any local/default files
            const urlParams = new URLSearchParams(window.location.search);
            const hasProjectParam = !!urlParams.get('project');
            const savedFiles = hasProjectParam ? null : localStorage.getItem('editorFiles');
            if (savedFiles) {
                this.files = JSON.parse(savedFiles);
                this.fileCounter = this.files.length;
                if (this.files.length > 0) {
                    this.currentFileIndex = 0;
                    // Defer opening the first file in a tab to avoid method order issues
                    setTimeout(() => {
                        if (this.files.length > 0) {
                            this.openFileInTab(this.files[0].id);
                        }
                    }, 0);
                } else {
                    if (!hasProjectParam) {
                        this.createDefaultFile();
                    }
                }
            } else {
                if (!hasProjectParam) {
                    this.createDefaultFile();
                }
            }
            
            // Load recent files
            const savedRecentFiles = localStorage.getItem('editorRecentFiles');
            if (savedRecentFiles) {
                this.recentFiles = JSON.parse(savedRecentFiles);
                // Filter out files that no longer exist
                this.recentFiles = this.recentFiles.filter(rf => 
                    this.files.some(f => f.id === rf.id)
                );
            }
            
            // Load open tabs
            const savedOpenTabs = localStorage.getItem('editorOpenTabs');
            if (savedOpenTabs) {
                this.openTabs = JSON.parse(savedOpenTabs);
                // Filter out tabs for files that no longer exist
                this.openTabs = this.openTabs.filter(tabId => 
                    this.files.some(f => f.id === tabId)
                );
                
                // Load active tab index
                const savedActiveTabIndex = localStorage.getItem('editorActiveTabIndex');
                if (savedActiveTabIndex !== null) {
                    this.activeTabIndex = parseInt(savedActiveTabIndex);
                    if (this.activeTabIndex >= this.openTabs.length) {
                        this.activeTabIndex = this.openTabs.length - 1;
                    }
                }
            }
        } catch (err) {
            console.error('Error loading files from storage:', err);
            this.files = [];
            this.currentFileIndex = -1;
            this.fileCounter = 0;
            this.recentFiles = [];
            this.openTabs = [];
            this.activeTabIndex = -1;
            if (!new URLSearchParams(window.location.search).get('project')) {
                this.createDefaultFile();
            }
        }
    }

    createDefaultFile() {
        const defaultContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="dashboard">
        <header class="header">
            <h1>Analytics Dashboard</h1>
            <div class="user-info">
                <span>Welcome, Admin</span>
                <div class="user-icon"></div>
            </div>
        </header>
        
        <div class="card"></div>
        
        <div class="main-container">
            <aside class="sidebar">
                <nav>
                    <ul>
                        <li class="active">Dashboard</li>
                        <li>Analytics</li>
                        <li>Reports</li>
                        <li>Settings</li>
                    </ul>
                </nav>
            </aside>
            
            <main class="content">
                <!-- Main content will go here -->
            </main>
        </div>
    </div>
</body>
</html>`;
        
        this.createNewFile('index.html', defaultContent);
    }
    
    saveFilesToStorage() {
        try {
            localStorage.setItem('editorFiles', JSON.stringify(this.files));
            localStorage.setItem('editorRecentFiles', JSON.stringify(this.recentFiles));
            localStorage.setItem('editorOpenTabs', JSON.stringify(this.openTabs));
            localStorage.setItem('editorActiveTabIndex', this.activeTabIndex.toString());
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
        
        // Automatically open new files in a tab
        this.openFileInTab(newFile.id);
        
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
        // Use the active tab file if available, otherwise fall back to currentFileIndex
        return this.getActiveTabFile() || (this.currentFileIndex >= 0 && this.currentFileIndex < this.files.length ? this.files[this.currentFileIndex] : null);
    }
    
    setCurrentFileIndex(index) {
        if (index >= 0 && index < this.files.length) {
            const file = this.files[index];
            this.currentFileIndex = index;
            
            // Also open in tab and set as active
            this.openFileInTab(file.id);
            
            return true;
        }
        return false;
    }
    
    setCurrentFileById(id) {
        const index = this.files.findIndex(file => file.id === id);
        if (index >= 0) {
            this.currentFileIndex = index;
            
            // Open in tab and set as active
            this.openFileInTab(id);
            
            return true;
        }
        return false;
    }
    
    /**
     * Add file to recent files list
     */
    addToRecentFiles(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) return;
        
        // Remove if already exists
        this.recentFiles = this.recentFiles.filter(rf => rf.id !== fileId);
        
        // Add to beginning
        this.recentFiles.unshift({
            id: fileId,
            timestamp: Date.now(),
            name: file.name
        });
        
        // Keep only last 10 recent files
        this.recentFiles = this.recentFiles.slice(0, 10);
        
        // Save to storage
        this.saveFilesToStorage();
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
            // First close the tab if it's open
            this.closeTab(id);
            
            // Then remove the file from the project
            this.files.splice(index, 1);
            
            // Update current file index if needed
            if (this.files.length === 0) {
                this.currentFileIndex = -1;
            } else if (this.currentFileIndex >= this.files.length) {
                this.currentFileIndex = this.files.length - 1;
            } else if (this.currentFileIndex === index && index > 0) {
                this.currentFileIndex = index - 1;
            }
            
            // Remove from recent files as well
            this.recentFiles = this.recentFiles.filter(rf => rf.id !== id);
            
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

    /**
     * Get recent files list (basic implementation)
     */
    getRecentFiles() {
        return this.recentFiles || [];
    }
    
    /**
     * Clear recent files list
     */
    clearRecentFiles() {
        this.recentFiles = [];
        this.saveFilesToStorage();
    }
    
    // ============================================
    // TAB MANAGEMENT METHODS
    // ============================================
    
    /**
     * Open a file in a new tab (if not already open)
     */
    openFileInTab(fileId) {
        if (!this.openTabs.includes(fileId)) {
            this.openTabs.push(fileId);
        }
        this.setActiveTab(fileId);
        this.saveFilesToStorage();
    }
    
    /**
     * Close a tab (remove from open tabs, but keep file in project)
     */
    closeTab(fileId) {
        const tabIndex = this.openTabs.indexOf(fileId);
        if (tabIndex === -1) return false;
        
        this.openTabs.splice(tabIndex, 1);
        
        // Update active tab index
        if (this.openTabs.length === 0) {
            this.activeTabIndex = -1;
            this.currentFileIndex = -1;
        } else {
            // If we closed the active tab, switch to the next one (or previous if it was the last)
            if (this.activeTabIndex >= this.openTabs.length) {
                this.activeTabIndex = this.openTabs.length - 1;
            }
            
            // Update current file index to match the new active tab
            if (this.activeTabIndex >= 0) {
                const activeTabFileId = this.openTabs[this.activeTabIndex];
                this.currentFileIndex = this.files.findIndex(f => f.id === activeTabFileId);
            }
        }
        
        this.saveFilesToStorage();
        return true;
    }
    
    /**
     * Set the active tab by file ID
     */
    setActiveTab(fileId) {
        const tabIndex = this.openTabs.indexOf(fileId);
        if (tabIndex === -1) return false;
        
        this.activeTabIndex = tabIndex;
        this.currentFileIndex = this.files.findIndex(f => f.id === fileId);
        
        // Add to recent files when a file is opened
        this.addToRecentFiles(fileId);
        
        this.saveFilesToStorage();
        return true;
    }
    
    /**
     * Get the currently active tab file
     */
    getActiveTabFile() {
        if (this.activeTabIndex >= 0 && this.activeTabIndex < this.openTabs.length) {
            const activeTabFileId = this.openTabs[this.activeTabIndex];
            return this.files.find(f => f.id === activeTabFileId);
        }
        return null;
    }
    
    /**
     * Get all open tab files in order
     */
    getOpenTabFiles() {
        return this.openTabs.map(tabId => this.files.find(f => f.id === tabId)).filter(Boolean);
    }
    
    /**
     * Close all tabs except the specified one
     */
    closeOtherTabs(keepFileId) {
        if (!this.openTabs.includes(keepFileId)) return false;
        
        this.openTabs = [keepFileId];
        this.activeTabIndex = 0;
        this.currentFileIndex = this.files.findIndex(f => f.id === keepFileId);
        
        this.saveFilesToStorage();
        return true;
    }
    
    /**
     * Close all tabs to the right of the specified tab
     */
    closeTabsToRight(fileId) {
        const tabIndex = this.openTabs.indexOf(fileId);
        if (tabIndex === -1) return false;
        
        this.openTabs = this.openTabs.slice(0, tabIndex + 1);
        
        // Update active tab index if needed
        if (this.activeTabIndex > tabIndex) {
            this.activeTabIndex = tabIndex;
            const activeTabFileId = this.openTabs[this.activeTabIndex];
            this.currentFileIndex = this.files.findIndex(f => f.id === activeTabFileId);
        }
        
        this.saveFilesToStorage();
        return true;
    }
    
    /**
     * Close all tabs
     */
    closeAllTabs() {
        this.openTabs = [];
        this.activeTabIndex = -1;
        this.currentFileIndex = -1;
        this.saveFilesToStorage();
        return true;
    }
    
    /**
     * Check if a file is currently open in a tab
     */
    isFileOpenInTab(fileId) {
        return this.openTabs.includes(fileId);
    }
}

