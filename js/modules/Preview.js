/**
 * Preview class - Handles live preview functionality
 */
export class Preview {
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
