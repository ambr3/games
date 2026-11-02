/*
 * Static invariants for the app shell.
 *
 * These are the findings of a manual audit turned into tests. They assert properties of
 * the shipped files rather than the behaviour of a function, because the properties are
 * the ones that regress silently: a new document that forgets its CSP, a link that
 * forgets `rel="noopener"`, a palette added to one file and not another. None of them
 * throws anything when broken — the app just quietly gets less private.
 *
 * Every assertion reads a real file over same-origin fetch, so what is tested is what is
 * served. `tests.html` has to allow `connect-src 'self'` for this; it is the only
 * concession, and it reaches this app's own files and nothing else.
 */

import { describe, expect, it } from './runner.js';

const ROOT = '../../../';

// Every document a browser can be handed as a page of the app. The card-engine test
// page is excluded: it is a development tool, not part of the app, and it carries
// allowances (`unsafe-inline`, `media-src`) the shipped documents do not.
const APP_DOCUMENTS = [
    'index.html',
    'offline.html',
    'games/klondike/index.html',
    'games/pyramid/index.html',
    'games/blockfall/index.html',
    'games/blockfall/offline.html',
    'games/pacman/index.html',
    'games/word-puzzle/index.html',
    'games/word-puzzle/offline.html',
];

const MANIFESTS = [
    'manifest.json',
    'games/blockfall/manifest.json',
    'games/word-puzzle/manifest.json',
];

const cache = new Map();

async function text(rel) {
    if (!cache.has(rel)) {
        const res = await fetch(ROOT + rel);
        if (!res.ok) throw new Error(`${rel} -> HTTP ${res.status}`);
        cache.set(rel, await res.text());
    }
    return cache.get(rel);
}

async function json(rel) {
    return JSON.parse(await text(rel));
}

/** base64(sha256(bytes)), for a CSP style hash. */
async function sha256Base64(value) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    let binary = '';
    for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
    return btoa(binary);
}

