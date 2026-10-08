const CACHE = "remesas-pwa-v16"; // ⚠️ IMPORTANTE: Cambia este número (v3, v4, v5) cada vez que subas cambios a GitHub
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
      ),
      // Refresca los iconos desde GitHub al activar una versión nueva.
      // Esto evita conservar indefinidamente el PNG anterior en la caché.
      Promise.all(
        ["./icon-192.png", "./icon-512.png"].map(url =>
          fetch(url + "?v=" + Date.now(), {cache:"no-store"})
            .then(response => {
              if (response && response.ok) {
                return caches.open(CACHE).then(c => c.put(url, response.clone()));
              }
            })
            .catch(() => {})
        )
      )
    ])
  );
});

// Estrategia Network-First: Busca siempre lo más nuevo en GitHub. Si está offline, carga la versión en caché.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  // Los iconos siempre intentan obtener la versión nueva primero.
  // El resto de archivos conserva la estrategia Network-First normal.
  const isIcon = e.request.url.endsWith("/icon-192.png") ||
                 e.request.url.endsWith("/icon-512.png");

  e.respondWith(
    fetch(e.request, isIcon ? {cache:"no-store"} : undefined)
      .then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
