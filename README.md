Keep Notes — no-backend client-side encrypted shared note

Cara singkat & padat
1) Buka index.html (atau deploy statis ke GitHub Pages/Netlify).
2) Masukkan password (bagikan password ini ke yang boleh akses).
3) Tulis catatan lalu tunggu autosave (atau klik "Simpan").
4) Salin "Link" dan bagikan bersama password.
5) Untuk backup: Export JSON. Untuk restore: Import JSON.

Catatan penting
- Semua enkripsi terjadi di browser (PBKDF2 + AES‑GCM). Jika lupa password → data tidak bisa dipulihkan.
- Fragment URL tidak dikirim ke server pada request HTTP, tapi jika Anda paste link ke layanan pihak ketiga, fragmen bisa tersimpan di layanan itu.

Deployed: 2026-08-14T09:58:00Z
