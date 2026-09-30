const CACHE = "remesas-pwa-v5"; // ⚠️ IMPORTANTE: Cambia este número (v3, v4, v5) cada vez que subas cambios a GitHub
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

// Instalar e inmediatamente forzar activación (skipWaiting)
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

// Activar, tomar control inmediato de la app (clients.claim) y borrar caches viejas
self.addEventListener("activate", e => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys => 
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      )
    ])
  );
});

// Estrategia Network-First: Busca siempre lo más nuevo en GitHub. Si está offline, carga la versión en caché.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Actualizar la copia del caché en segundo plano con lo último descargado
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(e.request)) // Si falla la red (offline), usa la versión guardada
  );
});
