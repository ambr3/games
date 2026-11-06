/*
 * Word Puzzle — service worker.
 *
 * One thing worth knowing
 * -----------------------
 *   The browser re-installs a worker only when this file's own bytes change. A release
 *   that bumps only manifest.json leaves this file identical, so `activate` would not
 *   fire again and the old cache would be served forever. The version is therefore
 *   re-read from the manifest on every worker startup, and `retireStaleCaches()` runs
 *   on the first navigation as well as in activate, so a bump always retires the
 *   previous `word-puzzle-v*` cache.
 *
 * Versioning
 * ----------
 *   There is no `?v=` query string on style.css, game.js or words.js any more. Those
 *   were the previous cache-busting mechanism and they were a standing bug: literals
 *   that had to be bumped by hand, where forgetting one file means a returning visitor
 *   silently keeps the stale copy. Two of them had in fact drifted apart already, so a
 *   precached dictionary never matched a single real request.
 *
 *   The cache name below is the version, read from the app's single manifest at install
 *   time. Bumping the app version retires this cache automatically on activate, so there
 *   is no per-game version to keep in step and nothing to drift.
 *
 *   Note this worker's `fetch()` is not governed by the CSP of the page that registered
 *   it. A service worker script is fetched and executed outside the document's CSP, so
 *   `connect-src 'none'` on index.html does not block the manifest read below. The
 *   design relies on that.
 */

/*
 * The one manifest, at the app root. `../../` climbs out of this worker's scope,
 * which is /games/word-puzzle/, to reach it.
 */
const MANIFEST_URL = new URL('../../manifest.json', self.location);

/*
 * Every cache this worker may delete must start with this prefix.
 *
 * Word Puzzle is served from one origin alongside the Seclusa Games launcher, which
 * registers its own worker at the root scope and keeps its own cache. Two workers at
 * different scopes on one origin is legal; deleting the *other* worker's cache is not.
 * The original version of this file filtered on `k !== CACHE_NAME`, which deleted
 * `seclusa-games-v*` and `blockfall-v*` as well — measurably, opening this game emptied
 * the launcher's offline cache from 24 entries to 0. Scope the sweep to our own prefix.
 */
const CACHE_PREFIX = 'word-puzzle-';

/* Used only when there is genuinely nothing to adopt — a first-ever install with no
 * network. Still prefixed, so a later successful install retires it. */
const FALLBACK_CACHE_NAME = 'word-puzzle-cache';

let cacheNamePromise = null;

/* How long the manifest read may take before it is treated as unavailable. */
const MANIFEST_TIMEOUT_MS = 5000;

function versionedName(version) {
    return CACHE_PREFIX + 'v' + version;
}

/*
 * Recovers the version from a manifest.json already in one of our own caches, so the
 * cache can still be named while offline.
 */
function versionFromOwnCache() {
    return caches.keys().then((keys) => {
        const ours = keys.filter((key) => key.startsWith(CACHE_PREFIX));
        return Promise.all(ours.map((key) =>
            caches.open(key)
                .then((cache) => cache.match(MANIFEST_URL.pathname))
                .then((hit) => {
                    if (!hit) return null;
                    return hit.json()
                        .then((m) => (m && typeof m.version === 'string' && m.version) ? m.version : null)
                        .catch(() => null);
                })
                .catch(() => null)
        )).then((found) => found.filter(Boolean)[0] || null);
    });
}

