/**
 * ThemeManager class - Handles theme switching
 */
export class ThemeManager {
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
