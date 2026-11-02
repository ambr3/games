import { safeGet, safeSet } from './storage.js';
import { MUSIC_MUTE_KEY, SFX_MUTE_KEY, MASTER_SOUND_KEY } from './constants.js';

export class AudioEngine {
    constructor() {
        this.ctx = null;
        const musicPref = safeGet(MUSIC_MUTE_KEY);
        this.musicMuted = musicPref === null ? true : musicPref === 'true';
        this.sfxMuted = safeGet(SFX_MUTE_KEY) === 'true';
        this.masterMuted = safeGet(MASTER_SOUND_KEY) === 'false';
        this.initialized = false;
        this.musicTimer = null;
        this.musicIndex = 0;
        this.musicPlaying = false;
        this.watchMasterSound();
    }

    watchMasterSound() {
        window.addEventListener('storage', (event) => {
            if (event.key !== null && event.key !== MASTER_SOUND_KEY) return;
            this.setMasterMuted(safeGet(MASTER_SOUND_KEY) === 'false');
        });
    }

    setMasterMuted(muted) {
        this.masterMuted = muted;
        if (muted || this.musicMuted) this.stopMusic();
        else this.startMusic();
    }

    init() {
        if (!this.initialized) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;
            } catch (e) {
                return;
            }
        }
        this.unmute();
    }

    unmute() {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (!this.musicMuted && !this.masterMuted) this.startMusic();
    }

    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;
        this.musicIndex = 0;
        this.musicTimer = setInterval(() => this.playMusicNote(), 160);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }

    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        safeSet(MUSIC_MUTE_KEY, String(this.musicMuted));
        if (this.musicMuted || this.masterMuted) this.stopMusic();
        else this.startMusic();
        return this.musicMuted;
    }

    toggleSfx() {
        this.sfxMuted = !this.sfxMuted;
        safeSet(SFX_MUTE_KEY, String(this.sfxMuted));
        return this.sfxMuted;
    }

    playMusicNote() {
        if (!this.ctx || this.musicMuted || this.masterMuted || this.ctx.state !== 'running') return;
        const melody = [
            [329.63, 0.08], [246.94, 0.08], [329.63, 0.08], [392.00, 0.16],
            [329.63, 0.08], [261.63, 0.08], [329.63, 0.16],
            [0, 0.08], [329.63, 0.08], [246.94, 0.08], [329.63, 0.08],
            [392.00, 0.16], [440.00, 0.08], [392.00, 0.08], [329.63, 0.16],
            [0, 0.08], [261.63, 0.08], [329.63, 0.08], [392.00, 0.08],
            [440.00, 0.16], [392.00, 0.08], [329.63, 0.16],
            [0, 0.08], [329.63, 0.08], [261.63, 0.08], [329.63, 0.08],
            [392.00, 0.16], [329.63, 0.08], [261.63, 0.08], [246.94, 0.16]
        ];
        const [freq, dur] = melody[this.musicIndex % melody.length];
        this.musicIndex++;
        if (freq === 0) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500;
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + dur);
    }

    play(type) {
        if (!this.ctx || this.sfxMuted || this.masterMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch (type) {
            case 'move':
                osc.frequency.value = 200;
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'rotate':
                osc.frequency.value = 400;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'drop':
                osc.frequency.value = 650;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'tick':
                osc.frequency.value = 950;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
                break;
            case 'land': {
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.start(now);
                osc.stop(now + 0.18);
                const thock = this.ctx.createOscillator();
                const thockGain = this.ctx.createGain();
                thock.type = 'square';
                thock.frequency.value = 900;
                thockGain.gain.setValueAtTime(0.13, now);
                thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                thock.connect(thockGain);
                thockGain.connect(this.ctx.destination);
                thock.start(now);
                thock.stop(now + 0.06);
                break;
            }
            case 'bind':
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'vault':
                [659, 784, 988, 1318].forEach((f, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.type = 'square';
                    o.frequency.value = f;
                    const t = now + i * 0.09;
                    g.gain.setValueAtTime(0.13, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.start(t);
                    o.stop(t + 0.12);
                });
                osc.frequency.value = 330;
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.07, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.45);
                break;
            case 'gameover':
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
            default:
                osc.stop(now);
                break;
        }
    }
}
