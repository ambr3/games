# Changelog

All notable changes to Seclusa Games. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.29] - 2026-11-02

### Fixed
- Clear all data now unregisters this app's service workers on any host path (not only `/seclusa-games`), so offline caches stay wiped after reload
- Service worker `keepable()` recognises launcher `?v=` URLs (`URL.search` includes the leading `?`)

### Changed
- Cache name and manifest version **0.1.29**

## [0.1.28] - 2026-11-02

### Added
- MDN HTTP Observatory scan report (B on GitHub Pages); README notes why that grade is expected for this static PWA

### Changed
- Cache name and manifest version **0.1.28**

## [0.1.27] - 2026-11-02

### Added
- Seclusa Munch has an on-screen FIRE button on touch devices (Space still fires on a keyboard)

### Fixed
- Returning to a won Klondike or Pyramid deal no longer leaves an empty board: auto-start new game (on by default) runs again when GameWon was actually saved

### Changed
- Cache name and manifest version **0.1.27**
- Local `scripts/serve.py` no longer needs `_headers` / `.htaccess` (GitHub Pages); framing headers stay in the server, document CSP stays in the HTML metas
- Header / shell static tests updated for that setup

## [0.1.26] - 2026-10-30

### Fixed
- Score and time pills in the chrome bar keep their card-scaled size on resize and fullscreen (set on every layout, not only at start)

### Changed
- Master audit re-run for Klondike and Pyramid; results in `MASTER-AUDIT-REPORT.md`

## [0.1.25] - 2026-10-30

### Changed
- Pill font sizes in the chrome bar now scale with card width via JavaScript, ensuring consistent visual sizing across viewports

## [0.1.24] - 2026-10-30

### Changed
- Score and time chips in the chrome bar now scale font size with card width, so they visually match the card size as the viewport changes

## [0.1.23] - 2026-10-30

### Fixed
- Auto-complete button now shows/hides to match game state
- Cards released on pointerup/pointercancel even when input blocked
- RecordList undo lock cleared when list emptied during undo

### Changed
- Klondike draw-3 gate removed: auto-complete now works with cards in discard pile
- GameManager input guard: held cards always released on release events
- RecordList.hasMoreToUndo(): clears working flag when list emptied

## [0.1.22] - 2026-10-30

### Fixed
- Klondike card size too big on desktop: card width is now capped at **140px** (`Game.MAX_CARD_WIDTH`)
- Mobile and tablet sizes untouched (below the cap)
- Card width now gradually shrinks on very wide viewports (above 800px reference), so cards stop growing and start coming in as the screen gets bigger — they do not push close to the bottom of the playfield

## [0.1.20] - 2026-10-27

### Added
- Word Puzzle has a test suite for its scoring, XP, word list and letter generation

### Changed
- Cache name and manifest version **0.1.20**
- Word Puzzle scoring takes its grid as an argument, so it can be tested without a running game
- Word Puzzle's test helpers are published only to the test page, not to players
- Dev server (`scripts/serve.py`) answers only local connections and does not serve hidden paths such as `.git` or `.htaccess`
- Unused functions removed from Blocks, Munch and the card engine

### Removed
- `games/blockfall/master-audit-report.md`, a stale audit that referred to a deleted `app.js`

## [0.1.19] - 2026-10-26

### Added
- Word Puzzle has its own maskable icons, with the artwork inside the safe zone
- Launcher has an SVG app icon, so the install icon scales cleanly

### Fixed
- The launcher's service worker read the manifest on every navigation with no deadline,
  so a stalled connection held every page load. It now gives up after 5 seconds, as the
  games' workers already did
- Word Puzzle cached every distinct query string on its asset paths, and nothing
  reclaimed them. Its cache keys now drop the query, as Blocks' do
- Word Puzzle installed its files through the HTTP cache, which could seal a stale copy
  into a new version. It now fetches them without the cache

### Changed
- Cache name and manifest version **0.1.19**
- Word Puzzle manifest declares `lang` and `dir`

## [0.1.18] - 2026-10-25

### Fixed
- Launcher would not scroll in mobile portrait: the body was `overflow: hidden` after the
  fit-to-screen work, so the game grid and footer were clipped on short viewports. The
  launcher body scrolls vertically again (touch scrolling enabled) when content exceeds
  the viewport.

### Changed
- Cache name and manifest version **0.1.18**

## [0.1.17] - 2026-10-24

### Fixed
- PWA install on Android collided with the Weather app: both apps used `id: "./"`,
  which resolved to the same WebAPK identity. The id is now `"./manifest.json"`,
  unique and host-independent per app
- Manifests were served as `application/json` on Cloudflare/Netlify; added
  `Content-Type: application/manifest+json` to `_headers` (Apache already had it)
- Launcher footer was busy; collapsed to a single small-print line
- Launcher no longer scrolls: body is `overflow: hidden` and spacing was compacted
  so the whole screen fits

### Changed
- Cache name and manifest version **0.1.17**

## [0.1.16] - 2026-10-18

### Changed
- Cache name and manifest version **0.1.16**. Everything the launcher shell precaches --
  `theme.css`, `launcher.css`, `mono.css`, `shell.js` among them -- is cache-first under
  the cache *name*, so without this bump none of the rest of this release reaches anyone.
  The games' own `js`/`css` are network-first and were already fresh
- The launcher, Blocks, Word Puzzle and Seclusa Munch now wear the shared
  black-and-white palette from `seclusa-base.css`. Klondike and Pyramid lost their
  colour palettes too, so the whole app is one look rather than five
- `mono.css` maps that palette onto the app's Material 3 colour roles. It is
  opt-in through a `data-mono` attribute on `<html>`, and wins on specificity
  rather than on source order, so it does not depend on being linked last
- The card table felt is now a grey gradient. `GameManager.loadBackgroundColor()`
  writes it as an inline style, so it is overridden from CSS rather than by
  editing the card engine that Klondike and Pyramid share

### Kept deliberately
- The 14 Blocks piece colours, and Munch's player, four ghosts and fruit. In a
  falling-block puzzle the pieces have to be told apart at a glance, and the
  ghosts are the game. That is content, not chrome
- A deck is still red and black, on whatever table it is dealt

### Removed
- The Appearance dialog: twelve colour swatches, night mode and clear-all-data.
  With every game monochrome the swatches changed nothing anyone could see, and
  a control that appears to do nothing is worse than no control
- **Clear all data** moved to the About dialog rather than disappearing with it.
  Being able to erase what is stored on the device is a privacy affordance, not
  a setting