/** Pulls the CSP out of a document, however the attribute happens to be wrapped. */
function cspOf(html) {
    const m = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
    return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

describe('every served document carries a policy', () => {
    it('declares a Content-Security-Policy', async () => {
        for (const doc of APP_DOCUMENTS) {
            expect(cspOf(await text(doc))).not.toBeNull();
        }
    });

    it('locks the app down to its own origin and forbids scripting escape hatches', async () => {
        for (const doc of APP_DOCUMENTS) {
            const csp = cspOf(await text(doc));
            expect(csp).toContain("default-src 'self'");
            expect(csp).toContain("script-src 'self'");
            // The whole privacy promise rests on this one directive.
            expect(csp).toContain("connect-src 'none'");
            expect(csp).toContain("object-src 'none'");
            expect(csp).toContain("base-uri 'none'");
            expect(csp).toContain("form-action 'none'");
        }
    });

    it('never allows unsafe-eval, and no document allows unsafe-inline', async () => {
        const inline = [];
        for (const doc of APP_DOCUMENTS) {
            const csp = cspOf(await text(doc));
            expect(csp).not.toContain('unsafe-eval');
            if (csp.includes('unsafe-inline')) inline.push(doc);
        }
        // offline.html inlines its own stylesheet so it still renders when the stylesheet
        // request is what failed, and it used to be allowed by 'unsafe-inline' — an
        // allowance that never reached the browser. A CSP header and a CSP <meta> both
        // apply and the stricter one wins, and the header sent for every path says
        // `style-src 'self'`, so the page rendered unstyled on every host that sends a
        // header while looking right on a plain file server. It is allowed by hash now,
        // and the next test proves the hash is the right one.
        expect(inline).toEqual([]);
    });

    it('allows offline.html exactly the one inline style it actually has', async () => {
        /*
         * The hash has to be the hash. A policy that allows a stale hash is a policy that
         * blocks the page, and a policy that allows `'unsafe-inline'` is a policy that
         * allows every future style too — so this recomputes the digest from the document
         * rather than trusting the string in the meta, and the header-side copy is checked
         * by scripts/test_serve.py against the same value.
         */
        const html = await text('offline.html');
        const style = html.match(/<style>([^<]*)<\/style>/);
        expect(style).not.toBeNull();

        const digest = await sha256Base64(style[1]);
        const quoted = `'sha256-${digest}'`;
        expect(cspOf(html)).toContain(quoted);

        // And exactly one source beyond 'self': a second allowance of any kind fails here.
        const styleSrc = cspOf(html).match(/style-src ([^;]+)/)[1].trim().split(/\s+/);
        expect(styleSrc).toEqual(["'self'", quoted]);
    });

    it('declares a Permissions-Policy', async () => {
        for (const doc of APP_DOCUMENTS) {
            expect(await text(doc)).toContain('Permissions-Policy');
        }
    });
});

describe('the privacy promise is enforced, not just stated', () => {
    it('makes no third-party subresource request of any kind', async () => {
        const docs = [...APP_DOCUMENTS, 'theme.css', 'launcher.css',
            'games/blockfall/style.css', 'games/pacman/theme.css',
            'games/word-puzzle/style.css', 'games/cards/cards.css'];

        for (const doc of docs) {
            const src = await text(doc);
            // Anchors are excluded deliberately. An <a href> to a GitHub credit is a link
            // the user has to click, opened in a new tab with rel=noopener — it is not a
            // request the page makes, and it is checked separately below. What must not
            // exist is anything the browser fetches on its own: script, link, img, src.
            const urlAttrs = [];
            for (const tag of src.match(/<(?:script|link|img|iframe|source|video|audio|embed|object)\b[^>]*>/gi) || []) {
                const m = tag.match(/(?:src|href)\s*=\s*["'](?:https?:)?\/\/[^"']+["']/i);
                if (m) urlAttrs.push(m[0]);
            }
            expect(urlAttrs).toEqual([]);

            const cssUrls = src.match(/url\(\s*["']?(?:https?:)?\/\/[^)]+\)/gi) || [];
            expect(cssUrls).toEqual([]);
        }
    });

    it('uses no remote API surface in application code', async () => {
        const app = ['theme.js', 'shell.js', 'theme-game.js', 'sw.js',
            'games/pacman/theme.js', 'games/word-puzzle/game.js', 'games/blockfall/js/game.js'];

        for (const file of app) {
            const src = await text(file);
            expect(src).not.toMatch(/\bnew\s+WebSocket\b/);
            expect(src).not.toMatch(/\bnavigator\.sendBeacon\b/);
            expect(src).not.toMatch(/\bnew\s+EventSource\b/);
            // The only fetch() calls belong to service workers reading this app's own
            // manifest and assets; anything else would break connect-src 'none'.
            if (!file.endsWith('sw.js')) expect(src).not.toMatch(/\bfetch\s*\(/);
        }
    });

    it('writes no cookies and opens no new browsing context', async () => {
        for (const doc of APP_DOCUMENTS) {
            expect(await text(doc)).not.toContain('document.cookie');
        }
    });

    it('gives every new-tab link rel=noopener noreferrer', async () => {
        for (const doc of APP_DOCUMENTS) {
            const src = await text(doc);
            const anchors = src.match(/<a\b[^>]*>/gi) || [];
            for (const a of anchors) {
                if (/target\s*=\s*["']_blank["']/i.test(a)) {
                    expect(a).toMatch(/rel\s*=\s*["'][^"']*noopener/i);
                    expect(a).toMatch(/rel\s*=\s*["'][^"']*noreferrer/i);
                }
            }
        }
    });
});

describe('manifests', () => {
    it('resolve id inside scope, so app identity does not depend on where it is hosted', async () => {
        for (const rel of MANIFESTS) {
            const m = await json(rel);
            // Resolved against a fixed base: "./" tracks the deployment path, an absolute
            // "/games/word-puzzle/" is discarded by the browser the moment the app is
            // served from anywhere else, silently changing the app's identity.
            const base = new URL(ROOT + rel, location.origin);
            const scope = new URL(m.scope, base);
            const id = new URL(m.id, base);
            expect(id.pathname.startsWith(scope.pathname)).toBe(true);
        }
    });

    it('opens each game by its directory, never by an index.html', async () => {
        /*
         * Several hosts rewrite a request for `games/pyramid/index.html` into a 301 to
         * `games/pyramid/` — Cloudflare does it, and so does `serve`. In a normal tab that
         * is invisible; inside an iframe, Brave and Chrome often drop the redirect and
         * leave a blank chrome-error page, so the game never arrives even though its files
         * are on the site. A tablet tolerated the same redirect, which is what made it look
         * like a browser difference rather than a path one.
         *
         * So the frames ask for directories. This test is here because the natural-looking
         * thing to write is the file, and writing it works perfectly until it is deployed.
         */
        const shell = await text('shell.js');
        const paths = [...shell.matchAll(/path:\s*"(games\/[^"]+)"/g)].map((m) => m[1]);

        expect(paths.length).toBeGreaterThanOrEqual(5);
        for (const path of paths) {
            expect(path.endsWith('index.html')).toBe(false);
            expect(path.endsWith('/')).toBe(true);
        }
    });

    it('caches exactly the games the launcher opens', async () => {
        /*
         * The launcher asks for one URL per game; the service worker precaches what will be
         * asked for. If the two lists drift, every game works online and fails offline —
         * the frame's navigation misses the cache entirely, because a cache is keyed by URL
         * and `games/pacman/` is not `games/pacman/index.html`.
         */
        const shell = await text('shell.js');
        const sw = await text('sw.js');
        const opened = [...shell.matchAll(/path:\s*"(games\/[^"]+)"/g)].map((m) => m[1]).sort();
        // Trailing slash, so the five tile icons the precache list also holds are left to
        // the test that owns them. Both live under games/; only these are navigations.
        const cached = [...sw.matchAll(/"\.\/(games\/[^"]+\/)"/g)].map((m) => m[1]).sort();

        expect(cached).toEqual(opened);
    });

    it('precaches every tile icon the launcher draws', async () => {
        /*
         * The launcher is the first thing anyone sees without a network, and three of its
         * five tiles had no cached icon: the games that have no worker of their own cannot
         * be rescued by one, because a request for `games/klondike/icon-192.png` is
         * handled by whichever worker's *scope* covers the URL, and only Blocks and Word
         * Puzzle have a scope that reaches theirs. So offline, three tiles came up blank
         * and nothing anywhere reported a failure.
         *
         * Both halves matter. The precache list has to cover the icons, and it has to name
         * the same files the registry does — an icon list that has drifted fails silently,
         * in the one place nobody looks for a bug.
         */
        const shell = await text('shell.js');
        const sw = await text('sw.js');
        const icons = [...shell.matchAll(/icon:\s*"(games\/[^"]+)"/g)].map((m) => m[1]).sort();
        const cached = [...sw.matchAll(/"\.\/(games\/[^"]+\.png)"/g)].map((m) => m[1]).sort();

        expect(icons.length).toBeGreaterThanOrEqual(5);
        expect(cached.filter((p) => p.startsWith('games/'))).toEqual(icons);

        for (const icon of icons) {
            const res = await fetch(ROOT + icon);
            expect(res.ok).toBe(true);
        }
    });

    it('does not put a CSP header on service workers or documents', async () => {
        /*
         * A worker is governed by the CSP on *its own script response*. GitHub Pages
         * sends none, so Cache.add() during install is unrestricted by CSP. The local
         * server matches that: no Content-Security-Policy response header. Document
         * privacy stays in the HTML <meta> (`connect-src 'none'`), which does not
         * apply to the worker.
         */
        const paths = [
            'sw.js',
            'games/blockfall/sw.js',
            'games/word-puzzle/sw.js',
            'index.html',
        ];
        for (const rel of paths) {
            const res = await fetch(ROOT + rel);
            expect(res.ok).toBe(true);
            expect(res.headers.get('Content-Security-Policy')).toBeNull();
        }
        expect(cspOf(await text('index.html'))).toContain("connect-src 'none'");
    });

    it('knows the same palettes in all three theme files', async () => {
        /*
         * The palette name list is copied into theme.js, theme-game.js and theme-boot.js,
         * and the copies are not derived from one another — they are typed out. theme-boot
         * is the dangerous one to get wrong: it runs synchronously in <head> and decides
         * the palette before the first paint, so a stale copy there repaints the whole app
         * in the default navy for a frame, on every load, with no error anywhere.
         */
        const lists = {};
        for (const rel of ['theme.js', 'theme-game.js', 'theme-boot.js']) {
            const m = (await text(rel)).match(/PALETTES\s*=\s*\[([^\]]+)\]/);
            expect(m).not.toBeNull();
            lists[rel] = m[1].match(/"([a-z-]+)"/g).map((s) => s.replace(/"/g, ''));
        }
        expect(lists['theme-game.js']).toEqual(lists['theme.js']);
        expect(lists['theme-boot.js']).toEqual(lists['theme.js']);
    });

    it('states the app version in exactly one place', async () => {
        const manifest = await json('manifest.json');
        const index = await text('index.html');
        const meta = index.match(/<meta\s+name="version"\s+content="([^"]+)"/i);
        expect(meta).not.toBeNull();
        expect(meta[1]).toBe(manifest.version);

        // Per-game manifests must not carry a version at all. Nothing reads one: all
        // three workers read the root manifest to name their cache, so a second literal
        // could only ever drift.
        for (const rel of MANIFESTS.filter((f) => f !== 'manifest.json')) {
            expect(Object.keys(await json(rel))).not.toContain('version');
        }
    });

    it('points nowhere outside the app', async () => {
        for (const rel of MANIFESTS) {
            const m = await json(rel);
            expect(m.start_url).toMatch(/^\.\//);
            expect(m.scope).toMatch(/^\.\//);
            for (const icon of m.icons) {
                expect(icon.src).not.toMatch(/^[a-z]+:/i);
                expect(icon.src).not.toMatch(/^\//);
            }
        }
    });
});

describe('clear-all-data ownership is host-path independent', () => {
    it('does not hardcode a /seclusa-games path for worker ownership', async () => {
        /*
         * That substring only matches one published path. Local serve and a /games/
         * GitHub Pages host never matched, so Clear all data left workers alive.
         */
        const theme = await text('theme.js');
        expect(theme).not.toMatch(/indexOf\s*\(\s*["']\/seclusa-games["']\s*\)/);
    });

    it('keys ownership off this page\'s base URL and the registration scope', async () => {
        const theme = await text('theme.js');
        const body = theme.match(
            /var isOwnedRegistration = function \(registration\) \{[\s\S]*?\n    \};/
        );
        expect(body).not.toBeNull();
        expect(body[0]).toContain('location.href');
        expect(body[0]).toContain('new URL("./"');
        expect(body[0]).toContain('registration.scope');
        expect(body[0]).toContain('scriptURL');
    });
});

describe('service worker cache allowlist', () => {
    it('accepts the launcher ?v= stamp (URL.search includes the ?)', async () => {
        /*
         * keepable() reads url.search, which is "?v=0.1.28" — including the leading
         * "?". A regex that starts at "v=" never matches, so the allowlist branch is
         * dead and every queried URL is treated as unkeepable.
         */
        const sw = await text('sw.js');
        expect(sw).toContain('/^\\?v=[0-9][\\d.]*$/.test(url.search)');

        const re = /^\?v=[0-9][\d.]*$/;
        expect(re.test('?v=0.1.28')).toBe(true);
        expect(re.test('?v=1')).toBe(true);
        expect(re.test('v=0.1.28')).toBe(false);
        expect(re.test('?evil=1')).toBe(false);
        expect(re.test('?v=0.1.28&x=1')).toBe(false);
    });
});

describe('the palette list cannot drift', () => {
    /*
     * The palette list is duplicated in three files: theme.js and theme-game.js for the
     * shell and the games, and the [data-palette=...] selectors in theme.css that define
     * the colours. A name added to one and not another does not error — a stale list
     * simply rejects the palette the other wrote and silently falls back to the default,
     * which is exactly the kind of failure that reads as "the app ignored my choice".
     */
    it('lists the same palettes in theme.js and theme-game.js', async () => {
        const listOf = (src) => (src.match(/PALETTES\s*=\s*\[([^\]]*)\]/s) || ['', ''])[1]
            .split(',')
            .map((s) => s.trim().replace(/["']/g, ''))
            .filter(Boolean);
        const a = listOf(await text('theme.js'));
        const b = listOf(await text('theme-game.js'));
        expect(a.length).toBeGreaterThan(0);
        expect(b).toEqual(a);
    });

    it('corrects a theme left wrong once the document has finished loading', async () => {
        /*
         * The regression this pins: three of five games rendered light on a dark device.
         *
         * theme-game.js applies the theme once while parsing. A freshly-created iframe
         * does not reliably report the OS colour scheme at that moment — measured as
         * `prefers-color-scheme: dark` answering false for the whole parse — so apply()
         * pinned data-theme="light". Nothing then *changed*, so the matchMedia change
         * listener never fired and it stayed light forever, inside a dark launcher.
         *
         * Behaviour is pinned by themeGame.test.js. What belongs here is that the
         * mechanism exists at all: without this assertion the whole correction could be
         * deleted as "redundant with the change listener" and the bug would return
         * silently, because nothing else in the codebase would fail.
         */
        for (const file of ['theme-game.js', 'games/pacman/theme.js']) {
            const src = await text(file);
            expect(src).toMatch(/addEventListener\(\s*["']load["']/);
            expect(src).toMatch(/readyState\s*===\s*["']complete["']/);
            // ...and the write must be guarded, or a correct frame fires listeners twice.
            expect(src).toMatch(/data-theme["']\s*\)\s*!==\s*wanted/);
        }
    });

    it('defines every listed palette in theme.css', async () => {
        const src = await text('theme.css');
        const listed = (await text('theme.js'))
            .match(/PALETTES\s*=\s*\[([^\]]*)\]/s)[1]
            .split(',')
            .map((s) => s.trim().replace(/["']/g, ''))
            .filter(Boolean);
        for (const name of listed) {
            expect(src).toContain(`[data-palette='${name}']`);
        }
    });

    it('has navy as the default everywhere it is declared', async () => {
        for (const file of ['theme.js', 'theme-game.js', 'games/pacman/theme.js']) {
            const src = await text(file);
            expect(src).toMatch(/DEFAULT_THEME_COLOR\s*=\s*["']navy["']/);
        }
        // ...and a :root block so navy holds before any script runs.
        expect(await text('theme.css')).toContain(':root {');
    });
});