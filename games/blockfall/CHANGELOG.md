# Changelog

All notable changes to **Seclusa Blocks**.

## Unreleased

### Added
- Board clear/collapse + `placePiece` coverage in the hub `blockfall.test.js` suite
- Continue / New game on the start screen (saved runs no longer auto-start)
- Preferred Pressure stored separately from a resumed run’s level

### Changed
- **Tetris-only board rules:** full rows collapse in one pass; SEAL / column-pack removed; Vault tracks lines; `RUN_SAVE_VERSION = 2`; modules under `js/`
- Pause **Restart** label is **New game** (returns to start so Pressure can be set)

### Fixed
- Multi-line clears no longer wipe the wrong rows (one-pass filter + top pad)
- `placePiece` validates all cells before writing (no partial lock above the board)
- Document `touchmove` no longer blocks the Pressure range control

### Added (prior)
- **The board now survives a reload.** Score, level, the board, the falling piece and the piece queue are written to `localStorage` on every placement and on pause / tab-hide / page-hide, and the game resumes by itself on the next load. Previously a reload lost the entire run and put you back at score 0. *Starting a fresh game, reaching game over, or Clear local data all discard the snapshot.*
- About → Clear local data (prefs / best / Daily / Pressure / hand)
- Left / Right hand play modes (pad on preferred side; hard drop opposite)
- Pressure start slider (1 Easy → 100 Hard) on the start screen
- Vault clear rules: color clusters (SEAL ≥5), classic full rows (LINE), QUAD bonus for 4 rows
- Open 9×16 vault board + stronger vault frame
- Retuned tool catalog (13): Spike, Gate, Key, Seal special, rare Spark & Vault
- Vault meter (Classic) + Daily seal objective (local); Pressure replaces Level label
- Name-led toasts (`SEAL`, `LINE`, `QUAD`) + seal/line/quad SFX
- Animated line clears (row flash before board collapse) + toast/board pop juice
- Mid-run “NEW BEST!” toast when beating a prior personal best
- Streak meter fill + About blurb for streak / scoring
- Daily mode: local date-seeded bag RNG (offline, Classic toggle)
- Color-blind tile patterns per piece color (board, next, About gallery)
- Local best score (device-only), game-over recap, level progress hint
- Clear / level-up board toasts, orange flash juice, streak HUD pulse
- Gentler opening: first two pieces drawn from Spark / Bolt / Knee only
- Start overlay rules + keyboard / pad control hints
- In-game About pill (privacy, controls, GPL + independent-game disclaimer)
- Separate hard-drop button above the pad (▼ soft-drops only)
- `offline.html` fallback page
- `.gitignore` for editor junk
- Standalone project under `~/dev/projects/blockfall` (own app tile on the Seclusa site)

### Changed (prior)
- Clears: SEAL at ≥5 same color (≥4 with Seal tool); classic full rows only; QUAD (4 rows) is the only line bonus
- Removed partial-row / column BIND
- Landscape uses side pads via body.landscape (taller board); portrait bottom dock
- Hard drop opposite the pad (landscape side pillar / portrait bottom pill)
- Control pad is in-flow (no fixed overlay on privacy footer)
- Pressure 1–100 curve retuned (slow/easy → fast/hard drop + lock grace)
- Piece bag is difficulty-weighted with recent-deal history (fairer randomiser)
- Top HUD replaces bulky left chrome (stats + actions stay on-screen)
- Renamed display name to **Seclusa Blocks** (was Blockfall)
- Clear language is Seclusa-only; Seclusa tool set; vault frame identity
- Orange accent theme; rounder cells; neon polish
- Compact portrait / landscape chrome
- First visit: music muted until toggled (no prior mute pref)
- SW cache `blockfall-v51`
- Gate rotates normally (removed morph reshape)
- Clears: same-color MATCH at ≥7 only + full rows; match and lines clear in separate waves
- Single game mode — Classic / Daily toggle removed (Vault meter only)
- About control is a circular `?` help pill
- UI polish: overlay panels, Match/Line rule chips, HUD depth, help-button hover

### Fixed
- Service worker no longer hands a proxy / captive-portal error page to the page as if it were the game — it now falls back to the cache. Reverses nothing; the earlier "query-string cache key strip" entry below is unaffected.
- Shared `../../theme.css` and `../../theme-game.js` are now cached, so the game keeps its theme offline instead of rendering unstyled.
- Every `?v=` cache-buster is gone and this game no longer carries its own version literal or `<meta name="version">`. **One version for the whole app**: it lives in exactly two files (the app's `index.html` and `manifest.json`) and this game's service worker names its cache from `manifest.json` at install time, so a version bump retires the cache automatically instead of relying on a hand-edited literal. This **reverses** the earlier entry "Service worker update check uses standalone `/blockfall/sw.js` (not hub `/games/…`)" — the update check matches the real `/games/blockfall/sw.js` path again, which is where the game lives inside the hub.
- `X-Frame-Options: SAMEORIGIN` instead of `DENY` (in both `_headers` and `.htaccess`). `DENY` made the game impossible to frame by the Seclusa Games launcher in production while looking fine under a plain file server. **Reverses** "Standalone PWA (no longer embedded in Seclusa Games hub)".
- `frame-ancestors` removed from the `<meta>` CSP: browsers ignore that directive in a `<meta>` tag and logged an error on every load. It stays in the headers. **Reverses** "CSP meta includes `frame-ancestors 'none'` (parity with headers)".
- `frame-src 'self'` in the header CSP, so the game is still framed while remaining unable to frame anything off-origin.
- Color match no longer wipes other colors in the same clear wave
- Landing a multi-cell tool no longer self-matches; needs an existing board cell
- About + start screen: Match 7 · Full row only
- CSP meta includes `frame-ancestors 'none'` (parity with headers)
- Line counter tracks full rows cleared (not cellCount/4)
- Privacy footer hidden whenever the touch pad is shown (no hard-drop overlap)
- About sheet can scroll on touch (document touchmove no longer blocks it)
- Install prompt null-guards the install button
- Portrait/landscape layout no longer clips left menu off the bottom
- Install button keeps icon (hint via title, not text swap)
- Pad position now applied in JS so lifts aren’t ignored by layout code
- Service worker allowlists assets only (no arbitrary same-origin cache); query-string cache key strip; offline.html fallback
- CSP/Permissions-Policy parity across meta, `.htaccess`, `_headers` (`connect-src 'none'`, `worker-src`/`manifest-src`)
- Pause stops music; auto-pause on tab hide
- README: scores are session-only (only mute prefs in localStorage)
- Service worker update check uses standalone `/blockfall/sw.js` (not hub `/games/…`)
- Standalone PWA (no longer embedded in Seclusa Games hub)
- Board stays within the viewport (no blocks clipped at the bottom)