### Added
- Munch: an energizer banks a pellet, and space or a tap fires it along the way
  you are going. It kills the first ghost it reaches, for the same points as
  catching one during a fright, and stops at the first wall. Two can be banked,
  one can be in flight at a time, and a shot into a wall is refused rather than
  spent
- A light/dark pill in the header beside About, cycling Auto -> Light -> Dark. The
  Appearance dialog used to own this and went with the colour swatches; the
  preference key and values are unchanged, so an existing choice survives. The
  label names the mode the tap moves to rather than the one on screen
- One warm note, and only one: the focus ring, the ring and glow on the selected
  tile or pill, and a hairline along the top of the shell bar. Opt-in through
  `data-warm`, separate from `data-mono`, so Klondike and Pyramid can wear the
  black-and-white theme and still carry no colour at all
- Word Puzzle: the menu is a 34px pill with everything centred inside it, inset
  14px from the edges, and the WORD PUZZLE wordmark is a pill of the same shape
  above it
- The card table felt is a real choice in the card settings again, as
  "Monochrome" alongside the six colours, and it is the default. It was being
  blocked by a stylesheet override that outranked the inline style the settings
  write
- PWA icons are now generated from the launcher's SG badge by
  `scripts/make_game_icons.py`, so the installed icon is the mark the app leads
  with rather than a separate controller glyph. Both were hand-drawn files that
  had drifted apart. The maskable variant is inset to 62%, verified to sit inside
  the 40%-radius safe zone

### Fixed
- Munch's page backdrop was a gradient of `--theme-game-select-background`, which
  is the launcher's *selected state* colour. Under the monochrome theme that is
  white on a dark theme, so the page behind the black board came up white and the
  game sat on a white sheet. The backdrop is the board's own colour now
- Munch's attract title and high score were drawn in `PLAYER_COLOR` -- the
  player's own yellow -- so the words on the page were the colour of the thing
  they describe. They take the theme's text roles now, as do READY!, PAUSED,
  GAME OVER, the HUD greys and the maze flash, which was the last hardcoded
  colour left on the board
- Word Puzzle's four mode icons rendered through the emoji font, which drew them
  in its own colours — the Rush bolt came out orange whatever the palette. They
  now ask for text presentation and take `currentColor`
- The card settings' background picker looped `1..6` as a literal, so a
  gradient added to `BACKGRADIENTS` appeared in the preference and not in the
  picker. It iterates the map now
- Every `var(--panel-radius, …)` in the app was dead code: `--panel-radius` is
  defined in `theme.css` at 18px, so the fallback never fires. Word Puzzle's menu
  pill has its own `--menu-radius` rather than relying on one
- `seclusa-base.css` and `mono.css` added to the service worker precache. Without
  them a launcher or game opened offline with every Material role unresolved
- `Prng.nextInt()` could freeze the tab permanently. Rejection sampling drew its four
  bytes once, *outside* the loop, so a draw the rejection test threw out was thrown out
  forever — `for (;;)` with nothing in it that could change the value. The event loop
  starved hard enough that not even a timer callback could fire to break out. The window
  is 48 values out of 2^32 at a bound of 52, about 1 in 90 million per draw; a deal is
  ~52 draws and an ensure-movability search is up to 2000 deals, so a full search crossed
  roughly 1 in 900. The bytes are drawn inside the loop now
- Hiding the tab within 200ms of opening a card game left the board permanently blank.
  `pause()` clears the same deferred timer list the first load is posted to, and
  `resume()` never put it back — so `hasLoaded` stayed false, which gates the timer and
  score saves, and the stack backgrounds drew over an empty game until a reload. The
  same list backs the after-move chain, so a pause inside the 100ms after the winning
  move dropped `testIfWon()` entirely: no win dialog, and the score never recorded
- The board stayed interactive during the ensure-movability deal search. It sets
  `stopUiUpdates`, which gates only the *drawing* of card movement, and opens its progress
  dialog non-modally, so neither `isDialogVisible` nor the movement check caught it. A
  drag reordered the very board the hint bot was evaluating, and the card moved in the
  model but not on screen until the search ended. This is the default path, not an edge
  case
- A single bad digit in a saved stack id cost the player their whole deal.
  `Stack.load()` indexed `shared.cards` unguarded, so an id that is out of range yielded
  `undefined` and `addCard` threw on it — unwinding the entire load. It skips and
  continues now, matching what `RecordList` already did for the same reason, and caps
  the list at the deck size so a list of a million valid ids repeated is not walked by
  `runSpacing`
- Saved score lists were re-parsed on every `Scores.load()` — every layout, every resume,
  every settings change — with no length ceiling, so a corrupt or hand-edited
  multi-megabyte value became a multi-million element array several times a session.
  `RecordList` capped its own lists for this reason; these did not
- The recycle and max-undo settings threw a TypeError when opened from the standalone
  game selector, which builds a `Preferences` but never a `GameLogic` or `RecordList`.
  The click handler died and the switch snapped back with no explanation
- **Clear all data** left Munch's legacy unprefixed `highScores` key on disk. The game
  reads it once to migrate an older record forward and its own comment says deleting it
  belongs to the launcher, but the key matched none of the launcher's prefixes — so the
  one control whose whole job is "erase everything this app stored" was keeping the
  high score it was meant to erase
- Switching between Klondike and Pyramid leaked a `window` storage listener and 24
  `Audio` elements per switch, permanently. `shared.sounds` is rebuilt per `GameManager`
  and `destroy()` only called `silence()`, which stops playback without unhooking
  anything; the listener was anonymous, so nothing could have removed it even in
  principle
- The service worker cached every URL it saw, keyed on the whole request including the
  query string, with no eviction until the next version bump. Cloudflare answers `200`
  for any query, so links with junk parameters grew a visitor's storage without bound,
  caused entirely by someone else. Only the app's own `?v=` stamp and query-less URLs are
  written down now
- Offline, a game that had never been opened fell through to the offline page even
  though its entry document was sitting in the cache. The launcher loads each game with
  `?v=` appended, while `GAME_ENTRIES` is precached at the query-less URL, so the exact
  match missed on the very first offline launch. The fallback now retries ignoring the
  search
- Cache writes were fire-and-forget. Once `respondWith` resolves the worker may be
  terminated, so a page served fine online could be absent from the offline copy

## [0.1.15] - 2026-10-16

### Fixed
- Clear-all data only deletes games caches and unregisters Seclusa Games service workers (not the whole origin)

### Changed
- White+black hub + game icons from sheet JPEGs; `ICON_V` / manifest **0.1.15**

## [0.1.13] - 2026-10-15

### Fixed

