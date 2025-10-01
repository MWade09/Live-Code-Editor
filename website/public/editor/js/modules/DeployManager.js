/**
 * DeployManager class - Handles deployment functionality
 */
export class DeployManager {
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
        this.deployModal.style.display = 'flex';
        setTimeout(() => {
            this.deployModal.classList.add('show');
        }, 10);
    }
    
    hideDeployModal() {
        this.deployModal.classList.remove('show');
        setTimeout(() => {
            this.deployModal.style.display = 'none';
        }, 300);
    }
}
