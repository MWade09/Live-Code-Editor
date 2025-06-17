/**
 * FormattingManager - Handles code formatting functionality
 */
export class FormattingManager {
    constructor(editor, codeMirror) {
        this.editor = editor;
        this.codeMirror = codeMirror;
    }

    /**
     * Format code using js-beautify
     */
    formatCode() {
        const mode = this.codeMirror.getMode().name;
        const text = this.codeMirror.getValue();
        
        if (typeof html_beautify === 'undefined' || typeof css_beautify === 'undefined' || typeof js_beautify === 'undefined') {
            this.editor.showNotification('Code formatting libraries not loaded');
            return;
        }
        
        let formatted;
        const options = {
            indent_size: 4,
            indent_char: ' ',
            wrap_line_length: 120,
            preserve_newlines: true,
            max_preserve_newlines: 2
        };
        
        try {
            if (mode === 'javascript' || mode === 'jsx') {
                formatted = js_beautify(text, {
                    ...options,
                    brace_style: 'collapse',
                    keep_array_indentation: false,
                    keep_function_indentation: false,
                    space_before_conditional: true,
                    break_chained_methods: false,
                    eval_code: false,
                    unescape_strings: false,
                    wrap_line_length: 120,
                    end_with_newline: true
                });
            } else if (mode === 'css') {
                formatted = css_beautify(text, {
                    ...options,
                    selector_separator_newline: true,
                    newline_between_rules: true
                });
            } else if (mode === 'xml' || mode === 'htmlmixed') {
                formatted = html_beautify(text, {
                    ...options,
                    extra_liners: ['head', 'body', '/html'],
                    indent_inner_html: true,
                    indent_handlebars: false,
                    indent_scripts: 'keep',
                    wrap_attributes: 'auto',
                    wrap_attributes_indent_size: 4,
                    end_with_newline: true
                });
            } else {
                this.editor.showNotification(`Formatting not supported for ${mode}`);
                return;
            }
            
            if (formatted && formatted !== text) {
                this.codeMirror.setValue(formatted);
                this.editor.showNotification('Code formatted successfully');
            } else {
                this.editor.showNotification('Code is already well-formatted');
            }
        } catch (error) {
            console.error('Formatting error:', error);
            this.editor.showNotification('Error formatting code: ' + error.message);
        }
    }
}
