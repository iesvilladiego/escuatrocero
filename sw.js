/* ============================================================
   EsCuatroCero · Service Worker (PWA)
   - App shell (mismo origen): stale-while-revalidate
   - CDNs (fuentes, Font Awesome, SDK Firebase): stale-while-revalidate
   - Backend de Firebase (datos y autenticación): SIEMPRE red, nunca caché
   - Navegación sin conexión: sirve index.html desde la caché
   - API de mensajes: la página consulta la versión activa (GET_VERSION)
     para pintar el chip de versión del banner y avisar de
     actualizaciones disponibles
   Para publicar cambios de la PWA, sube el valor de VERSION.
   ============================================================ */
const VERSION = 'v1.0.3'; // v1.0.3: chip de versión en el banner + aviso de actualización disponible + mensaje GET_VERSION
const SHELL_CACHE = `e40-shell-${VERSION}`;
const CDN_CACHE = `e40-cdn-${VERSION}`;

const SHELL_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.png',
    './apple-touch-icon.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-192.png',
    './icons/icon-maskable-512.png'
];

/* CDNs de los que depende la app: se cachean para poder abrir sin conexión */
const CDN_HOSTS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com',
    'www.gstatic.com'
];

/* Backend de datos/autenticación de Firebase: nunca interceptar */
const NEVER_CACHE_HOSTS = [
    'firebasedatabase.app',
    'firebaseio.com',
    'firestore.googleapis.com',
    'firebasestorage.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebaseinstallations.googleapis.com',
    'firebaseanalytics.googleapis.com',
    'firebaselogging-pa.googleapis.com'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then((cache) => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    // IMPORTANTE: Cache Storage es compartido por todo el origen
                    // (portal-ies-*, ace-villadiego-*, laliao-*, etc. son de OTRAS
                    // PWAs). Solo se borran las cachés de la propia familia 'e40-'.
                    .filter((k) => k !== SHELL_CACHE && k !== CDN_CACHE && k.startsWith('e40-'))
                    .map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    let url;
    try {
        url = new URL(req.url);
    } catch (e) {
        return;
    }

    /* Datos y auth de Firebase: red directa, sin caché */
    if (NEVER_CACHE_HOSTS.includes(url.hostname)) return;

    /* Navegación: red primero; si no hay conexión, index.html de la caché */
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(SHELL_CACHE).then((c) => c.put('./index.html', copy));
                    return res;
                })
                .catch(() => caches.match('./index.html').then((m) => m || Response.error()))
        );
        return;
    }

    const isShell = url.origin === self.location.origin;
    const isCdn = CDN_HOSTS.includes(url.hostname);

    if (isShell) {
        event.respondWith(staleWhileRevalidate(req, SHELL_CACHE));
    } else if (isCdn) {
        event.respondWith(staleWhileRevalidate(req, CDN_CACHE));
    }
    /* Otros orígenes no controlados: se dejan pasar sin cachear */
});

/* Mensajes de la página: consulta de la versión para el chip del banner.
   La página envía { type: 'GET_VERSION' } y el SW responde
   { type: 'VERSION', version } por el MessageChannel recibido
   (o, como respaldo, al emisor directamente). */
self.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'GET_VERSION') return;
    const respuesta = { type: 'VERSION', version: VERSION };
    if (event.ports && event.ports.length > 0) {
        event.ports[0].postMessage(respuesta);
    } else if (event.source) {
        event.source.postMessage(respuesta);
    }
});

async function staleWhileRevalidate(req, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    const refresh = fetch(req)
        .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
        })
        .catch(() => null);
    return cached || (await refresh) || Response.error();
}
