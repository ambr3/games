/*
 * Blocks — Tetris board rules against the real modules.
 *
 * Pins full-row clear + collapse. The splice+unshift-per-row bug left empty bottoms
 * after multi-line clears; these cases would have failed then and must keep failing
 * if that path returns.
 */

import { describe, expect, it } from './runner.js';

import {
    createEmptyBoard,
    findFullRows,
    collapseClearedRows,
    clearCells,
    placePiece
} from '../../blockfall/js/board.js';
import { COLS, ROWS } from '../../blockfall/js/constants.js';

function fillRow(board, r, color = 1) {
    for (let c = 0; c < COLS; c++) board[r][c] = color;
}

describe('Blocks board — Tetris clear/collapse', () => {
    it('finds only completely filled playable rows', () => {
        const board = createEmptyBoard();
        fillRow(board, ROWS - 1, 2);
        board[ROWS - 2][0] = 3;
        const found = findFullRows(board);
        expect(found.fullRows).toBe(1);
        expect(found.fullRowIndices).toEqual([ROWS - 1]);
        expect(found.cells.size).toBe(COLS);
    });

    it('single bottom clear drops the stack with holes kept', () => {
        const board = createEmptyBoard();
        fillRow(board, ROWS - 1, 1);
        board[ROWS - 2] = [0, 2, 2, 2, 2, 2, 2, 2, 2];
        const found = findFullRows(board);
        clearCells(board, found.cells);
        collapseClearedRows(board, found.fullRowIndices);
        expect(board[ROWS - 1][0]).toBe(0);
        expect(board[ROWS - 1][1]).toBe(2);
        expect(board[ROWS - 2].every((c) => c === 0)).toBe(true);
    });

    it('double clear at the bottom preserves the row above (no empty floor)', () => {
        const board = createEmptyBoard();
        board[ROWS - 3] = [7, 7, 7, 7, 7, 7, 7, 7, 0];
        fillRow(board, ROWS - 2, 3);
        fillRow(board, ROWS - 1, 4);
        const found = findFullRows(board);
        expect(found.fullRows).toBe(2);
        clearCells(board, found.cells);
        collapseClearedRows(board, found.fullRowIndices);
        expect(board[ROWS - 1]).toEqual([7, 7, 7, 7, 7, 7, 7, 7, 0]);
        expect(board[ROWS - 2].every((c) => c === 0)).toBe(true);
        expect(board.length).toBe(ROWS);
    });

    it('triple clear pads empty rows at the top', () => {
        const board = createEmptyBoard();
        board[ROWS - 4] = [5, 0, 0, 0, 0, 0, 0, 0, 0];
        fillRow(board, ROWS - 3, 1);
        fillRow(board, ROWS - 2, 2);
        fillRow(board, ROWS - 1, 3);
        const found = findFullRows(board);
        expect(found.fullRows).toBe(3);
        collapseClearedRows(board, found.fullRowIndices);
        expect(board[ROWS - 1][0]).toBe(5);
        expect(board[0].every((c) => c === 0)).toBe(true);
        expect(board[1].every((c) => c === 0)).toBe(true);
        expect(board[2].every((c) => c === 0)).toBe(true);
    });

    it('placePiece does not leave cells when any block is above the board', () => {
        const board = createEmptyBoard();
        const piece = {
            shape: [[1], [1]],
            color: 4,
            x: 0,
            y: -1
        };
        const settled = placePiece(board, piece);
        expect(settled).toBe(-1);
        expect(board[0][0]).toBe(0);
        expect(board.every((row) => row.every((c) => c === 0))).toBe(true);
    });
});
