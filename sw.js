
const CACHE_NAME = "tunepro-v13-oem";
const ASSETS = [
  "./", "index.html", "manifest.json", "css/style.css", "js/app.js", "js/i18n.js",
  "i18n/en.json", "i18n/de.json", "icons/icon-192.png", "icons/icon-512.png",
  "icons/apple-touch-icon.png", "icons/favicon-32.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
