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
        if (!files || files.length === 0) {
            this.clearPreview();
            return;
        }
        
        // Find HTML file or use the first file if none
        let htmlFile = files.find(file => file.type === 'html');
        if (!htmlFile) {
            htmlFile = files[0];
        }
        
        // Validate htmlFile has content
        if (!htmlFile || !htmlFile.content) {
            this.clearPreview();
            return;
        }
        
        // Get CSS files
        const cssFiles = files.filter(file => file.type === 'css' && file.content);
        
        // Get JS files
        const jsFiles = files.filter(file => file.type === 'javascript' && file.content);
        
        // Create full HTML document
        let htmlContent = htmlFile.content || '';
        
        // Ensure we have at least some content
        if (htmlContent.trim() === '') {
            this.clearPreview();
            return;
        }
        
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
            // Handle both inline injection and replacement of external references
            
            let modifiedContent = htmlContent;
            
            // Replace external CSS references with inline styles
            cssFiles.forEach(file => {
                if (file !== htmlFile) {
                    // Replace <link> tags that reference this CSS file
                    const linkPattern = new RegExp(`<link[^>]*href=["']([^"']*${file.name}[^"']*)["'][^>]*>`, 'gi');
                    modifiedContent = modifiedContent.replace(linkPattern, `<style>${file.content}</style>`);
                    
                    // Also handle href="css/filename.css" patterns
                    const relativeLinkPattern = new RegExp(`<link[^>]*href=["']([^"']*/?${file.name})["'][^>]*>`, 'gi');
                    modifiedContent = modifiedContent.replace(relativeLinkPattern, `<style>${file.content}</style>`);
                }
            });
            
            // Replace external JS references with inline scripts
            jsFiles.forEach(file => {
                if (file !== htmlFile) {
                    // Replace <script src=""> tags that reference this JS file
                    const scriptPattern = new RegExp(`<script[^>]*src=["']([^"']*${file.name}[^"']*)["'][^>]*></script>`, 'gi');
                    modifiedContent = modifiedContent.replace(scriptPattern, `<script>${file.content}</script>`);
                    
                    // Also handle src="js/filename.js" patterns
                    const relativeScriptPattern = new RegExp(`<script[^>]*src=["']([^"']*/?${file.name})["'][^>]*></script>`, 'gi');
                    modifiedContent = modifiedContent.replace(relativeScriptPattern, `<script>${file.content}</script>`);
                }
            });
            
            // If no replacements were made, inject at the appropriate locations
            if (modifiedContent === htmlContent) {
                let headEndPos = modifiedContent.indexOf('</head>');
                if (headEndPos !== -1) {
                    let cssInjection = '';
                    cssFiles.forEach(file => {
                        if (file !== htmlFile) {
                            cssInjection += `<style>${file.content}</style>\n`;
                        }
                    });
                    
                    modifiedContent = modifiedContent.slice(0, headEndPos) + cssInjection + modifiedContent.slice(headEndPos);
                }
                
                let bodyEndPos = modifiedContent.indexOf('</body>');
                if (bodyEndPos !== -1) {
                    let jsInjection = '';
                    jsFiles.forEach(file => {
                        if (file !== htmlFile) {
                            jsInjection += `<script>${file.content}</script>\n`;
                        }
                    });
                    
                    modifiedContent = modifiedContent.slice(0, bodyEndPos) + jsInjection + modifiedContent.slice(bodyEndPos);
                }
            }
            
            htmlContent = modifiedContent;
        }
        
        try {
            // Validate HTML content before writing
            if (!htmlContent || htmlContent.trim() === '') {
                htmlContent = '<html><body><div style="text-align: center; padding: 20px; color: #666;">Empty file</div></body></html>';
            }
            
            // Check for basic HTML structure, if missing add it
            if (!htmlContent.includes('<html') && !htmlContent.includes('<HTML')) {
                // Wrap in basic HTML structure
                htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body>
${htmlContent}
</body>
</html>`;
            }
            
            // Update the iframe
            const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
            frameDoc.open();
            frameDoc.write(htmlContent);
            frameDoc.close();
        } catch (err) {
            console.error('Error updating preview:', err);
            // Show error in preview instead of crashing
            try {
                const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
                frameDoc.open();
                frameDoc.write(`<html><body><div style="padding: 20px; color: red;">Error: ${err.message}</div></body></html>`);
                frameDoc.close();
            } catch (e) {
                console.error('Failed to show error in preview:', e);
            }
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
