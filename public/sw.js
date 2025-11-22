const CACHE_NAME = 'dreweave-cache-v1'
const ASSET_TYPES = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.webp']
self.addEventListener('install', (event) => {
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  const isAsset = ASSET_TYPES.some((ext) => url.pathname.endsWith(ext))
  if (!isAsset) return
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req)
      const fetchPromise = fetch(req).then((networkRes) => {
        cache.put(req, networkRes.clone())
        return networkRes
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})