- **Fullscreen no longer stretches Klondike/Pyramid.** Enter/exit re-lays the board
  (parent posts `seclusa:viewport-changed`; canvas buffer tracks the playfield).

## [0.1.12] - 2026-10-15

### Fixed

- **Klondike / Pyramid touch drag.** Canvas uses `touch-action: none` with pointer
  capture so the browser cannot cancel a card drag as a pan/scroll.

### Changed

- **Version 0.1.12.**
- **Card menu bar** redesigned as a floating glass capsule (thumb-sized circular
  hits); removed back-to-menu and hide-bar — launcher ← Games is the exit.
- **Card settings** trimmed for one game per iframe: no light/dark, theme palette,
  main-menu, hide-menu, orientation, or immersive; **Games → Game**.
- **Blocks How to play** matches Tetris-only rules (full rows / Quad / Vault / Pressure);
  start-screen chips and Vault HUD copy updated the same way.

## [0.1.11] - 2026-10-15

### Added

- **Blocks board test suite** (`blockfall.test.js`): full-row find, single/double/triple
  collapse with holes kept, and `placePiece` no partial write above the board.

### Fixed

- **Shell no longer pins stale game HTML.** Entry documents are re-fetched with
  `cache: 'no-store'`, Blocks/Word Puzzle JS/CSS go network-first from the shell
  worker, and iframes load with `?v=` from the app version — so a rewrite like
  Blocks’ module split cannot leave the frame on yesterday’s `app.js`.
- **Word Puzzle XP label contrast.** Empty-track text used `on-primary` (deep maroon
  on crimson dark) and vanished; it is white with a scrim shadow so it reads on both
  the empty track and a filled bar.
- **Word Puzzle CSP now names `manifest-src 'self'`** (meta, `_headers`, `.htaccess`) so
  the install manifest is allowed under the same policy as the rest of the app.
- **Blocks Pressure slider reachable again.** A saved run no longer auto-starts (Continue /
  New game on the start screen); document `touchmove` no longer blocks the range control;
  Pause → New game returns to the start screen so Pressure can be set.
- **Blocks multi-line clears.** Collapsing used splice+unshift per row, which shifted
  indices and wiped the wrong rows (empty bottoms / floating holes). Clears now filter
  surviving rows once and pad empties at the top.
- **Continue no longer fights the Pressure slider.** Preferred new-game Pressure is stored
  separately from a saved run’s level; Continue restores the snapshot’s Pressure.
- **Card GameManager** unbinds canvas resize listeners on destroy; **Blocks `placePiece`**
  validates all cells before writing so a topped-out lock cannot dirty the board.

### Changed

- **Version 0.1.11.**
- **Launcher game tiles.** Centred flex wrap (no dead cell under five games), primary
  hover glow, icon lift, and a short entrance motion.
- **Blocks Tetris-only rewrite** under `games/blockfall/js/` (full rows only; SEAL /
  column-pack removed; Vault tracks lines; `RUN_SAVE_VERSION = 2`).

## [0.1.10] - 2026-10-14

### Changed

- **Munch's on-screen D-pad is gone; swipes steer instead.** Four buttons cost a reach, a
  chunk of the bottom of the screen — most of the maze on a phone in portrait — and a
  handedness setting to remember between sessions. A swipe is one gesture, it turns twice
  in a single movement without lifting a finger, and it gives the screen back. The pad's
  pause button is the one part worth keeping, and it is now a single button in the corner,
  shown only where there is no End key, so a desktop never grows a second control for a
  key it already has. It still dispatches the same keydown/keyup pair, so it is the real
  control by construction and cannot drift from the keyboard. The title screen and the hint
  chip now name the controls the device actually has rather than the ones the arcade had,
  and the swipe threshold moved from 4px to 10px: it was tuned when a misread swipe cost
  nothing because the pad was right there, and a resting thumb that drifts 4px would now
  steer *and* swallow the tap that should have started the game. The pad-side preference
  went with it; both key names are left in a returning player's storage for the launcher's
  "clear all data" rather than deleted from inside a game.
- **Every game's `.htaccess` and `_headers` now carry the same policy**, character for
  character, and the card games' and Munch's carry the full directive set the launcher has,
  including `upgrade-insecure-requests` — a game's own `/*` block replaces the root's
  rather than merging with it, so a directive missing from a game file is missing from that
  path on Cloudflare too.
- **The word dictionary is filtered at the source**, by `scripts/filter-words.py`, rather
  than hidden behind a runtime check that would leave the words in a public repository.
- **Munch's touch-pad preference moved to `ssc.munch-pad-side`**, the last key still
  carrying the old name. The previous key is read when the new one has never been written,
  so nobody's handedness is reset by the rename.
- **Word Puzzle and Blocks load the shared stylesheet on their offline pages**, which their
  own workers precache for exactly that document — the fallback used to render without the
  palette the rest of the app is in.
- **222 tests across 11 suites, up from 198**, and `scripts/test_serve.py` grew from 258
  checks to 401. The new ones are the ones that would have caught the bugs above: a game's
  two header transports compared directive by directive, the worker's `connect-src`
  carve-out, the offline page's style hash recomputed from the document, the launcher's
  tile icons held against its own registry, and the palette list compared across all three
  theme files — `theme-boot.js` included, which runs before the first paint and had no
  test at all.
- **Version 0.1.10.** One version for the app: it is declared in `manifest.json` and
  mirrored in `index.html`, all three service workers read it from that one manifest to
  name their caches, and a test fails the build if a per-game manifest ever grows a version
  of its own. The games' caches are separate namespaces, not separate versions — two caches
  have to exist for two games' assets not to collide, and both carry the same number.
  Every `?v=` cache-buster is gone with it, along with the per-game version literals and
  the `<meta name="version">` in Blocks and Word Puzzle: a literal that has to be bumped
  by hand in six files is a literal that will be missed in one of them, and a returning
  visitor then keeps the stale file for as long as the cache lives.
- **New logo and app icon.** The SG monogram and wordmark, supplied as artwork, now
  replace the previous arch mark. `scripts/extract-brand.py` reads the two supplied images
  and writes `brand/{logo,mark,icon}.png` with a real alpha channel derived from
  luminance, so the wordmark sits on whichever palette is active with no off-white box
  around it — the reason the old sheet was written the way it was. `scripts/make-icons.py`
  then resamples the icon into the four sizes the manifest declares. The launcher tile and
  the PWA icons are regenerated from that, not hand-edited.
