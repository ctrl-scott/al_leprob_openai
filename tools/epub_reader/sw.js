// sw.js — Service Worker for Offline Reading
// Place this file in the same folder as index.html (e.g., /app/sw.js)

const CACHE = "reader-cache-v1";

// Core assets to cache on install (the app shell)
const ASSETS = [
  //"./index.html",
	"./reader_jsonformat.html",
  "./",               // root of /app
  // Add CSS/JS files if you split them out of index.html
 // "/books/sample-text/book.json",
 // "/books/sample-text/book.txt"
  "book.json",
  "book.txt"
];

// Install event: cache app shell & book assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // activate worker immediately
});

// Activate event: clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch event: offline strategy
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // For book files and app shell: cache-first
  //if (req.url.includes("/books/") || req.url.endsWith("index.html")) {
	if (req.url.includes("/") || req.url.endsWith("reader_jsonformat.html")) {  
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // For everything else: network-first fallback to cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
