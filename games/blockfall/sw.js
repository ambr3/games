/*
 * Seclusa Blocks — service worker.
 *
 * One thing worth knowing
 * -----------------------
 *   The browser re-installs a worker only when this file's own bytes change. A release
 *   that bumps only manifest.json leaves this file identical, so `activate` would not
 *   fire again and the old cache would be served forever. The version is therefore
 *   re-read from the manifest on every worker startup, and `retireStaleCaches()` runs
 *   on the first navigation as well as in activate, so a bump always retires the
 *   previous `blockfall-v*` cache.
 *
 * Versioning
 * ----------
 *   There is no `?v=` query string on style.css or js/ any more. Those were the
 *   previous cache-busting mechanism and they were a standing bug: literals that had to
 *   be bumped by hand, where forgetting one file means a returning visitor silently
 *   keeps the stale copy.
 *
 *   The cache name below is the version, read from the app's single manifest at install
 *   time. Bumping the app version retires this cache automatically on activate, so
 *   there is no per-game version to keep in step and nothing to drift.
 *
 *   Note this worker's `fetch()` is not governed by the CSP of the page that registered
 *   it. A service worker script is fetched and executed outside the document's CSP, so
 *   `connect-src 'none'` on index.html does not block the manifest read below. The
 *   design relies on that.
 */

/*
 * The one manifest, at the app root. `../../` climbs out of this worker's scope,
 * which is /games/blockfall/, to reach it.
 */
var MANIFEST_URL = new URL('../../manifest.json', self.location);

/* Every cache this worker creates carries this prefix. Only caches with this prefix
 * are ours to delete — another worker's cache on this origin is not. */
var CACHE_PREFIX = 'blockfall-';

/* Used only when there is genuinely nothing to adopt — a first-ever install with no
 * network. Still prefixed, so a later successful install retires it. */
var FALLBACK_CACHE_NAME = 'blockfall-cache';

var cacheNamePromise = null;

/* How long the manifest read may take before it is treated as unavailable. */
var MANIFEST_TIMEOUT_MS = 5000;

function versionedName(version) {
    return CACHE_PREFIX + 'v' + version;
}

/*
 * Recovers the version from a manifest.json already in one of our own caches, so the
 * cache can still be named while offline.
 */
function versionFromOwnCache() {
    return caches.keys().then(function (keys) {
        var ours = keys.filter(function (key) {
            return key.indexOf(CACHE_PREFIX) === 0;
        });
        return Promise.all(ours.map(function (key) {
            return caches.open(key)
                .then(function (cache) {
                    return cache.match(MANIFEST_URL.pathname);
                })
                .then(function (hit) {
                    if (!hit) return null;
                    return hit.json().then(function (manifest) {
                        return manifest && typeof manifest.version === 'string' && manifest.version
                            ? manifest.version
                            : null;
                    }).catch(function () {
                        return null;
                    });
                })
                .catch(function () {
                    return null;
                });
        })).then(function (found) {
            return found.filter(Boolean)[0] || null;
        });
    });
}

/** Adopts whichever of our caches already exists, so a name is never invented. */
function discoverExistingCache() {
    return caches.keys().then(function (keys) {
        var ours = keys.filter(function (key) {
            return key.indexOf(CACHE_PREFIX) === 0;
        });
        var versioned = ours.filter(function (key) {
            return /^blockfall-v/.test(key);
        });
        var pool = versioned.length ? versioned : ours;
        return pool[pool.length - 1] || FALLBACK_CACHE_NAME;
    });
}

/*
 * Reads the one manifest, with a deadline.
 *
 * This sits in front of the first navigation, so a connection that neither answers
 * nor refuses — a black-holed router, a captive portal that stalls rather than
 * redirects — would otherwise hold the page open until the browser's own, much
 * longer, timeout. Timing out degrades to the adopted-cache path below, which is
 * the safe direction: a name guessed while offline never retires anything, so a
 * slow network costs one round of version checking, not the player's cache and
 * not the page.
 */
function fetchManifest() {
    const options = { cache: 'no-store' };
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        options.signal = AbortSignal.timeout(MANIFEST_TIMEOUT_MS);
    }
    return fetch(MANIFEST_URL, options);
}

/*
 * Resolves the cache name.
 *
 * `fromManifest: false` means the manifest could not be read and the name is a
 * best-effort adoption of a cache that already exists. That distinction is load-bearing:
 * retiring means deleting every cache of ours whose name is not the current one, so a
 * name invented while offline would delete the player's real cache. Measured on the
 * app worker before this was handled: going offline deleted `seclusa-games-v0.1.2`.
 */
