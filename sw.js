/*
 * Keeps the app and its data on the phone. Every file of the build is stored when this worker is
 * installed and served from the phone from then on, so the app opens with no signal. A new build
 * comes with a new list and version (written in by offline/vite.config.ts), is stored beside the
 * old one, and takes over when the app asks it to or next starts; the old set is then dropped.
 */
const VERSION = "98e582465694"
const FILES = ["./","assets/alegreya-italic-latin-BNGsTFBD.woff2","assets/alegreya-italic-latin-ext-pnGMTehi.woff2","assets/alegreya-italic-vietnamese-B_BjP3Cx.woff2","assets/alegreya-latin-BCUEsrKK.woff2","assets/alegreya-latin-ext-DYBa33G-.woff2","assets/alegreya-sans-sc-500-latin-CoGqyLsG.woff2","assets/alegreya-sans-sc-500-latin-ext-vN1Lj7FP.woff2","assets/alegreya-sans-sc-500-vietnamese-8NaPYAUx.woff2","assets/alegreya-sans-sc-700-latin-7H8cAEN8.woff2","assets/alegreya-sans-sc-700-latin-ext-BCBLRwPe.woff2","assets/alegreya-sans-sc-700-vietnamese-B5zHf4g_.woff2","assets/alegreya-vietnamese-B6l37gIf.woff2","assets/index-CINDvboS.css","assets/index-sRVz2jVe.js","flora.json","icons/icon-180.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","index.html","manifest.webmanifest"]
const CACHE = `wild-roses-${VERSION}`

self.addEventListener('install', (event) => {
  // `reload` skips the browser's own cache, so a new version never stores an old file
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((file) => new Request(file, { cache: 'reload' })))),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('wild-roses-') && key !== CACHE) await caches.delete(key)
      }
      await self.clients.claim()
    })(),
  )
})

// The app asks for the new version once the reader agrees to switch
self.addEventListener('message', (event) => {
  if (event.data === 'update') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      // Vary is ignored: a module script is asked for with an Origin header the stored request
      // lacks, and a server answering "Vary: Origin" would otherwise send it to the network
      const options = { ignoreSearch: true, ignoreVary: true }
      // Any page of the app opens the app itself
      const stored =
        request.mode === 'navigate'
          ? (await cache.match('./', options)) || (await cache.match('./index.html', options))
          : await cache.match(request, options)
      return stored || fetch(request)
    })(),
  )
})
