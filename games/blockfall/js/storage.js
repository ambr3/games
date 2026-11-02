import {
    BEST_SCORE_KEY,
    RUN_KEY,
    RUN_SAVE_VERSION,
    ROWS,
    COLS,
    WALL,
    VAULT_METER_MAX,
    STREAK_METER_MAX,
    BAG_HISTORY
} from './constants.js';
import { PIECE_CATALOG, pieceFromIndex } from './pieces.js';

export function safeGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

export function safeSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        /* private mode / quota */
    }
}

export function loadBestScore() {
    const raw = safeGet(BEST_SCORE_KEY);
    const n = raw != null ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
}

export function saveBestScore(value) {
    safeSet(BEST_SCORE_KEY, String(value));
}

export function clearRun() {
    try {
        localStorage.removeItem(RUN_KEY);
    } catch (_) { /* ignore */ }
}

export function saveRun(game) {
    if (game.gameState !== 'playing' || game.isClearing) return;
    const snapshot = {
        v: RUN_SAVE_VERSION,
        board: game.board.map((row) => row.slice()),
        current: game.current ? {
            pieceIdx: game.current.pieceIdx,
            x: game.current.x,
            y: game.current.y
        } : null,
        nextIdx: game.next ? game.next.pieceIdx : null,
        score: game.score,
        level: game.level,
        startLevel: game.startLevel,
        lines: game.lines,
        vaultMeter: game.vaultMeter,
        lineStreak: game.lineStreak,
        easySpawnsLeft: game.easySpawnsLeft,
        bag: game.bag.slice(),
        dealHistory: game.dealHistory.slice(),
        lastShapeIdx: game.lastShapeIdx
    };
    safeSet(RUN_KEY, JSON.stringify(snapshot));
}

/**
 * @returns {object|null} restored fields, or null if discarded
 */
export function restoreRun() {
    const raw = safeGet(RUN_KEY);
    if (!raw) return null;

    let data;
    try {
        data = JSON.parse(raw);
    } catch (_) {
        clearRun();
        return null;
    }

    const bad = (msg) => {
        console.warn('Blockfall: discarded saved run —', msg);
        clearRun();
        return null;
    };

    if (!data || typeof data !== 'object' || Array.isArray(data)) return bad('not an object');
    if (data.v !== RUN_SAVE_VERSION) return bad('version ' + data.v);

    if (!Array.isArray(data.board) || data.board.length !== ROWS) return bad('board rows');
    const board = [];
    for (let r = 0; r < ROWS; r++) {
        const row = data.board[r];
        if (!Array.isArray(row) || row.length !== COLS) return bad('board row ' + r);
        const cells = [];
        for (let c = 0; c < COLS; c++) {
            const v = row[c];
            if (!Number.isInteger(v)) return bad('board cell');
            if (v < WALL || v > PIECE_CATALOG.length) return bad('board cell range');
            cells.push(v);
        }
        board.push(cells);
    }

    const inPieceRange = (d) => d && Number.isInteger(d.pieceIdx) &&
        d.pieceIdx >= 0 && d.pieceIdx < PIECE_CATALOG.length &&
        Number.isInteger(d.x) && Number.isInteger(d.y) &&
        d.x >= -4 && d.x <= COLS + 4 && d.y >= -4 && d.y <= ROWS + 4;

    if (!inPieceRange(data.current)) return bad('current piece');
    if (!Number.isInteger(data.nextIdx) || data.nextIdx < 0 || data.nextIdx >= PIECE_CATALOG.length) {
        return bad('next piece');
    }

    const num = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
    if (!num(data.score, 0, 1e9)) return bad('score');
    if (!num(data.level, 1, 100)) return bad('level');
    if (!num(data.startLevel, 1, 100)) return bad('startLevel');
    if (!num(data.lines, 0, 1e6)) return bad('lines');
    if (!num(data.vaultMeter, 0, VAULT_METER_MAX)) return bad('vaultMeter');
    if (!num(data.lineStreak, 0, STREAK_METER_MAX)) return bad('lineStreak');
    if (!num(data.easySpawnsLeft, 0, 8)) return bad('easySpawnsLeft');

    const idxList = (v, maxLen) => Array.isArray(v) && v.length <= maxLen &&
        v.every((n) => Number.isInteger(n) && n >= 0 && n < PIECE_CATALOG.length);
    if (!idxList(data.bag, PIECE_CATALOG.length * 4)) return bad('bag');
    if (!idxList(data.dealHistory, BAG_HISTORY * 4)) return bad('dealHistory');
    if (data.lastShapeIdx !== null &&
        !(Number.isInteger(data.lastShapeIdx) && data.lastShapeIdx >= 0 &&
          data.lastShapeIdx < PIECE_CATALOG.length)) {
        return bad('lastShapeIdx');
    }

    return {
        board,
        current: pieceFromIndex(data.current.pieceIdx, data.current.x, data.current.y),
        next: pieceFromIndex(data.nextIdx, 0, 0),
        score: data.score,
        level: data.level,
        startLevel: data.startLevel,
        lines: data.lines,
        vaultMeter: data.vaultMeter,
        lineStreak: data.lineStreak,
        easySpawnsLeft: data.easySpawnsLeft,
        bag: data.bag.slice(),
        dealHistory: data.dealHistory.slice(),
        lastShapeIdx: data.lastShapeIdx
    };
}
