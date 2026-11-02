# Changelog

All notable changes to **Word Puzzle**.

## Unreleased

### Changed
- **One version for the whole app.** Every `?v=` cache-buster is gone, along with this game's own version literal and the `<meta name="version">` that fed it. The version now lives in exactly two files — the app's `index.html` and `manifest.json` — and this game's service worker names its cache from `manifest.json` at install time, so a version bump retires the cache automatically and there is nothing to keep in step by hand. The app version is shown once, in the launcher's About dialog.
- The "Open source" link in the menu and on the offline page pointed at `../../oss/word-puzzle/`, a directory that no longer exists — it 404'd on every load. It now points at the author's page, the same one the README already cites.

### Fixed
- **The service worker no longer deletes other caches on the origin.** Its activate sweep filtered on `k !== CACHE_NAME`, which matched *every* cache that wasn't its own — measurably, opening this game emptied the Seclusa Games launcher's offline cache from 24 entries to 0. It is now scoped to the `word-puzzle-` prefix.
- `words.js` is now requested with a plain URL and the service worker precaches it with a plain URL. The request used to be `?v=0.1.5` while the worker precached `?v=0.1.6`, so the precached dictionary never matched a single real request.
- Offline navigation now falls back to the cache when an intermediary (proxy, captive portal, CDN) returns an HTTP error page instead of failing at the network level. Previously the error page was served to the page as though it were the game.
- Cache lookups are scoped to this worker's own cache rather than searching every cache on the origin.
- `X-Frame-Options: SAMEORIGIN` instead of `DENY` (in both `_headers` and `.htaccess`). `DENY` made the game impossible to frame by the Seclusa Games launcher in production while looking fine under a plain file server.
- `connect-src` in `.htaccess` was `'self'` while `_headers` said `'none'`; the two host paths enforced different policies. Both are now `'none'`.
- `frame-src 'self'` and `frame-ancestors 'self'` in the header CSP, so the launcher can frame this game while it still cannot frame anything off-origin.
- Hub ← Games pill styled correctly (CSP blocked inline bridge CSS)

## 0.1.5 — 2026-09-29

### Changed
- App icon: single glowing **W** tile (aurora theme) replacing the old WORDS! grid.

## 0.1.4 — 2026-09-29

### Added
- Install App button (Chrome/Edge `beforeinstallprompt`).
- iOS / mobile-web-app meta tags for Add to Home Screen.

### Fixed
- Manifest installability: PNG 192/512 with separate `any` + `maskable` purposes, stable `id`, `start_url`/`scope` `./`.
- Service worker offline navigate falls back to cached `index.html` first.

## 0.1.3 — 2026-09-29

### Changed
- Menu fits one viewport: How to Play collapsed, denser chrome, Play + High Scores side-by-side.
- In-game site header hidden on all devices; HUD stays visible; grid sized to leftover height.

### Fixed
- Gameplay HUD / header no longer clipped off the top of the screen.

## 0.1.2 — 2026-09-28

### Added
- Vowel-clamped letter deal (≈30–40% vowels) with retuned Easy / Mixed / Hard pools.
- Streak bonus that actually adds points (from ×3).
- Aurora UI theme: glass cards, gradient brand, glowing Play CTA, motion with reduced-motion respect.
- README with features, privacy table, local play, and deploy notes.
- Footer version line (`v0.1.2`).

### Fixed
- `endGame` double-fire could award XP / scores twice (Zen End Round).
- Challenge result title said “Time’s Up!” with no timer.
- Timer warning style leaked into Zen / Challenge.
- MIXED double-J and HARD thin D / Q–U balance.

### Changed
- Clear All Data wipes scores, progress, and saved difficulty.
- Privacy copy: no third-party requests (same-origin assets only).

## 0.1.1 — 2026-09-28

### Added
- Initial privacy-first word puzzle PWA: Classic / Rush / Zen / Challenge, difficulty 1–100, Ruzzle-style bonuses, offline service worker, local high scores.
- Master-audit hardening: GET + same-origin SW, offline fallback, storage validation, CSP / header samples, Clear data affordance.
