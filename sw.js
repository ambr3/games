/*
 * Seclusa Games — app service worker.
 *
 * Strategy
 * --------
 *   Shell (index.html, css, js, manifest, icons): precached, network-first for
 *   navigations so a fresh deploy is picked up immediately, cache as the offline
 *   fallback.
 *
 *   Game bundles and assets: cache-first, filled on first use. This deliberately
 *   does NOT precache them. The full set is ~24 MB — Pac-Man alone ships 9.3 MB of
 *   audio and word-puzzle a 2 MB dictionary it only loads lazily. Precaching all
 *   of it would make the install enormous for content most people never open.
 *   Instead each game's entry document is precached, so every game at least opens
 *   offline and pulls the rest as it runs.
 *
 * Versioning
 * ----------
 *   There is no `?v=` query string on any stylesheet or script anywhere in this app.
 *   Those were the previous cache-busting mechanism and they were a standing bug: a
 *   literal that had to be bumped by hand in six files, where forgetting one file
 *   means a returning visitor silently keeps the stale copy.
 *
 *   The cache name below is the version. It is read from the one manifest at install
 *   time, so it cannot drift from the shipped version — there is nothing to keep in
 *   step. Bumping the version retires the old cache automatically on activate.
 *
 *   Note this worker's own `fetch()` is not governed by any page's CSP. A service
 *   worker script is fetched and executed outside the document CSP that applies to
 *   the page which registered it, so `connect-src 'none'` on index.html does not
 *   block the manifest read below. That is the behaviour the design relies on.
 */

var MANIFEST_URL = new URL("./manifest.json", self.location.href);

/*
 * Local development mode — see the fetch handler below for why this exists.
 * Keyed on hostname, so a plain-HTTP deployment to a real domain still gets the
 * production cache-first strategy.
 */
var IS_LOCAL =
    self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1" ||
    self.location.hostname === "[::1]";

/*
 * Cache name prefix. Every cache this worker creates carries it, and activate
 * deletes any cache with this prefix that is not the current one.
 */
var CACHE_PREFIX = "seclusa-games-";

/*
 * Fallback cache name, used only when there is genuinely nothing else to adopt — a
 * first-ever install with no network. It is prefixed, so a later successful install
 * retires it like any other stale cache.
 */
var FALLBACK_CACHE_NAME = "seclusa-games-cache";

/*
 * The cache name, resolved from the manifest.
 *
 * Every cache operation goes through `withCache()`, which awaits this promise and hands
 * the handler a ready cache. Nothing reads a cache name at module scope — that is what
 * makes the async resolution safe.
 *
 * It is a *refreshable* memo, not a one-shot. A service worker stays alive across
 * navigations for as long as it has clients, so a name resolved once at startup would
 * be the name it uses forever. Measured: after a manifest-only version change the app
 * worker kept serving `seclusa-games-v0.1.3-test` while both game workers had already
 * moved on — the version had changed on disk and the app had not noticed.
 *
 * `fromManifest` records whether the version was actually read this time. It gates
 * cache retirement: see the warning on resolveCacheName.
 */
var cacheNamePromise = null;

function versionedName(version) {
    return CACHE_PREFIX + "v" + version;
}

/**
 * Recovers the version from a manifest.json already in one of our own caches.
 *
 * manifest.json is precached, so this succeeds offline. Without it, a user who goes
 * offline would be unable to name their own cache — see resolveCacheName.
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
                        return manifest && typeof manifest.version === "string" && manifest.version
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

/*
 * Reads the manifest, with a deadline.
 *
 * Every navigation waits on this read before it is answered. A connection that neither
 * answers nor refuses would otherwise hold the page until the browser's own, much longer,
 * timeout. Timing out degrades to the adopted-cache path, the safe direction.
 */
var MANIFEST_TIMEOUT_MS = 5000;

function fetchManifest() {
    var options = { cache: "no-store" };
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        options.signal = AbortSignal.timeout(MANIFEST_TIMEOUT_MS);
    }
    return fetch(MANIFEST_URL, options);
}

/** Adopts whichever of our caches already exists, so a name is never invented. */
function discoverExistingCache() {
    return caches.keys().then(function (keys) {
        var ours = keys.filter(function (key) {
            return key.indexOf(CACHE_PREFIX) === 0;
        });
        var versioned = ours.filter(function (key) {
            return /^seclusa-games-v/.test(key);
        });
        var pool = versioned.length ? versioned : ours;
        return pool[pool.length - 1] || FALLBACK_CACHE_NAME;
    });
}

