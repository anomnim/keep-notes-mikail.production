Keep Notes — no-backend client-side encrypted shared note

Deskripsi singkat
- Aplikasi web minimal yang menyimpan catatan terenkripsi langsung di URL fragment (tidak perlu backend).
- Semua enkripsi/dekripsi dilakukan di browser (PBKDF2 + AES-GCM). Server tidak menyimpan apa-apa karena tidak ada server.
- Siapa pun yang punya URL penuh (termasuk fragment) dan password yang benar dapat membuka catatan.

Cara cepat pakai (tanpa Firebase)
- Buka index.html (lokal) atau deploy statis (GitHub Pages / Netlify) — tidak perlu build step.
- Isi password, tulis catatan, lalu tekan "Encrypt & Generate Link". Aplikasi akan mengenkripsi dan memperbarui URL fragment.
- Bagikan "link" (URL lengkap) beserta password ke orang yang Anda ingin beri akses.
- Atau gunakan Export JSON untuk mengunduh file yang berisi ciphertext (untuk backup) dan Import JSON untuk memasukkan kembali.

Keterbatasan & catatan keamanan
- URL panjang: untuk catatan besar, link bisa sangat panjang; beberapa layanan/klien mungkin memotong fragment.
- Jika lupa password: data tidak dapat dipulihkan.
- Fragment URL tidak dikirim ke server oleh browser saat permintaan HTTP, tetapi jika Anda paste link ke layanan pihak ketiga, fragment ikut dibagikan.

Deploy cepat ke GitHub Pages
1) Repo -> Settings -> Pages -> Source: main / root -> Save.
2) Tunggu beberapa menit. Akses: https://<username>.github.io/<repo>

Atau buka index.html langsung di browser (file://) untuk pengujian lokal.
