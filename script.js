// Main Application Logic - Dengan Rich Text Editor Integration

let currentState = 'menu';
let isAuthenticated = false;
let requiresLayer2 = false;
let editingNoteId = null;
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// ===== DARK MODE SUPPORT =====

function initDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkMode = localStorage.getItem('darkMode') === null ? prefersDark : localStorage.getItem('darkMode') === 'true';
    applyDarkMode();
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyDarkMode();
}

function applyDarkMode() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeIcon').textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('darkModeIcon').textContent = '🌙';
    }
}

// ===== UI STATE MANAGEMENT =====

function showLayer(layerId) {
    try {
        document.querySelectorAll('.layer').forEach(layer => {
            layer.classList.add('hidden');
            layer.setAttribute('aria-hidden', 'true');
        });
        
        const targetLayer = document.getElementById(layerId);
        if (targetLayer) {
            targetLayer.classList.remove('hidden');
            targetLayer.setAttribute('aria-hidden', 'false');
            
            const firstInput = targetLayer.querySelector('input, textarea, button');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    } catch (e) {
        console.error('Error showing layer:', e);
    }
}

function showMenu() {
    showLayer('mainMenu');
    currentState = 'menu';
}

function showCreateNew() {
    editingNoteId = null;
    showLayer('layer1');
    currentState = 'createNew';
}

function showLogin() {
    showLayer('loginLayer1');
    currentState = 'login';
}

function showExport() {
    showLayer('exportSection');
}

function backToMenu() {
    editingNoteId = null;
    showMenu();
    resetForm();
}

function resetForm() {
    try {
        document.getElementById('password1').value = '';
        document.getElementById('password2').value = '';
        document.getElementById('loginPassword1').value = '';
        document.getElementById('loginPassword2').value = '';
        document.getElementById('detectionAlert').classList.add('hidden');
        document.getElementById('layer2Setup').classList.add('hidden');
    } catch (e) {
        console.error('Error resetting form:', e);
    }
}

// ===== LAYER 1: PASSWORD SETUP =====

async function setupLayer1() {
    try {
        const password = document.getElementById('password1').value;
        const statusEl = document.getElementById('layer1Status');

        if (!password) {
            statusEl.textContent = '❌ Masukkan password!';
            statusEl.className = 'status error';
            return;
        }

        const result = await encryptionManager.setLayer1Password(password);
        
        if (result.success) {
            statusEl.textContent = result.message;
            statusEl.className = 'status success';
            
            setTimeout(() => {
                document.getElementById('layer1').classList.add('hidden');
                document.getElementById('notesSection').classList.remove('hidden');
                document.getElementById('password1').value = '';
                
                // Initialize editor
                if (!richTextEditor) {
                    richTextEditor = new RichTextEditor('editorContainer');
                }
                richTextEditor.focus();
                
                renderNotesList();
            }, 1000);
        } else {
            statusEl.textContent = result.message;
            statusEl.className = 'status error';
        }
    } catch (e) {
        console.error('Error in setupLayer1:', e);
        alert('❌ Terjadi kesalahan: ' + e.message);
    }
}

// ===== RICH TEXT EDITOR FUNCTIONS =====

async function saveNoteFromEditor() {
    try {
        if (!richTextEditor) {
            alert('❌ Editor tidak siap!');
            return;
        }

        const content = richTextEditor.getContent();
        
        if (!content.text.trim()) {
            alert('📝 Tulis catatan terlebih dahulu!');
            return;
        }

        // Detect languages dari text
        const detection = detectionManager.getSummary(content.text);
        
        // Check if multiple languages
        if (detection.multipleLanguages) {
            document.getElementById('detectionAlert').classList.remove('hidden');
            document.getElementById('layer2Setup').classList.remove('hidden');
            requiresLayer2 = true;
            return;
        }

        await saveNoteToDatabase(content, detection);
    } catch (e) {
        console.error('Error saving note:', e);
        alert('❌ Gagal menyimpan: ' + e.message);
    }
}

async function saveNoteToDatabase(content, detection) {
    try {
        const noteObj = {
            title: content.text.substring(0, 50) + (content.text.length > 50 ? '...' : ''),
            content: content.text,
            htmlContent: content.html,
            formatting: content.formatting,
            hasLayer2: requiresLayer2,
            languagesDetected: detection.languages,
            detectionInfo: detection.confidenceScores,
            tone: detection.tone ? detection.tone.tone : 'neutral'
        };

        let result;
        if (editingNoteId) {
            result = await storageManager.updateNote(editingNoteId, noteObj);
            editingNoteId = null;
        } else {
            result = await storageManager.addNote(noteObj);
        }

        if (result.success) {
            // Clear editor
            richTextEditor.clearDraft();
            richTextEditor.editor.innerHTML = '';
            document.getElementById('detectionAlert').classList.add('hidden');
            document.getElementById('layer2Setup').classList.add('hidden');
            requiresLayer2 = false;
            
            alert('✅ ' + result.message);
            await renderNotesList();
            richTextEditor.focus();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (e) {
        console.error('Error saving to database:', e);
        alert('❌ Gagal menyimpan: ' + e.message);
    }
}

async function setupLayer2() {
    try {
        const password = document.getElementById('password2').value;
        
        if (!password) {
            alert('🔐 Masukkan password Layer 2!');
            return;
        }

        const result = await encryptionManager.setLayer2Password(password);
        
        if (result.success) {
            const content = richTextEditor.getContent();
            const detection = detectionManager.getSummary(content.text);
            
            await saveNoteToDatabase(content, detection);
            document.getElementById('password2').value = '';
        } else {
            alert('❌ ' + result.message);
        }
    } catch (e) {
        console.error('Error in setupLayer2:', e);
        alert('❌ Terjadi kesalahan: ' + e.message);
    }
}

function exportEditorAsHTML() {
    if (!richTextEditor) return;
    richTextEditor.exportAsHTML();
    alert('✅ File HTML berhasil diunduh!');
}

function clearEditorDraft() {
    if (!richTextEditor) return;
    richTextEditor.clear();
}

// ===== NOTES LIST MANAGEMENT =====

async function renderNotesList() {
    try {
        const notesList = document.getElementById('notesList');
        const notes = await storageManager.getNotes();

        if (notes.length === 0) {
            notesList.innerHTML = '<p style="text-align: center; color: #999;">Belum ada catatan. Buat yang baru! 📝</p>';
            return;
        }

        notesList.innerHTML = notes.map(note => `
            <div class="note-item" role="article" aria-label="Note: ${escapeHtml(note.title)}">
                <div class="note-header">
                    <h4>${escapeHtml(note.title)}</h4>
                    ${note.hasLayer2 ? '<span class="badge badge-layer2" title="Catatan ini memiliki 2 layer password">🔐 Layer 2</span>' : ''}
                    ${note.tone && note.tone !== 'neutral' ? `<span class="badge badge-tone" title="Tone: ${note.tone}">${note.tone.toUpperCase()}</span>` : ''}
                </div>
                <p>${escapeHtml(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}</p>
                <small>📅 ${note.createdAt}</small>
                ${note.languagesDetected.length > 0 ? `<small style="display: block; color: #667eea;"> 🌐 ${note.languagesDetected.join(', ')}</small>` : ''}
                <div class="note-actions">
                    <button class="btn btn-info" onclick="editNote(${note.id})" aria-label="Edit note">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteNote(${note.id})" aria-label="Delete note">🗑️ Hapus</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error rendering notes:', e);
    }
}

async function editNote(id) {
    try {
        const note = await storageManager.getNoteById(id);
        if (note) {
            editingNoteId = id;
            
            // Load into editor
            if (richTextEditor) {
                richTextEditor.setContent(note.htmlContent || note.content, note.formatting);
            }
            
            // Scroll to editor
            document.getElementById('editorContainer').scrollIntoView({ behavior: 'smooth' });
            richTextEditor.focus();
        }
    } catch (e) {
        console.error('Error editing note:', e);
        alert('❌ Gagal membuka catatan untuk edit');
    }
}

async function deleteNote(id) {
    try {
        if (confirm('🗑️ Yakin ingin menghapus catatan ini? Tindakan ini tidak bisa dibatalkan.')) {
            const result = await storageManager.deleteNote(id);
            if (result.success) {
                alert('✅ ' + result.message);
                await renderNotesList();
            } else {
                alert('❌ ' + result.message);
            }
        }
    } catch (e) {
        console.error('Error deleting note:', e);
        alert('❌ Gagal menghapus catatan');
    }
}

// ===== LAYER 1: LOGIN =====

async function verifyLayer1() {
    try {
        const password = document.getElementById('loginPassword1').value;
        const statusEl = document.getElementById('loginStatus1');

        if (!password) {
            statusEl.textContent = '❌ Masukkan password!';
            statusEl.className = 'status error';
            return;
        }

        const isValid = await encryptionManager.verifyLayer1Password(password);

        if (isValid) {
            statusEl.textContent = '✅ Password benar!';
            statusEl.className = 'status success';

            if (encryptionManager.hasLayer2()) {
                setTimeout(() => {
                    document.getElementById('loginLayer1').classList.add('hidden');
                    document.getElementById('loginLayer2').classList.remove('hidden');
                    document.getElementById('loginPassword1').value = '';
                }, 1000);
            } else {
                setTimeout(() => {
                    isAuthenticated = true;
                    document.getElementById('loginLayer1').classList.add('hidden');
                    document.getElementById('notesSection').classList.remove('hidden');
                    document.getElementById('loginPassword1').value = '';
                    
                    // Initialize editor
                    if (!richTextEditor) {
                        richTextEditor = new RichTextEditor('editorContainer');
                    }
                    richTextEditor.focus();
                    
                    renderNotesList();
                }, 1000);
            }
        } else {
            statusEl.textContent = '❌ Password salah!';
            statusEl.className = 'status error';
        }
    } catch (e) {
        console.error('Error in verifyLayer1:', e);
        alert('❌ Terjadi kesalahan: ' + e.message);
    }
}

// ===== LAYER 2: LOGIN =====

async function verifyLayer2() {
    try {
        const password = document.getElementById('loginPassword2').value;
        const statusEl = document.getElementById('loginStatus2');

        if (!password) {
            statusEl.textContent = '❌ Masukkan password!';
            statusEl.className = 'status error';
            return;
        }

        const isValid = await encryptionManager.verifyLayer2Password(password);

        if (isValid) {
            statusEl.textContent = '✅ Password benar!';
            statusEl.className = 'status success';

            setTimeout(() => {
                isAuthenticated = true;
                document.getElementById('loginLayer2').classList.add('hidden');
                document.getElementById('notesSection').classList.remove('hidden');
                document.getElementById('loginPassword2').value = '';
                
                // Initialize editor
                if (!richTextEditor) {
                    richTextEditor = new RichTextEditor('editorContainer');
                }
                richTextEditor.focus();
                
                renderNotesList();
            }, 1000);
        } else {
            statusEl.textContent = '❌ Password salah!';
            statusEl.className = 'status error';
        }
    } catch (e) {
        console.error('Error in verifyLayer2:', e);
        alert('❌ Terjadi kesalahan: ' + e.message);
    }
}

// ===== LOGOUT =====

function logout() {
    try {
        if (confirm('👋 Yakin ingin logout?')) {
            isAuthenticated = false;
            document.getElementById('notesSection').classList.add('hidden');
            document.getElementById('layer2Setup').classList.add('hidden');
            document.getElementById('detectionAlert').classList.add('hidden');
            resetForm();
            showMenu();
        }
    } catch (e) {
        console.error('Error in logout:', e);
    }
}

// ===== EXPORT & IMPORT =====

async function exportToFile() {
    try {
        const notes = await storageManager.getNotes();
        if (notes.length === 0) {
            alert('⚠️ Tidak ada catatan untuk diekspor!');
            return;
        }
        const result = await storageManager.exportAsJSON();
        alert('✅ ' + result.message + ' File sudah diunduh!');
    } catch (e) {
        console.error('Error exporting:', e);
        alert('❌ Gagal mengexport catatan');
    }
}

function importFromFile() {
    document.getElementById('importFile').click();
}

function handleFileImport(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const isMerge = confirm('Merge dengan catatan lama? (Cancel = Replace semua)');
                const result = await storageManager.importFromJSON(e.target.result, isMerge);
                alert(result.success ? '✅ ' + result.message : '❌ ' + result.message);
                
                if (result.success) {
                    await renderNotesList();
                }
            } catch (error) {
                alert('❌ Gagal memproses file!');
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    } catch (e) {
        console.error('Error importing:', e);
        alert('❌ Terjadi kesalahan saat import');
    }
}

// ===== SEARCH & FILTER =====

async function searchNotes(query) {
    try {
        if (!query.trim()) {
            await renderNotesList();
            return;
        }

        const results = await storageManager.searchNotes(query);
        const notesList = document.getElementById('notesList');

        if (results.length === 0) {
            notesList.innerHTML = '<p style="text-align: center; color: #999;">❌ Catatan tidak ditemukan</p>';
            return;
        }

        notesList.innerHTML = results.map(note => `
            <div class="note-item">
                <h4>${escapeHtml(note.title)}</h4>
                <p>${escapeHtml(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}</p>
                <small>📅 ${note.createdAt}</small>
                <div class="note-actions">
                    <button class="btn btn-info" onclick="editNote(${note.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteNote(${note.id})">🗑️ Hapus</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Search error:', e);
    }
}

// ===== KEYBOARD NAVIGATION =====

document.addEventListener('keydown', (e) => {
    try {
        if (e.key === 'Escape' && currentState !== 'menu') {
            backToMenu();
        }
        
        if (e.key === 'Enter' && e.ctrlKey) {
            const activeElement = document.activeElement;
            if (activeElement.id === 'password1') {
                setupLayer1();
            } else if (activeElement.id === 'password2') {
                setupLayer2();
            }
        }
    } catch (e) {
        console.error('Keyboard event error:', e);
    }
});

// ===== UTILITY FUNCTIONS =====

function escapeHtml(text) {
    try {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    } catch (e) {
        return text;
    }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    try {
        initDarkMode();
        
        if (encryptionManager.hasLayer1()) {
            // User sudah pernah setup
        }
        
        showMenu();
        console.log('🎯 Encrypted Notes App v3.0 - Rich Text Editor Edition! ✨');
        console.log('Features: 🔐 2-Layer Encryption, 📝 Rich Text Editing, 🎨 Custom Fonts & Colors');
    } catch (e) {
        console.error('Initialization error:', e);
    }
});