// Service worker manual untuk SIMASET SD.
// Ditulis tangan (bukan hasil plugin build) supaya tidak bergantung ke
// Serwist/Workbox yang saat ini belum kompatibel dengan Turbopack di
// Next.js 16. Cukup untuk syarat "installable" PWA + cache dasar.

const CACHE_VERSION = "simaset-v1";
const APP_SHELL = ["/", "/dashboard", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya tangani GET same-origin; biarkan request lain (POST ke
  // Supabase/Cloudinary, dll) langsung ke jaringan tanpa campur tangan SW.
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  const isNavigasi = request.mode === "navigate";

  if (isNavigasi) {
    // Network-first untuk halaman: data aset harus selalu paling baru
    // kalau online; fallback ke cache saat offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((res) => res || caches.match("/dashboard"))
            // Kalau /pengaturan (atau halaman apapun yang belum pernah
            // dikunjungi) DAN "/dashboard" dua-duanya cache-miss, baris di
            // atas resolve ke `undefined`. event.respondWith(undefined)
            // itu yang bikin browser lempar persis error yang dilaporkan:
            // "resulted in a network error response: the promise was
            // rejected" — bukan promise-nya beneran reject, tapi
            // respondWith nerima non-Response. Selalu kasih Response asli
            // di ujung sebagai jaring pengaman terakhir.
            .then(
              (res) =>
                res ||
                new Response(
                  "<h1>Kamu sedang offline</h1><p>Halaman ini belum pernah dibuka sebelumnya, jadi belum tersimpan di cache.</p>",
                  { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
                )
            )
        )
    );
    return;
  }

  // Cache-first untuk asset statis (font, ikon, JS/CSS terkompilasi).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
            return response;
          })
          // Sebelumnya TIDAK ADA .catch() di sini. Begitu fetch aset
          // statis gagal (offline, koneksi putus sesaat, atau navigasi
          // dibatalkan user di tengah jalan), promise ini reject tanpa
          // ada yang nangkep -> persis "Uncaught (in promise) TypeError:
          // Failed to fetch" yang dilaporkan. Fallback Response kosong di
          // sini bukan solusi sempurna (asetnya tetap gak kebuka), tapi
          // minimal gak bikin unhandled rejection nyampah di console dan
          // gak bikin request nge-hang.
          .catch(() => new Response("", { status: 504 }))
    )
  );
});
