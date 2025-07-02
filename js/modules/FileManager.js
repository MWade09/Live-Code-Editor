/**
 * FileManager class - Handles file operations and storage
 */
export class FileManager {
    constructor() {
        this.files = [];
        this.currentFileIndex = -1;
        this.fileCounter = 0;
        this.recentFiles = []; // Array of {id, timestamp, name} objects
        
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
                } else {
                    this.createDefaultFile();
                }
            } else {
                this.createDefaultFile();
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
        } catch (err) {
            console.error('Error loading files from storage:', err);
            this.files = [];
            this.currentFileIndex = -1;
            this.fileCounter = 0;
            this.recentFiles = [];
            this.createDefaultFile();
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
        if (this.setCurrentFileIndex(index)) {
            // Add to recent files when a file is opened
            this.addToRecentFiles(id);
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
}