- **Seclusa Munch's icon is the character drawing**, supplied as `pacdude.jpeg` in the app
  root, rather than a second rendering of Munch drawn in code. `scripts/make-munch-icons.py`
  finds the subject by measuring what differs from the field the drawing was made on, crops
  a square around it and resamples it to the four sizes the game ships — so the icon cannot
  drift from the artwork the way a separately drawn one did. The favicon is cropped to the
  cap and face: at 32px the arms, legs and mouth are one pixel each.
- **The footer links to the source**, and the About dialog lists it. Both used to say the
  source did not exist. The pill is a plain anchor rather than something the shell wires
  up, so the licence obligation is still met with JavaScript disabled.
- **The card games' fork lineage is recorded**: Simple Solitaire Collection, by way of
  `ambr3/Seclusa-Solitaire`, which is where the APK fork lives.
- **The sound pill is the master everywhere.** The card games' own sound and winning-sound
  settings and the Blocks HUD's music and effects toggles all stay — they are finer-grained
  and Blocks is the only game with a music track — but they now sit *underneath* the pill
  rather than beside it. Pill off means silence in every game, whatever those four toggles
  say.
- **Blocks: a cleared line collapses like a falling-block game.** It used to run every
  column through full gravity after a clear, so clearing one row near the top teleported
  the whole stack to the floor. A colour match still settles — a dissolved cluster that
  hung in the air would look broken — and a line clear now removes the cleared rows and
  drops everything above them by exactly that many rows.
- **Pac-Man is now Seclusa Munch**, with its own identity and one game in it. The launcher
  tile, the page title, the help card, the credits, the high-score key (`ssc.munch_high_score`,
  folding in the old one) and a new icon all carry the new name. The ghosts are **Rook**,
  **Pip**, **Nix** and **Bram**. The maze is the arcade maze, pellet for pellet, and the
  speed patterns, scatter and chase schedule, release counters, Elroy, fright timings and
  fruit ladder are the arcade's.
- **Ms. Pac-Man and turbo are gone.** One game means one game. The title screen is a name,
  the cast, the record and *press start* — on any key, which is the fix for the bug below.
- **The engine is a rewrite, not a fork.** `games/pacman/` is plain ES modules loaded
  straight by the browser: no `pacman.js` bundle, no `build.sh`. Every sprite is canvas
  geometry and the maze walls are traced from the maze's own ASCII, so there is no image
  file in the game at all. Dropped with it: cutscenes, Crazy Otto, Cookie-Man's procedural
  maze generator, learn mode, practice mode and the VCR, and the score table screen.
- **The game is set in the app's own typeface.** Sora and DM Sans, declared in
  `games/pacman/theme.css` and loaded from the app's `assets/fonts/`.
- **Fullscreen** is one control in the stage bar for all five games.
- **One instruction source.** Blocks' rules, the piece catalogue, and Munch's controls
  and credits moved into a launcher "How to play" dialog; both games' own `?` buttons
  were removed.
- **Blocks gained Beam**, a five-cell straight piece, appended rather than inserted so
  existing saved games keep their piece-to-colour mapping.
- **Munch gained an on-screen D-pad** for touch play, dispatching the same key events
  the keyboard produces so it cannot drift from the real controls.
- **Blocks and Word Puzzle share one layout language**: a single panel radius across both,
  and a matching stat strip in Word Puzzle.
- **The version is shown once**, in the launcher's About dialog, read from the
  `<meta name="version">` in `index.html`. It is no longer printed in any game.
- **Navy is the default palette**, set consistently across every place that declares it,
  plus a `:root` block in `theme.css` so it holds before any JavaScript runs.
- **Twelve palettes** (was four), each with the full Material 3 role set in both schemes.
- **Blocks' pressure curve** front-loads its climb and steepens into the last stretch, so
  level 1 stays gentle and level 100 lands decisively faster.

### Fixed

- **Touch steering was broken on exactly the devices that need it.** The browser
  synthesises a `click` after every touch sequence, including a swipe, and that click ran
  `player.clearInputDir()` — so a swipe was cancelled by its own click before the next
  60Hz frame consumed it. A `swiped` flag distinguishes the two now; a genuine tap still
  clears a held direction.
- **Munch's ghost ladder was doubled before it was awarded.** The first ghost of a fright
  was worth 400 rather than 200 and the last was unreachable, while both the module's own
  comment and `config.js` state the arcade's 200/400/800/1600. The doubling moved to
  where the score leaves the board, so the number awarded and the number drawn agree.
- **Munch's soundtracks died permanently after the first state change.** `silence()`
  cleared the clip without clearing the loop flag, so every later `loop()` was a no-op —
  dying mid-chomp was enough. Muting had the same defect, and one-shot sounds re-armed
  themselves on a browser that honours the ended event. Pausing also left the chase
  warbling under the PAUSED overlay, because the simulation froze and the soundtrack did
  not.
- **Munch accepted a non-integer high score.** `Number.isFinite` let `12.5`, `1e21` and
  `"-0"` through to the header as text, and a non-numeric score would have persisted the
  string `"NaN"`. It is a safe integer on both the read and the write now, and a fruit
  eaten just before a death can no longer restart the chase loop in the middle of READY!.
- **The card engine's `Scheduler.cancelPending()` was an empty stub**, with a comment
  saying the handlers cancelled their own ids. They did not: the deal, hint and
  auto-complete loops and the EnsureMovability search outlived `destroy()`, and a search
  that outlived the screen held `stopUiUpdates` true, which silently freezes every game
  opened after it.
- **Card-game audio was unlocked before any user gesture.** `attachInput()` runs in the
  constructor, the autoplay policy rejected all six `play()` calls, and `unlocked` latched
  true anyway — so the first sounds of every session were silent. It is unlocked from the
  first real `pointerdown`/`keydown` now.
- **Corrupt card storage could hang or wedge the game permanently.** The undo list looped a
  stored entry count, so `1000000000` spun forever with no error; stored card and stack ids
  indexed `shared.cards` unchecked, so an out-of-range id threw on the *next* save and on
  every move after it. Both are bounded and validated now.
- **Backgrounding the tab mid-search ended a card game for good.** `resume()` called a hook
  nothing ever installed, and `step` is a closure from `start()`, so a paused search had
  nothing to resume. It re-deals from the untouched order and restarts the search.
- **Muting a card game did not mute it.** `silence()` iterated the pool, which holds one
  element per name, and `play()` replaces the pooled element with a clone when the original
  is still audible — so the clone that was actually playing was unreachable.
- **Pausing a card game left the win fanfare playing into a backgrounded tab**, its menu
  bar was built by interpolating a label into an `innerHTML` template, and every
  `GameSelector` refresh added a window resize listener that nothing ever removed.
