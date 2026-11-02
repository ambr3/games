/** Canvas colours from CSS custom properties. */

const COLOR_FALLBACKS = [
    '#000',
    '#f97316', '#a78bfa', '#38bdf8', '#f43f5e', '#eab308',
    '#6366f1', '#f472b6', '#22d3ee', '#c084fc', '#fb923c',
    '#34d399', '#818cf8', '#fbbf24', '#2dd4bf'
];

const CANVAS_FALLBACKS = {
    wellTop: '#0c0c14', wellMid: '#09090f', wellBot: '#07070c',
    vignetteIn: 'rgba(249,115,22,0.04)',
    vignetteOut: 'rgba(0,0,0,0.35)',
    gridMajor: 'rgba(249,115,22,0.06)', gridMinor: 'rgba(255,255,255,0.028)',
    wallTop: '#1a1a28', wallMid: '#12121c', wallBot: '#0a0a12',
    wallEdge: 'rgba(249,115,22,0.22)', wallRivet: 'rgba(249,115,22,0.35)',
    ink: 'rgba(255,255,255,0.42)', inkSoft: 'rgba(255,255,255,0.22)',
    inkShadow: 'rgba(0,0,0,0.22)',
    rim: 'rgba(255,255,255,0.12)', rimClear: 'rgba(255,255,255,0.65)',
    glow: 'rgba(0,0,0,0.4)',
    juice: 'rgba(249, 115, 22, 1)',
    flashHot: '#fff7ed', flashMid: '#fdba74', flashCool: '#fb923c',
    ghost: '#e8e8f0',
    nextWellTop: '#1e1e2c', nextWellBot: '#15151f',
    shadow: 'rgba(0,0,0,0.4)'
};

export let COLORS = COLOR_FALLBACKS.slice();
export let CANVAS = Object.assign({}, CANVAS_FALLBACKS);

function cssVar(name, fallback) {
    try {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
        return value || fallback;
    } catch (_) {
        return fallback;
    }
}

export function refreshThemeColors() {
    const next = [cssVar('--bf-piece-0', COLOR_FALLBACKS[0])];
    for (let i = 1; i < COLOR_FALLBACKS.length; i++) {
        next.push(cssVar('--bf-piece-' + i, COLOR_FALLBACKS[i]));
    }
    COLORS = next;

    const t = CANVAS_FALLBACKS;
    CANVAS = {
        wellTop: cssVar('--bf-canvas-well-top', t.wellTop),
        wellMid: cssVar('--bf-canvas-well-mid', t.wellMid),
        wellBot: cssVar('--bf-canvas-well-bot', t.wellBot),
        vignetteIn: cssVar('--bf-canvas-vignette-in', t.vignetteIn),
        vignetteOut: cssVar('--bf-canvas-vignette-out', t.vignetteOut),
        gridMajor: cssVar('--bf-canvas-grid-major', t.gridMajor),
        gridMinor: cssVar('--bf-canvas-grid-minor', t.gridMinor),
        wallTop: cssVar('--bf-canvas-wall-top', t.wallTop),
        wallMid: cssVar('--bf-canvas-wall-mid', t.wallMid),
        wallBot: cssVar('--bf-canvas-wall-bot', t.wallBot),
        wallEdge: cssVar('--bf-canvas-wall-edge', t.wallEdge),
        wallRivet: cssVar('--bf-canvas-wall-rivet', t.wallRivet),
        ink: cssVar('--bf-canvas-ink', t.ink),
        inkSoft: cssVar('--bf-canvas-ink-soft', t.inkSoft),
        inkShadow: cssVar('--bf-canvas-ink-shadow', t.inkShadow),
        rim: cssVar('--bf-canvas-rim', t.rim),
        rimClear: cssVar('--bf-canvas-rim-clear', t.rimClear),
        glow: cssVar('--bf-canvas-glow', t.glow),
        juice: cssVar('--bf-canvas-juice', t.juice),
        flashHot: cssVar('--bf-canvas-flash-hot', t.flashHot),
        flashMid: cssVar('--bf-canvas-flash-mid', t.flashMid),
        flashCool: cssVar('--bf-canvas-flash-cool', t.flashCool),
        ghost: cssVar('--bf-canvas-ghost', t.ghost),
        nextWellTop: cssVar('--bf-canvas-next-well-top', t.nextWellTop),
        nextWellBot: cssVar('--bf-canvas-next-well-bot', t.nextWellBot),
        shadow: cssVar('--bf-canvas-shadow', t.shadow)
    };
}