function resolveCacheName() {
    return fetchManifest()
        .then(function (response) {
            if (!response.ok) throw new Error('manifest ' + response.status);
            return response.json();
        })
        .then(function (manifest) {
            if (!manifest || typeof manifest.version !== 'string' || !manifest.version) {
                throw new Error('manifest has no version');
            }
            return { name: versionedName(manifest.version), fromManifest: true };
        })
        .catch(function () {
            return versionFromOwnCache()
                .then(function (version) {
                    if (version) return { name: versionedName(version), fromManifest: false };
                    return discoverExistingCache().then(function (name) {
                        return { name: name, fromManifest: false };
                    });
                });
        });
}

/** Reads the manifest only if the name has never been resolved this worker lifetime. */
function currentCacheName() {
    if (!cacheNamePromise) {
        cacheNamePromise = resolveCacheName();
    }
    return cacheNamePromise;
}

/*
 * Forces a fresh manifest read, replacing the memo.
 *
 * A service worker outlives the page that registered it, so a name resolved once at
 * startup is the name it keeps using no matter what changes on disk. The in-flight
 * promise is reused so concurrent handlers share one fetch.
 */
function forceRefreshCacheName() {
    if (!cacheNamePromise) return currentCacheName();
    var inFlight = cacheNamePromise;
    return inFlight.then(function () {
        return (cacheNamePromise = resolveCacheName());
    });
}

/** Opens the current cache. Nothing reads a cache name at module scope. */
function withCache() {
    return currentCacheName().then(function (resolved) {
        return caches.open(resolved.name);
    });
}

/* Plain paths, no query strings: this worker strips search params from cache keys
   anyway (see toCacheKey), so a version suffix here would never match a lookup. */
var ASSETS = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './style.css',
    './js/main.js',
    './js/game.js',
    './js/board.js',
    './js/pieces.js',
    './js/render.js',
    './js/audio.js',
    './js/input.js',
    './js/storage.js',
    './js/constants.js',
    './js/theme.js',
    './icon.svg',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-192.png',
    './icon-maskable-512.png'
];

/*
 * The app shell's shared design system, loaded by this document as ../../theme.css and
 * ../../theme-game.js. They live above this worker's scope, so they can never appear in
 * ASSETS above — but without them the game renders unstyled offline, so they are
 * allowed and cached explicitly. Resolved relative to this script so the layout works
 * wherever the app is deployed.
 *
 * The root manifest.json is in this list for a second reason: versionFromOwnCache()
 * recovers the app version by reading the root manifest out of our own cache when the
 * network is gone, so that stale caches can still be retired offline. It could only
 * ever succeed if the root manifest were actually cached here — and it was not, so the
 * lookup always missed, fell through to an arbitrary cache name, and took cache
 * retirement with it. Precaching it makes the comment true.
 */
const SHARED_ASSETS = ['../../theme.css', '../../theme-game.js', '../../manifest.json']
    .map((rel) => new URL(rel, self.location.href).pathname);

/*
 * The shell's shared files are owned by the launcher, not by this game. They are cached
 * here only so the game still renders offline.
 *
 * They must be served NETWORK-FIRST. A service worker intercepts every fetch made by a
 * client it controls, and this worker controls the game frame — so when the frame asks
 * for /theme-game.js, this worker answers, not the launcher's root-scope worker, even
 * though the URL sits outside this worker's scope. Scope decides which clients are
 * controlled, not which requests are intercepted.
 *
 * Serving those shared files cache-first therefore pins the game to whichever revision
 * happened to be current when this cache was filled, with no way to notice a newer one:
 * the cache is only retired on an app-version bump. Measured on this file: the launcher
 * had already shipped navy as its default palette, and this worker's cache was still
 * serving the green build of theme-game.js — so a fresh install opened Blocks green
 * while every other game opened navy.
 */
function isSharedAsset(pathname) {
    return SHARED_ASSETS.indexOf(pathname) !== -1;
}

function toCacheKey(request) {
    try {
        const url = new URL(request.url);
        if (url.origin !== self.location.origin) return null;
        url.search = '';
        url.hash = '';
        return new Request(url.toString());
    } catch {
        return null;
    }
}

function assetRel(requestUrl) {
    try {
        const url = new URL(requestUrl);
        if (url.origin !== self.location.origin) return null;
        const base = new URL('./', self.location.href);
        let rel = url.pathname.slice(base.pathname.length);
        if (rel === '' || rel === '/') return './';
        return './' + rel;
    } catch {
        return null;
    }
}

/**
 * True only for a real, same-origin, 2xx response.
 *
 * A proxy, captive portal or CDN in front of the origin answers with a 502/503/504
 * *response* rather than a network error, so `fetch()` resolves and a handler that only
 * handles rejection hands that error page straight to the page. Measured before this
 * guard: the game iframe received a 39-byte error page instead of the game.
 */
