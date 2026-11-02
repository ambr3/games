import { boot } from './game.js';

boot();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const ctrl = navigator.serviceWorker.controller;
        const hadOwnController = !!(ctrl && /(?:^|\/)blockfall\/sw\.js(?:\?|$)/.test(ctrl.scriptURL));
        navigator.serviceWorker.register('./sw.js').then((reg) => {
            if (reg) reg.update().catch(() => {});
        }).catch(() => {});
        if (hadOwnController) {
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        }
    });
}
