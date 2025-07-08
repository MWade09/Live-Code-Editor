/**
 * Resizer class - Handles pane resizing functionality
 */
export class Resizer {
    constructor(resizerElement, leftPane, rightPane) {
        this.resizer = resizerElement;
        this.leftPane = leftPane;
        this.rightPane = rightPane;
        this.isHorizontal = window.innerWidth > 768;
        
        // Check if this is the chat panel resizer
        this.isChatResizer = rightPane.classList.contains('chat-pane');
        
        this.initResizer();
        this.addResponsiveListener();
    }
    
    initResizer() {
        let startPos, startLeftSize, startRightSize, containerWidth;
        
        const startResize = (e) => {
            e.preventDefault();
            
            const container = this.leftPane.parentElement;
            containerWidth = container.getBoundingClientRect().width;
            
            if (this.isHorizontal) {
                startPos = e.clientX;
                startLeftSize = this.leftPane.getBoundingClientRect().width;
                startRightSize = this.rightPane.getBoundingClientRect().width;
            } else {
                startPos = e.clientY;
                startLeftSize = this.leftPane.getBoundingClientRect().height;
                startRightSize = this.rightPane.getBoundingClientRect().height;
            }
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        };
        
        const resize = (e) => {
            if (this.isHorizontal) {
                const dx = e.clientX - startPos;
                
                let leftWidth = startLeftSize + dx;
                let rightWidth = startRightSize - dx;
                
                // Set minimum and maximum constraints based on panel type
                let minLeftWidth, maxLeftWidth, minRightWidth, maxRightWidth;
                
                if (this.isChatResizer) {
                    // Chat panel resizer - left pane is main editor area, right pane is chat
                    minLeftWidth = Math.max(300, containerWidth * 0.3); // Editor needs minimum space
                    minRightWidth = Math.max(280, containerWidth * 0.2); // Chat panel minimum
                    maxRightWidth = Math.max(500, containerWidth * 0.5); // Chat panel maximum
                    maxLeftWidth = containerWidth - minRightWidth;
                } else {
                    // Editor/preview resizer
                    minLeftWidth = containerWidth * 0.1;
                    minRightWidth = containerWidth * 0.1;
                    maxLeftWidth = containerWidth * 0.9;
                    maxRightWidth = containerWidth * 0.9;
                }
                
                // Apply constraints
                if (leftWidth < minLeftWidth) {
                    leftWidth = minLeftWidth;
                    rightWidth = containerWidth - leftWidth;
                }
                if (rightWidth < minRightWidth) {
                    rightWidth = minRightWidth;
                    leftWidth = containerWidth - rightWidth;
                }
                if (this.isChatResizer && rightWidth > maxRightWidth) {
                    rightWidth = maxRightWidth;
                    leftWidth = containerWidth - rightWidth;
                }
                if (leftWidth > maxLeftWidth) {
                    leftWidth = maxLeftWidth;
                    rightWidth = containerWidth - leftWidth;
                }
                
                // Apply the new sizes
                if (this.isChatResizer) {
                    // For chat resizer, use flex-basis to maintain proper layout
                    this.leftPane.style.flex = '1 1 auto';
                    this.leftPane.style.width = `${leftWidth}px`;
                    this.leftPane.style.minWidth = `${minLeftWidth}px`;
                    
                    this.rightPane.style.flex = `0 0 ${rightWidth}px`;
                    this.rightPane.style.width = `${rightWidth}px`;
                    this.rightPane.style.minWidth = `${minRightWidth}px`;
                    this.rightPane.style.maxWidth = `${maxRightWidth}px`;
                } else {
                    // For editor/preview resizer, use percentages
                    const leftPct = (leftWidth / containerWidth) * 100;
                    const rightPct = (rightWidth / containerWidth) * 100;
                    
                    this.leftPane.style.flex = `0 0 ${leftPct}%`;
                    this.rightPane.style.flex = `0 0 ${rightPct}%`;
                }
            } else {
                // Vertical layout (mobile) - same logic but for height
                const dy = e.clientY - startPos;
                const containerHeight = this.leftPane.parentElement.getBoundingClientRect().height;
                
                let leftHeight = startLeftSize + dy;
                let rightHeight = startRightSize - dy;
                
                // Ensure minimum sizes
                const minHeight = containerHeight * 0.1;
                if (leftHeight < minHeight) leftHeight = minHeight;
                if (rightHeight < minHeight) rightHeight = minHeight;
                
                const leftPct = (leftHeight / containerHeight) * 100;
                const rightPct = (rightHeight / containerHeight) * 100;
                
                this.leftPane.style.flex = `0 0 ${leftPct}%`;
                this.rightPane.style.flex = `0 0 ${rightPct}%`;
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
                // Reset to default responsive sizes when changing orientation
                if (this.isChatResizer) {
                    this.leftPane.style.flex = '1 1 auto';
                    this.leftPane.style.width = '';
                    this.leftPane.style.minWidth = '';
                    
                    this.rightPane.style.flex = '0 0 350px';
                    this.rightPane.style.width = '';
                    this.rightPane.style.minWidth = '';
                    this.rightPane.style.maxWidth = '';
                } else {
                    this.leftPane.style.flex = '1';
                    this.rightPane.style.flex = '1';
                }
            }
        };
        
        window.addEventListener('resize', checkOrientation);
    }
}
