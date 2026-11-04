const CACHE_NAME = "sim-scouting-app-v1";

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const response = await fetch("/");
            if (!response.ok) {
                throw new Error(`Unable to cache the app shell: ${response.status}`);
            }

            const html = await response.clone().text();
            await cache.put(
                new URL("/", self.location.origin).href,
                response.clone(),
            );
            await cache.put(
                new URL("/index.html", self.location.origin).href,
                response.clone(),
            );

            const assets = Array.from(
                html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g),
                (match) => new URL(match[1], self.location.origin).href,
            );
            await Promise.all(
                assets.map(async (asset) => {
                    const assetResponse = await fetch(asset);
                    if (!assetResponse.ok) {
                        throw new Error(
                            `Unable to cache app asset ${asset}: ${assetResponse.status}`,
                        );
                    }
                    await cache.put(asset, assetResponse);
                }),
            );
            await self.skipWaiting();
        })(),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter(
                        (cacheName) =>
                            cacheName.startsWith("sim-scouting-app-") &&
                            cacheName !== CACHE_NAME,
                    )
                    .map((cacheName) => caches.delete(cacheName)),
            );
            await self.clients.claim();
        })(),
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const requestUrl = new URL(request.url);

    if (
        request.method !== "GET" ||
        requestUrl.origin !== self.location.origin ||
        requestUrl.pathname.startsWith("/api/")
    ) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async () => {
                const cachedPage = await caches.match(
                    new URL("/index.html", self.location.origin).href,
                );
                return cachedPage ?? Response.error();
            }),
        );
        return;
    }

    event.respondWith(
        (async () => {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }

            const response = await fetch(request);
            if (response.ok && response.type === "basic") {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, response.clone());
            }
            return response;
        })(),
    );
});
