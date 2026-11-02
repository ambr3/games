import {
    COLS, ROWS, MIN_BLOCK_SIZE, MAX_BLOCK_SIZE,
    LOCK_DELAY_EASY, LOCK_DELAY_HARD, MAX_LOCK_RESETS,
    BASE_DROP_MS, MIN_DROP_MS, LINES_PER_PRESSURE,
    QUAD_BONUS_ROWS, VAULT_METER_MAX, STREAK_METER_MAX,
    MAX_CLEAR_CHAINS, CLEAR_TOAST_MS, JUICE_FLASH_MS, CLEAR_ANIM_MS,
    DIFFICULTY_KEY, HAND_KEY, prefersReducedMotion
} from './constants.js';
import { safeGet, safeSet, loadBestScore, saveBestScore, saveRun, clearRun, restoreRun } from './storage.js';
import { clampDifficulty, difficultyShape, PieceBag } from './pieces.js';
import { AudioEngine } from './audio.js';
import {
    createEmptyBoard, validPosition, placePiece,
    findFullRows, collapseClearedRows, clearCells
} from './board.js';
import { Renderer } from './render.js';
import { bindInput } from './input.js';
import { refreshThemeColors } from './theme.js';

export class Blockfall {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.renderer = new Renderer(this.canvas, this.nextCanvas);

        this.block = this.fitBlock();
        this.renderer.setBlock(this.block);

        this.board = createEmptyBoard();
        this.current = null;
        this.next = null;
        this.score = 0;
        this.startLevel = clampDifficulty(safeGet(DIFFICULTY_KEY) || 1);
        this.level = this.startLevel;
        this.lines = 0;
        this.gameState = 'idle';
        this.dropInterval = this.dropSpeedForLevel(this.level);
        this.lastDrop = 0;
        this.lineStreak = 0;
        this.audio = new AudioEngine();
        this.animationId = null;
        this.onGround = false;
        this.groundTime = 0;
        this.lockResets = 0;
        this.lastFrameTime = 0;
        this.bagger = new PieceBag();
        this.bagger.setLevel(this.level);
        this.juiceFlashUntil = 0;
        this.juiceFlashStrength = 0;
        this.toastTimer = null;
        this.bestScore = loadBestScore();
        this.beatBestToasted = false;
        this.runStartBest = this.bestScore;
        this.isClearing = false;
        this.clearingCells = null;
        this.clearAnimUntil = 0;
        this.pendingClear = null;
        this.clearChain = 0;
        this.lastLockName = '';
        this.vaultMeter = 0;
        this.handMode = safeGet(HAND_KEY) === 'left' ? 'left' : 'right';
        this.holdStops = null;
        /** Preferred Pressure for the next new game (slider); independent of a Continue run. */
        this.preferredStartLevel = this.startLevel;
        this.continueAvailable = false;
        this.resumeSnapshot = null;

        this.bindUi();
        bindInput(this);
        this.syncDifficultyUI();
        this.syncHandUI();
        this.refreshBestDisplay();
        this.updateVaultHud();
        this.updateStreakMeter();

