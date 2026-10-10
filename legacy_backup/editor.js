// Advanced Rich Text Editor - Paper-like with Full Formatting
class RichTextEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.editor = null;
        this.toolbar = null;
        this.undoStack = [];
        this.redoStack = [];
        this.currentState = {
            fontSize: 16,
            fontFamily: 'Arial',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            lineHeight: 1.6,
            letterSpacing: 0,
            fontWeight: 'normal',
            fontStyle: 'normal'
        };
        
        // Available fonts
        this.fonts = [
            { name: 'Arial', value: 'Arial, sans-serif' },
            { name: 'Times New Roman', value: 'Times New Roman, serif' },
            { name: 'Georgia', value: 'Georgia, serif' },
            { name: 'Courier New', value: 'Courier New, monospace' },
            { name: 'Comic Sans', value: 'Comic Sans MS, cursive' },
            { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
            { name: 'Verdana', value: 'Verdana, sans-serif' },
            { name: 'Palatino', value: 'Palatino, serif' },
            { name: 'Garamond', value: 'Garamond, serif' },
            { name: 'Consolas', value: 'Consolas, monospace' }
        ];

        // Background colors/patterns
        this.backgroundPatterns = [
            { name: 'White', color: '#ffffff', pattern: null },
            { name: 'Cream', color: '#fffef0', pattern: null },
            { name: 'Light Blue', color: '#e8f4f8', pattern: null },
            { name: 'Light Green', color: '#e8f5e9', pattern: null },
            { name: 'Light Yellow', color: '#fffde7', pattern: null },
            { name: 'Light Pink', color: '#fce4ec', pattern: null },
            { name: 'Light Purple', color: '#f3e5f5', pattern: null },
            { name: 'Paper', color: '#fef9e7', pattern: 'paper' },
            { name: 'Notebook', color: '#f5f5f5', pattern: 'notebook' },
            { name: 'Lined', color: '#ffffff', pattern: 'lined' }
        ];

        this.init();
    }

    // Initialize editor
    init() {
        // Create main editor structure
        const editorWrapper = document.createElement('div');
        editorWrapper.className = 'editor-wrapper';
        editorWrapper.innerHTML = `
            <div class="editor-toolbar">
                <div class="toolbar-group">
                    <label for="fontSelect">🔤 Font:</label>
                    <select id="fontSelect" class="toolbar-input" aria-label="Font family">
                        ${this.fonts.map(f => `<option value="${f.value}">${f.name}</option>`).join('')}
                    </select>
                </div>

                <div class="toolbar-group">
                    <label for="fontSize">📏 Size:</label>
                    <input type="range" id="fontSize" class="toolbar-input" min="10" max="32" value="16" aria-label="Font size">
                    <span class="font-size-display">16px</span>
                </div>

                <div class="toolbar-group">
                    <label for="lineHeight">↔️ Line Height:</label>
                    <input type="range" id="lineHeight" class="toolbar-input" min="1" max="3" step="0.1" value="1.6" aria-label="Line height">
                    <span class="line-height-display">1.6</span>
                </div>

                <div class="toolbar-group">
                    <label for="bgColor">🎨 Background:</label>
                    <select id="bgColor" class="toolbar-input" aria-label="Background color">
                        ${this.backgroundPatterns.map(p => `<option value="${p.color}" data-pattern="${p.pattern || 'none'}">${p.name}</option>`).join('')}
                    </select>
                </div>

                <div class="toolbar-group">
                    <label for="textColor">🖍️ Text Color:</label>
                    <input type="color" id="textColor" class="toolbar-input color-picker" value="#000000" aria-label="Text color">
                </div>

                <div class="toolbar-group formatting">
                    <button id="boldBtn" class="format-btn" title="Bold (Ctrl+B)" aria-label="Bold">
                        <strong>B</strong>
                    </button>
                    <button id="italicBtn" class="format-btn" title="Italic (Ctrl+I)" aria-label="Italic">
                        <em>I</em>
                    </button>
                    <button id="underlineBtn" class="format-btn" title="Underline (Ctrl+U)" aria-label="Underline">
                        <u>U</u>
                    </button>
                </div>

                <div class="toolbar-group">
                    <button id="undoBtn" class="toolbar-btn" title="Undo (Ctrl+Z)" aria-label="Undo">↶ Undo</button>
                    <button id="redoBtn" class="toolbar-btn" title="Redo (Ctrl+Y)" aria-label="Redo">↷ Redo</button>
                </div>

                <div class="toolbar-group stats">
                    <span class="word-count">Words: 0</span>
                    <span class="char-count">Characters: 0</span>
                    <span class="reading-time">Reading time: 0s</span>
                </div>
            </div>

            <div class="editor-container">
                <div id="noteEditor" class="note-editor" contenteditable="true" role="textbox" aria-label="Note content editor"></div>
            </div>
        `;

        this.container.appendChild(editorWrapper);

        // Get references
        this.editor = document.getElementById('noteEditor');
        this.toolbar = document.querySelector('.editor-toolbar');

        // Setup event listeners
        this.setupEventListeners();
        this.loadFromStorage();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Font selection
        document.getElementById('fontSelect').addEventListener('change', (e) => {
            this.currentState.fontFamily = e.target.value;
            this.editor.style.fontFamily = e.target.value;
            this.saveToStorage();
        });

        // Font size
        document.getElementById('fontSize').addEventListener('input', (e) => {
            const size = e.target.value;
            this.currentState.fontSize = size;
            this.editor.style.fontSize = size + 'px';
            document.querySelector('.font-size-display').textContent = size + 'px';
            this.saveToStorage();
        });

        // Line height
        document.getElementById('lineHeight').addEventListener('input', (e) => {
            const height = e.target.value;
            this.currentState.lineHeight = height;
            this.editor.style.lineHeight = height;
            document.querySelector('.line-height-display').textContent = height;
            this.saveToStorage();
        });

        // Background color
        document.getElementById('bgColor').addEventListener('change', (e) => {
            const color = e.target.value;
            const pattern = e.target.options[e.target.selectedIndex].dataset.pattern;
            this.currentState.backgroundColor = color;
            this.setBackgroundPattern(color, pattern);
            this.saveToStorage();
        });

        // Text color
        document.getElementById('textColor').addEventListener('change', (e) => {
            this.currentState.textColor = e.target.value;
            this.editor.style.color = e.target.value;
            this.saveToStorage();
        });

        // Formatting buttons
        document.getElementById('boldBtn').addEventListener('click', () => this.toggleFormat('bold'));
        document.getElementById('italicBtn').addEventListener('click', () => this.toggleFormat('italic'));
        document.getElementById('underlineBtn').addEventListener('click', () => this.toggleFormat('underline'));

        // Undo/Redo
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());

        // Editor input
        this.editor.addEventListener('input', () => {
            this.updateStats();
            this.saveToStorage();
        });

        // Save state on keyup
        this.editor.addEventListener('keyup', () => {
            this.saveState();
        });

        // Keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.toggleFormat('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.toggleFormat('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.toggleFormat('underline');
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                }
            }
        });

        // Apply initial styles
        this.editor.style.fontFamily = this.currentState.fontFamily;
        this.editor.style.fontSize = this.currentState.fontSize + 'px';
        this.editor.style.lineHeight = this.currentState.lineHeight;
        this.editor.style.color = this.currentState.textColor;
        this.setBackgroundPattern(this.currentState.backgroundColor, 'none');
    }

    // Set background pattern
    setBackgroundPattern(color, pattern) {
        const container = document.querySelector('.editor-container');
        
        container.style.backgroundColor = color;
        container.style.backgroundImage = 'none';
        
        if (pattern === 'paper') {
            container.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23fef9e7\'/%3E%3Cpath d=\'M0 0 L100 0\' stroke=\'%23e0e0e0\' stroke-width=\'0.5\'/%3E%3C/svg%3E")';
            container.style.backgroundSize = '100% 20px';
            container.style.backgroundRepeat = 'repeat';
        } else if (pattern === 'notebook') {
            container.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f5f5f5\'/%3E%3Cline x1=\'10\' y1=\'0\' x2=\'10\' y2=\'100\' stroke=\'%23ffb3ba\' stroke-width=\'2\'/%3E%3Cline x1=\'0\' y1=\'20\' x2=\'100\' y2=\'20\' stroke=\'%23e0e0e0\' stroke-width=\'0.5\'/%3E%3C/svg%3E")';
            container.style.backgroundSize = '100% 20px';
            container.style.backgroundRepeat = 'repeat';
        } else if (pattern === 'lined') {
            container.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23ffffff\'/%3E%3Cline x1=\'0\' y1=\'24\' x2=\'100\' y2=\'24\' stroke=\'%23e8e8e8\' stroke-width=\'1\'/%3E%3C/svg%3E")';
            container.style.backgroundSize = '100% 25px';
            container.style.backgroundRepeat = 'repeat';
        }
    }

    // Toggle text format
    toggleFormat(format) {
        document.execCommand(format, false, null);
        this.editor.focus();
        this.updateFormatButtons();
    }

    // Update format button states
    updateFormatButtons() {
        document.getElementById('boldBtn').classList.toggle('active', document.queryCommandState('bold'));
        document.getElementById('italicBtn').classList.toggle('active', document.queryCommandState('italic'));
        document.getElementById('underlineBtn').classList.toggle('active', document.queryCommandState('underline'));
    }

    // Update writing statistics
    updateStats() {
        const text = this.editor.innerText || '';
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const characters = text.length;
        const readingTime = Math.ceil(words / 200); // 200 words per minute

        document.querySelector('.word-count').textContent = `Words: ${words}`;
        document.querySelector('.char-count').textContent = `Characters: ${characters}`;
        document.querySelector('.reading-time').textContent = `Reading time: ${readingTime}s`;
    }

    // Save state for undo
    saveState() {
        this.undoStack.push(this.editor.innerHTML);
        this.redoStack = []; // Clear redo stack
        
        // Limit undo stack to 50 states
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
    }

    // Undo
    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.editor.innerHTML);
            this.editor.innerHTML = this.undoStack.pop();
            this.updateStats();
        }
    }

    // Redo
    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.editor.innerHTML);
            this.editor.innerHTML = this.redoStack.pop();
            this.updateStats();
        }
    }

    // Get content
    getContent() {
        return {
            html: this.editor.innerHTML,
            text: this.editor.innerText,
            formatting: { ...this.currentState }
        };
    }

    // Set content
    setContent(content, formatting = null) {
        this.editor.innerHTML = content;
        
        if (formatting) {
            this.currentState = { ...this.currentState, ...formatting };
            this.applyFormatting();
        }
        
        this.updateStats();
    }

    // Apply saved formatting
    applyFormatting() {
        this.editor.style.fontFamily = this.currentState.fontFamily;
        this.editor.style.fontSize = this.currentState.fontSize + 'px';
        this.editor.style.lineHeight = this.currentState.lineHeight;
        this.editor.style.color = this.currentState.textColor;
        
        document.getElementById('fontSelect').value = this.currentState.fontFamily;
        document.getElementById('fontSize').value = this.currentState.fontSize;
        document.querySelector('.font-size-display').textContent = this.currentState.fontSize + 'px';
        document.getElementById('lineHeight').value = this.currentState.lineHeight;
        document.querySelector('.line-height-display').textContent = this.currentState.lineHeight;
        document.getElementById('textColor').value = this.currentState.textColor;
        
        this.setBackgroundPattern(this.currentState.backgroundColor, 'none');
    }

    // Save to browser storage
    saveToStorage() {
        try {
            const data = {
                content: this.editor.innerHTML,
                formatting: this.currentState,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('editorDraft', JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to storage:', e);
        }
    }

    // Load from browser storage
    loadFromStorage() {
        try {
            const data = localStorage.getItem('editorDraft');
            if (data) {
                const parsed = JSON.parse(data);
                this.editor.innerHTML = parsed.content || '';
                this.currentState = { ...this.currentState, ...parsed.formatting };
                this.applyFormatting();
                this.updateStats();
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
    }

    // Clear editor
    clear() {
        if (confirm('🗑️ Hapus semua konten editor? Tindakan ini tidak bisa dibatalkan.')) {
            this.editor.innerHTML = '';
            this.undoStack = [];
            this.redoStack = [];
            this.updateStats();
            this.saveToStorage();
        }
    }

    // Export as HTML
    exportAsHTML() {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Exported Note</title>
                <style>
                    body {
                        font-family: ${this.currentState.fontFamily};
                        font-size: ${this.currentState.fontSize}px;
                        line-height: ${this.currentState.lineHeight};
                        color: ${this.currentState.textColor};
                        background-color: ${this.currentState.backgroundColor};
                        padding: 40px;
                    }
                </style>
            </head>
            <body>
                ${this.editor.innerHTML}
            </body>
            </html>
        `;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `note-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Focus editor
    focus() {
        this.editor.focus();
    }

    // Clear draft
    clearDraft() {
        localStorage.removeItem('editorDraft');
    }
}

// Global editor instance
let richTextEditor = null;