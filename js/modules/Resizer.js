/**
 * Resizer class - Handles pane resizing functionality
 */
export class Resizer {
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
