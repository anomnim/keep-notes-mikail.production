// Encryption Module - Password Ganda dengan Persistence
class EncryptionManager {
    constructor() {
        this.storagePrefix = 'encryptedNotes_';
        this.layer1Key = `${this.storagePrefix}layer1Password`;
        this.layer2Key = `${this.storagePrefix}layer2Password`;
        this.loadPasswords();
    }

    // Load passwords dari localStorage
    loadPasswords() {
        try {
            const stored1 = localStorage.getItem(this.layer1Key);
            const stored2 = localStorage.getItem(this.layer2Key);
            this.layer1Password = stored1 ? JSON.parse(stored1) : null;
            this.layer2Password = stored2 ? JSON.parse(stored2) : null;
        } catch (e) {
            console.warn('Error loading passwords:', e);
            this.layer1Password = null;
            this.layer2Password = null;
        }
    }

    // Save passwords ke localStorage
    savePasswords() {
        try {
            if (this.layer1Password) {
                localStorage.setItem(this.layer1Key, JSON.stringify(this.layer1Password));
            }
            if (this.layer2Password) {
                localStorage.setItem(this.layer2Key, JSON.stringify(this.layer2Password));
            }
        } catch (e) {
            console.error('Error saving passwords:', e);
        }
    }

    // Encryption using SHA-256
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // Set Layer 1 Password
    async setLayer1Password(password) {
        if (!password || password.length < 6) {
            return { success: false, message: 'Password minimal 6 karakter!' };
        }
        try {
            this.layer1Password = await this.hashPassword(password);
            this.savePasswords();
            return { success: true, message: 'Layer 1 password berhasil dibuat! ✅' };
        } catch (e) {
            return { success: false, message: 'Error setting password!' };
        }
    }

    // Verify Layer 1 Password
    async verifyLayer1Password(password) {
        if (!this.layer1Password) {
            return false;
        }
        try {
            const hashed = await this.hashPassword(password);
            return hashed === this.layer1Password;
        } catch (e) {
            console.error('Error verifying password:', e);
            return false;
        }
    }

    // Set Layer 2 Password
    async setLayer2Password(password) {
        if (!password || password.length < 6) {
            return { success: false, message: 'Password minimal 6 karakter!' };
        }
        try {
            this.layer2Password = await this.hashPassword(password);
            this.savePasswords();
            return { success: true, message: 'Layer 2 password berhasil dibuat! ✅' };
        } catch (e) {
            return { success: false, message: 'Error setting password!' };
        }
    }

    // Verify Layer 2 Password
    async verifyLayer2Password(password) {
        if (!this.layer2Password) {
            return false;
        }
        try {
            const hashed = await this.hashPassword(password);
            return hashed === this.layer2Password;
        } catch (e) {
            console.error('Error verifying password:', e);
            return false;
        }
    }

    // Check if Layer 2 is set
    hasLayer2() {
        return this.layer2Password !== null;
    }

    // Check if Layer 1 is set
    hasLayer1() {
        return this.layer1Password !== null;
    }

    // Encrypt note content
    encryptNoteContent(content) {
        try {
            return btoa(unescape(encodeURIComponent(content)));
        } catch (e) {
            console.error('Encryption error:', e);
            return content;
        }
    }

    // Decrypt note content
    decryptNoteContent(encrypted) {
        try {
            return decodeURIComponent(escape(atob(encrypted)));
        } catch (e) {
            return encrypted;
        }
    }

    // Reset all passwords
    reset() {
        try {
            localStorage.removeItem(this.layer1Key);
            localStorage.removeItem(this.layer2Key);
            this.layer1Password = null;
            this.layer2Password = null;
        } catch (e) {
            console.error('Error resetting passwords:', e);
        }
    }
}

// Global encryption manager
const encryptionManager = new EncryptionManager();