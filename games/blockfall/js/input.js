/** Keyboard, D-pad, and board swipe bindings. */

export function bindInput(game) {
    const holds = new Set();
    game.holdStops = holds;

    const addHold = (btn, action, delay = 150) => {
        if (!btn) return;
        let interval = null;
        let timeout = null;
        let active = false;

        const stop = () => {
            active = false;
            clearTimeout(timeout);
            clearInterval(interval);
            timeout = null;
            interval = null;
            holds.delete(stop);
            window.removeEventListener('blur', stop);
        };

        const start = (e) => {
            e.preventDefault();
            if (active) return;
            active = true;
            holds.add(stop);
            window.addEventListener('blur', stop);
            action();
            timeout = setTimeout(() => {
                interval = setInterval(action, 50);
            }, delay);
        };

        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', stop);
        btn.addEventListener('touchcancel', stop);
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', stop);
        btn.addEventListener('mouseleave', stop);
    };

    const addHardDrop = (btn) => {
        if (!btn) return;
        let locked = false;
        const fire = (e) => {
            e.preventDefault();
            if (locked) return;
            locked = true;
            game.hardDrop();
        };
        const unlock = () => { locked = false; };
        btn.addEventListener('touchstart', fire, { passive: false });
        btn.addEventListener('touchend', unlock);
        btn.addEventListener('touchcancel', unlock);
        btn.addEventListener('mousedown', fire);
        btn.addEventListener('mouseup', unlock);
        btn.addEventListener('mouseleave', unlock);
    };

    addHold(document.getElementById('leftBtn'), () => game.move(-1));
    addHold(document.getElementById('rightBtn'), () => game.move(1));
    addHold(document.getElementById('downBtn'), () => game.softDrop(), 80);
    addHardDrop(document.getElementById('hardDropBtn'));
    document.getElementById('rotateBtn')?.addEventListener('click', () => game.rotate());

    let hardDropLocked = false;
    document.addEventListener('keydown', (e) => {
        if (e.repeat && (e.key === ' ' || e.key === 'ArrowUp')) return;
        switch (e.key) {
            case 'ArrowLeft': e.preventDefault(); game.move(-1); break;
            case 'ArrowRight': e.preventDefault(); game.move(1); break;
            case 'ArrowDown': e.preventDefault(); game.softDrop(); break;
            case 'ArrowUp': e.preventDefault(); game.rotate(); break;
            case ' ':
                e.preventDefault();
                if (!hardDropLocked) {
                    hardDropLocked = true;
                    game.hardDrop();
                }
                break;
            case 'p': case 'P':
                if (game.gameState === 'playing') game.pause();
                else if (game.gameState === 'paused') game.resume();
                break;
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === ' ') hardDropLocked = false;
    });

    /*
     * Stop the page scrolling while a run is in motion — but never swallow gestures
     * aimed at overlays (Pressure range, buttons). A blanket preventDefault made the
     * start-screen slider immovable on touch.
     */
    document.addEventListener('touchmove', (e) => {
        if (game.gameState !== 'playing') return;
        const t = e.target;
        if (t && typeof t.closest === 'function'
            && t.closest('input, button, label, select, textarea, .overlay, .hud')) {
            return;
        }
        e.preventDefault();
    }, { passive: false });

    bindBoardGestures(game);
}

function bindBoardGestures(game) {
    const board = document.getElementById('gameBoard');
    if (!board) return;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let moved = false;
    const THRESH = 28;

    board.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        startT = Date.now();
        moved = false;
    }, { passive: true });

    board.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 1 || game.gameState !== 'playing') return;
        const t = e.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < THRESH && Math.abs(dy) < THRESH) return;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= THRESH) {
            e.preventDefault();
            game.move(dx > 0 ? 1 : -1);
            startX = t.clientX;
            moved = true;
        }
    }, { passive: false });

    board.addEventListener('touchend', (e) => {
        if (game.gameState !== 'playing') return;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        const dt = Date.now() - startT;
        if (moved) return;
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) >= THRESH) {
            if (dy < 0) game.rotate();
            else game.softDrop();
        } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 220) {
            game.rotate();
        }
    }, { passive: true });
}