function isRealDocument(response) {
    return !!response && response.status >= 200 && response.status < 300 &&
        (response.type === 'basic' || response.type === 'default');
}

/*
 * Deletes any of our own caches that is not the one the manifest currently names.
 *
 * Run beyond `activate` on purpose: a manifest-only version bump leaves this file's
 * bytes identical, so the browser does not re-install the worker and activate never
 * fires again. Re-reading the manifest on each startup and retiring here is what makes
 * a version bump actually take effect.
 *
 * Scoped to CACHE_PREFIX, so the launcher's and word-puzzle's caches are untouched.
 */
function retireStaleCaches() {
    return forceRefreshCacheName()
        .then((resolved) => {
            // Only delete when the version was genuinely read. A name adopted while
            // offline is not evidence that anything else is stale.
            if (!resolved.fromManifest) return null;
            return caches.keys().then((keys) => Promise.all(keys.map((key) => {
                if (key.startsWith(CACHE_PREFIX) && key !== resolved.name) return caches.delete(key);
            })));
        });
}

/** Answers from this worker's own cache, then from the offline fallback page. */
function serveFromCache(request) {
    return withCache()
        .then((cache) => cache.match(request).then((cached) =>
            cached || cache.match('./index.html').then((c) => c || cache.match('./offline.html'))
        ))
        .catch(() =>
            new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
            })
        );
}

self.addEventListener('install', (e) => {
    e.waitUntil(
        withCache().then((cache) =>
            Promise.allSettled(
                ASSETS.concat(SHARED_ASSETS).map((url) =>
                    fetch(url, { cache: 'no-store' })
                        .then((res) => (res && res.ok ? cache.put(url, res) : null))
                        .catch(() => null)
                )
            )
        ).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        retireStaleCaches().then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    let url;
    try {
        url = new URL(e.request.url);
    } catch {
        return;
    }
    if (url.origin !== self.location.origin) return;

    const cacheKey = toCacheKey(e.request);
    const rel = assetRel(e.request.url);
    const allowed = SHARED_ASSETS.indexOf(url.pathname) !== -1 ||
        (rel != null && ASSETS.indexOf(rel) !== -1);

    if (e.request.mode === 'navigate') {
        // Awaited before responding: this navigation is the thing that notices a new
        // version, so it must not then serve from the cache that version just retired.
        // A failed manifest read degrades to the cached name, so this costs at most one
        // manifest fetch and never blocks the page indefinitely.
        e.respondWith(
            retireStaleCaches()
                .catch(() => { /* best-effort; never block the page on it */ })
                .then(() => fetch(e.request, { cache: 'no-store' }))
                .then((res) => {
                    if (!isRealDocument(res)) return serveFromCache(e.request);
                    const clone = res.clone();
                    withCache().then((c) => c.put('./index.html', clone)).catch(() => {});
                    return res;
                })
                .catch(() => serveFromCache(e.request))
        );
        return;
    }

    if (!allowed) return;

    /*
     * Shared launcher files: network first, cache as the offline fallback. See
     * isSharedAsset() for why serving these from the cache first is wrong.
     */
    if (isSharedAsset(url.pathname)) {
        e.respondWith(
            fetch(e.request)
                .then((res) => {
                    if (res && res.ok) {
                        const clone = res.clone();
                        withCache().then((c) => c.put(e.request, clone)).catch(() => {});
                        return res;
                    }
                    // A proxy's 502 arrives as a successful fetch. Prefer the cached
                    // copy to handing the frame an error page styled as the app.
                    return withCache()
                        .then((cache) => cache.match(e.request))
                        .then((cached) => cached || res);
                })
                .catch(() =>
                    withCache()
                        .then((cache) => cache.match(e.request))
                        .then((cached) => cached || new Response('', { status: 503, statusText: 'Offline' }))
                )
        );
        return;
    }

    /*
     * Local hosts: network-first so module rewrites (app.js → js/*.js) show up without
     * a version bump. Production stays cache-first for offline/cold-start speed.
     */
    const isLocal =
        self.location.hostname === 'localhost' ||
        self.location.hostname === '127.0.0.1' ||
        self.location.hostname === '[::1]';

    e.respondWith(
        withCache().then((cache) => cache.match(cacheKey || e.request)).then((cached) => {
            if (cached && !isLocal) return cached;
            return fetch(e.request, { cache: isLocal ? 'no-store' : 'default' }).then((response) => {
                if (response && response.ok && cacheKey) {
                    const clone = response.clone();
                    withCache().then((c) => c.put(cacheKey, clone)).catch(() => {});
                }
                return response;
            }).catch(() =>
                cached ||
                withCache().then((cache) => cache.match('./offline.html')).then((o) =>
                    o || new Response('', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    })
                )
            );
        })
    );
});