/** Adopts whichever of our caches already exists, so a name is never invented. */
function discoverExistingCache() {
    return caches.keys().then((keys) => {
        const ours = keys.filter((key) => key.startsWith(CACHE_PREFIX));
        const versioned = ours.filter((key) => /^word-puzzle-v/.test(key));
        const pool = versioned.length ? versioned : ours;
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
 * name invented while offline would delete the player's real cache — which is exactly
 * what happened on the app worker before this was handled.
 */
function resolveCacheName() {
    return fetchManifest()
        .then((response) => {
            if (!response.ok) throw new Error('manifest ' + response.status);
            return response.json();
        })
        .then((manifest) => {
            if (!manifest || typeof manifest.version !== 'string' || !manifest.version) {
                throw new Error('manifest has no version');
            }
            return { name: versionedName(manifest.version), fromManifest: true };
        })
        .catch(() =>
            versionFromOwnCache()
                .then((version) => version
                    ? { name: versionedName(version), fromManifest: false }
                    : discoverExistingCache().then((name) => ({ name, fromManifest: false }))
                )
        );
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
    const inFlight = cacheNamePromise;
    return inFlight.then(() => (cacheNamePromise = resolveCacheName()));
}

/** Opens the current cache. Nothing reads a cache name at module scope. */
function withCache() {
    return currentCacheName().then((resolved) => caches.open(resolved.name));
}

/* Plain paths, no query strings — the cache keys these requests produce have no query
   string either, so a version suffix here would never match anything. */
const ASSETS = [
    './',
    './index.html',
    './offline.html',
    './style.css',
    './words.js',
    './game.js',
    './manifest.json',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-192.png',
    './icons/icon-maskable-512.png'
];

/*
 * The launcher's shared design system, loaded by this document as ../../theme.css and
 * ../../theme-game.js. They live above this worker's scope and are owned by the launcher,
 * so they are not in ASSETS — but the game needs them to render at all, offline
 * included, so they are cached explicitly.
 *
 * The root manifest.json is here for a second reason: versionFromOwnCache() recovers the
 * app version from the root manifest in our own cache when the network is gone, so stale
 * caches can still be retired offline. That lookup could never succeed unless the root
 * manifest were actually cached here — it was not, so it always missed and took cache
 * retirement with it. Precaching it makes the comment true.
 */
const SHARED_ASSETS = ['../../theme.css', '../../theme-game.js', '../../manifest.json']
    .map((rel) => new URL(rel, self.location.href).pathname);

/**
 * True only for a real, same-origin, 2xx document.
 *
 * A proxy, captive portal or CDN in front of the origin answers with a 502/503/504
 * *response* rather than a network error, so `fetch()` resolves and a handler that only
 * checks `.catch()` hands that error page to the page as if it were the game. Measured
 * before this guard: the game iframe received a 39-byte error page instead of the game.
 */
function isRealDocument(response) {
    return !!response && response.status >= 200 && response.status < 300 &&
        (response.type === 'basic' || response.type === 'default');
}

/*
 * Cache key for a request: same origin, no query string, no hash.
 *
 * Without this, every distinct query on an allowed path is stored as its own entry, and
 * nothing reclaims them except a version bump. Blockfall's worker does the same.
 */
function toCacheKey(request) {
    const url = new URL(request.url);
    url.search = '';
    url.hash = '';
    return new Request(url.toString());
}

/** True for the shared launcher files, which must not be served from cache first. */
function isSharedAsset(pathname) {
    return SHARED_ASSETS.indexOf(pathname) !== -1;
}

/** This worker's own files, as './'-relative paths, or null for anything else. */
function assetRel(requestUrl) {
    try {
        const url = new URL(requestUrl);
        if (url.origin !== self.location.origin) return null;
        const base = new URL('./', self.location.href);
        const rel = url.pathname.slice(base.pathname.length);
        if (rel === '' || rel === '/') return './';
        return './' + rel;
    } catch {
        return null;
    }
}

/** Answers from this worker's own cache only, then from offline.html. */
function serveFromCache(request) {
    return withCache()
        .then((cache) => cache.match(request).then((cached) =>
            cached || cache.match('./offline.html')
        ))
        .catch(() => new Response('', { status: 503, statusText: 'Service Unavailable' }));
}

/*
 * Deletes any of our own caches that is not the one the manifest currently names.
 *
 * Run beyond `activate` on purpose: a manifest-only version bump leaves this file's
 * bytes identical, so the browser does not re-install the worker and activate never
 * fires again. Re-reading the manifest on each startup and retiring here is what makes
 * a version bump actually take effect.
 *
 * Scoped to CACHE_PREFIX, so the launcher's and blockfall's caches are untouched.
 */
function retireStaleCaches() {
    return forceRefreshCacheName()
        .then((resolved) => {
            // Only delete when the version was genuinely read. A name adopted while
            // offline is not evidence that anything else is stale.
            if (!resolved.fromManifest) return null;
            return caches.keys().then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k.startsWith(CACHE_PREFIX) && k !== resolved.name)
                        .map((k) => caches.delete(k))
                )
            );
        });
}

