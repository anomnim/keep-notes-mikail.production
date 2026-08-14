Keep Notes — client-side encrypted shared note

Deskripsi singkat
- Aplikasi web minimal yang menyimpan catatan terenkripsi.
- Semua enkripsi/dekripsi terjadi di browser. Server (Firestore) hanya menyimpan ciphertext, salt, dan iv.
- Siapa pun yang punya URL repo/site dan password yang benar dapat membuka catatan.

Cara cepat (recommended)
1) Buat Firebase project (gratis) di https://console.firebase.google.com/
2) Di Project settings -> Your apps -> add Web app. Salin konfigurasi Web SDK.
3) Isi file config.js di repo ini dengan objek window.firebaseConfig yang berisi nilai dari step 2.
   (lihat contoh di config.js)
4) Di Firebase Console, aktifkan Firestore (Native mode). Tidak perlu autentikasi.
5) Atur Firestore rules (sementara) menjadi public jika ingin mudah: 

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

Catatan: Data tersimpan terenkripsi, jadi aturan public hanya cocok karena kita mengandalkan enkripsi client-side sebagai kontrol akses.

Deploy
- Pilihan mudah: Netlify (drag & drop folder public) atau GitHub Pages. Cukup build (tidak perlu build step) — file statis.
- Contoh deploy ke GitHub Pages:
  1. Buka repo settings -> Pages -> Source: main branch / root
  2. Setelah aktif, buka https://<username>.github.io/<repo-name>

Cara penggunaan
- Buka URL aplikasi, masukkan password yang ingin dipakai bersama, tekan Buka untuk decrypt (jika sudah ada), atau tulis lalu Simpan untuk meng-encrypt dan upload.
- Jangan lupa bagikan URL + password kepada siapa yang boleh mengakses.

Keamanan & peringatan
- Jika lupa password -> data tidak bisa dipulihkan.
- Enkripsi dilakukan di browser dengan PBKDF2 + AES-GCM. Iterasi PBKDF2 di-set moderat untuk performa mobile.
- Untuk produksi: pertimbangkan Argon2 (via WASM) dan HMAC checks for integrity.

Jika mau, saya bisa bantu:
- Mengisi config.js (kamu beri config dari Firebase) dan commit ulang.
- Mengubah Firestore rules ke anonymous auth flow.
- Deploy otomatis ke GitHub Pages/Netlify bila kamu inginkan.