- **A held D-pad button in Blocks kept repeating for the rest of the session** after a
  pause, a restart, a game over or a window blur — only `mouseup` on that button cleared
  it. Starting or resuming a game also started the music while the app-wide sound pill was
  off, which every other path already checked.
- **A restored Blocks run with no current piece was a wedge, not a fallback:** every input
  bailed and nothing spawned a piece, and the reload restored the same broken snapshot.
- **The Blocks HUD labelled a clear *event* as "clears"** while the real row count sat in
  an unused field, so a three-row clear showed as 1. Both counters are live now: rows are
  shown as lines, and seals drive Pressure exactly as before.
- **Word Puzzle's clock kept running while the tab was hidden** — a hidden tab's interval
  is throttled, not stopped, so switching tabs mid-round spent the player's time. The
  countdown suspends and resumes where it was, which is the only pause this game can offer
  honestly without a pause screen.
- **The workers' manifest read had no deadline** in Blocks and Word Puzzle, so a connection
  that neither answered nor refused stalled the first navigation — directly against that
  function's own "never blocks the page indefinitely" comment. Five seconds now, degrading
  to the adopted-cache path, which is the safe direction: a guessed name retires nothing.
- **Word Puzzle's found-words list grew without bound**, one row per guess, for as long as
  the tab stayed open.
- **The logo's declared intrinsic size was wrong**, so its box was the wrong shape until
  the image decoded and then jumped.
- **The Pac-Man Dossier credit pointed at a plain-HTTP address that no longer serves it**,
  which `upgrade-insecure-requests` would have rewritten to HTTPS on click. It is
  `https://pacman.holenet.info/` now.
- **A test asserted an API that does not exist.** `isPaused()` is not a method on
  `EnsureMovability` — `paused` is a field — so the teardown test could never have passed.
  It asserts the real state now.
- **An abandoned game could report "failed to load" over the game that replaced it.**
  Opening a game and going back before its `load` event fired removed the frame, and the
  frame's six-second check kept counting against a frame nobody was looking at any more.
  Open two games in a row and the first one's verdict arrived on top of the second, which
  then sat under a full-screen "failed to load" while playing perfectly well. The check is
  now cancelled when a frame is torn down, and a frame that is no longer the one on stage
  cannot report a failure at all.
- **Games could fail to open in the launcher, and the tablet was the only one that coped.**
  The frames asked for `games/pyramid/index.html`, and several hosts rewrite that into a
  301 to `games/pyramid/` — Cloudflare does it, and so does `serve`. In a normal tab the
  redirect is invisible; inside an iframe, Brave and Chrome often drop it and leave a blank
  chrome-error page, so the game never loaded even though its files were on the site. The
  frames now ask for the directory, which is the URL the redirect was heading for anyway.
  Two tests hold it: one refuses an `index.html` in the launcher registry, the other
  requires the service worker's precache list to match the launcher's paths exactly — they
  are two halves of one contract, and if they drift every game works online and fails
  offline.
- **The launcher's load check called a navigation in progress a failure.** It read a null
  `contentDocument` as "did not load" on a timer running from the moment the iframe was
  created, and a null document inside that window is not a failure at all — it is a
  navigation that has not committed yet. Failure is now keyed to the `load` event with a
  six-second timeout, so a game on a cold cache over a slow connection is waited for rather
  than reported missing.
- **The launcher could not be installed.** `index.html` had no `<link rel="manifest">`, so
  `display: standalone`, the icons, `theme_color` and `start_url` were all inert from the
  only screen a user reaches first. The root policy already declared `manifest-src 'self'`,
  which showed the link had been intended and lost.
- **Munch failed to load in production.** The root header policies apply
  `X-Frame-Options: DENY` and `frame-ancestors 'none'` to `/*`, and those are inherited by
  every subdirectory. Munch had no override, so the browser refused to frame it; Klondike
  and Pyramid had `_headers` but no `.htaccess` and so were broken on Apache only. All five
  games now carry a `_headers`, and `.htaccess` applies the same exception to every path
  under `games/` rather than relying on five copies of itself — only Munch had one, so four
  of the five games were still unframable on Apache before this.
- **Theme and About were unreachable on every phone.** Both bars are `flex: none` controls
  inside `overflow: hidden` pages, so below ~621px (launcher) and ~708px (in-game) the
  right-hand buttons were clipped with no way to scroll to them. The bars now shrink at
  narrow widths and scroll as a backstop.
- **Zoom was disabled on four of six documents** (`user-scalable=no`, WCAG 1.4.4), on the
  four games with the smallest text. All viewports now allow zoom and declare
  `viewport-fit=cover`.
- **A panel flashed in the top-left corner on opening Munch** — the canvas at its default
  300×150, with the stylesheet's radius and shadow, before the renderer sized and centred
  it. Hidden until real dimensions are observed.
- **First paint was green, then flipped to navy**, because `data-palette="green"` was
  hardcoded in both HTML documents while the default had moved to navy.
- **Browser chrome colour ignored the palette.** The `theme-color` meta was written to
  green's anchors unconditionally, overwriting the manifest's value. It is now read from
  the active palette's own token.
- **The "failed to load" card was unreachable.** `error` does not fire on `<iframe>` for
  HTTP failures, so a missing game left a blank rectangle. Now detected via same-origin
  `contentDocument`.
- **A `style` attribute in Blocks' offline page was blocked** by that page's own
  `style-src 'self'` policy, so its fallback rendered flush to the corner.
- **Paused-state audio controls had no `aria-pressed`**, and every licence and fork link was
  a `<span>` with a click handler — unreachable by keyboard and invisible to the
  accessibility tree. Both fixed.
- **Game tiles announced as "list item"**: `role="listitem"` on a `<button>` overrides its
  native button role.
- **`theme-boot.js` was missing from the service worker's precache** while the precache
  list was documented as the exact set of URLs the documents request. A cold install that
  went offline before Munch had ever been opened could not fetch it, and the one game whose
  palette is its identity repainted with the markup default before correcting itself.
- **`offline.html` was the only document missing `upgrade-insecure-requests`.** Inert today
  — nothing on that page is fetched over http — but a policy that silently differs from
  every other document in the app is how the next subresource arrives unupgraded.
- **"Clear all data" could finish before it had finished.** The reload that ends the
  teardown was fired while the `caches.delete` calls were still in flight, and a navigation
  tears the context down with them, so offline copies could survive a wipe the user was
  told could not be undone. The deletion is now awaited before the reload.
- **The Pac-Man Dossier link in the footer was `http://`.** Every other external reference
  in the app is https.