self.addEventListener('install', (e) => {
    e.waitUntil(
        withCache().then((c) =>
            // `cache: 'no-store'`, not `c.add()`: add() goes through the HTTP cache, which
            // can seal yesterday's words.js into this version. Additive, matching the
            // blockfall worker: the shared launcher files are cached here too, so a cold
            // offline load has the stylesheet and the version it needs.
            Promise.allSettled(ASSETS.concat(SHARED_ASSETS).map((url) =>
                fetch(url, { cache: 'no-store' })
                    .then((res) => (isRealDocument(res) ? c.put(url, res) : null))
                    .catch(() => null)
            ))
        ).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        retireStaleCaches().then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;
    let url;
    try { url = new URL(req.url); } catch { return; }
    if (url.origin !== self.location.origin) return;

    if (req.mode === 'navigate') {
        // Awaited before responding: this navigation is the thing that notices a new
        // version, so it must not then serve from the cache that version just retired.
        // A failed manifest read degrades to the cached name, so this costs at most one
        // manifest fetch and never blocks the page indefinitely.
        e.respondWith(
            retireStaleCaches()
                .catch(() => { /* best-effort; never block the page on it */ })
                .then(() => fetch(req))
                .then((res) => {
                    if (!isRealDocument(res)) return serveFromCache(req);
                    const clone = res.clone();
                    // waitUntil: respondWith settling can kill the worker before an
                    // unwaited put lands, so the page that just loaded is missing offline.
                    e.waitUntil(withCache().then((c) => c.put('./index.html', clone)).catch(() => {}));
                    return res;
                })
                .catch(() => serveFromCache(req))
        );
        return;
    }

    /*
     * This worker used to respond to EVERY same-origin GET with a cache-first lookup,
     * which meant it quietly absorbed — and permanently pinned — files it does not own,
     * including the launcher's shared stylesheet and theme script. Those are served
     * network-first below.
     */
    if (isSharedAsset(url.pathname)) {
        const key = toCacheKey(req);
        e.respondWith(
            fetch(req)
                .then((res) => {
                    if (res && res.ok) {
                        const clone = res.clone();
                        e.waitUntil(withCache().then((c) => c.put(key, clone)).catch(() => {}));
                        return res;
                    }
                    return withCache()
                        .then((cache) => cache.match(key))
                        .then((cached) => cached || res);
                })
                .catch(() =>
                    withCache()
                        .then((cache) => cache.match(key))
                        .then((cached) => cached || new Response('', { status: 503, statusText: 'Offline' }))
                )
        );
        return;
    }

    const rel = assetRel(req.url);
    const allowed = rel != null && ASSETS.indexOf(rel) !== -1;
    if (!allowed) return;

    const key = toCacheKey(req);
    e.respondWith(
        withCache().then((cache) => cache.match(key)).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((res) => {
                if (isRealDocument(res)) {
                    const clone = res.clone();
                    e.waitUntil(withCache().then((c) => c.put(key, clone)).catch(() => {}));
                }
                return res;
            }).catch(() =>
                withCache().then((cache) => cache.match('./offline.html')).then((o) =>
                    o || new Response('', { status: 503, statusText: 'Offline' })
                )
            );
        })
    );
});