        /*
         * Offer Continue on the start screen instead of auto-resuming. Auto-resume hid
         * the Pressure slider, so a returning player could not set the starting level.
         */
        const saved = restoreRun();
        if (saved && this.applyRestored(saved)) {
            this.resumeSnapshot = {
                startLevel: this.startLevel,
                level: this.level
            };
            this.setContinueAvailable(true);
            this.updateDisplay();
            this.renderer.drawNext(this.next);
            this.renderer.draw(this);
        } else {
            this.setContinueAvailable(false);
            this.renderer.draw(this);
        }
    }

    setContinueAvailable(on) {
        this.continueAvailable = !!on;
        const cont = document.getElementById('continueBtn');
        const start = document.getElementById('startBtn');
        if (cont) cont.classList.toggle('hidden', !on);
        if (start) {
            start.textContent = on ? 'New game' : 'Start';
            start.classList.toggle('btn-secondary', !!on);
            start.classList.toggle('btn-primary', !on);
        }
        if (!on) this.resumeSnapshot = null;
        this.syncDifficultyUI();
    }

    get bag() { return this.bagger.bag; }
    set bag(v) { this.bagger.bag = v; }
    get dealHistory() { return this.bagger.dealHistory; }
    set dealHistory(v) { this.bagger.dealHistory = v; }
    get lastShapeIdx() { return this.bagger.lastShapeIdx; }
    set lastShapeIdx(v) { this.bagger.lastShapeIdx = v; }
    get easySpawnsLeft() { return this.bagger.easySpawnsLeft; }
    set easySpawnsLeft(v) { this.bagger.easySpawnsLeft = v; }

    applyRestored(data) {
        if (!data) return false;
        this.board = data.board;
        this.current = data.current;
        this.next = data.next;
        this.score = data.score;
        this.level = data.level;
        this.startLevel = data.startLevel;
        this.lines = data.lines;
        this.vaultMeter = data.vaultMeter;
        this.lineStreak = data.lineStreak;
        this.easySpawnsLeft = data.easySpawnsLeft;
        this.bag = data.bag;
        this.dealHistory = data.dealHistory;
        this.lastShapeIdx = data.lastShapeIdx;
        this.runStartBest = this.bestScore;
        this.beatBestToasted = false;
        this.bagger.setLevel(this.level);
        this.dropInterval = this.dropSpeedForLevel(this.level);
        return true;
    }

    dropSpeedForLevel(level) {
        const shaped = difficultyShape(level);
        return Math.max(MIN_DROP_MS, Math.round(BASE_DROP_MS - shaped * (BASE_DROP_MS - MIN_DROP_MS)));
    }

    lockDelayForLevel(level) {
        const t = difficultyShape(level);
        return Math.round(LOCK_DELAY_EASY + (LOCK_DELAY_HARD - LOCK_DELAY_EASY) * t);
    }

    fitBlock() {
        const boardHost = document.querySelector('.board-panel');
        if (!boardHost) return MIN_BLOCK_SIZE;
        this.positionHandControls();
        const vv = window.visualViewport;
        const viewTop = vv ? vv.offsetTop : 0;
        const viewLeft = vv ? vv.offsetLeft : 0;
        const viewBottom = viewTop + (vv ? vv.height : window.innerHeight);
        const viewRight = viewLeft + (vv ? vv.width : window.innerWidth);
        const rect = boardHost.getBoundingClientRect();
        const top = Math.max(rect.top, viewTop);
        const bottom = Math.min(rect.bottom, viewBottom);
        const left = Math.max(rect.left, viewLeft);
        const right = Math.min(rect.right, viewRight);
        const availW = Math.max(64, right - left - 8);
        const availH = Math.max(64, bottom - top - 8);
        const byW = Math.floor(availW / COLS);
        const byH = Math.floor(availH / ROWS);
        return Math.max(MIN_BLOCK_SIZE, Math.min(MAX_BLOCK_SIZE, byW, byH));
    }

    positionHandControls() {
        const hardDrop = document.getElementById('hardDropBtn');
        const mainPad = document.getElementById('controlsMain');
        const touch = window.matchMedia('(pointer: coarse)').matches
            || window.matchMedia('(hover: none)').matches
            || (navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 1100px)').matches);
        const landscape = window.matchMedia('(orientation: landscape)').matches;
        document.body.classList.toggle('touch-pad', touch);
        document.body.classList.toggle('landscape', landscape);
        [hardDrop, mainPad].forEach((el) => {
            if (!el) return;
            el.style.left = '';
            el.style.right = '';
            el.style.bottom = '';
            el.style.width = '';
            el.style.position = '';
            el.style.gridArea = '';
        });
    }

    resize() {
        const block = this.fitBlock();
        if (block === this.block) {
            this.renderer.draw(this);
            return;
        }
        this.block = block;
        this.renderer.setBlock(block);
        this.renderer.draw(this);
        this.renderer.drawNext(this.next);
    }

    validPosition(piece, ox = 0, oy = 0) {
        return validPosition(this.board, piece, ox, oy);
    }

    /** Tetris-only lock: place piece, then full-row clears with row-shift gravity. */
    lock() {
        if (!this.current || this.gameState !== 'playing' || this.isClearing) return;

        this.lastLockName = this.current.name;
        const settled = placePiece(this.board, this.current);
        if (settled < 0) {
            this.gameOver();
            return;
        }
        this.score += settled * 4;
        this.maybeBeatBest();
        this.audio.play('land');
        this.resetLockState();
        this.current = null;
        this.clearChain = 0;

        const lines = findFullRows(this.board);
        if (!lines.fullRows) {
            this.lineStreak = 0;
            this.updateStreakMeter();
            this.spawnAfterLock();
            this.updateDisplay();
            return;
        }
        this.lineStreak++;
        this.beginClear(lines);
    }

    beginClear(info) {
        this.isClearing = true;
        this.clearingCells = info.cells;
        this.pendingClear = info;
        const animMs = prefersReducedMotion() ? 0 : CLEAR_ANIM_MS;
        this.clearAnimUntil = performance.now() + animMs;

        if (info.fullRows >= QUAD_BONUS_ROWS) this.audio.play('vault');
        else this.audio.play('bind');

        const previewPressure = Math.min(
            100,
            this.startLevel + Math.floor((this.lines + info.fullRows) / LINES_PER_PRESSURE)
        );
        info.pressureUp = previewPressure > this.level;
        this.triggerClearJuice(info);
        this.updateStreakMeter();
        this.updateDisplay();
        if (animMs === 0) this.finishClear();
    }

    finishClear() {
        if (!this.isClearing || !this.pendingClear) return;
        const info = this.pendingClear;
        const cellCount = info.cells.size;

        clearCells(this.board, info.cells);
        collapseClearedRows(this.board, info.fullRowIndices);

        const streakMult = 1 + Math.min(this.lineStreak - 1, 5) * 0.2;
        let points = cellCount * 18 * this.level;
        points += info.fullRows * 100 * this.level;
        if (info.fullRows >= QUAD_BONUS_ROWS) points += 800 * this.level;
        this.score += Math.round(points * streakMult);
        this.lines += info.fullRows;
        this.registerLineProgress(info);
        this.maybeBeatBest();

        this.isClearing = false;
        this.clearingCells = null;
        this.pendingClear = null;
        this.clearAnimUntil = 0;

        this.clearChain++;
        if (this.clearChain < MAX_CLEAR_CHAINS) {
            const next = findFullRows(this.board);
            if (next.fullRows) {
                this.beginClear(next);
                return;
            }
        }

        this.spawnAfterLock();
        this.updateDisplay();
    }

    finishLineClear() {
        this.finishClear();
    }

    registerLineProgress(info) {
        const prevLevel = this.level;
        this.level = Math.min(
            100,
            this.startLevel + Math.floor(this.lines / LINES_PER_PRESSURE)
        );
        this.dropInterval = this.dropSpeedForLevel(this.level);
        this.bagger.setLevel(this.level);
        info.pressureUp = this.level > prevLevel;
        if (info.pressureUp) this.bagger.bag = [];

        this.vaultMeter += info.fullRows;
        while (this.vaultMeter >= VAULT_METER_MAX) {
            this.vaultMeter -= VAULT_METER_MAX;
            this.score += 800 * this.level;
            this.showBoardToast('VAULT BONUS');
            this.audio.play('vault');
        }
        this.updateVaultHud();
    }

    spawnAfterLock() {
        this.current = this.next;
        this.next = this.bagger.nextPiece();
        this.renderer.drawNext(this.next);
        this.resetLockState();
        this.lastDrop = performance.now();
        if (!this.current || !this.validPosition(this.current)) {
            this.gameOver();
            return;
        }
        saveRun(this);
    }

    move(dir) {
        if (this.gameState !== 'playing' || !this.current || this.isClearing) return;
        if (this.validPosition(this.current, dir, 0)) {
            this.current.x += dir;
            this.audio.play('move');
            this.resetLockDelay();
        }
    }

    tryPlaceShape(shape) {
        const original = this.current.shape;
        const origX = this.current.x;
        const origY = this.current.y;
        this.current.shape = shape;
        const kicks = [
            [0, 0], [-1, 0], [1, 0], [0, -1],
            [-2, 0], [2, 0], [-1, -1], [1, -1], [0, -2]
        ];
        for (const [kx, ky] of kicks) {
            if (this.validPosition(this.current, kx, ky)) {
                this.current.x += kx;
                this.current.y += ky;
                this.audio.play('rotate');
                this.resetLockDelay();
                return true;
            }
        }
        this.current.shape = original;
        this.current.x = origX;
        this.current.y = origY;
        return false;
    }

    rotate() {
        if (this.gameState !== 'playing' || !this.current || this.isClearing) return;
        const rows = this.current.shape.length;
        const cols = this.current.shape[0].length;
        const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                rotated[c][rows - 1 - r] = this.current.shape[r][c];
            }
        }
        this.tryPlaceShape(rotated);
    }

    softDrop() {
        if (this.gameState !== 'playing' || !this.current || this.isClearing) return;
        if (this.validPosition(this.current, 0, 1)) {
            this.current.y++;
            this.lastDrop = performance.now();
            this.score += 1;
            this.maybeBeatBest();
            this.updateDisplay();
            this.audio.play('tick');
        }
    }

    hardDrop() {
        if (this.gameState !== 'playing' || !this.current || this.isClearing) return;
        this.audio.play('drop');
        let dropped = 0;
        while (this.validPosition(this.current, 0, 1)) {
            this.current.y++;
            dropped++;
        }
        this.score += dropped * 2;
        this.maybeBeatBest();
        this.updateDisplay();
        this.lock();
    }

    resetLockDelay() {
        if (this.onGround && this.lockResets < MAX_LOCK_RESETS) {
            this.groundTime = 0;
            this.lockResets++;
        }
    }

    resetLockState() {
        this.onGround = false;
        this.groundTime = 0;
        this.lockResets = 0;
    }

    gameLoop(timestamp = 0) {
        if (this.gameState !== 'playing') return;

        const dt = Math.min(100, this.lastFrameTime ? timestamp - this.lastFrameTime : 16);
        this.lastFrameTime = timestamp;

        if (this.isClearing) {
            if (timestamp >= this.clearAnimUntil) this.finishClear();
            if (this.gameState !== 'playing') return;
            this.renderer.draw(this);
            this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        if (this.current && this.validPosition(this.current, 0, 1)) {
            const elapsed = timestamp - this.lastDrop;
            if (elapsed >= this.dropInterval) {
                const steps = Math.min(ROWS, Math.floor(elapsed / this.dropInterval));
                let fell = 0;
                for (let i = 0; i < steps; i++) {
                    if (!this.validPosition(this.current, 0, 1)) break;
                    this.current.y++;
                    fell++;
                }
                this.lastDrop += fell * this.dropInterval;
                if (fell < steps) this.lastDrop = timestamp;
            }
        } else if (this.current) {
            this.lastDrop = timestamp;
        }

        if (this.current && !this.validPosition(this.current, 0, 1)) {
            if (!this.onGround) {
                this.onGround = true;
                this.groundTime = 0;
            }
            this.groundTime += dt;
            if (this.groundTime >= this.lockDelayForLevel(this.level)
                || this.lockResets >= MAX_LOCK_RESETS) {
                this.lock();
                this.lastDrop = timestamp;
            }
        } else {
            this.onGround = false;
            this.groundTime = 0;
        }

        if (this.gameState !== 'playing') return;
        this.renderer.draw(this);
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    start() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.releaseHolds();
        clearRun();
        this.board = createEmptyBoard();
        this.bagger = new PieceBag();
        this.score = 0;
        this.startLevel = clampDifficulty(
            document.getElementById('diffSlider')?.value
                || this.preferredStartLevel
                || this.startLevel
                || 1
        );
        this.preferredStartLevel = this.startLevel;
        safeSet(DIFFICULTY_KEY, String(this.startLevel));
        this.level = this.startLevel;
        this.bagger.setLevel(this.level);
        this.lines = 0;
        this.vaultMeter = 0;
        this.lineStreak = 0;
        this.easySpawnsLeft = Math.max(0, 4 - Math.floor((this.startLevel - 1) / 25));
        this.juiceFlashUntil = 0;
        this.isClearing = false;
        this.clearingCells = null;
        this.pendingClear = null;
        this.clearAnimUntil = 0;
        this.clearChain = 0;
        this.beatBestToasted = false;
        this.runStartBest = this.bestScore;
        this.syncDifficultyUI();
        this.updateVaultHud();
        this.dropInterval = this.dropSpeedForLevel(this.level);
        this.current = this.bagger.nextPiece();
        this.next = this.bagger.nextPiece();
        this.resetLockState();
        this.updateDisplay();
        this.renderer.drawNext(this.next);
        this.gameState = 'playing';
        this.lastDrop = performance.now();
        this.lastFrameTime = performance.now();
        if (!this.audio.musicMuted && !this.audio.masterMuted) this.audio.startMusic();
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    resumeRestoredRun() {
        document.getElementById('startOverlay')?.classList.add('hidden');
        document.getElementById('gameOverOverlay')?.classList.add('hidden');
        this.resetLockState();
        this.syncDifficultyUI();
        this.syncHandUI();
        this.refreshBestDisplay();
        this.updateVaultHud();
        this.updateStreakMeter();
        this.updateDisplay();
        this.renderer.drawNext(this.next);
        this.renderer.draw(this);
        this.gameState = 'playing';
        this.lastDrop = performance.now();
        this.lastFrameTime = performance.now();
        this.audio.init();
        this.unlockAudioOnGesture();
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    unlockAudioOnGesture() {
        if (this._audioUnlockBound) return;
        this._audioUnlockBound = true;
        const unlock = () => {
            this.audio.init();
            window.removeEventListener('pointerdown', unlock, true);
            window.removeEventListener('keydown', unlock, true);
        };
        window.addEventListener('pointerdown', unlock, true);
        window.addEventListener('keydown', unlock, true);
    }

    releaseHolds() {
        if (!this.holdStops) return;
        Array.from(this.holdStops).forEach((stop) => stop());
    }

    pause() {
        if (this.gameState !== 'playing') return;
        this.releaseHolds();
        if (this.isClearing) this.finishClear();
        if (this.gameState !== 'playing') return;
        saveRun(this);
        this.gameState = 'paused';
        this.audio.stopMusic();
        document.getElementById('pauseOverlay')?.classList.remove('hidden');
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resume() {
        if (this.gameState !== 'paused') return;
        this.gameState = 'playing';
        document.getElementById('pauseOverlay')?.classList.add('hidden');
        this.lastDrop = performance.now();
        this.lastFrameTime = performance.now();
        if (!this.audio.musicMuted && !this.audio.masterMuted) this.audio.startMusic();
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    gameOver() {
        this.releaseHolds();
        this.gameState = 'gameover';
        this.audio.stopMusic();
        this.audio.play('gameover');
        clearRun();
        const finalScore = document.getElementById('finalScore');
        const finalBest = document.getElementById('finalBest');
        const finalLines = document.getElementById('finalLines');
        const finalLevel = document.getElementById('finalLevel');
        const banner = document.getElementById('newBestBanner');
        if (finalScore) finalScore.textContent = this.score.toLocaleString();
        if (finalBest) finalBest.textContent = this.bestScore.toLocaleString();
        if (finalLines) finalLines.textContent = String(this.lines);
        if (finalLevel) finalLevel.textContent = String(this.level);
        if (banner) banner.classList.toggle('hidden', this.score < this.bestScore || this.score === 0);
        document.getElementById('gameOverOverlay')?.classList.remove('hidden');
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    maybeBeatBest() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            saveBestScore(this.score);
            this.refreshBestDisplay();
        }
        if (!this.beatBestToasted && this.runStartBest > 0 && this.score > this.runStartBest) {
            this.beatBestToasted = true;
            this.showBoardToast('NEW BEST!');
        }
    }

    showBoardToast(message) {
        const el = document.getElementById('boardToast');
        if (!el) return;
        el.textContent = message;
        el.classList.remove('hidden', 'toast-pop');
        void el.offsetWidth;
        if (!prefersReducedMotion()) el.classList.add('toast-pop');
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            el.classList.add('hidden');
            el.classList.remove('toast-pop');
            el.textContent = '';
            this.toastTimer = null;
        }, CLEAR_TOAST_MS);
    }

    pulseBoardPop() {
        const board = document.getElementById('gameBoard');
        if (!board || prefersReducedMotion()) return;
        board.classList.remove('clear-pop');
        void board.offsetWidth;
        board.classList.add('clear-pop');
        if (this.boardPopTimer) clearTimeout(this.boardPopTimer);
        this.boardPopTimer = setTimeout(() => {
            board.classList.remove('clear-pop');
            this.boardPopTimer = null;
        }, 380);
    }

    pulseStreakBox() {
        const box = document.getElementById('streakBox');
        if (!box) return;
        box.classList.remove('streak-hot');
        void box.offsetWidth;
        if (!prefersReducedMotion()) box.classList.add('streak-hot');
    }

    buildClearToast(info) {
        const name = (this.lastLockName || '').toUpperCase();
        let verb = 'LINE';
        if (info.fullRows >= QUAD_BONUS_ROWS) verb = 'QUAD';
        let msg = name ? `${name} ${verb}` : verb;
        if (info.fullRows > 1 && info.fullRows < QUAD_BONUS_ROWS) msg += ` ×${info.fullRows}`;
        if (this.lineStreak > 1) {
            msg += ` · ×${this.lineStreak}`;
            this.pulseStreakBox();
        }
        if (info.pressureUp) msg += ` · P${this.level}`;
        return msg;
    }

    triggerClearJuice(info) {
        this.juiceFlashUntil = performance.now() + JUICE_FLASH_MS;
        this.juiceFlashStrength = Math.min(1, info.cells.size / 8);
        this.showBoardToast(this.buildClearToast(info));
        this.pulseBoardPop();
    }

    updateDisplay() {
        const scoreEl = document.getElementById('scoreDisplay');
        const linesEl = document.getElementById('linesDisplay');
        const levelEl = document.getElementById('levelDisplay');
        const streakEl = document.getElementById('streakDisplay');
        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
        if (linesEl) linesEl.textContent = String(this.lines);
        if (levelEl) levelEl.textContent = String(this.level);
        if (streakEl) {
            streakEl.textContent = this.lineStreak > 1 ? `×${this.lineStreak}` : '—';
        }
        this.updateStreakMeter();
        this.updateVaultHud();
    }

    updateStreakMeter() {
        const fill = document.getElementById('streakMeterFill');
        if (!fill) return;
        const level = Math.max(0, Math.min(STREAK_METER_MAX, this.lineStreak));
        fill.style.width = `${(level / STREAK_METER_MAX) * 100}%`;
        fill.parentElement?.classList.toggle('meter-hot', this.lineStreak > 1);
    }

    updateVaultHud() {
        const fill = document.getElementById('vaultMeterFill');
        const label = document.getElementById('vaultDisplay');
        const goalEl = document.getElementById('goalDisplay');
        const goalSub = document.getElementById('goalSub');
        const pct = (this.vaultMeter / VAULT_METER_MAX) * 100;
        if (fill) {
            fill.style.width = `${pct}%`;
            fill.parentElement?.classList.toggle('meter-hot', pct >= 70);
        }
        if (label) label.textContent = `${this.vaultMeter}/${VAULT_METER_MAX}`;
        if (goalEl) goalEl.textContent = 'Vault';
        if (goalSub) goalSub.textContent = 'Lines fill · bonus at 10';
        const startGoal = document.getElementById('startGoalHint');
        if (startGoal) startGoal.textContent = 'Fill whole rows to clear · Vault bonus at 10';
    }

    refreshBestDisplay() {
        const el = document.getElementById('bestDisplay');
        if (el) {
            el.textContent = this.bestScore > 0 ? this.bestScore.toLocaleString() : '—';
        }
    }

    syncDifficultyUI() {
        const slider = document.getElementById('diffSlider');
        const valueEl = document.getElementById('diffValue');
        const hintEl = document.getElementById('diffHint');
        /*
         * While Continue is offered the slider is the *next* new-game Pressure, not the
         * saved run's. Mutating this.startLevel here used to desync Continue speed.
         */
        const v = clampDifficulty(
            this.continueAvailable ? this.preferredStartLevel : this.startLevel
        );
        this.preferredStartLevel = v;
        if (!this.continueAvailable) this.startLevel = v;
        if (slider) {
            slider.value = String(v);
            slider.setAttribute('aria-valuenow', String(v));
        }
        if (valueEl) valueEl.textContent = String(v);
        if (hintEl) {
            if (v <= 15) hintEl.textContent = 'Easy';
            else if (v <= 40) hintEl.textContent = 'Warm';
            else if (v <= 70) hintEl.textContent = 'Firm';
            else if (v <= 90) hintEl.textContent = 'Hard';
            else hintEl.textContent = 'Brutal';
        }
    }

    setStartDifficulty(raw) {
        this.preferredStartLevel = clampDifficulty(raw);
        safeSet(DIFFICULTY_KEY, String(this.preferredStartLevel));
        if (!this.continueAvailable) this.startLevel = this.preferredStartLevel;
        this.syncDifficultyUI();
    }

    syncHandUI() {
        const left = this.handMode === 'left';
        document.body.classList.toggle('hand-left', left);
        document.body.classList.toggle('hand-right', !left);
        [
            ['handLeftBtn', left],
            ['handRightBtn', !left],
            ['pauseHandLeftBtn', left],
            ['pauseHandRightBtn', !left]
        ].forEach(([id, pressed]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.setAttribute('aria-pressed', pressed ? 'true' : 'false');
            el.classList.toggle('active', pressed);
        });
        this.positionHandControls();
        this.resize();
    }

    setHandMode(mode) {
        this.handMode = mode === 'left' ? 'left' : 'right';
        safeSet(HAND_KEY, this.handMode);
        this.syncHandUI();
    }

    bindUi() {
        const diffSlider = document.getElementById('diffSlider');
        if (diffSlider) {
            const onDiff = () => this.setStartDifficulty(diffSlider.value);
            diffSlider.addEventListener('input', onDiff);
            diffSlider.addEventListener('change', onDiff);
        }

        const bindHand = (id, mode) => {
            document.getElementById(id)?.addEventListener('click', () => this.setHandMode(mode));
        };
        bindHand('handLeftBtn', 'left');
        bindHand('handRightBtn', 'right');
        bindHand('pauseHandLeftBtn', 'left');
        bindHand('pauseHandRightBtn', 'right');

        document.getElementById('continueBtn')?.addEventListener('click', () => {
            this.audio.init();
            if (this.resumeSnapshot) {
                this.startLevel = this.resumeSnapshot.startLevel;
                this.level = this.resumeSnapshot.level;
                this.dropInterval = this.dropSpeedForLevel(this.level);
                this.bagger.setLevel(this.level);
            }
            document.getElementById('startOverlay')?.classList.add('hidden');
            this.setContinueAvailable(false);
            this.resumeRestoredRun();
        });
        document.getElementById('startBtn')?.addEventListener('click', () => {
            this.audio.init();
            clearRun();
            this.setContinueAvailable(false);
            document.getElementById('startOverlay')?.classList.add('hidden');
            this.start();
        });
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            this.audio.init();
            clearRun();
            this.setContinueAvailable(false);
            document.getElementById('gameOverOverlay')?.classList.add('hidden');
            this.start();
        });
        document.getElementById('resumeBtn')?.addEventListener('click', () => this.resume());
        document.getElementById('restartFromPause')?.addEventListener('click', () => {
            clearRun();
            this.setContinueAvailable(false);
            document.getElementById('pauseOverlay')?.classList.add('hidden');
            document.getElementById('startOverlay')?.classList.remove('hidden');
            this.gameState = 'idle';
            if (this.animationId) cancelAnimationFrame(this.animationId);
            this.animationId = null;
            this.audio.stopMusic();
            this.board = createEmptyBoard();
            this.current = null;
            this.next = null;
            this.score = 0;
            this.lines = 0;
            this.lineStreak = 0;
            this.vaultMeter = 0;
            this.level = this.startLevel;
            this.syncDifficultyUI();
            this.updateVaultHud();
            this.updateStreakMeter();
            this.updateDisplay();
            this.renderer.draw(this);
            this.renderer.drawNext(null);
        });
        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            if (this.gameState === 'playing') this.pause();
            else if (this.gameState === 'paused') this.resume();
        });

        const syncSoundToggles = () => {
            const music = document.getElementById('musicBtn');
            const sfx = document.getElementById('sfxBtn');
            if (music) {
                music.classList.toggle('muted', this.audio.musicMuted);
                music.setAttribute('aria-pressed', this.audio.musicMuted ? 'false' : 'true');
            }
            if (sfx) {
                sfx.classList.toggle('muted', this.audio.sfxMuted);
                sfx.setAttribute('aria-pressed', this.audio.sfxMuted ? 'false' : 'true');
            }
        };
        document.getElementById('musicBtn')?.addEventListener('click', () => {
            this.audio.toggleMusic();
            syncSoundToggles();
        });
        document.getElementById('sfxBtn')?.addEventListener('click', () => {
            this.audio.toggleSfx();
            syncSoundToggles();
        });
        syncSoundToggles();

        const onViewportChange = () => {
            this.positionHandControls();
            this.resize();
        };
        window.addEventListener('resize', onViewportChange);
        window.addEventListener('orientationchange', () => {
            this.positionHandControls();
            setTimeout(onViewportChange, 60);
            setTimeout(onViewportChange, 200);
        });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', onViewportChange);
        }
        try {
            window.matchMedia('(orientation: landscape)').addEventListener('change', onViewportChange);
        } catch (_) { /* older browsers */ }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === 'playing') this.pause();
        });
        window.addEventListener('pagehide', () => {
            if (this.gameState === 'playing') saveRun(this);
        });

        requestAnimationFrame(() => {
            this.resize();
            requestAnimationFrame(() => this.resize());
        });
    }
}

export function boot() {
    refreshThemeColors();
    if (window.SeclusaGameTheme && typeof window.SeclusaGameTheme.onChange === 'function') {
        window.SeclusaGameTheme.onChange(() => {
            refreshThemeColors();
            if (window.blockfallGame) {
                window.blockfallGame.renderer.wellKey = '';
                window.blockfallGame.renderer.draw(window.blockfallGame);
                window.blockfallGame.renderer.drawNext(window.blockfallGame.next);
            }
        });
    }
    window.blockfallGame = new Blockfall();
}