- **The header painted light before it corrected itself.** `<html>` declares
  `data-theme="light"` — the right answer with JavaScript off — and the script that reads
  the real preference could not run until `theme.js` at the end of the body. Every load
  therefore painted the whole app in the wrong mode and then corrected: a white header on a
  dark-mode phone, for as long as parsing a game registry and two stylesheets took. A tiny
  synchronous `theme-boot.js` now sets both attributes in `<head>` ahead of the stylesheets,
  so there is no wrong frame to correct. This is what "the theme does weird things on
  devices" turned out to be; the palettes themselves were measured across all twelve in
  both modes and were correct throughout.
- **The launcher's sound pill did not reach a running game.** The pill writes localStorage
  from the launcher document and each game is a same-origin frame, so the write arrives as
  a `storage` event — but the card games had no listener, so Klondike kept playing with the
  pill showing off. Blocks now listens from its constructor rather than from its first
  gesture, which had left a hole exactly where it hurts: open the game, turn the pill off,
  then start playing, and the game started making noise at someone who had just asked it
  not to.
- **A sound setting that outlived the master.** Klondike's winning sound was gated only by
  its own setting, so a player who had turned the pill off still got a fanfare every time
  they won. It is gated by the master first now.
- **The card games and the launcher disagreed about the default.** Both read the same
  preference key, and the launcher said sound-on while `Preferences.js` said off, so a fresh
  install showed a pressed Sound pill over a silent card game.
- **`READY` had a dotted line after it.** The arcade drew its exclamation as its own sprite
  — five two-pixel blocks at three-pixel spacing — which on a proportional font rendered as
  debris beside the label. The messages now centre by canvas rather than by arithmetic on
  string length, so the glyph can just be in the text.
- **Eaten pellets were never erased from the maze.** The maze is drawn once into an
  offscreen canvas and blitted each frame; nothing told that canvas a pellet had gone.
- **The player still lost most of his face against a wall.** The chomp's widest frame was a
  2-radian wedge — 229° — which measured 1,911 lit pixels and 30 wide against 8,436 and 104
  for the closed frame. Because the frame counter freezes the moment he stops, that sliver
  is what he wore every time he reached a wall. It is now about 70°, and a stopped player
  holds a closed mouth rather than whatever frame he froze on.
- **The player was upside down whenever he faced up.** The sprite rotated as a whole, so
  the cap and the eyes went round with the head. Only the head turns now; the cap, eyes and
  legs are drawn afterwards, upright.
- **The audio is built on the first key press or tap** rather than at load, which removes
  nine parallel requests the player had not asked for from page load.
- **The fright timer was one frame long.** It tested its counter before incrementing it.

### Added

- **A cast, not a recolour.** Munch wears a red baseball cap and has legs; the four ghosts
  have faces — Rook spiked and scowling, Pip square-footed, Nix in a flat cap and looking
  bored, Bram grinning — and square feet instead of a wavy hem. Every sprite is still canvas
  geometry, and there is still no image file in the game.
- **198 tests, up from 137** (222 by the end of this batch — see the top of this section).
  `pacman.test.js` (61) covers the maze data, the speed table,
  the turn priority and its tie-breaks, each ghost's targeting rule, the release counters,
  Elroy, the fright timings, the fruit ladder, the identity and the cast — loaded from
  `games/pacman/js/` itself, so there is no copy of the engine in the test that could drift
  from the one that ships. Eleven of them pin the cast by recording the 2D calls the
  sprites make, which needs no canvas: the mouth can never open past a right angle, the cap
  is never drawn inside a rotation, a ghost's body never turns, and a frightened ghost keeps
  the outline it had.
- **`theme-boot.js`**, a synchronous pre-paint theme bootstrap, shared by the launcher and
  by Munch.

### Removed

- **1.73 MB of Munch assets that nothing referenced.** Two arcade pixel fonts left over from
  before the game was set in the app's typeface; the upstream `sprites/` folder — a sprite
  sheet, an Otto reference photograph and a Cookie-Man T-shirt graphic — from a build that
  drew from an image atlas this one does not; and six audio clips, the two cutscene cues and
  the four `ghost-spurt` loops. Every one was checked against the whole repository before
  removal, not just the game folder. `fruit/` and `mission/` stay: they are the research the
  maze and the fruit ladder came out of.
- **Dead code that the audit turned up.** `games/pacman/icon/index.htm`, a sprite preview
  page that loaded `../src/*.js` — deleted in the rebrand — and whose inline script the
  game's own CSP blocks, so it could never have run as served; Blocks' unreferenced
  `clearLocalData()`, which nothing called and which was already wrong (stale
  `aria-pressed`, board left un-reset) beside two legacy key constants only it used; the
  card engine's dead `DEFAULT_SOUND_WIN_ENABLED`, which said the win jingle defaulted to
  off while the code did the opposite; and Munch's Ms. Pac-Man `fruitPaths`, a dead blink
  constant for a blink the renderer does not do, and four unused getters.

### Security

- **Apache served the app service worker an empty cache.** A worker is governed by the CSP
  delivered with its own script response, not by the page's, and `.htaccess` gave every path
  `connect-src 'none'` — including `sw.js`, which reads `manifest.json` to name its cache and
  fills its precache through `Cache.add()`. `_headers` had carried the `'self'` exception all
  along and `.htaccess` never did, so the two hosts were running different policies and only
  one of them worked. `.htaccess` now sends the worker the same narrow exception, and
  `scripts/test_serve.py` compares all four declarations — `index.html`, `offline.html`,
  `_headers` and `.htaccess` — so the next edit cannot drift one away from the others
  silently.
- **`theme-boot.js` was not in the Apache no-cache list** although `_headers` had it, so a
  host reading this file could serve a copy of the pre-paint theme script that no longer
  matches the palettes the rest of the app offers.
- **Both games' service workers were served `connect-src 'none'` too**, which breaks
  offline mode in Blocks and Word Puzzle. A worker is governed by the CSP delivered *with
  its own script response*, so every `Cache.add()` in the install step and the manifest
  read that names the cache were blocked. The symptom is a cache that exists, is
  correctly named, and holds nothing — indistinguishable from a healthy one until the
  second offline load fails. The app's own worker already had the carve-out, with the
  failure written down above; the two game workers did not.
- **Four of the five games could not be framed at all on Apache.** The root `.htaccess`
  set `X-Frame-Options: DENY` and `frame-ancestors 'none'` for every path, and Apache
  *inherits* a parent directory's headers into every subdirectory, so only Munch — which
  has its own `.htaccess` — was framable. The launcher showed "failed to load" for the
  other four on any Apache host while Cloudflare and Netlify were fine. The games are
  `SAMEORIGIN` / `'self'` everywhere now, gated on the request path, and the launcher's
  own `DENY` is kept.
