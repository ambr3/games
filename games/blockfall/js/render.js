import { COLS, ROWS, WALL, CELL_ROUND, cellKey, JUICE_FLASH_MS } from './constants.js';
import { COLORS, CANVAS } from './theme.js';
import { ghostY } from './board.js';

function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
}

function mixHex(hex, toward, amount) {
    const h = hex.replace('#', '');
    if (h.length !== 6) return hex;
    const tr = toward === 'white' ? 255 : 0;
    const tg = toward === 'white' ? 255 : 0;
    const tb = toward === 'white' ? 255 : 0;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgb(${Math.round(r + (tr - r) * amount)},${Math.round(g + (tg - g) * amount)},${Math.round(b + (tb - b) * amount)})`;
}

function drawTilePattern(ctx, px, py, size, colorIdx) {
    const ink = CANVAS.ink;
    const inkSoft = CANVAS.inkSoft;
    const pattern = ((colorIdx - 1) % 9 + 9) % 9;
    const cx = px + size * 0.5;
    const cy = py + size * 0.52;
    ctx.save();
    roundRect(ctx, px, py, size, size, Math.max(3, size * CELL_ROUND));
    ctx.clip();
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = Math.max(1, size * 0.08);
    switch (pattern) {
        case 0:
            ctx.beginPath();
            ctx.ellipse(cx, cy, size * 0.16, size * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 1:
            ctx.fillStyle = inkSoft;
            ctx.fillRect(px + size * 0.15, py + size * 0.28, size * 0.7, size * 0.12);
            ctx.fillRect(px + size * 0.15, py + size * 0.58, size * 0.7, size * 0.12);
            break;
        case 2:
            ctx.fillStyle = inkSoft;
            ctx.fillRect(px + size * 0.28, py + size * 0.18, size * 0.12, size * 0.64);
            ctx.fillRect(px + size * 0.58, py + size * 0.18, size * 0.12, size * 0.64);
            break;
        case 3:
            ctx.beginPath();
            ctx.moveTo(px + size * 0.2, py + size * 0.75);
            ctx.lineTo(px + size * 0.75, py + size * 0.2);
            ctx.stroke();
            break;
        case 4:
            ctx.beginPath();
            ctx.moveTo(cx, py + size * 0.2);
            ctx.lineTo(cx, py + size * 0.8);
            ctx.moveTo(px + size * 0.2, cy);
            ctx.lineTo(px + size * 0.8, cy);
            ctx.stroke();
            break;
        case 5:
            ctx.beginPath();
            ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case 6: {
            const r = size * 0.08;
            [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].forEach(([u, v]) => {
                ctx.beginPath();
                ctx.arc(px + size * u, py + size * v, r, 0, Math.PI * 2);
                ctx.fill();
            });
            break;
        }
        case 7:
            ctx.beginPath();
            ctx.moveTo(px + size * 0.22, py + size * 0.35);
            ctx.lineTo(cx, py + size * 0.55);
            ctx.lineTo(px + size * 0.78, py + size * 0.35);
            ctx.stroke();
            break;
        default:
            ctx.strokeStyle = inkSoft;
            ctx.beginPath();
            ctx.moveTo(px + size * 0.32, py + size * 0.2);
            ctx.lineTo(px + size * 0.32, py + size * 0.8);
            ctx.moveTo(px + size * 0.68, py + size * 0.2);
            ctx.lineTo(px + size * 0.68, py + size * 0.8);
            ctx.stroke();
            break;
    }
    ctx.restore();
}

/** Locked cells: flat fill + pattern, no shadowBlur (cheap). Active/clearing can glow. */
function drawBlock(ctx, block, x, y, colorIdx, opts = {}) {
    const color = COLORS[colorIdx] || '#888';
    const pad = Math.max(2, block * 0.08);
    const px = x * block + pad;
    const py = y * block + pad;
    const size = block - pad * 2;
    const radius = Math.max(4, size * CELL_ROUND);
    const glow = opts.glow === true;
    const clearing = opts.clearing === true;

    ctx.save();
    if (glow || clearing) {
        ctx.shadowColor = clearing ? CANVAS.flashHot : color;
        ctx.shadowBlur = Math.max(4, block * (clearing ? 0.55 : 0.35));
    }

    if (clearing) {
        const flashOn = Math.floor(performance.now() / 70) % 2 === 0;
        const grad = ctx.createLinearGradient(px, py, px, py + size);
        grad.addColorStop(0, flashOn ? CANVAS.flashHot : mixHex(color, 'white', 0.55));
        grad.addColorStop(0.45, flashOn ? CANVAS.flashMid : color);
        grad.addColorStop(1, flashOn ? CANVAS.flashCool : mixHex(color, 'black', 0.2));
        ctx.fillStyle = grad;
    } else {
        ctx.fillStyle = color;
    }
    roundRect(ctx, px, py, size, size, radius);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, px + 1.5, py + 1.5, size * 0.55, size * 0.28, radius * 0.55);
    ctx.fill();

    if (!clearing) drawTilePattern(ctx, px, py, size, colorIdx);

    ctx.strokeStyle = clearing ? CANVAS.rimClear : CANVAS.rim;
    ctx.lineWidth = clearing ? 2 : 1;
    roundRect(ctx, px + 0.5, py + 0.5, size - 1, size - 1, radius);
    ctx.stroke();
    ctx.restore();
}

function drawGhost(ctx, block, x, y, colorIdx) {
    const color = COLORS[colorIdx] || CANVAS.ghost;
    const pad = Math.max(2.5, block * 0.1);
    const px = x * block + pad;
    const py = y * block + pad;
    const size = block - pad * 2;
    const radius = Math.max(4, size * CELL_ROUND);
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = color;
    roundRect(ctx, px, py, size, size, radius);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.75;
    ctx.setLineDash([3.5, 3]);
    roundRect(ctx, px, py, size, size, radius);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

export class Renderer {
    constructor(canvas, nextCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nextCanvas = nextCanvas;
        this.nextCtx = nextCanvas.getContext('2d');
        this.block = 24;
        this.wellKey = '';
        this.wellGrad = null;
        this.vignetteGrad = null;
    }

    setBlock(size) {
        this.block = size;
        this.canvas.width = COLS * size;
        this.canvas.height = ROWS * size;
        this.wellKey = '';
    }

    draw(game) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const block = this.block;

        const wellKey = w + 'x' + h + CANVAS.wellTop + CANVAS.wellMid + CANVAS.wellBot
            + CANVAS.vignetteIn + CANVAS.vignetteOut;
        if (this.wellKey !== wellKey) {
            this.wellKey = wellKey;
            this.wellGrad = ctx.createLinearGradient(0, 0, 0, h);
            this.wellGrad.addColorStop(0, CANVAS.wellTop);
            this.wellGrad.addColorStop(0.55, CANVAS.wellMid);
            this.wellGrad.addColorStop(1, CANVAS.wellBot);
            this.vignetteGrad = ctx.createRadialGradient(
                w * 0.5, h * 0.4, h * 0.15,
                w * 0.5, h * 0.5, h * 0.75
            );
            this.vignetteGrad.addColorStop(0, CANVAS.vignetteIn);
            this.vignetteGrad.addColorStop(1, CANVAS.vignetteOut);
        }
        ctx.fillStyle = this.wellGrad;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = this.vignetteGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.lineWidth = 1;
        for (let r = 1; r < ROWS; r++) {
            ctx.strokeStyle = r % 2 === 0 ? CANVAS.gridMajor : CANVAS.gridMinor;
            ctx.beginPath();
            ctx.moveTo(0, r * block);
            ctx.lineTo(COLS * block, r * block);
            ctx.stroke();
        }
        for (let c = 1; c < COLS; c++) {
            ctx.strokeStyle = c % 2 === 0 ? CANVAS.gridMajor : CANVAS.gridMinor;
            ctx.beginPath();
            ctx.moveTo(c * block, 0);
            ctx.lineTo(c * block, ROWS * block);
            ctx.stroke();
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const v = game.board[r][c];
                if (v === WALL || v <= 0) continue;
                const clearing = game.isClearing
                    && game.clearingCells
                    && game.clearingCells.has(cellKey(r, c));
                drawBlock(ctx, block, c, r, v, { clearing });
            }
        }

        if (game.current && game.gameState === 'playing' && !game.isClearing) {
            const gy = ghostY(game.board, game.current);
            if (gy !== game.current.y) {
                for (let r = 0; r < game.current.shape.length; r++) {
                    for (let c = 0; c < game.current.shape[r].length; c++) {
                        if (game.current.shape[r][c]) {
                            drawGhost(ctx, block, game.current.x + c, gy + r, game.current.color);
                        }
                    }
                }
            }
            for (let r = 0; r < game.current.shape.length; r++) {
                for (let c = 0; c < game.current.shape[r].length; c++) {
                    if (game.current.shape[r][c]) {
                        drawBlock(ctx, block, game.current.x + c, game.current.y + r, game.current.color, { glow: true });
                    }
                }
            }
        }

        const now = performance.now();
        if (game.juiceFlashUntil > now && game.gameState === 'playing') {
            const t = (game.juiceFlashUntil - now) / JUICE_FLASH_MS;
            const a = 0.22 * game.juiceFlashStrength * t;
            ctx.fillStyle = CANVAS.juice.replace(/[\d.]+\)$/, `${a})`).replace(/^rgba?\(/, 'rgba(');
            if (CANVAS.juice.startsWith('#')) {
                ctx.fillStyle = `rgba(249,115,22,${a})`;
            }
            ctx.fillRect(0, 0, w, h);
        }
    }

    drawNext(piece) {
        const ctx = this.nextCtx;
        const w = this.nextCanvas.width;
        const h = this.nextCanvas.height;
        ctx.clearRect(0, 0, w, h);
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, CANVAS.nextWellTop);
        bg.addColorStop(1, CANVAS.nextWellBot);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const nameEl = document.getElementById('nextPieceName');
        if (!piece) {
            if (nameEl) nameEl.textContent = '—';
            return;
        }
        if (nameEl) nameEl.textContent = piece.name || '—';

        const shape = piece.shape;
        const rows = shape.length;
        const cols = shape[0].length;
        const blockSize = Math.min(18, Math.floor(88 / Math.max(cols, rows)));
        const offsetX = (100 - cols * blockSize) / 2;
        const offsetY = (100 - rows * blockSize) / 2;
        const radius = Math.max(3, (blockSize - 3) * CELL_ROUND);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!shape[r][c]) continue;
                const x = offsetX + c * blockSize + 1.5;
                const y = offsetY + r * blockSize + 1.5;
                const size = blockSize - 3;
                ctx.fillStyle = COLORS[piece.color] || '#888';
                roundRect(ctx, x, y, size, size, radius);
                ctx.fill();
            }
        }
    }
}
