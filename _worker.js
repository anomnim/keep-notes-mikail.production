// Cloudflare Pages Advanced Mode Worker
// Menangani routing untuk mikail.anom.my.id:
// 1. "/" -> Menampilkan landing page (Website Mikail Sedang Dibangun)
// 2. "/notes" -> Redirect ke "/notes/"
// 3. "/notes/*" -> Menyajikan file statis aplikasi Keep Notes

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Root "/" -> Landing page "Sedang Dibangun"
    if (url.pathname === '/' || url.pathname === '') {
      return env.ASSETS.fetch(new Request(new URL('/landing.html', request.url), request));
    }

    // 2. Akses "/notes" tanpa trailing slash -> Redirect 301 ke "/notes/"
    // Trailing slash wajib agar aset relatif (seperti "./style.css") di-resolve ke "/notes/style.css"
    if (url.pathname === '/notes') {
      return Response.redirect(`${url.origin}/notes/${url.search}${url.hash}`, 301);
    }

    // 3. Semua akses aplikasi di "/notes/*" -> Teruskan ke aset statis root
    if (url.pathname.startsWith('/notes/')) {
      const subPath = url.pathname.slice('/notes'.length) || '/';
      const targetUrl = new URL(subPath + url.search, request.url);
      return env.ASSETS.fetch(new Request(targetUrl, request));
    }

    // 4. Jika ada yang mengakses "/index.html" langsung, rapikan ke "/notes/"
    if (url.pathname === '/index.html') {
      return Response.redirect(`${url.origin}/notes/${url.search}${url.hash}`, 301);
    }

    // 5. Akses langsung ke "/landing.html"
    if (url.pathname === '/landing.html') {
      return env.ASSETS.fetch(request);
    }

    // 6. Path lainnya -> 404
    return new Response('Halaman tidak ditemukan', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
