# Keep Notes — Encrypted & Shared via URL

Aplikasi catatan rahasia berbasis browser (*client-side only*) tanpa backend maupun database. Data catatan dikompresi, dienkripsi, dan dibawa langsung di dalam URL fragment (`#d=...`), sehingga dapat dibuka dan dibagikan ke perangkat apa pun secara aman dan instan.

---

## 🚀 Cara Penggunaan

1. **Buka Aplikasi**: Buka `index.html` langsung di browser atau deploy statis (GitHub Pages, Netlify, Cloudflare Pages, Vercel).
2. **Masukkan Password**: Tentukan password enkripsi (gunakan tombol 👁 untuk memastikan tidak typo).
3. **Tulis Catatan**: Tulis catatan Anda (mendukung sintaks Markdown). Anda dapat berpindah ke tab **Preview** untuk melihat hasilnya secara langsung.
4. **Simpan / Autosave**: Klik tombol **Simpan** (atau biarkan autosave bekerja). URL browser akan otomatis terisi kode payload terenkripsi.
5. **Bagikan Catatan**:
   - Klik **Copy Link** untuk membagikan tautan bersama password kepada rekan Anda.
   - Atau klik **📱 QR Code** untuk memindai tautan langsung menggunakan kamera smartphone.
6. **Buka Catatan**: Buka link yang diterima, masukkan password, lalu klik **Buka** (atau tekan `Enter`).
7. **Backup & Restore**: Gunakan tombol **Export JSON** untuk mengunduh arsip catatan terenkripsi, dan **Import JSON** untuk memulihkannya kembali.

---

## 🛡️ Fitur & Keamanan

- **Zero-Backend & Zero-Database**: Tidak ada server penyimpanan data. Tidak ada risiko kebocoran database pusat.
- **Enkripsi Kuat di Browser**: Menggunakan standar Web Crypto API (`PBKDF2` 120.000 iterasi + `AES-GCM` 256-bit).
- **Kompresi Stream Native**: Memanfaatkan browser `CompressionStream('deflate-raw')` untuk memangkas panjang link hingga 50–70% dengan tetap mendukung dekripsi backward-compatible.
- **Offline QR Code Generator**: Pembuatan QR Code instan SVG tanpa internet dan tanpa membagikan URL ke API pihak ketiga.
- **Markdown & Auto-Expanding Editor**: Mendukung heading, bold, italic, list, quotes, dan code snippets dengan tinggi textarea dinamis.
- **Perlindungan Data**: Notifikasi `beforeunload` aktif jika ada teks yang belum tersimpan saat tab hendak ditutup.
- **Privasi URL Fragment**: Karakter setelah `#` (fragment) secara spesifikasi protokol HTTP tidak pernah dikirim ke web server hosting.

---

## 📁 Struktur Berkas

```text
├── index.html          # Halaman utama aplikasi & layout antarmuka
├── style.css           # Styling modern, responsif, & status alert feedback
├── js/
│   ├── crypto.js       # Engine Web Crypto API (AES-GCM, PBKDF2, Deflate stream)
│   ├── no-backend-app.js # Logika aplikasi, state, event listeners, & Markdown parser
│   └── qrcode.min.js   # Library QR code offline mandiri (SVG renderer)
└── legacy_backup/      # Cadangan file legacy terdahulu (diisolasi)
```

---

*Catatan: Semua enkripsi terjadi di browser Anda. Jika password hilang, data tidak dapat dipulihkan oleh siapa pun.*
