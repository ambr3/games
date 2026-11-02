/*
 * Seclusa Games — application shell theme.
 *
 * Owns everything that lives outside a game: the appearance dialog, the about
 * dialog, fullscreen, and the palette/night-mode state on <html>.
 *
 * The theme itself is CSS (theme.css). This file only writes the `data-palette` /
 * `data-theme` attributes and persists the choice.
 *
 * Settings live in the `ssc.` localStorage namespace, using the Android preference
 * key names from the Solitaire app. That namespace was chosen deliberately:
 * games/pacman/theme.js already reads and writes the same keys, so a palette picked
 * here is the palette a game sees. The launcher and the games share one origin, and
 * the frames are same-origin, so there is exactly one copy of these values.
 *
 * This is the app-level shell. games/pacman/theme.js is a separate, game-local file
 * and has been left alone — see README "Known differences".
 */

(function () {
    "use strict";

    var PREF_PREFIX = "ssc.";
    var KEY_THEME_COLOR = PREF_PREFIX + "pref_key_theme_color";
    var KEY_NIGHT_MODE = PREF_PREFIX + "pref_key_night_mode";
    var KEY_SOUND_ENABLED = PREF_PREFIX + "pref_key_sound_enabled";

    /*
     * Where this app's source lives. One constant, because the URL appears in the footer's
     * pill and twice in the About dialog, and three copies of a URL is three chances to
     * publish one and forget the other two. index.html carries its own copy, which cannot be
     * shared from here: that link is in the served document rather than in this script, and
     * it has to be a real anchor for the footer to work with JavaScript disabled.
     */
    var SOURCE_URL = "https://ambr3.pages.dev/oss/seclusa-games/";

    /* Must match DEFAULT_THEME_COLOR in theme-game.js, games/pacman/theme.js and the
       card engine's Preferences.js — all four read the same key. */
    var DEFAULT_THEME_COLOR = "navy";
    var DEFAULT_NIGHT_MODE = "system";
    var PALETTES = [
        "orange", "green", "blue", "purple",
        "rose", "teal", "amber", "slate",
        "navy", "indigo", "lime", "crimson"
    ];
    var NIGHT_MODES = ["system", "light", "dark"];

    var root = document.documentElement;
    var dialogRoot = null;
    var openDialog = null;

    // ------------------------------------------------------------- preferences

    var readPref = function (key, fallback) {
        try {
            var value = window.localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (err) {
            return fallback;
        }
    };

    var writePref = function (key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (err) {
            /* storage unavailable (private browsing) — the choice just does not persist */
        }
    };

    // ------------------------------------------------------------------- theme

    var prefersDark = function () {
        return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    };

    var resolveIsDark = function (nightMode) {
        if (nightMode === "dark") return true;
        if (nightMode === "light") return false;
        return prefersDark();
    };

    var applyTheme = function (palette, nightMode) {
        if (PALETTES.indexOf(palette) < 0) palette = DEFAULT_THEME_COLOR;
        if (NIGHT_MODES.indexOf(nightMode) < 0) nightMode = DEFAULT_NIGHT_MODE;

        var dark = resolveIsDark(nightMode);
        root.setAttribute("data-palette", palette);
        root.setAttribute("data-theme", dark ? "dark" : "light");

        /*
         * Browser chrome colour, read from the active palette.
         *
         * This used to write green's dark anchor unconditionally — "#0b3b1e" / "#14532d"
         * — with a comment saying it matched the palette. It did not: it matched green,
         * whatever palette was actually selected, and it overwrote the navy value the
         * manifest and index.html ship. So the address-bar colour jumped on every boot
         * and was wrong for eleven of the twelve palettes.
         *
         * Reading --theme-game-select-background off the root means the browser chrome
         * now follows whatever palette is in force, with no literal to keep in step.
         */
        var themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            var anchor = window.getComputedStyle(root)
                .getPropertyValue("--theme-game-select-background").trim();
            themeColorMeta.setAttribute("content", anchor || "#0d2340");
        }
    };

    var currentPalette = function () {
        return readPref(KEY_THEME_COLOR, DEFAULT_THEME_COLOR);
    };

    var currentNightMode = function () {
        return readPref(KEY_NIGHT_MODE, DEFAULT_NIGHT_MODE);
    };

    /**
     * Switches between light and dark and remembers it.
     *
     * The Appearance dialog used to own this and went when the colour swatches
     * did. The preference itself is unchanged -- same key, same values, so an
     * existing choice survives -- and this is now the only thing that writes it.
     *
     * "system" is left reachable on purpose: the button toggles between the two
     * explicit modes, and holding the system setting means a visitor whose OS
     * flips at dusk still gets the app to follow it rather than being pinned to
     * whatever they last tapped.
     */
    var setNightMode = function (mode) {
        if (NIGHT_MODES.indexOf(mode) < 0) mode = DEFAULT_NIGHT_MODE;
        writePref(KEY_NIGHT_MODE, mode);
        applyTheme(currentPalette(), mode);
        paintNightModeButton();
    };

    /**
     * Cycles system -> light -> dark -> system, and says what the tap will do
     * rather than what is currently on, the same convention the site and NoCal
     * use. aria-pressed carries the state for a screen reader.
     */
    var NIGHT_MODE_NAMES = { system: "Auto", light: "Light", dark: "Dark" };
    var NIGHT_CYCLE = ["system", "light", "dark"];

    /* Names the mode the tap moves to, not the one on screen. Labelling the
       current mode reads as a state report, and a button that says "Auto"
       while the next tap goes to Light is worse than no label. */
    var nightModeLabel = function (mode) {
        var i = NIGHT_CYCLE.indexOf(mode);
        if (i < 0) i = 0;
        return NIGHT_MODE_NAMES[NIGHT_CYCLE[(i + 1) % NIGHT_CYCLE.length]];
    };

    var paintNightModeButton = function () {
        var btn = document.getElementById("btn-night");
        if (!btn) return;
        var mode = currentNightMode();
        btn.textContent = nightModeLabel(mode);
        btn.setAttribute("aria-pressed", resolveIsDark(mode) ? "true" : "false");
        btn.setAttribute("aria-label",
            "Theme: " + NIGHT_MODE_NAMES[mode] + ". Tap for " + nightModeLabel(mode));
        btn.title = "Theme: " + NIGHT_MODE_NAMES[mode] + " \u00b7 tap for " + nightModeLabel(mode);
    };

    var cycleNightMode = function () {
        var i = NIGHT_CYCLE.indexOf(currentNightMode());
        if (i < 0) i = 0;
        setNightMode(NIGHT_CYCLE[(i + 1) % NIGHT_CYCLE.length]);
    };

    // ----------------------------------------------------------------- helpers

    var el = function (tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };

    var button = function (className, text, onClick) {
        var node = el("button", className, text);
        node.type = "button";
        node.addEventListener("click", onClick);
        return node;
    };

    // ----------------------------------------------------------------- dialogs

    /*
     * The dialogs are built in the launcher document. A loaded game lives in an
     * iframe, and key events inside an iframe never reach the parent window, so a
     * game cannot see these dialogs' keystrokes and needs no shielding here.
     */
    var closeDialog = function () {
        if (!openDialog) return;
        openDialog.parentNode.removeChild(openDialog);
        openDialog = null;
        window.removeEventListener("keydown", onKeyDownEscape, true);
    };

    var onKeyDownEscape = function (event) {
        if (!openDialog) return;
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        closeDialog();
    };

    var showDialog = function (title, buildBody) {
        closeDialog();

        var scrim = el("div", "dialog-scrim");
        scrim.setAttribute("data-ui-chrome", "");
        scrim.addEventListener("click", function (event) {
            if (event.target === scrim) closeDialog();
        });

        var dialog = el("div", "dialog");
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-label", title);

        var appBar = el("div", "app-bar");
        var closeButton = button("app-bar-close", "✕", closeDialog);
        // The glyph alone is announced as "multiplication x" by most screen readers.
        closeButton.setAttribute("aria-label", "Close");
        appBar.appendChild(closeButton);
        appBar.appendChild(el("div", "app-bar-title", title));

        var body = el("div", "doc");
        buildBody(body);

        dialog.appendChild(appBar);
        dialog.appendChild(body);
        scrim.appendChild(dialog);

        if (!dialogRoot) {
            dialogRoot = el("div");
            dialogRoot.setAttribute("data-ui-chrome", "");
            document.body.appendChild(dialogRoot);
        }
        dialogRoot.appendChild(scrim);

        openDialog = scrim;
        window.addEventListener("keydown", onKeyDownEscape, true);
    };

    var infoRow = function (label, value) {
        var row = el("div", "row");
        row.appendChild(el("div", "row-label", label));
        row.appendChild(el("div", "row-value", value));
        return row;
    };

    var card = function (title, lines) {
        var node = el("div", "card");
        if (title) node.appendChild(el("div", "card-title", title));
        lines.forEach(function (line) {
            node.appendChild(el("div", "card-body", line));
        });
        return node;
    };

    /*
     * A real anchor, not a clickable span.
     *
     * This was a <span> with a click handler and window.open(), which is unreachable by
     * keyboard and invisible to the accessibility tree — every licence link and fork
     * link in the app was behind it. An <a href> gets focus, Enter, middle-click,
     * "open in new tab", and a correct accessible name for free. `rel` carries
     * noopener/noreferrer so the opened page cannot reach back into this window.
     */
    var link = function (text, url) {
        var node = el("a", "link", text);
        node.href = url;
        node.target = "_blank";
        node.rel = "noopener noreferrer";
        return node;
    };

    // --------------------------------------------------------------- how to play

    /*
     * One place for every game's rules and controls.
     *
     * These used to live in two different games. Blocks had an eleven-item rules list
     * behind a `?` in its HUD; Munch had a Controls section behind an About button.
     * Neither Klondike, Pyramid nor Word Puzzle carried instructions at all, so a
     * player looking for how anything worked had to know which game to open first —
     * and then, for two of the five, find a button that only existed inside a running
     * game. They are all here now, reachable before you have chosen anything.
     *
     * Blocks rules stay in step with the live game (Tetris-only full rows). Munch keeps
     * authorship and controls. Anything that lived only inside a game was moved here
     * deliberately so Help works before you pick a tile.
     */
    var showHelp = function () {
        var registry = (window.SeclusaShell && window.SeclusaShell.games) || [];
        var byId = {};
        registry.forEach(function (game) { byId[game.id] = game.name; });

        var helpFor = {};
        var addHelp = function (id, build) {
            if (byId[id]) helpFor[id] = build;
        };

        showDialog("How to play", function (body) {
            body.appendChild(
                card(null, [
                    "Everything you need to play, in one place. Rules and controls for " +
                        "all five games — no need to start a game to find them."
                ])
            );

            // ---------------------------------------------------------------- Blocks
            addHelp("blockfall", function () {
                body.appendChild(el("h2", undefined, "Blocks"));
                body.appendChild(
                    card(null, [
                        "Stack tools in the vault. Clear only by filling every cell in a " +
                            "row — colours do not match-clear."
                    ])
                );
                var rules = el("ul", "help-rules");
                [
                    "Fourteen named tools on a 9×16 vault.",
                    "LINE: fill every cell in a row; that row clears and everything above drops.",
                    "Holes stay — incomplete rows never clear on colour alone.",
                    "QUAD: clear four rows in one lock for a big bonus.",
                    "Streak: consecutive locks that clear a line raise the meter, up to ×2.0.",
                    "Vault: each cleared line fills the meter; a score bonus at 10.",
                    "Pressure: start slider 1 (easy) to 100 (hard). It climbs every 8 lines.",
                    "Hands: Right or Left puts the pad on your preferred side and hard drop opposite.",
                    "Spark and Vault are rare.",
                    "Keyboard: arrows to move, up to rotate, down to soft drop, " +
                        "space to hard drop, P to pause. On a touchscreen: swipe to move, " +
                        "tap to rotate, swipe down to soft drop."
                ].forEach(function (line) {
                    rules.appendChild(el("li", undefined, line));
                });
                body.appendChild(rules);

                body.appendChild(el("h3", "help-subhead", "The tools"));
                body.appendChild(
                    card(null, [
                        "Spark · Bolt · Rail · Knee · Wing · Seal · Hook · Star · " +
                            "Cup · Gate · Spike · Key · Vault · Beam"
                    ])
                );
                body.appendChild(
                    card(null, [
                        "Beam is the five-cell straight — wider than anything else, and " +
                            "taller than anything else once rotated. Spark and Vault are " +
                            "the rarest."
                    ])
                );
            });

            // ---------------------------------------------------------- Seclusa Munch
            addHelp("pacman", function () {
                body.appendChild(el("h2", undefined, "Seclusa Munch"));
                body.appendChild(
                    card(null, [
                        "Eat the maze, keep clear of the four. One game, one maze, and the " +
                            "ghosts behaving exactly as the 1980 board's did — the same " +
                            "scatter and chase rhythm, the same targeting, the same speeds."
                    ])
                );
                var controls = el("div", "card");
                controls.appendChild(infoRow("Start", "any key, or a tap"));
                controls.appendChild(infoRow("Steer", "arrow keys, or swipe"));
                controls.appendChild(infoRow("Fire", "Space, or the FIRE button on touch"));
                controls.appendChild(infoRow("Pause", "End, or the pause button on touch"));
                controls.appendChild(infoRow("Hands", "Left or Right puts FIRE on your preferred side"));
                body.appendChild(controls);

                body.appendChild(
                    card(null, [
                        "Pip aims four tiles ahead — and four up and left when you face up. " +
                            "That is the arcade's bug, kept because Nix measures from the " +
                            "same wrong square and his turns depend on it."
                    ])
                );

                var credits = el("div", "card");
                credits.appendChild(infoRow("Rules and maze", "Jamey Pittman, The Pac-Man Dossier"));
                credits.appendChild(infoRow("Earlier browser version", "Shaun Williams"));
                var lic = infoRow("Licence", "");
                lic.lastChild.appendChild(
                    link("GPL-3.0", "https://www.gnu.org/licenses/gpl.html")
                );
                credits.appendChild(lic);
                body.appendChild(credits);
            });

            // ------------------------------------------------------- the card games
            addHelp("klondike", function () {
                body.appendChild(el("h2", undefined, "Klondike"));
                body.appendChild(
                    card(null, [
                        "Deal all 52 cards into seven columns, then build the four " +
                            "foundations up by suit from Ace to King."
                    ])
                );
                var rules = el("ul", "help-rules");
                [
                    "Only a King — or a column headed by a King — may go on an empty column.",
                    "You may move a single card or a correctly-sequenced run. " +
                        "Runs break apart when you move part of one.",
                    "Only a King or a run headed by a King may be placed on an empty " +
                            "foundation.",
                    "Build down in alternating colours in the tableau; up in suit in the " +
                        "foundations.",
                    "The stock deals one card at a time; the waste is recycled until the " +
                        "stock runs out.",
                    "You win when every card is on a foundation. There is no draw in " +
                        "Klondike — if you cannot move, restart."
                ].forEach(function (line) {
                    rules.appendChild(el("li", undefined, line));
                });
                body.appendChild(rules);
            });

            addHelp("pyramid", function () {
                body.appendChild(el("h2", undefined, "Pyramid"));
                body.appendChild(
                    card(null, [
                        "Twenty-eight cards are dealt face up in seven rows. Pair off " +
                            "kings and queens, tens and nines, and so on down to aces."
                    ])
                );
                var rules = el("ul", "help-rules");
                [
                    "Any two cards whose ranks add to 11 may be paired — kings with queens, " +
                        "tens with nines, and so on.",
                    "Cards that are not yet playable form the stock, and are dealt back out " +
                        "one at a time when you run out of moves.",
                    "You win when the stock is empty and no pair remains on the pyramid."
                ].forEach(function (line) {
                    rules.appendChild(el("li", undefined, line));
                });
                body.appendChild(rules);
            });

            addHelp("word-puzzle", function () {
                body.appendChild(el("h2", undefined, "Word Puzzle"));
                body.appendChild(
                    card(null, [
                        "Trace paths through adjacent letters to form words."
                    ])
                );
                var rules = el("ul", "help-rules");
                [
                    "Connect neighbours in any of the eight directions — " +
                        "horizontal, vertical or diagonal — so a word may bend.",
                    "Each letter may be used once per word. Minimum two letters.",
                    "Letter values, plus DL, TL, DW and TW bonuses. A length bonus " +
                        "applies from five letters.",
                    "Difficulty runs 1–100, growing the grid and hardening the letter pool.",
                    "Progress is kept on your device and nothing is sent anywhere."
                ].forEach(function (line) {
                    rules.appendChild(el("li", undefined, line));
                });
                body.appendChild(rules);
            });

            // Emit them in the registry's own order so the list follows the menu.
            registry.forEach(function (game) {
                var build = helpFor[game.id];
                if (build) build();
            });

            /*
             * A closing attribution card used to be appended here: "Seclusa Blocks is an
             * independent game with no affiliation to or endorsement by any third-party
             * puzzle brand… used AI while building these — audit the code."
             *
             * It was the wrong dialog twice over. It said nothing about how to play
             * anything, so it read as a dangling instruction; and it named "Seclusa
             * Blocks", which is not a thing — Blocks is one game inside Seclusa Games,
             * and the sentence made five games sound like one product with a disclaimer.
             *
             * None of it was lost. Attribution and the trademark position are in the
             * About dialog (the forks list, the arcade credits, and "this is an
             * unaffiliated tribute"), and the source-audit point is where the reader
             * would actually want it — next to the link to the code.
             */
        });
    };

    // -------------------------------------------------------------- appearance

    var isSoundEnabled = function () {
        return readPref(KEY_SOUND_ENABLED, "true") === "true";
    };

    /*
     * Toggling here only writes the shared preference. Games read it when they boot,
     * so a game already running in the frame keeps whatever it started with — reload
     * the game (or leave and re-enter it) to pick the change up.
     */
    var setSoundEnabled = function (enabled) {
        writePref(KEY_SOUND_ENABLED, enabled ? "true" : "false");
    };

    // ------------------------------------------------------------- clear data

    /*
     * Everything this app persists is plaintext on this device, so there has to be a
     * way for a person to wipe it. Without this the only route is devtools.
     *
     * Scoped to the keys the app and its games actually write, rather than
     * `localStorage.clear()`, so a future unrelated app sharing this origin is not
     * taken out with it.
     */
    var OWNED_KEY_PREFIXES = [
        "ssc.",          // launcher, card games, Munch theme + high score
        "blockfall-",
        "wordpuzzle_"
    ];

    /*
     * Keys this app owns that no prefix can name.
     *
     * Munch kept its record under a bare `highScores` before the `ssc.` namespace
     * existed, and still reads it once on load to migrate the score forward. Nothing
     * writes it any more -- the game's own comment leaves deleting it to here, on the
     * grounds that "they belong to the launcher's clear local data" -- but it matched no
     * prefix above, so the one control whose entire job is "erase everything this app
     * stored" was leaving a player's best score on disk.
     *
     * Named exactly rather than loosened into a prefix: `highScores` is generic enough
     * that a startsWith on it would reach into a sibling app's storage.
     */
    var OWNED_KEYS_EXACT = ["highScores"];

    // Cache Storage is origin-wide. Only touch names this hub owns.
    var OWNED_CACHE_PREFIXES = [
        "seclusa-games-",
        "blockfall-",
        "word-puzzle-"
    ];

    var ownedKeys = function () {
        try {
            var keys = [];
            for (var i = 0; i < window.localStorage.length; i++) {
                var key = window.localStorage.key(i);
                if (OWNED_KEYS_EXACT.indexOf(key) !== -1) {
                    keys.push(key);
                    continue;
                }
                for (var j = 0; j < OWNED_KEY_PREFIXES.length; j++) {
                    if (key.indexOf(OWNED_KEY_PREFIXES[j]) === 0) {
                        keys.push(key);
                        break;
                    }
                }
            }
            return keys;
        } catch (err) {
            return [];
        }
    };

    var isOwnedCacheName = function (name) {
        for (var i = 0; i < OWNED_CACHE_PREFIXES.length; i++) {
            if (name.indexOf(OWNED_CACHE_PREFIXES[i]) === 0) return true;
        }
        return false;
    };

    /*
     * A registration this Clear-all-data pass may touch.
     *
     * Owned means under *this* app's base URL — the directory that served the page —
     * not a hardcoded path segment. A fixed `"/seclusa-games"` only matched one host
     * path: local `serve.py` (`http://127.0.0.1:8080/`) and a GitHub Pages `/games/`
     * deploy never matched, so workers stayed registered, skipped `clear-cache`, and
     * refilled the offline caches on the reload that is supposed to finish the wipe.
     *
     * Sibling apps on the same origin (Weather, NoCal, the site shell) live outside
     * this base, so their scopes and script URLs stay untouched.
     */
    var isOwnedRegistration = function (registration) {
        try {
            var baseHref = new URL("./", window.location.href).href;
            if (baseHref.charAt(baseHref.length - 1) !== "/") {
                baseHref += "/";
            }

            var underBase = function (absolute) {
                if (!absolute) return false;
                var href = new URL(String(absolute), window.location.href).href;
                return href === baseHref || href.indexOf(baseHref) === 0;
            };

            if (underBase(registration.scope)) return true;

            var worker = registration.active || registration.waiting || registration.installing;
            return !!(worker && underBase(worker.scriptURL));
        } catch (err) {
            return false;
        }
    };

    var clearAllData = function () {
        var keys = ownedKeys();

        try {
            keys.forEach(function (key) {
                window.localStorage.removeItem(key);
            });
        } catch (err) {
            /* storage unavailable — nothing to clear anyway */
        }

        /*
         * Caches and workers hold more than preferences: saved board positions, the
         * card image sheets, and the word-puzzle dictionary. Unregistering the workers
         * first stops them repopulating what is about to be deleted, then each worker
         * is told to forget its own cache. A plain `caches.delete()` would leave a
         * live worker able to re-derive the cache on its next navigation.
         *
         * Scope both steps to Seclusa Games only — Cache Storage and
         * getRegistrations() are origin-wide, so wiping everything would also
         * erase the site shell, Weather, and NoCal offline caches.
         *
         * The deletion promise is returned rather than fired and forgotten, because the
         * next step reloads the page and the reload tears this context down mid-flight.
         * A `caches.delete` that has not been dispatched by then may never land, and a
         * "Clear all data" that leaves the offline copies behind is worse than no
         * control at all. Callers chain this; nothing here runs at load.
         */
        var finished = function () {
            if (!(window.caches && window.caches.keys)) return null;
            return window.caches.keys().then(function (names) {
                return Promise.all(names.map(function (name) {
                    if (!isOwnedCacheName(name)) return null;
                    return window.caches.delete(name);
                }));
            }).catch(function () {
                /*
                 * Nothing to do. The caches could not be listed or deleted — blocked or
                 * already-emptied Cache Storage — and the page reloads either way.
                 * Swallowing it here is the difference between a console full of
                 * unhandled rejections and a clean teardown.
                 */
            });
        };

        var afterWorkers = function () {
            // A reload is the only honest way to finish: every frame is gone, every
            // in-memory cache is dropped, and each game re-reads empty storage.
            window.location.reload();
        };

        if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
            navigator.serviceWorker.getRegistrations()
                .then(function (registrations) {
                    return Promise.all(registrations.map(function (registration) {
                        if (!isOwnedRegistration(registration)) return null;
                        if (registration.active) {
                            registration.active.postMessage({ type: "clear-cache" });
                        }
                        return registration.unregister();
                    }));
                })
                .then(finished, finished)
                .then(afterWorkers);
        } else {
            Promise.resolve(finished()).then(afterWorkers);
        }
    };

    var confirmClearData = function () {
        var count = ownedKeys().length;
        var body = el("div", "card");
        body.appendChild(el("div", "card-body",
            "Erases everything Seclusa Games has stored on this device: " + count +
            " preference" + (count === 1 ? "" : "s") + ", every game's saved progress " +
            "and high scores, and all offline caches. This cannot be undone."));
        body.appendChild(el("div", "card-body",
            "Themes and scores are not backed up anywhere, so clearing means starting fresh."));
        showDialog("Clear all data", function (dialogBody) {
            dialogBody.appendChild(body);
            var row = el("div", "pill-row");
            row.appendChild(button("pill-choice", "Cancel", closeDialog));
            row.appendChild(button("pill-choice is-destructive", "Erase everything",
                clearAllData));
            dialogBody.appendChild(row);
        });
    };

    // ------------------------------------------------------------- fullscreen

    var isFullscreen = function () {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    };

    var toggleFullscreen = function () {
        var target = document.documentElement;
        if (isFullscreen()) {
            var exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) exit.call(document);
        } else {
            var enter = target.requestFullscreen || target.webkitRequestFullscreen;
            if (enter) enter.call(target);
        }
    };

    // ------------------------------------------------------------------ about

    /*
     * Built lazily off the registry so this file does not have to be edited every
     * time a game is added. shell.js publishes the list as window.SeclusaShell.games.
     */
    var showAbout = function () {
        var registry = (window.SeclusaShell && window.SeclusaShell.games) || [];

        showDialog("About", function (body) {
            /*
             * The app version, read from the one literal in index.html.
             *
             * This is the only place a version number is shown anywhere in the app. The
             * `?v=` query strings that used to carry it are gone; the service workers read
             * the version out of manifest.json to name their caches, so index.html and
             * manifest.json are the only two places it is written down and this row is
             * the only place a user ever sees it.
             */
            var versionMeta = document.querySelector('meta[name="version"]');
            var version = versionMeta ? versionMeta.content : "";

            body.appendChild(
                card(null, [
                    "Seclusa — from the Latin for “private”, “secluded”, “set apart”. " +
                        "A collection of small, privacy-first games that run entirely in your browser.",
                ])
            );

            if (version) {
                body.appendChild(infoRow("Version", version));
            }

            /* Softened from "privacy-first", which is a claim the Privacy pill below now
               makes in full — repeating it here only diluted it. */
            body.appendChild(el("h2", undefined, "Your data"));
            body.appendChild(el("p", "dialog-note",
                "Everything this app has stored is on this device. Nothing is sent anywhere."));
            body.appendChild(button("pill-choice", "Clear all data", confirmClearData));

            body.appendChild(el("h2", undefined, "Games"));
            var list = el("div", "card");
            registry.forEach(function (game) {
                list.appendChild(infoRow(game.name, game.tagline));
            });
            body.appendChild(list);

            /*
             * Privacy sits behind a pill at the top of the dialog rather than a heading,
             * because it is the answer to the first question anyone has about an app that
             * keeps scores on their device. The section starts open — a pill that hides
             * information by default would be the wrong trade for a privacy claim.
             *
             * There used to be two "Privacy" sections here, an older short one and a newer
             * long one added later. Only the fuller text survives.
             */
            var privacySection = el("div", "about-section");
            var privacyPill = button("pill-choice", "Privacy", function () {
                var hidden = privacySection.hasAttribute("hidden");
                if (hidden) {
                    privacySection.removeAttribute("hidden");
                    privacyPill.setAttribute("aria-expanded", "true");
                } else {
                    privacySection.setAttribute("hidden", "");
                    privacyPill.setAttribute("aria-expanded", "false");
                }
            });
            privacyPill.setAttribute("aria-expanded", "true");

            var privacyRow = el("div", "pill-row");
            privacyRow.appendChild(privacyPill);
            body.appendChild(privacyRow);

            privacySection.appendChild(
                card(null, [
                    "No ads. No analytics. No tracking. No accounts. Nothing is requested " +
                        "from anyone but the origin that served the app — no third-party " +
                        "host, no CDN, no font service — and it cannot phone home: a " +
                        "Content-Security-Policy of connect-src 'none' is there to stop it.",
                    "Every game, every score and every setting stays on this device. High scores, " +
                        "themes and saved games live in this browser's localStorage and nowhere else.",
                    "Everything is GPL-3.0, this app included, so the licence can be " +
                        "exercised against all of it: this project's source and the source " +
                        "of the projects it forks are all linked from the About dialog.",
                ])
            );
            body.appendChild(privacySection);

            body.appendChild(el("h2", undefined, "Licence"));
            var licence = card("GPL-3.0", [
                "Seclusa Games is free software under GPL-3.0. The source is published, so " +
                    "the licence can be audited against this app.",
            ]);
            var licenceLink = el("div", "row");
            licenceLink.appendChild(el("div", "row-label", "Source"));
            var licenceValue = el("div", "row-value", "Read it at ");
            licenceValue.appendChild(link("ambr3.pages.dev/oss/seclusa-games", SOURCE_URL));
            licenceLink.appendChild(licenceValue);
            licence.appendChild(licenceLink);
            body.appendChild(licence);

            body.appendChild(el("h2", undefined, "Open source"));

            /*
             * Everything in this app is GPL-3.0. The card games are forks of another
             * project's code; Seclusa Munch's engine is this app's own, built on a maze
             * and a set of rules that Jamey Pittman reverse-engineered from the 1980
             * board and Shaun Williams first assembled into a browser game. The
             * attribution lives here rather than in each game, so there is one place to
             * read it.
             */
            var forks = el("div", "card");
            [
                {
                    label: "Card games — Klondike & Pyramid",
                    detail: "Forked from Simple Solitaire Collection, by way of " +
                        "ambr3/Seclusa-Solitaire",
                    url: "https://github.com/ambr3/Seclusa-Solitaire"
                },
                {
                    label: "Simple Solitaire Collection",
                    detail: "Tobias Bielefeld — where the card games start",
                    url: "https://github.com/TobiasBielefeld/Simple-Solitaire"
                },
                {
                    label: "Seclusa Munch",
                    detail: "Maze and arcade rules reverse-engineered by Jamey Pittman; " +
                        "earlier browser version by Shaun Williams",
                    url: "https://github.com/masonicGIT/pacman"
                }
            ].forEach(function (fork) {
                var row = el("div", "row");
                row.appendChild(el("div", "row-label", fork.label));
                var value = el("div", "row-value", fork.detail + " ");
                value.appendChild(link("view", fork.url));
                row.appendChild(value);
                forks.appendChild(row);
            });
            body.appendChild(forks);

            /*
             * This app's own source used to be an inert line here, reading "source not
             * published yet". It is published now, so it is a row like the others — the
             * fork list is where someone auditing the licence looks first, and an app
             * that is GPL-3.0 has to be able to show its own terms as well as everyone
             * else's.
             */
            var own = el("div", "row");
            own.appendChild(el("div", "row-label", "Seclusa Games"));
            var ownValue = el("div", "row-value", "This app — ");
            ownValue.appendChild(link("source", SOURCE_URL));
            own.appendChild(ownValue);
            forks.appendChild(own);

            body.appendChild(el("h2", undefined, "Credits"));
            body.appendChild(
                card("Original authors", [
                    "Tobias Bielefeld — Simple Solitaire Collection, the original Android app behind " +
                        "the Klondike and Pyramid rules here.",
                    "Shaun Williams — the browser Pac-Man whose reverse engineering this grows out of.",
                ])
            );
            body.appendChild(
                card("Munch", [
                    "Jamey Pittman — The Pac-Man Dossier: the speed patterns, the ghost targeting, the " +
                        "scatter and chase rhythm, and the maze this is played on.",
                    "James Freeman (GP2U Telehealth) — the cleaned arcade sound set this still uses.",
                    "Pac-Man is a trademark of Bandai Namco Entertainment. This is an unaffiliated " +
                        "homage, and no original Namco artwork is used.",
                    "Seclusa Munch was written for Seclusa Games, and is not a remake of the arcade " +
                        "game's code.",
                ])
            );
        });
    };

    // ------------------------------------------------------------------- boot

    var boot = function () {
        applyTheme(currentPalette(), currentNightMode());

        // "System" night mode stays live when the OS flips.
        if (window.matchMedia) {
            var query = window.matchMedia("(prefers-color-scheme: dark)");
            var listener = function () {
                if (currentNightMode() === "system") {
                    applyTheme(currentPalette(), "system");
                }
            };
            if (query.addEventListener) query.addEventListener("change", listener);
            else if (query.addListener) query.addListener(listener);
        }

        var bind = function (id, handler) {
            var node = document.getElementById(id);
            if (node) node.addEventListener("click", handler);
        };

        bind("btn-about", showAbout);
        bind("btn-night", cycleNightMode);
        paintNightModeButton();
        bind("btn-help", showHelp);
        bind("btn-stage-about", showAbout);
        bind("btn-stage-help", showHelp);
        bind("btn-stage-fullscreen", toggleFullscreen);

        /*
         * Sound, as a bar control rather than a setting inside the Appearance dialog.
         *
         * One pill for every game, because they all read the same
         * `ssc.pref_key_sound_enabled` preference — this is genuinely one app-wide
         * mute, not five that happen to be toggled from one place.
         *
         * The label stays "Sound" rather than spelling out "Sound on" / "Sound off":
         * the bar already carries six controls, and the on/off state is shown by the
         * pressed fill on the pill itself. Spelling it out was what squeezed the game
         * name in the stage bar down to an ellipsis.
         *
         * Blocks keeps its own music and effects toggles on its HUD keys
         * (`blockfall-music-muted`, `blockfall-sfx-muted`) because it is the only game
         * with a music track, and folding that into one switch would throw the distinction
         * away. Those two are now *underneath* this one rather than beside it: the pill is
         * the master, and when it says off that game is silent whichever way its own
         * toggles are set. Turning the pill back on restores whatever it had chosen there.
         * The card games' own sound and winning-sound settings sit underneath it the same
         * way.
         */
        ["btn-sound", "btn-stage-sound"].forEach(function (id) {
            var pill = document.getElementById(id);
            if (!pill) return;
            var sync = function () {
                pill.setAttribute("aria-pressed", isSoundEnabled() ? "true" : "false");
                pill.title = isSoundEnabled() ? "Sound is on" : "Sound is off";
            };
            pill.addEventListener("click", function () {
                setSoundEnabled(!isSoundEnabled());
                sync();
            });
            sync();
        });

        /*
         * Keep the fullscreen button honest.
         *
         * There is no "fullscreen changed" event that fires reliably everywhere, and the
         * user can leave fullscreen with Esc — which never touches this button. So it
         * re-reads the document's actual fullscreen state on a poll and on the events that
         * do fire. Left stale, the button would read "Fullscreen" while the app was
         * already fullscreen, and tapping it would appear to do nothing.
         */
        var fullscreenButton = document.getElementById("btn-stage-fullscreen");
        if (fullscreenButton) {
            var syncFullscreenLabel = function () {
                var on = isFullscreen();
                /*
                 * Update the label SPANS, never textContent.
                 *
                 * Assigning textContent here replaced the button's children with a bare
                 * string, which destroyed the long/short label pair. The narrow-width
                 * swap then had nothing to work with, so the button silently reverted to
                 * its full label at exactly the width where space was tightest — and the
                 * stage bar overflowed as a result.
                 */
                var long = fullscreenButton.querySelector(".lbl-long");
                var short = fullscreenButton.querySelector(".lbl-short");
                if (long) long.textContent = on ? "Exit fullscreen" : "Fullscreen";
                if (short) short.textContent = on ? "Exit" : "Full";
                fullscreenButton.setAttribute("aria-pressed", on ? "true" : "false");
            };
            var pingGameViewport = function () {
                /*
                 * Fullscreen is on this (launcher) document. The game iframe often
                 * misses a timely resize, so card canvases stay on the old bitmap and
                 * stretch — or leave stacks under the chrome when exiting. Tell the
                 * frame to re-lay out.
                 */
                var frame = document.querySelector("#stage-frame iframe");
                if (!frame || !frame.contentWindow) return;
                try {
                    frame.contentWindow.postMessage(
                        { type: "seclusa:viewport-changed" },
                        window.location.origin
                    );
                } catch (err) {
                    /* cross-origin or detached — ignore */
                }
            };
            syncFullscreenLabel();
            ["fullscreenchange", "webkitfullscreenchange"].forEach(function (type) {
                document.addEventListener(type, function () {
                    syncFullscreenLabel();
                    // After the browser commits the new size.
                    requestAnimationFrame(function () {
                        requestAnimationFrame(pingGameViewport);
                    });
                }, true);
            });
            window.addEventListener("resize", syncFullscreenLabel);
            /*
             * The poll is the backstop for a fullscreen exit that fires no event at all.
             * It only needs to exist while someone is looking: a hidden tab cannot show a
             * stale label, and this is a phone-first app that spends most of its time
             * hidden. So it runs on a timer it starts and stops itself, rather than one
             * that wakes the device every 700ms from the launcher grid with nothing
             * running behind it.
             */
            var fullscreenPoll = null;
            var startPoll = function () {
                if (fullscreenPoll === null) {
                    fullscreenPoll = setInterval(syncFullscreenLabel, 700);
                }
            };
            var stopPoll = function () {
                if (fullscreenPoll !== null) {
                    clearInterval(fullscreenPoll);
                    fullscreenPoll = null;
                }
            };
            startPoll();
            document.addEventListener("visibilitychange", function () {
                if (document.hidden) {
                    stopPoll();
                } else {
                    // Re-read once before resuming, so the label cannot be stale on the
                    // frame the tab comes back.
                    syncFullscreenLabel();
                    startPoll();
                }
            });
        }
    };

    /*
     * Public surface for shell.js. Exposed before boot() runs so the launcher can
     * call these regardless of script order.
     */
    window.SeclusaShell = window.SeclusaShell || {};
    window.SeclusaShell.showAbout = showAbout;
    window.SeclusaShell.showHelp = showHelp;
    window.SeclusaShell.toggleFullscreen = toggleFullscreen;
    window.SeclusaShell.isFullscreen = isFullscreen;
    window.SeclusaShell.applyTheme = applyTheme;
    window.SeclusaShell.setNightMode = setNightMode;
    window.SeclusaShell.cycleNightMode = cycleNightMode;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();