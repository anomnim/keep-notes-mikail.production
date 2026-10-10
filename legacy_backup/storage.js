// IndexedDB Storage Manager - Lebih powerful dari localStorage
class IndexedDBManager {
    constructor() {
        this.dbName = 'EncryptedNotesDB';
        this.storeName = 'notes';
        this.passwordStoreName = 'passwords';
        this.dbVersion = 1;
        this.db = null;
        this.initDB();
    }

    // Initialize IndexedDB
    async initDB() {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = () => {
                    console.error('IndexedDB error:', request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('✅ IndexedDB initialized successfully');
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create notes object store
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const notesStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                        notesStore.createIndex('createdAt', 'createdAt', { unique: false });
                        notesStore.createIndex('title', 'title', { unique: false });
                        console.log('Notes store created');
                    }

                    // Create passwords object store
                    if (!db.objectStoreNames.contains(this.passwordStoreName)) {
                        db.createObjectStore(this.passwordStoreName, { keyPath: 'key' });
                        console.log('Passwords store created');
                    }
                };
            } catch (e) {
                console.error('DB initialization error:', e);
                reject(e);
            }
        });
    }

    // Add note
    async addNote(note) {
        try {
            const newNote = {
                id: Date.now(),
                title: note.title || 'Catatan Tanpa Judul',
                content: note.content,
                encryptedContent: encryptionManager.encryptNoteContent(note.content),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                hasLayer2: note.hasLayer2 || false,
                languagesDetected: note.languagesDetected || [],
                detectionInfo: note.detectionInfo || {},
                tone: note.tone || 'neutral'
            };

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.add(newNote);

                request.onsuccess = () => {
                    resolve({ success: true, note: newNote, message: 'Catatan berhasil ditambahkan!' });
                };

                request.onerror = () => {
                    reject({ success: false, message: 'Gagal menambahkan catatan!' });
                };
            });
        } catch (e) {
            console.error('Error adding note:', e);
            return { success: false, message: 'Gagal menambahkan catatan!' };
        }
    }

    // Get all notes
    async getAllNotes() {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject([]);
                };
            } catch (e) {
                console.error('Error getting notes:', e);
                reject([]);
            }
        });
    }

    // Get note by ID
    async getNoteById(id) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(id);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(null);
                };
            } catch (e) {
                console.error('Error getting note:', e);
                reject(null);
            }
        });
    }

    // Update note
    async updateNote(id, updatedData) {
        try {
            const note = await this.getNoteById(id);
            if (!note) {
                return { success: false, message: 'Catatan tidak ditemukan!' };
            }

            const updated = {
                ...note,
                ...updatedData,
                updatedAt: new Date().toISOString()
            };

            if (updatedData.content) {
                updated.encryptedContent = encryptionManager.encryptNoteContent(updatedData.content);
                updated.title = updatedData.title || updatedData.content.substring(0, 50);
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put(updated);

                request.onsuccess = () => {
                    resolve({ success: true, note: updated, message: 'Catatan berhasil diupdate!' });
                };

                request.onerror = () => {
                    reject({ success: false, message: 'Gagal mengupdate catatan!' });
                };
            });
        } catch (e) {
            console.error('Error updating note:', e);
            return { success: false, message: 'Gagal mengupdate catatan!' };
        }
    }

    // Delete note
    async deleteNote(id) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(id);

                request.onsuccess = () => {
                    resolve({ success: true, message: 'Catatan berhasil dihapus!' });
                };

                request.onerror = () => {
                    reject({ success: false, message: 'Gagal menghapus catatan!' });
                };
            } catch (e) {
                console.error('Error deleting note:', e);
                reject({ success: false, message: 'Gagal menghapus catatan!' });
            }
        });
    }

    // Search notes
    async searchNotes(query) {
        try {
            const notes = await this.getAllNotes();
            const lowerQuery = query.toLowerCase();
            return notes.filter(note =>
                note.title.toLowerCase().includes(lowerQuery) ||
                note.content.toLowerCase().includes(lowerQuery)
            );
        } catch (e) {
            console.error('Search error:', e);
            return [];
        }
    }

    // Export all notes as JSON
    async exportAsJSON() {
        try {
            const notes = await this.getAllNotes();
            const dataStr = JSON.stringify(notes, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `encrypted-notes-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return { success: true, message: `${notes.length} catatan berhasil diexport!` };
        } catch (e) {
            console.error('Export error:', e);
            return { success: false, message: 'Gagal mengexport catatan!' };
        }
    }

    // Import notes from JSON
    async importFromJSON(jsonData, merge = false) {
        try {
            const importedNotes = JSON.parse(jsonData);
            if (!Array.isArray(importedNotes)) {
                return { success: false, message: 'Format JSON tidak valid!' };
            }

            if (merge) {
                // Merge with existing notes
                const existingNotes = await this.getAllNotes();
                const existingIds = new Set(existingNotes.map(n => n.id));
                let addedCount = 0;

                for (let note of importedNotes) {
                    if (!existingIds.has(note.id)) {
                        await this.addNote(note);
                        addedCount++;
                    }
                }

                return {
                    success: true,
                    message: `${addedCount} catatan baru berhasil diimport! ${importedNotes.length - addedCount} duplikat diabaikan.`
                };
            } else {
                // Replace all notes
                await this.clearAllNotes();
                for (let note of importedNotes) {
                    await this.addNote(note);
                }
                return { success: true, message: `${importedNotes.length} catatan berhasil diimport!` };
            }
        } catch (e) {
            console.error('Import error:', e);
            return { success: false, message: 'Format file tidak valid atau rusak!' };
        }
    }

    // Clear all notes
    async clearAllNotes() {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    resolve({ success: true, message: 'Semua catatan telah dihapus!' });
                };

                request.onerror = () => {
                    reject({ success: false, message: 'Gagal menghapus catatan!' });
                };
            } catch (e) {
                console.error('Error clearing notes:', e);
                reject({ success: false, message: 'Gagal menghapus catatan!' });
            }
        });
    }

    // Get statistics
    async getStatistics() {
        try {
            const notes = await this.getAllNotes();
            const stats = {
                totalNotes: notes.length,
                layer2Notes: notes.filter(n => n.hasLayer2).length,
                totalCharacters: notes.reduce((sum, n) => sum + n.content.length, 0),
                averageLength: notes.length > 0 ? Math.round(notes.reduce((sum, n) => sum + n.content.length, 0) / notes.length) : 0,
                longestNote: notes.length > 0 ? Math.max(...notes.map(n => n.content.length)) : 0,
                shortestNote: notes.length > 0 ? Math.min(...notes.map(n => n.content.length)) : 0,
                createdDates: notes.map(n => n.createdAt),
                languageBreakdown: this.getLanguageBreakdown(notes),
                toneBreakdown: this.getToneBreakdown(notes)
            };
            return stats;
        } catch (e) {
            console.error('Statistics error:', e);
            return {
                totalNotes: 0,
                layer2Notes: 0,
                totalCharacters: 0,
                averageLength: 0,
                longestNote: 0,
                shortestNote: 0,
                createdDates: [],
                languageBreakdown: {},
                toneBreakdown: {}
            };
        }
    }

    getLanguageBreakdown(notes) {
        const breakdown = {};
        notes.forEach(note => {
            note.languagesDetected.forEach(lang => {
                breakdown[lang] = (breakdown[lang] || 0) + 1;
            });
        });
        return breakdown;
    }

    getToneBreakdown(notes) {
        const breakdown = {};
        notes.forEach(note => {
            const tone = note.tone || 'unknown';
            breakdown[tone] = (breakdown[tone] || 0) + 1;
        });
        return breakdown;
    }

    // Save password
    async savePassword(key, value) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.passwordStoreName], 'readwrite');
                const store = transaction.objectStore(this.passwordStoreName);
                const request = store.put({ key, value });

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(false);
            } catch (e) {
                reject(false);
            }
        });
    }

    // Get password
    async getPassword(key) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.passwordStoreName], 'readonly');
                const store = transaction.objectStore(this.passwordStoreName);
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result ? request.result.value : null);
                request.onerror = () => reject(null);
            } catch (e) {
                reject(null);
            }
        });
    }

    // Delete password
    async deletePassword(key) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.passwordStoreName], 'readwrite');
                const store = transaction.objectStore(this.passwordStoreName);
                const request = store.delete(key);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(false);
            } catch (e) {
                reject(false);
            }
        });
    }
}

// Global IndexedDB manager
const idbManager = new IndexedDBManager();

// Fallback StorageManager (tetap ada untuk backward compatibility)
class StorageManager {
    constructor() {
        this.notes = [];
    }

    async addNote(note) {
        return await idbManager.addNote(note);
    }

    async getNotes() {
        return await idbManager.getAllNotes();
    }

    async getNoteById(id) {
        return await idbManager.getNoteById(id);
    }

    async updateNote(id, updatedData) {
        return await idbManager.updateNote(id, updatedData);
    }

    async deleteNote(id) {
        return await idbManager.deleteNote(id);
    }

    async exportAsJSON() {
        return await idbManager.exportAsJSON();
    }

    async importFromJSON(jsonData, merge = false) {
        return await idbManager.importFromJSON(jsonData, merge);
    }

    async searchNotes(query) {
        return await idbManager.searchNotes(query);
    }

    async getStatistics() {
        return await idbManager.getStatistics();
    }

    async clearAllNotes() {
        return await idbManager.clearAllNotes();
    }
}

// Global storage manager
const storageManager = new StorageManager();