- **Both card games were completely silent on Apache.** `games/{klondike,pyramid}/.htaccess`
  said `media-src 'none'` while the `_headers` file beside each one said `'self'`. The
  engine plays its sounds through `new Audio(...)`, which is a media element, so on any
  Apache host there was no sound at all — while the identical build on Cloudflare had it.
  Nothing local could show it: a plain file server reads no config, and `scripts/serve.py`
  parses `_headers`, not `.htaccess`. Every game's two config files now carry one policy,
  character for character, and a test compares them.
- **The last `unsafe-inline` is gone, and it was not working anyway.** `offline.html`
  inlines its stylesheet so it can render when the stylesheet request is what failed, and
  allowed it with `'unsafe-inline'` in its own `<meta>`. A CSP header and a CSP `<meta>`
  both apply and the stricter one wins — the header sent for every path says
  `style-src 'self'` — so the page rendered unstyled on every host that sends a header
  while looking correct on `python3 -m http.server`. It is allowed by the sha256 of its
  own style block now, in the meta and in both header files, and the test recomputes the
  digest from the document so the three cannot drift apart.
- **"Clear all data" could leave the offline copies behind.** The dialog reloaded the page
  while `caches.delete` was still in flight. The deletions are awaited now, with a terminal
  catch, and the reload happens after them.
- **Three of the five launcher tiles had no icon offline.** The tile images are requested
  by the launcher, so they are served by whichever worker's scope covers the URL — and
  Klondike, Pyramid and Munch have no worker of their own, so their icons were cached
  nowhere. All five are precached now, and a test holds that list to the launcher's
  registry.
- **The word dictionary shipped slurs and profanity.** `words.js` is a raw 168,551-word
  English list, and Zen mode lets a player enumerate whatever is in it — 272 entries are
  gone, along with one hand-written word in `game.js`. The filter is
  `scripts/filter-words.py`, and it is deliberately *not* a substring filter: matching
  anywhere would have taken *spice*, *auspicious*, *cocoon*, *denude*, *prickly* and
  *japanese* along with them. The whole cost is two words, *niggle* and *twattle*.
- **No action needed on the rest of the surface:** every `target="_blank"` already carried
  `rel="noopener noreferrer"`, and the audit found no cookies, no analytics, no beacons,
  no `eval`, no `document.write`, no `innerHTML` fed by anything untrusted, and no
  third-party subresource of any kind. Munch was measured making 42 requests on boot and
  0 off-origin.

## [0.1.8] - 2026-10-13

### Added

- **137 tests, up from 114.** Two new suites cover the app around the engine, because the
  bugs that actually happened were all there rather than in the card engine:
  - `shellStatic.test.js` turns the security and privacy invariants into assertions over
    the real served files — every document carries a CSP and a Permissions-Policy, the
    policy locks the app to its own origin and forbids `unsafe-eval`, `unsafe-inline`
    appears in exactly one place, nothing loads a third-party subresource, no new-tab link
    is missing `rel="noopener"`, every manifest `id` resolves inside its own scope, and
    the palette list cannot drift between `theme.js`, `theme-game.js` and `theme.css`.
  - `themeGame.test.js` drives `theme-game.js` in a real iframe, including the mid-parse
    load that exposed the light-theme bug: the subject is left with the wrong
    `data-theme` and the test asserts it is corrected once loading completes, and that an
    explicit light or dark choice is left alone.
- `tests.html` now allows `connect-src 'self'`. It is the one departure from the shipped
  documents, which use `'none'`, and exists only so the shell suite can read this app's
  own source files. Asserting those properties against a copy of the source would have
  tested the copy.

### Changed

- **Manifest `id` is now `"./"` everywhere.** It was an absolute path —
  `/seclusa-games`, `/games/blockfall/`, `/games/word-puzzle/` — which only resolves
  inside the scope when the app is deployed at exactly that path. Hosted anywhere else the
  browser discards the id and the app's identity silently becomes location-dependent.
- **Per-game manifests no longer carry a `version`.** Nothing read one: all three service
  workers read the *root* `manifest.json` to name their cache, which is the app's single
  version literal. Two extra literals could only drift, and `sw.js` already documented
  "there is no per-game version to keep in step and nothing to drift".
- Root `start_url` is `"./"` rather than `"./index.html"`, so it matches the scope.
- Test page retitled "Seclusa Games tests" — it no longer covers only the card engine.

### Fixed

- **The app claimed it could be audited when it cannot.** The About dialog and the README
  both said "the source is published so you can audit it — which is the entire point",
  while the launcher footer said "Source not published yet". Only the footer was true.
  Both claims now state that this project's own repository is not published yet, so the
  GPL-3.0 licence cannot be exercised against this app yet — and that the licences of the
  two projects it forks can. A trust claim that is not true is worse than no claim.
- **Seven stale green `theme-color` anchors.** Five documents (root `offline.html`,
  Pac-Man, Word Puzzle, Klondike, Pyramid) still carried the pre-navy green `#14532d` as
  their first-paint browser-chrome colour, so the address bar flashed green before the
  palette applied. All now use navy's own anchor `#0d2340`, matching `index.html` and the
  manifest. The `#14532d` inside `theme.css` and `games/pacman/theme.css` is green
  *palette's* legitimate anchor and is left alone.
- **Pac-Man had no `Permissions-Policy`.** The one served document in the app missing it.
  Added, denying the whole capability surface as every other document does.
- **`scripts/serve.py` served the app with no security headers at all**, so anything that
  worked locally could be relying on a CSP that was not actually being enforced — the
  usual way a policy difference escapes into a release. It now sends the same header set
  as `_headers` and `.htaccess`.
- **`iconSvg()` threw on an unknown icon name.** `ICONS[name]` returned `undefined` and
  `.fill` on it raised a `TypeError` that took down whatever was building the node. Every
  caller passes a literal today, so this never fired; it now returns an empty string so a
  future typo is cosmetic rather than a crash.
- **README palette count was wrong** — it documented four palettes; there are twelve.

### Corrected in the record

- An earlier pass in this session reported that the root `index.html` and `offline.html`
  had no CSP meta at all. They do — the `content` attribute is wrapped across two lines and
  the check that produced that finding only matched single-line values.

## [0.1.7] - 2026-10-13

### Added