/**
 * Resolves the cache name.
 *
 * `fromManifest: false` means the manifest could not be read and the name is a
 * best-effort adoption of a cache that already exists.
 *
 * This distinction is load-bearing. Retiring caches means deleting every cache of ours
 * whose name is not the current one, so a name invented while offline would delete the
 * user's real cache. Measured before this was handled: going offline produced the
 * fallback name, and the very next navigation deleted `seclusa-games-v0.1.2` outright.
 * Retirement is therefore skipped unless the manifest was genuinely read.
 */
function resolveCacheName() {
    return fetchManifest()
        .then(function (response) {
            if (!response.ok) throw new Error("manifest " + response.status);
            return response.json();
        })
        .then(function (manifest) {
            if (!manifest || typeof manifest.version !== "string" || !manifest.version) {
                throw new Error("manifest has no version");
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

/**
 * Forces a fresh manifest read, replacing the memo.
 *
 * Called on navigation. A worker outlives the page, so without this the version it
 * resolved at startup is the version it keeps using no matter what changes on disk.
 */
function forceRefreshCacheName() {
    if (!cacheNamePromise) return currentCacheName();
    var inFlight = cacheNamePromise;
    return inFlight.then(function () {
        return (cacheNamePromise = resolveCacheName());
    });
}

/** Opens the current cache. */
function withCache() {
    return currentCacheName().then(function (resolved) {
        return caches.open(resolved.name);
    });
}

/*
 * Shell precache.
 *
 * These entries are the URLs the shell documents and every game frame request —
 * index.html's own subresources plus the two theme files each frame loads from the app
 * root — which after the removal of `?v=` means plain relative paths. No version suffix
 * to keep in step.
 *
 * "./theme.css", "./theme-game.js" and "./theme-boot.js" are here because the five game
 * frames load exactly those three paths from the app root, and no game may be blocked
 * on a launcher stylesheet or on the bootstrap that settles its palette.
 */
var SHELL = [
    "./",
    "./index.html",
    "./offline.html",
    "./manifest.json",
    "./theme.css",
    "./launcher.css",
    "./theme.js",
    /*
     * The shared palette and the monochrome mapping. Blockfall, Word Puzzle,
     * Munch and the launcher all load both, so a launcher that came up offline
     * without them would render with every Material role unresolved -- which is
     * the same failure NoCal had, for the same reason.
     */
    "./seclusa-base.css",
    "./mono.css",
    /*
     * The wordmark on the launcher screen. It is decoration, so nothing breaks without
     * it — but it is the first thing the app shows, and an offline launch that came up
     * with a gap where the branding should be looked broken.
     */
    "./brand/logo.png",
    /*
     * theme-game.js is loaded by every game frame, so a shell that omits it has no
     * offline theme bootstrap: the card games would boot colourless.
     */
    "./theme-game.js",
    /*
     * theme-boot.js is the same bootstrap one step earlier — synchronous, in <head>,
     * and it is what index.html and games/pacman/index.html both load to settle the
     * palette before the first paint. It was missing here while the list above was
     * described as "the exact URLs index.html requests", which it was not.
     *
     * Consequence of leaving it out: a cold install that went offline before Munch had
     * ever been opened could not fetch it, the script 504'd, and the frame painted with
     * the markup's default palette before correcting itself — the flash this file exists
     * to remove, in the one game whose palette is its identity.
     */
    "./theme-boot.js",
    "./shell.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-192.png",
    "./icons/icon-maskable-512.png",
    "./icons/icon.svg",
    /*
     * The five tile icons the launcher draws, taken from the same registry shell.js reads.
     * They are here for the same reason the wordmark is: a launcher that comes up offline
     * with three of its five tiles blank looks broken, and the launcher is the first thing
     * anyone sees without a network.
     *
     * Two of these were already reachable offline — a request under `games/blockfall/` is
     * served by that game's own worker, whose scope covers the file — which is exactly why
     * the omission went unnoticed. Klondike, Pyramid and Munch have no worker of their
     * own, so their three icons came from nowhere. Five small PNGs, about 30kB, for a
     * screen that is hard to use without them.
     *
     * These paths are asserted against shell.js's registry by the shell suite, because an
     * icon list that has drifted fails silently, in the one place nobody looks for a bug.
     */
    "./games/klondike/icon-192.png",
    "./games/pyramid/icon-192.png",
    "./games/blockfall/icon-192.png",
    "./games/pacman/icon/icon-192.png",
    "./games/word-puzzle/icons/icon-192.png",
    /*
     * The two DM Sans faces the launcher renders in, and the Sora display face
     * used for headings. Small (96kB for all six) and self-hosted, so precaching
     * them costs no third-party request.
     */
    "./assets/fonts/dm-sans-latin-400-normal.woff2",
    "./assets/fonts/dm-sans-latin-600-normal.woff2",
    "./assets/fonts/dm-sans-latin-700-normal.woff2",
    "./assets/fonts/sora-latin-600-normal.woff2",
    "./assets/fonts/sora-latin-700-normal.woff2",
    "./assets/fonts/sora-latin-800-normal.woff2"
];

/*
 * Game entry documents. Cached at install so the launcher works offline and a game
 * opens even before its bundle has been pulled. All five games — an entry document
 * that is missing here is a game that cannot open offline at all.
 */
var GAME_ENTRIES = [
    "./games/klondike/",
    "./games/pyramid/",
    "./games/blockfall/",
    "./games/pacman/",
    "./games/word-puzzle/"
];

/**
 * Adds the precache list one entry at a time.
 *
 * `cache.addAll` is all-or-nothing: a single failure leaves the cache empty while the
 * cache *name* still exists, which reads exactly like a healthy cache and defeats every
 * later lookup. Adding individually means one unreachable optional asset cannot break
 * the install.
 */
function addAllLenient(cache, urls) {
    return Promise.all(
        urls.map(function (url) {
            /*
             * `cache.add` follows the browser HTTP cache. After a big game rewrite the
             * disk cache can still hold yesterday's index.html, and a lenient install
             * would seal that stale document into the SW cache forever (ensureShell only
             * refills *missing* entries). Bypass HTTP cache so install stores what the
             * origin actually serves.
             */
            return fetch(url, { cache: "no-store" })
                .then(function (response) {
                    if (!response || !response.ok) return null;
                    return cache.put(url, response);
                })
                .catch(function () {
                    /* optional — carry on */
                });
        })
    );
}

/** Repopulates the precache. Safe to call repeatedly. */
var restoreShell = function () {
    return withCache().then(function (cache) {
        return addAllLenient(cache, SHELL.concat(GAME_ENTRIES));
    });
};

/*
 * Deletes any of our own caches that is not the one the manifest currently names.
 *
 * Runs on every navigation, not just in `activate`. The browser re-installs a worker
 * only when sw.js's own bytes change, and a release that bumps only the version in
 * manifest.json changes sw.js not at all — so the worker is not re-installed, activate
 * does not fire again, and the version bump would leave the old cache being served
 * forever. Combined with `forceRefreshCacheName()`, this is what makes a version bump
 * take effect on a worker that is already installed and long-lived.
 *
 * Only caches carrying CACHE_PREFIX are touched. The games register their own workers
 * at their own scopes and keep their own caches.
 */
var retireStaleCaches = function () {
    return forceRefreshCacheName().then(function (resolved) {
        /*
         * Only ever delete when the version was genuinely read from the manifest.
         *
         * If the read failed the name is an adoption of a cache that already exists,
         * and deleting "anything that is not this name" would take the user's cache with
         * it. Verified: offline, the unguarded version of this deleted
         * `seclusa-games-v0.1.2` and left an empty `seclusa-games-cache` behind.
         */
        if (!resolved.fromManifest) return null;

        return caches.keys().then(function (keys) {
            return Promise.all(
                keys
                    .filter(function (key) {
                        return key !== resolved.name && key.indexOf(CACHE_PREFIX) === 0;
                    })
                    .map(function (key) {
                        return caches.delete(key);
                    })
            );
        });
    });
};

/**
 * Rebuilds the precache if any shell entry is missing.
 *
 * Checking completeness rather than waiting for a cache *miss* is deliberate. With the
 * network up, a navigation is never a miss — it is answered from the live origin — so a
 * precache emptied by another worker would otherwise only refill asset by asset as each
 * one happened to be requested. A user who then went offline would get a launcher with
 * no stylesheet.
 *
 * Callers do not await this; it is a background repair.
 */
var ensureShell = function () {
    return withCache()
        .then(function (cache) {
            return cache.keys().then(function (stored) {
                var have = {};
                stored.forEach(function (request) {
                    have[new URL(request.url).pathname + new URL(request.url).search] = true;
                });

                var missingShell = SHELL.some(function (url) {
                    // Relative entries resolve against this worker's script URL.
                    var absolute = new URL(url, self.location.href);
                    return !have[absolute.pathname + absolute.search];
                });

                /*
                 * Game entry documents are always re-fetched. They are tiny, and leaving
                 * a stale index.html in the shell cache (e.g. Blocks still pointing at
                 * app.js after a module split) is worse than one extra round-trip — the
                 * completeness check above would never refresh an entry that is merely
                 * outdated, only one that is missing.
                 */
                var refreshEntries = addAllLenient(cache, GAME_ENTRIES);
                return missingShell
                    ? addAllLenient(cache, SHELL).then(function () {
                        return refreshEntries;
                    })
                    : refreshEntries;
            });
        })
        .catch(function () {
            /* repair is best-effort */
        });
};

self.addEventListener("install", function (event) {
    event.waitUntil(
        withCache()
            .then(function (cache) {
                return addAllLenient(cache, SHELL.concat(GAME_ENTRIES));
            })
            // Take over straight away rather than waiting for every old tab to close.
            .then(function () {
                return self.skipWaiting();
            })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        retireStaleCaches()
            .then(function () {
                return ensureShell();
            })
            .then(function () {
                return self.clients.claim();
            })
    );
});

self.addEventListener("message", function (event) {
    if (event.data === "skip-waiting") {
        self.skipWaiting();
        return;
    }

    /*
     * Sent by the launcher's "Clear all data" before it unregisters this worker.
     * Dropping our cache here matters: unregistering alone leaves the cache on disk,
     * and a still-running worker could repopulate it on the next navigation.
     */
    if (event.data && event.data.type === "clear-cache") {
        event.waitUntil(caches.keys().then(function (keys) {
            // Every cache of ours, not just the current one: "clear all data" means all.
            return Promise.all(
                keys
                    .filter(function (key) {
                        return key.indexOf(CACHE_PREFIX) === 0;
                    })
                    .map(function (key) {
                        return caches.delete(key);
                    })
            );
        }));
    }
});

self.addEventListener("fetch", function (event) {
    var request = event.request;

    if (request.method !== "GET") return;

    var url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    /*
     * Whether this URL may be written to the cache at all.
     *
     * Entries are keyed on the whole Request, query included, and the only eviction is a
     * cache-*name* change on a version bump -- so every distinct query is a distinct
     * entry that nothing ever reclaims, and the origin answers 200 for all of them.
     * Enough links with junk queries is unbounded permanent storage on a visitor's
     * device, caused entirely by someone else. Only the two shapes this app actually
     * emits are kept: no query, and the `?v=` stamp the launcher appends. Everything
     * else is served from the network and never written down.
     */
    function keepable() {
        return url.search === "" || /^v=[0-9][\d.]*$/.test(url.search);
    }
    var keep = keepable();

    // Navigations: network first, so a deploy is never shadowed by a stale shell.
    if (request.mode === "navigate") {
        /*
         * The maintenance chain: notice a version change, retire the cache it retires,
         * then top the current one back up. Awaited before the response is served, so
         * the very navigation that observes a new version is already reading from the
         * new cache rather than serving one stale byte out of the old one.
         *
         * `forceRefreshCacheName` is the important part. The browser re-installs a worker
         * only when sw.js's own bytes change, and a manifest-only bump changes none —
         * so a long-lived worker would otherwise keep the version it resolved at startup
         * and the bump would silently do nothing. Measured before this was added: after
         * a manifest-only change the app worker kept serving the previous version's
         * cache while both game workers had already moved on.
         *
         * A failed manifest read degrades to the cached name, so this never blocks the
         * navigation for longer than one manifest fetch.
         */
        var maintain = retireStaleCaches().then(function () {
            return ensureShell();
        });

        event.respondWith(
            maintain
                .catch(function () {
                    /* maintenance is best-effort; never block the page on it */
                })
                .then(function () {
                    /* no-store: do not resurrect a stale index from the HTTP disk cache */
                    return fetch(request, { cache: "no-store" });
                })
                .then(function (response) {
                    /*
                     * Only a real document is kept. A proxy, captive portal or CDN in
                     * front of the origin answers with a 502/503/504 *response* rather
                     * than a network error, so `fetch` resolves and a naive handler both
                     * serves the error page to the user and writes it into the cache —
                     * which would leave the offline shell permanently broken. Anything
                     * that is not a same-origin 2xx document is treated as a miss.
                     */
                    if (!isRealDocument(response)) {
                        return serveFromCache(request);
                    }

                    var copy = response.clone();
                    // waitUntil: once respondWith settles the worker may be terminated,
                    // so an unwaited put can simply be lost -- and a page that loaded
                    // fine online is then absent from the offline copy.
                    event.waitUntil(withCache().then(function (cache) {
                        return cache.put(request, copy);
                    }).catch(function () {}));
                    return response;
                })
                .catch(function () {
                    return serveFromCache(request);
                })
        );
        return;
    }

    /*
     * Klondike, Pyramid and Munch have no game-scoped worker of their own. Their JS/CSS
     * therefore live in this cache. Cache-first left a deploy invisible until the
     * manifest version bumped — edit the rules, reload, still play the old build.
     * Those paths go network-first (cache as offline fallback). Images and audio stay
     * cache-first: they are large and change rarely.
     */
    var path = url.pathname;
    /*
     * Blocks and Word Puzzle have their own workers, but when the shell frame loads
     * them the root worker is often still the only one registered (first open after
     * a rewrite, or before the game SW claims). Their HTML/JS must not stick to a
     * precached entry document the way Klondike used to.
     */
    var shellManagedCode =
        /\.(js|css)$/.test(path) &&
        /\/games\/(klondike|pyramid|pacman|cards|blockfall|word-puzzle)\//.test(path);
    var networkFirst = IS_LOCAL || shellManagedCode;

    // Everything else: cache first, filling as we go. Also scoped to our own cache.
    event.respondWith(
        withCache()
            .then(function (cache) {
                return cache.match(request);
            })
            .then(function (cached) {
                /*
                 * Local development is always network-first (see IS_LOCAL). Production
                 * uses network-first only for shell-managed game code above; everything
                 * else stays cache-first so offline and cold start stay fast.
                 */
                if (cached && !networkFirst) return cached;

                return fetch(request)
                    .then(function (response) {
                        // Opaque and error responses are not worth storing.
                        if (keep && response && response.status === 200 && response.type === "basic") {
                            var copy = response.clone();
                            event.waitUntil(withCache().then(function (cache) {
                                return cache.put(request, copy);
                            }).catch(function () {}));
                        }
                        return response;
                    })
                    .catch(function () {
                        if (cached) return cached;
                        return new Response("", { status: 504, statusText: "Offline" });
                    });
            })
    );
});

/**
 * True only for a same-origin 2xx document.
 *
 * Deliberately strict. `response.ok` alone would still accept a 404 or a soft-error
 * HTML page from a CDN, and neither belongs in a cache that is the app's only offline
 * copy of itself.
 */
function isRealDocument(response) {
    return !!response && response.status >= 200 && response.status < 300 &&
        (response.type === "basic" || response.type === "default");
}

/**
 * Answers a navigation from our own cache, then from offline.html.
 *
 * Scoped to the current cache on purpose. A bare `caches.match()` searches every cache
 * on the origin, so a navigation could be answered with an entry another game's worker
 * stored under the same URL.
 */
function serveFromCache(request) {
    return withCache()
        .then(function (cache) {
            return cache.match(request).then(function (cached) {
                if (cached) return cached;
                /*
                 * Retry without the query string.
                 *
                 * The launcher loads each game as `games/<id>/?v=<version>` so a bump is
                 * visible immediately, and that is also what the navigate handler writes
                 * back under. But GAME_ENTRIES is precached at the query-less URL, so on
                 * the very first offline launch -- before any navigation has been
                 * recorded under the `?v=` key -- the exact match misses and the player
                 * is dropped to the offline page for a game that is sitting in the cache
                 * in plain sight. Every URL this cache holds is same-origin and version-
                 * stamped, so matching on path alone cannot cross into another app.
                 */
                return cache.match(request, { ignoreSearch: true }).then(function (unqueried) {
                    return unqueried || cache.match("./offline.html");
                });
            });
        })
        /*
         * A function, not the result of calling one: passing a Promise to .catch() is
         * silently ignored and the rejection goes unhandled.
         */
        .catch(function () {
            return restoreShellThenRetry(request);
        });
}

/** Last resort for a shell asset wiped by another worker's cache cleanup. */
function restoreShellThenRetry(request) {
    return restoreShell().then(function () {
        return withCache().then(function (cache) {
            return cache.match(request);
        });
    });
}