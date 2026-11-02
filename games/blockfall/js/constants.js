/** Playfield and timing. Tetris-only rules: full rows clear, rows above shift down. */

export const COLS = 9;
export const ROWS = 16;
export const WALL = -1;

export const MAX_BLOCK_SIZE = 72;
export const MIN_BLOCK_SIZE = 12;

export const LOCK_DELAY_EASY = 920;
export const LOCK_DELAY_HARD = 260;
export const MAX_LOCK_RESETS = 20;
export const BASE_DROP_MS = 1650;
export const MIN_DROP_MS = 80;

/** Lines cleared per Pressure step (replaces SEAL-based pressure). */
export const LINES_PER_PRESSURE = 8;
export const QUAD_BONUS_ROWS = 4;
export const VAULT_METER_MAX = 10;
export const STREAK_METER_MAX = 6;
export const MAX_CLEAR_CHAINS = 8;
export const BAG_HISTORY = 3;

export const CLEAR_TOAST_MS = 1400;
export const JUICE_FLASH_MS = 340;
export const CLEAR_ANIM_MS = 320;
export const CELL_ROUND = 0.42;

export const DIFFICULTY_KEY = 'blockfall-difficulty';
export const HAND_KEY = 'blockfall-hand';
export const BEST_SCORE_KEY = 'blockfall-best-score';
export const RUN_KEY = 'blockfall-game-state';
/** Bumped: old SEAL/hybrid saves are incompatible with Tetris-only rules. */
export const RUN_SAVE_VERSION = 2;
export const MUSIC_MUTE_KEY = 'blockfall-music-muted';
export const SFX_MUTE_KEY = 'blockfall-sfx-muted';
export const MASTER_SOUND_KEY = 'ssc.pref_key_sound_enabled';

export function prefersReducedMotion() {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) {
        return false;
    }
}

export function cellKey(r, c) {
    return `${r},${c}`;
}