- **Seclusa Games brand artwork.** The supplied lockup and app icon are extracted from
  `game logo.jpeg` by `scripts/extract-brand.py` into `brand/{logo,mark,icon}.png` with a
  real alpha channel — the sheet is a JPEG, so treating its ground as opaque would have
  left an off-white box around the mark on the dark palettes. `scripts/make-icons.py`
  builds the four manifest icons from it; the maskable variant insets the mark to 72% on
  a bled black field so Android's circle and squircle masks cannot crop the arch.
- **Left / right handed Pac-Man pad.** The D-pad docks to the chosen screen edge instead of
  always sitting bottom-centre, with a Left / Right toggle that travels with it and is
  remembered. Mirrors Blocks' "Left hand" / "Right hand" choice rather than fighting it.
- **Keyboard-cluster pad layout.** UP alone on the top row, LEFT, DOWN and RIGHT beneath,
  replacing the symmetric cross — the arrangement people already have muscle memory for,
  and one row shorter, which matters because the pad overlays the maze.
- **One-pill Word Puzzle menu.** The stat strip, mode card, level card and action row are
  now rows of a single centred panel divided by hairlines, instead of four separately
  bordered boxes stacked from the top of the screen with a third of the viewport empty
  beneath them.

### Fixed

- **Pac-Man was invisible on every touch device.** `touch-pad` was used for two different
  things: the coarse-pointer state on `<body>`, and the pad element's own class. On a
  phone `<body class="touch-pad">` therefore matched the pad's `display: none;
  position: fixed` rule and the entire game inherited `display: none`. The canvas had
  layout of 0×0 and nothing was on screen — it reproduced only on touch devices, which is
  why it looked like a mobile-only loading failure. The state class is now `has-touch-pad`;
  two distinct names cannot collide. Blockfall uses `body.touch-pad` too but has no
  element sharing the name, so it was never at risk.
- **Pac-Man's canvas could stay permanently hidden.** The `canvas-ready` gate that
  suppresses the unsized-canvas corner flash waited for the canvas to exceed 300×150 on
  the assumption the game always sizes up. Where that assumption failed the class never
  landed and `visibility: hidden` stayed on the game's only visible element — the game
  ran, the screen was black. It now reveals when the dimensions change *at all*, with a
  2.5s timeout as a failsafe, so no path leaves the canvas hidden.
- **Three of five games rendered in light theme on a dark device.** `theme-game.js` applies
  the theme once while parsing, and a freshly-created iframe does not reliably report the
  OS colour scheme at that point — measured as `prefers-color-scheme: dark` → `false` for
  the whole parse, then `true` from the next tick. Because the `change` listener was
  registered against a value still settling, no event ever fired and the frame stayed
  pinned to `data-theme="light"` while the launcher around it was dark. Re-checked once on
  `load`, writing only when the answer differs so listeners are not fired for a no-op.
  Pac-Man carries its own copy of this script and needed the same fix.
- **Word Puzzle landscape.** At 844×390 the menu needed 406px in a 330px frame, and the
  panel is `overflow: hidden`, so Play and High Scores were clipped off and unreachable.
  Landscape now uses a two-column panel — modes left, slider and actions right — which
  fits without dropping any button below 44px.
- **"Challenge" was clipped on narrow phones.** The four-across mode grid was applied by
  the short-viewport rule and so fired on any short screen including a 320px-wide one,
  where each column came to 64px. Height and width are different constraints: four across
  needs ~420px of panel to avoid truncating labels, so it is now keyed to width.
- **Word Puzzle's difficulty steppers were 38px**, under the 44px touch-target floor. Now
  44px; the menu has the slack at every size measured.

### Changed

- **The wordmark moved out of the header bar** and into the launcher body above the blurb.
  In the bar it was `display: none` below 620px, so the app's one piece of branding was the
  first thing dropped on every phone; it now shows at every width and no longer competes
  with four controls that need 44px each. Inverted for dark themes.
- **How to play** no longer ends with an attribution card. It said nothing about playing
  anything, and it named "Seclusa Blocks", which is not a thing — Blocks is one game inside
  Seclusa Games. Attribution and the trademark position were already in About.

### Notes

- The version bump to 0.1.7 is load-bearing, not bookkeeping. Each game serves its own
  `style.css`, `index.html` and `game.js` cache-first with no revalidation, under a cache
  named from the **root** manifest version. Editing those files without bumping the version
  means the change cannot reach an installed copy at all — which is how an earlier round
  of edits appeared to have no effect.
- `scripts/extract-brand.py` is the reason the assets can be regenerated; re-run it if the
  source sheet is replaced.

## [0.1.2] — 2026-10-12

### Added
- Unified launcher: five games (Klondike, Pyramid, Blocks, Pac-Man, Word Puzzle)
  behind one game menu, each in its own frame.
- Shared Material 3 theme — four palettes plus system/light/dark — applied to every
  game. Changing the palette in the launcher updates all five with no reload.
- Shared card-game engine ported from Tobias Bielefeld's Simple Solitaire Collection,
  in plain ES modules with no build step.
- "Clear all data" control under Appearance, erasing preferences, saved games, high
  scores and offline caches, scoped to this app's own keys.
- Fork attribution in the README and in the in-app About dialog.
- App icons generated by `scripts/make-icons.py`.

### Fixed
- The app service worker was never registered, so the app had no offline support and
  was not installable. Registered, with a precache that matches the URLs the documents
  actually request.
- A proxy, captive portal or CDN 5xx was being cached as the app's own offline copy,
  leaving the offline shell permanently broken.
- Card-game score and time pills were misaligned and overlapped the vertical menu bar.
- Cards jumped away from the pointer on drag, and tap-to-select never engaged — the
  grab offset was measured from the canvas instead of the card.
- Empty pills, caused by Android ARGB colour ints being emitted as CSS RGBA hex.
- The game timer displayed a six-figure hours field.
- Blocks and Word Puzzle had fixed dark palettes with no light mode; both now follow
  the shared theme.
- Borders rendered as a dotted hairline where their opacity was below the legibility
  floor; replaced with `--hairline` tokens.
- Cache-busters in Blocks and Word Puzzle were frozen, so stylesheet changes never
  reached returning visitors.

### Security
- `word-puzzle/sw.js` deleted every cache on the origin that was not its own,
  repeatedly wiping the launcher's cache. Now prefix-scoped.
- `X-Frame-Options: DENY` in the Blocks and Word Puzzle headers made them impossible
  for the launcher to frame. Now `SAMEORIGIN`.
- Pac-Man had no Content-Security-Policy at all, so the documented `connect-src
  'none'` guarantee did not hold for it.
- The three games returned a proxy's error page as the game document when offline
  behind an intermediary.

## [0.1.0] — 2026-10-11

### Added
- Initial Seclusa Games shell.

