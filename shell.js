/*
 * Seclusa Games — launcher.
 *
 * Builds the game grid and swaps between the launcher and a game view.
 *
 * WHY EVERY GAME RUNS IN AN IFRAME
 *
 * The games are independent projects that each assume they own the whole document.
 * Merging them onto one page would mean editing all of them:
 *
 *   - munch binds `window` keydown to steer, with no target check, so it swallows the
 *     launcher's keystrokes for as long as a game is open;
 *   - blockfall's document-level keydown handler calls preventDefault() on
 *     Arrows and Space unconditionally, which would break a launcher menu;
 *   - word-puzzle's stylesheet sets `html, body { height: 100dvh; overflow: hidden }`
 *     — which breaks the moment a launcher header exists;
 *   - blockfall and word-puzzle both toggle unprefixed classes on <body>.
 *
 * A frame gives all of that isolation for free, and means no game code has to
 * change to be hosted here.
 *
 * `allow-same-origin` is deliberate. Without it the frame gets an opaque origin and
 * cannot read localStorage, which would break the shared `ssc.` theme settings and
 * every game's own saved progress. These are same-origin first-party games already
 * loaded from our own origin, so this does not widen the trust boundary.
 */

(function () {
    "use strict";

    /*
     * The registry. Every game gets a tile whether or not it is finished — the
     * launcher is the thing we are building right now, so a half-built game still
     * belongs on the menu. Add `pending: true` only to make a tile dimmed and
     * non-clickable.
     *
     * `icon` paths are relative to this file.
 *
 * The `path`s are directories, not `index.html` files, and that is deliberate. Several
 * hosts rewrite a request for `games/pyramid/index.html` into a 301 to `games/pyramid/` —
 * Cloudflare does it, and so does `serve`. In a normal tab that is invisible. Inside an
 * iframe, Brave and Chrome will often drop the redirect and leave a blank chrome-error
 * page: the game files are on the site and never arrive. The tablet tolerated the same
 * redirect, which is why it looked like a browser difference rather than a path one.
 * Asking for the directory skips the redirect entirely, so there is nothing to drop.
     */
    var GAMES = [
        {
            id: "klondike",
            name: "Klondike",
            tagline: "The classic. Seven columns, four foundations.",
            path: "games/klondike/",
            icon: "games/klondike/icon-192.png"
        },
        {
            id: "pyramid",
            name: "Pyramid",
            tagline: "Pair them off and clear the deck.",
            path: "games/pyramid/",
            icon: "games/pyramid/icon-192.png"
        },
        {
            id: "blockfall",
            name: "Blocks",
            tagline: "A falling-block puzzle.",
            path: "games/blockfall/",
            icon: "games/blockfall/icon-192.png"
        },
        {
            id: "pacman",
            name: "Munch",
            tagline: "Eat the maze. Keep clear of the four.",
            path: "games/pacman/",
            icon: "games/pacman/icon/icon-192.png"
        },
        {
            id: "word-puzzle",
            name: "Word Puzzle",
            tagline: "Find the words. Six letters, endless grids.",
            path: "games/word-puzzle/",
            icon: "games/word-puzzle/icons/icon-192.png"
        }
    ];

    var launcherEl = document.getElementById("launcher");
    var gridEl = document.getElementById("game-grid");
    var stageEl = document.getElementById("stage");
    var stageFrameEl = document.getElementById("stage-frame");
    var stageTitleEl = document.getElementById("stage-title");
    var backButton = document.getElementById("btn-back");

    var currentGame = null;
    var currentFrame = null;

    // ------------------------------------------------------------------ routing

    var gameById = function (id) {
        for (var i = 0; i < GAMES.length; i++) {
            if (GAMES[i].id === id) return GAMES[i];
        }
        return null;
    };

    /*
     * Routes on location.hash so the hardware/browser Back button steps out of a game
     * instead of leaving the app. "#/" is the launcher.
     */
    var route = function () {
        var id = (window.location.hash || "").replace(/^#\/?/, "").trim();

        /* Registry ids are short; a crafted huge hash must not walk the list as work. */
        if (!id || id.length > 64 || !gameById(id)) {
            showLauncher();
            return;
        }

        var game = gameById(id);
        if (game.pending) {
            showLauncher();
            return;
        }

        showGame(game);
    };

    // ------------------------------------------------------------------- views

    var showLauncher = function () {
        teardownFrame();

        stageEl.hidden = true;
        launcherEl.hidden = false;
        currentGame = null;
        document.title = "Seclusa Games";
    };

    /*
     * Drops the frame entirely rather than hiding it. Removing the element destroys
     * the iframe's JavaScript context, so the game's animation loop and timers stop.
     * A hidden frame would keep both running in the background.
     */
    var teardownFrame = function () {
        if (!currentFrame) return;
        // Cancel the frame's load check on the way out. An unmounted frame stops receiving
        // its `load` event, so its timeout would otherwise arrive later with nothing to do
        // and report the failure against whatever is on stage by then.
        if (typeof currentFrame.seclusaStopWatching === "function") {
            currentFrame.seclusaStopWatching();
        }
        if (currentFrame.parentNode) currentFrame.parentNode.removeChild(currentFrame);
        currentFrame = null;
    };

    var showGame = function (game) {
        teardownFrame();

        currentGame = game;
        launcherEl.hidden = true;
        stageEl.hidden = false;
        /*
         * The bar and the tab both say the full name.
         *
         * Every game is a Seclusa game, and the bar is the only place the player is told
         * which one they are in -- the games themselves no longer carry a name, since it
         * would be a second copy of this one that could go stale. The launcher tiles
         * below stay short, because they sit directly under the "Seclusa Games" heading
         * and repeating it on every tile is noise rather than information.
         *
         * The prefix is added here rather than baked into GAMES[].name so there is one
         * place that decides, and `Munch` does not end up as "Seclusa Seclusa Munch".
         */
        var fullName = "Seclusa " + game.name;
        stageTitleEl.textContent = fullName.toUpperCase();
        document.title = fullName;

        var frame = document.createElement("iframe");
        /*
         * Bust the HTTP + SW entry-document cache when the app version moves.
         * Without this, a rewrite under games/<id>/ can leave the frame on yesterday's
         * index.html until a full version bump retires the shell cache — measured on
         * Blocks after the Tetris-only split, where the frame kept loading app.js.
         */
        var appVersion = "";
        try {
            var versionMeta = document.querySelector('meta[name="version"]');
            appVersion = versionMeta ? versionMeta.getAttribute("content") || "" : "";
        } catch (err) {
            appVersion = "";
        }
        frame.src = appVersion
            ? game.path + (game.path.indexOf("?") >= 0 ? "&" : "?") + "v=" + encodeURIComponent(appVersion)
            : game.path;
        frame.title = game.name;
        /*
         * Sandbox flags gate capabilities that are *off* by default in a frame.
         *
         *   allow-scripts      — obviously
         *   allow-same-origin  — without it the frame gets an opaque origin and
         *                        cannot read localStorage, which would break both the
         *                        shared `ssc.` theme prefs and every game's saved
         *                        progress
         *   allow-pointer-lock — Klondike uses it
         *   allow-popups       — the card games' about dialogs open external links
         *
         * Fullscreen and autoplay are NOT sandbox flags — the browser rejects them
         * as invalid and logs a console error. They are Permissions Policy
         * features, requested on the `allow` attribute below.
         */
        frame.setAttribute(
            "sandbox",
            "allow-scripts allow-same-origin allow-pointer-lock allow-popups"
        );
        frame.setAttribute("allow", "fullscreen; autoplay; gamepad; clipboard-write");

        /*
         * Catch a game that never arrives.
         *
         * `error` on an <iframe> element fires for a handful of cases but NOT for an
         * HTTP or network failure loading the frame's document — so a missing or
         * unreachable game path left a blank rectangle instead of the message below,
         * and the failure UI was unreachable in exactly the case it existed for.
         *
         * The check is keyed on the `load` event, which fires for successful navigations
         * only, and a null `contentDocument` is a failure *after* that event and never
         * before it. It used to be read the other way round, on a timer running from the
         * moment the element was created — and a null document inside that window is not
         * a failure at all, it is a navigation that has not committed yet. Measured
         * consequence: the first game opened loaded, and every game opened after it
         * reported "failed to load", because the launcher had already warmed the cache and
         * the connection for the first one and nothing since could beat a 150ms budget. The
         * timeout is the real failure condition; the null check only means anything once
         * the load event says the navigation is over.
         */
        var settled = false;
        var loaded = false;
        var poll = null;

        /*
         * Stop watching. Called both when this frame settles and when it is torn down,
         * because a frame that has been unmounted can still reach its timeout: leaving a
         * game removes the element before its `load` event has fired, the event never
         * arrives, and the poll carries on counting to six seconds against a frame
         * nobody is looking at any more.
         */
        var stopWatching = function () {
            settled = true;
            if (poll) clearInterval(poll);
            poll = null;
        };

        var fail = function () {
            if (settled) return;
            /*
             * Only the frame on stage may report a failure.
             *
             * Without this, the timer belonging to a game the player has already left
             * fires later and paints "failed to load" over whatever replaced it: open a
             * game, go back inside a few seconds, open another, and the first game's
             * six-second verdict arrives on top of the second — which then looks broken
             * while playing perfectly well underneath. The guard is the fix; the
             * teardown hook below is the belt to its braces, for any path that unmounts
             * a frame without going through teardownFrame().
             */
            if (currentFrame !== frame || !frame.isConnected) {
                stopWatching();
                return;
            }
            stopWatching();
            showLoadFailure(game);
        };

        var check = function () {
            if (settled || !loaded) return;
            if (!frame.contentDocument) {
                fail();
                return;
            }
            if (frame.contentDocument.readyState === "complete") {
                stopWatching();
            }
        };

        frame.addEventListener("error", fail);
        frame.addEventListener("load", function () {
            loaded = true;
            check();
        });

        // Six seconds, then call it. A game on a cold cache over a slow connection is slow
        // rather than broken, and telling someone their game is missing is worse than
        // waiting a few seconds longer.
        var attempts = 0;
        poll = setInterval(function () {
            check();
            if (++attempts > 40) fail();
        }, 150);

        // The teardown hook. Kept on the element rather than in a module-level variable so
        // that two frames can never share one timer, and so removing the frame from the
        // document is enough to stop it — no caller has to remember.
        frame.seclusaStopWatching = stopWatching;

        currentFrame = frame;
        stageFrameEl.appendChild(frame);
    };

    var showLoadFailure = function (game) {
        teardownFrame();
        stageFrameEl.innerHTML = "";

        var message = document.createElement("div");
        message.className = "load-failure";

        var heading = document.createElement("p");
        heading.className = "load-failure-heading";
        heading.textContent = game.name + " failed to load.";

        var detail = document.createElement("p");
        detail.className = "load-failure-detail";
        detail.textContent = "Expected " + game.path;

        var back = document.createElement("p");
        var link = document.createElement("a");
        link.href = "#/";
        link.textContent = "Back to games";
        back.appendChild(link);

        message.appendChild(heading);
        message.appendChild(detail);
        message.appendChild(back);
        stageFrameEl.appendChild(message);
    };

    // -------------------------------------------------------------------- grid

    var buildGrid = function () {
        gridEl.innerHTML = "";

        GAMES.forEach(function (game) {
            var tile = document.createElement(game.pending ? "div" : "button");
            tile.className = game.pending ? "game-tile is-pending" : "game-tile";
            /*
             * The grid is role="list", so its children are meant to be listitems — but
             * an explicit role on a <button> OVERRIDES the native button role, and each
             * tile was announcing as "list item" with no indication it could be
             * activated. The list semantics are decorative here (the tiles are a grid of
             * independent controls, not a sequence to be counted through), so the
             * button keeps the role the browser gives it for free.
             */
            if (game.pending) tile.setAttribute("role", "listitem");

            var icon = document.createElement("img");
            icon.className = "game-tile-icon";
            icon.alt = "";
            icon.loading = "lazy";
            icon.decoding = "async";
            if (game.icon) {
                icon.src = game.icon;
                // A missing icon should leave the tile readable, not broken.
                icon.addEventListener("error", function () {
                    icon.classList.add("is-missing");
                });
            }

            var name = document.createElement("div");
            name.className = "game-tile-name";
            name.textContent = game.name;

            var tag = document.createElement("div");
            tag.className = "game-tile-tag";
            tag.textContent = game.tagline;

            tile.appendChild(icon);
            tile.appendChild(name);
            tile.appendChild(tag);

            if (game.pending) {
                tile.setAttribute("aria-disabled", "true");
                tile.title = "Not built yet";
            } else {
                tile.type = "button";
                tile.addEventListener("click", function () {
                    window.location.hash = "#/" + game.id;
                });
            }

            gridEl.appendChild(tile);
        });
    };

    /*
     * Service worker.
     *
     * sw.js ships a complete install / activate / fetch strategy and an offline
     * fallback, but nothing ever registered it, so none of it ran. This is the only
     * registration in the app shell.
     *
     *   - Guarded on `navigator.serviceWorker`, which is simply absent on an insecure
     *     origin, so serving this over plain http on a LAN IP degrades to "no offline
     *     support" rather than throwing.
     *   - Scope './' — the root worker has to cover the whole origin, because the
     *     launcher itself lives at the root. The games register their own workers at
     *     narrower scopes, and a fetch is handled by the *most specific* matching
     *     registration, so anything under a game directory is still served by that
     *     game's worker and this one only handles the shell.
     *   - No `updatefound` reload loop: sw.js calls skipWaiting() on install and
     *     clients.claim() on activate, which is enough for an app this size and avoids
     *     the reload-forever pattern.
     */
    var registerServiceWorker = function () {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker.register("sw.js", { scope: "./" })
            .then(function (registration) {
                /*
                 * Ask for a re-install check on every launch.
                 *
                 * This matters because the worker's cache name is read from
                 * manifest.json, not from its own source. The browser decides whether
                 * to reinstall a worker by comparing the *script bytes*, so a release
                 * that bumps only the version in manifest.json changes sw.js not at
                 * all — and without this call the worker never re-installs, never
                 * re-reads the manifest, and keeps serving the previous version's
                 * cache forever. The version bump would silently do nothing.
                 *
                 * update() is cheap and safe to call every launch: it re-fetches sw.js,
                 * and the byte comparison decides whether anything happens.
                 */
                if (registration && registration.update) {
                    registration.update().catch(function () {
                        /* best-effort; the current worker keeps working */
                    });
                }
            })
            .catch(function () {
                // Registration can fail on a plain-http LAN origin. Offline support is a
                // bonus there, not a requirement, so this is not worth surfacing.
            });
    };

    // -------------------------------------------------------------------- boot

    var boot = function () {
        buildGrid();

        if ("serviceWorker" in navigator && document.readyState === "complete") {
            registerServiceWorker();
        } else {
            window.addEventListener("load", registerServiceWorker, { once: true });
        }

        // theme.js reads this list to build the About dialog's game table.
        window.SeclusaShell = window.SeclusaShell || {};
        window.SeclusaShell.games = GAMES;

        if (backButton) {
            backButton.addEventListener("click", function () {
                window.location.hash = "#/";
            });
        }

        window.addEventListener("hashchange", route);

        /*
         * A game's in-game "Menu" button asks the launcher to take it home. The frame
         * cannot navigate the opener itself — cross-frame navigation is blocked — so it
         * posts this instead. See boot.js `exitToLauncher()`.
         *
         * Checked against `event.origin` rather than trusted blindly.
         */
        window.addEventListener("message", function (event) {
            if (event.origin !== window.location.origin) return;
            if (!event.data || event.data.type !== "seclusa:exit-to-launcher") return;
            window.location.hash = "#/";
        });

        /*
         * Leaving the page should not leave a game's audio running. Each game owns
         * its own visibility handling; this is only about the launcher teardown.
         */
        window.addEventListener("pagehide", teardownFrame);

        if (!window.location.hash) {
            window.location.replace(
                window.location.pathname + window.location.search + "#/"
            );
        }

        route();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();