import { COLS, BAG_HISTORY } from './constants.js';

export const PIECE_CATALOG = [
    { id: 'spark', name: 'Spark', weight: 2, hard: 1, shape: [[1]] },
    { id: 'bolt',  name: 'Bolt',  weight: 4, hard: 1, shape: [[1, 1]] },
    { id: 'rail',  name: 'Rail',  weight: 4, hard: 2, shape: [[1, 1, 1]] },
    { id: 'knee',  name: 'Knee',  weight: 4, hard: 2, shape: [[1, 0], [1, 1]] },
    { id: 'wing',  name: 'Wing',  weight: 4, hard: 2, shape: [[1, 1], [0, 1]] },
    { id: 'seal',  name: 'Seal',  weight: 3, hard: 2, shape: [[1, 1], [1, 1]] },
    { id: 'hook',  name: 'Hook',  weight: 3, hard: 5, shape: [[0, 1, 0], [1, 1, 1], [1, 0, 0]] },
    { id: 'star',  name: 'Star',  weight: 3, hard: 5, shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },
    { id: 'cup',   name: 'Cup',   weight: 3, hard: 5, shape: [[1, 0, 1], [1, 1, 1]] },
    { id: 'gate',  name: 'Gate',  weight: 3, hard: 6, shape: [[1, 0, 1], [1, 1, 1], [1, 0, 0]] },
    { id: 'spike', name: 'Spike', weight: 2, hard: 7, shape: [[0, 1], [0, 1], [0, 1], [1, 1]] },
    { id: 'key',   name: 'Key',   weight: 2, hard: 8, shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0], [0, 1, 0]] },
    { id: 'vault', name: 'Vault', weight: 1, hard: 9, shape: [[1, 1, 1], [1, 1, 1]] },
    { id: 'beam',  name: 'Beam',  weight: 2, hard: 4, shape: [[1, 1, 1, 1, 1]] }
];

export const EASY_SHAPE_IDX = PIECE_CATALOG
    .map((p, i) => (p.hard <= 2 ? i : -1))
    .filter((i) => i >= 0);

export function clampDifficulty(n) {
    const v = Number.parseInt(n, 10);
    if (!Number.isFinite(v)) return 1;
    return Math.max(1, Math.min(100, v));
}

export function difficultyT(level) {
    return (clampDifficulty(level) - 1) / 99;
}

export function difficultyShape(level) {
    const t = difficultyT(level);
    return (Math.pow(t, 0.6) * 0.78) + (Math.pow(t, 3.2) * 0.22);
}

export function pieceBagCount(piece, level) {
    const t = difficultyShape(level);
    const soft = 1 - (piece.hard / 10);
    const scale = (1.55 * soft * (1 - t)) + (0.35 + 1.45 * (1 - soft) * t);
    return Math.max(1, Math.round(piece.weight * scale));
}

export function pieceFromIndex(pieceIdx, x, y) {
    const def = PIECE_CATALOG[pieceIdx];
    if (!def) return null;
    return {
        shape: def.shape.map((row) => [...row]),
        color: pieceIdx + 1,
        pieceIdx,
        id: def.id,
        name: def.name,
        special: def.special || null,
        x,
        y
    };
}

export function newPieceAt(pieceIdx) {
    const def = PIECE_CATALOG[pieceIdx];
    const shape = def.shape.map((row) => [...row]);
    return {
        shape,
        color: pieceIdx + 1,
        pieceIdx,
        id: def.id,
        name: def.name,
        special: def.special || null,
        x: Math.floor((COLS - shape[0].length) / 2),
        y: 0
    };
}

/** Bag + deal history for the running game. */
export class PieceBag {
    constructor(rng = Math.random.bind(Math)) {
        this.rng = rng;
        this.bag = [];
        this.dealHistory = [];
        this.lastShapeIdx = null;
        this.easySpawnsLeft = 0;
        this.level = 1;
    }

    setLevel(level) {
        this.level = level;
    }

    refill() {
        const level = this.level || 1;
        const indices = [];
        PIECE_CATALOG.forEach((piece, i) => {
            const n = pieceBagCount(piece, level);
            for (let w = 0; w < n; w++) indices.push(i);
        });
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        if (this.dealHistory.length && indices.length > 1) {
            const recent = new Set(this.dealHistory);
            let guard = 0;
            while (recent.has(indices[indices.length - 1]) && guard < 12) {
                const swapWith = Math.floor(this.rng() * (indices.length - 1));
                [indices[swapWith], indices[indices.length - 1]] =
                    [indices[indices.length - 1], indices[swapWith]];
                guard++;
            }
        } else if (
            this.lastShapeIdx != null &&
            indices.length > 1 &&
            indices[indices.length - 1] === this.lastShapeIdx
        ) {
            const swapWith = Math.floor(this.rng() * (indices.length - 1));
            [indices[swapWith], indices[indices.length - 1]] =
                [indices[indices.length - 1], indices[swapWith]];
        }
        this.bag = indices;
    }

    remember(idx) {
        this.lastShapeIdx = idx;
        this.dealHistory.push(idx);
        if (this.dealHistory.length > BAG_HISTORY) this.dealHistory.shift();
    }

    take() {
        if (this.easySpawnsLeft > 0 && EASY_SHAPE_IDX.length) {
            this.easySpawnsLeft--;
            const idx = EASY_SHAPE_IDX[Math.floor(this.rng() * EASY_SHAPE_IDX.length)];
            this.remember(idx);
            return idx;
        }
        if (!this.bag.length) this.refill();

        let pickAt = this.bag.length - 1;
        if (this.dealHistory.length && this.bag.length > 1) {
            const recent = new Set(this.dealHistory);
            for (let i = this.bag.length - 1; i >= 0; i--) {
                if (!recent.has(this.bag[i])) {
                    pickAt = i;
                    break;
                }
            }
        }
        const idx = this.bag.splice(pickAt, 1)[0];
        this.remember(idx);
        return idx;
    }

    nextPiece() {
        return newPieceAt(this.take());
    }
}
