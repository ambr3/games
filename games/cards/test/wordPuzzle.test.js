/*
 * Word Puzzle's pure logic, driven in its own page.
 *
 * game.js is a classic IIFE that runs against the game's DOM, so it cannot be imported.
 * It is loaded into a same-origin iframe of the real index.html instead, and the helpers it
 * publishes on `window.WordPuzzleTestHooks` are called from here. Only functions that take
 * their inputs as arguments are tested; nothing here writes to localStorage.
 */

import { describe, expect, it } from './runner.js';

const WORD_PUZZLE_INDEX = '../../word-puzzle/index.html';

let hooks = null;

async function loadHooks() {
    if (hooks) return hooks;
    // The flag is read by game.js while the frame loads, so it must be set first.
    window.__wordPuzzleTest = true;
    const frame = document.createElement('iframe');
    frame.setAttribute('title', 'word-puzzle subject');
    frame.src = WORD_PUZZLE_INDEX;
    document.body.appendChild(frame);
    await new Promise((resolve, reject) => {
        frame.onload = resolve;
        frame.onerror = () => reject(new Error('word-puzzle failed to load'));
    });
    delete window.__wordPuzzleTest;
    hooks = frame.contentWindow.WordPuzzleTestHooks;
    if (!hooks) throw new Error('word-puzzle did not publish WordPuzzleTestHooks');
    return hooks;
}

function cells(row, cols) {
    return cols.map((col) => ({ row, col }));
}

describe('word puzzle', () => {
    it('needs 50 XP for level 1 and 25 more for each level after', async () => {
        const h = await loadHooks();
        expect(h.xpNeededFor(1)).toBe(50);
        expect(h.xpNeededFor(2)).toBe(75);
        expect(h.xpNeededFor(10)).toBe(275);
    });

    it('recognises words from the built-in list', async () => {
        const h = await loadHooks();
        expect(h.isWord('cat')).toBeTruthy();
        expect(h.isWord('zzzq')).toBeFalsy();
    });

    it('scores a plain word by its letter values', async () => {
        const h = await loadHooks();
        const grid = [['c', 'a', 't']];
        const bonus = [[null, null, null]];
        // c=4, a=1, t=1; three letters earn no length bonus.
        expect(h.scorePath(cells(0, [0, 1, 2]), grid, bonus)).toBe(6);
    });

    it('doubles the word for a double-word tile and triples it for a triple-word tile', async () => {
        const h = await loadHooks();
        const grid = [['c', 'a', 't']];
        expect(h.scorePath(cells(0, [0, 1, 2]), grid, [[null, 'dw', null]])).toBe(12);
        expect(h.scorePath(cells(0, [0, 1, 2]), grid, [['tw', null, null]])).toBe(18);
    });

    it('triples a letter for a triple-letter tile', async () => {
        const h = await loadHooks();
        const grid = [['c', 'a', 't']];
        // c=4*3=12, a=1, t=1.
        expect(h.scorePath(cells(0, [0, 1, 2]), grid, [['tl', null, null]])).toBe(14);
    });

    it('adds 5 points per letter past four', async () => {
        const h = await loadHooks();
        const grid = [['a', 'a', 'a', 'a', 'a']];
        const bonus = [[null, null, null, null, null]];
        // Five a's = 5 letter points, plus (5 - 4) * 5 length bonus.
        expect(h.scorePath(cells(0, [0, 1, 2, 3, 4]), grid, bonus)).toBe(10);
    });

    it('draws the letters from the pool in the vowel band for its size', async () => {
        const h = await loadHooks();
        const pool = 'EEEEEEEEEAAAAAAAIIIIIIOOOOOOUUUNNNNNNRRRRRRTTTTTLLLLSSSSDDDDGGGBBCCMMPPFFHHVVWWYY';
        for (let run = 0; run < 50; run++) {
            const letters = h.pickLetters(pool, 16);
            expect(letters.length).toBe(16);
            const vowels = letters.filter((ch) => 'aeiou'.includes(ch)).length;
            expect(vowels).toBeGreaterThanOrEqual(5);
            expect(vowels).toBeLessThanOrEqual(6);
        }
    });
});
