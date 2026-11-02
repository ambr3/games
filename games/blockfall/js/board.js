import { COLS, ROWS, WALL, cellKey } from './constants.js';

/** Empty open vault — no wall notches. */
export function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function isPlayable(r, c) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

export function validPosition(board, piece, offsetX = 0, offsetY = 0) {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (!piece.shape[r][c]) continue;
            const newX = piece.x + c + offsetX;
            const newY = piece.y + r + offsetY;
            if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
            if (newY >= 0) {
                const cell = board[newY][newX];
                if (cell === WALL || cell > 0) return false;
            }
        }
    }
    return true;
}

/** Locks the piece onto the board. Returns settled cell count, or -1 if lock topped out. */
export function placePiece(board, piece) {
    const writes = [];
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (!piece.shape[r][c]) continue;
            const y = piece.y + r;
            if (y < 0) return -1;
            writes.push([y, piece.x + c]);
        }
    }
    for (let i = 0; i < writes.length; i++) {
        const [y, x] = writes[i];
        board[y][x] = piece.color;
    }
    return writes.length;
}

/**
 * Full rows only. Tetris gravity: remove those rows and shift everything above down.
 * Holes in surviving rows stay.
 */
export function findFullRows(board) {
    const rows = [];
    const cells = new Set();
    for (let r = 0; r < ROWS; r++) {
        let full = true;
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] <= 0) {
                full = false;
                break;
            }
        }
        if (full) {
            rows.push(r);
            for (let c = 0; c < COLS; c++) cells.add(cellKey(r, c));
        }
    }
    return { fullRowIndices: rows, fullRows: rows.length, cells };
}

/**
 * Drop every cleared row out, then pad empty rows at the top.
 * Must not splice+unshift one-by-one: each unshift shifts later indices and
 * deletes the wrong rows (multi-clears left holes / empty bottoms).
 */
export function collapseClearedRows(board, rowIndices) {
    const doomed = new Set(rowIndices);
    const kept = [];
    for (let r = 0; r < board.length; r++) {
        if (!doomed.has(r)) kept.push(board[r]);
    }
    const pad = Math.max(0, ROWS - kept.length);
    board.length = 0;
    for (let i = 0; i < pad; i++) board.push(new Array(COLS).fill(0));
    for (let i = 0; i < kept.length; i++) board.push(kept[i]);
}

export function clearCells(board, cells) {
    for (const k of cells) {
        const [r, c] = k.split(',').map(Number);
        if (isPlayable(r, c)) board[r][c] = 0;
    }
}

export function ghostY(board, piece) {
    if (!piece) return 0;
    let y = piece.y;
    while (validPosition(board, piece, 0, y - piece.y + 1)) y++;
    return y;
}
