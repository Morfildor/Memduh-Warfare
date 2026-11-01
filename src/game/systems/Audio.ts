import { Save } from './Save';

type Sfx =
    | 'shoot' | 'bomb' | 'explode' | 'jump' | 'land' | 'hit' | 'kill' | 'pickup' | 'hurt'
    | 'combo' | 'pompa' | 'pompaReady' | 'ui' | 'boss' | 'win' | 'lose' | 'empty' | 'enemyShot'
    | 'heal' | 'slap' | 'sleep' | 'hack' | 'shield';

/** Tiny WebAudio chiptune synth: effects plus a looping tune. Everything is generated, nothing is downloaded. */
class AudioSystem {
    private ctx: AudioContext | null = null;
    private master!: GainNode;
    private sfxBus!: GainNode;
    private musicBus!: GainNode;
    private noiseBuf!: AudioBuffer;
    private musicTimer = 0;
    private musicStep = 0;
    private nextNote = 0;
    private musicOn = false;
    private lastShot = 0;

    /** Must be called from a user gesture (pointerdown/keydown). Safe to call repeatedly. */
    unlock() {
        if (!this.ctx) {
            const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AC) return;
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.8;
            this.master.connect(this.ctx.destination);
            this.sfxBus = this.ctx.createGain();
            this.sfxBus.connect(this.master);
            this.musicBus = this.ctx.createGain();
            this.musicBus.gain.value = 0.22;
            this.musicBus.connect(this.master);
            const len = this.ctx.sampleRate;
            this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const d = this.noiseBuf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
            document.addEventListener('visibilitychange', () => (document.hidden ? this.suspend() : this.resume()));
        }
        if (this.ctx.state === 'suspended') void this.ctx.resume();
        this.applyMusic();
    }

    suspend() {
        if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
    }

    private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0, bus?: GainNode) {
        const c = this.ctx!;
        const t = c.currentTime + delay;
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(bus ?? this.sfxBus);
        o.start(t);
        o.stop(t + dur + 0.02);
    }

    private noise(dur: number, vol: number, f0: number, f1: number, delay = 0) {
        const c = this.ctx!;
        const t = c.currentTime + delay;
        const s = c.createBufferSource();
        s.buffer = this.noiseBuf;
        const flt = c.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(f0, t);
        flt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(flt).connect(g).connect(this.sfxBus);
        s.start(t, Math.random() * 0.5);
        s.stop(t + dur + 0.02);
    }

    play(name: Sfx, pitch = 1) {
        if (!this.ctx || !Save.sfx || this.ctx.state !== 'running') return;
        switch (name) {
            case 'shoot': {
                const now = this.ctx.currentTime;
                if (now - this.lastShot < 0.035) return;
                this.lastShot = now;
                this.noise(0.07, 0.22, 5000, 900);
                this.tone('square', 520 * pitch, 140, 0.08, 0.12);
                break;
            }
            case 'enemyShot':
                this.noise(0.09, 0.12, 2500, 500);
                this.tone('sawtooth', 300, 120, 0.1, 0.07);
                break;
            case 'bomb':
                this.tone('sine', 300, 700, 0.25, 0.14);
                this.noise(0.2, 0.06, 3000, 1200);
                break;
            case 'explode':
                this.noise(0.7, 0.6, 2400, 80);
                this.tone('sine', 150 * pitch, 35, 0.6, 0.5);
                this.tone('square', 90, 30, 0.3, 0.15);
                break;
            case 'jump':
                this.tone('square', 260, 640, 0.16, 0.12);
                break;
            case 'land':
                this.noise(0.08, 0.18, 900, 200);
                this.tone('sine', 120, 60, 0.08, 0.2);
                break;
            case 'hit':
                this.tone('square', 900 * pitch, 300, 0.05, 0.1);
                break;
            case 'kill':
                this.tone('square', 400, 90, 0.18, 0.18);
                this.noise(0.14, 0.2, 3000, 300);
                break;
            case 'pickup':
                [660, 880, 1320].forEach((f, i) => this.tone('square', f, f, 0.08, 0.13, i * 0.06));
                break;
            case 'hurt':
                this.tone('sawtooth', 440, 70, 0.4, 0.3);
                this.noise(0.25, 0.3, 1500, 200);
                break;
            case 'combo':
                this.tone('triangle', 500 * pitch, 900 * pitch, 0.1, 0.18);
                break;
            case 'pompaReady':
                [523, 659, 784, 1047].forEach((f, i) => this.tone('square', f, f, 0.09, 0.12, i * 0.07));
                break;
            case 'pompa':
                this.tone('sawtooth', 110, 880, 0.9, 0.3);
                this.tone('square', 220, 1760, 0.9, 0.12);
                this.noise(0.6, 0.35, 400, 4000);
                [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f, 0.15, 0.14, 0.5 + i * 0.07));
                break;
            case 'ui':
                this.tone('square', 700, 900, 0.05, 0.1);
                break;
            case 'heal': // a soft rising chime, one note per glass of tea
                [784, 988, 1175, 1568].forEach((f, i) => this.tone('triangle', f, f * 1.01, 0.22, 0.16, i * 0.09));
                break;
            case 'slap': // a flat crack and a thump
                this.noise(0.07, 0.5, 6000, 900);
                this.tone('square', 220, 70, 0.12, 0.28);
                break;
            case 'sleep': // a falling lullaby
                [659, 587, 523, 440, 392].forEach((f, i) => this.tone('triangle', f, f * 0.98, 0.3, 0.12, i * 0.16));
                break;
            case 'hack': // a glitchy stutter
                [900, 300, 1200, 200, 700].forEach((f, i) => this.tone('square', f, f * 0.5, 0.05, 0.1, i * 0.045));
                this.noise(0.22, 0.12, 5000, 800, 0.05);
                break;
            case 'shield':
                this.tone('sine', 300, 900, 0.3, 0.2);
                this.tone('triangle', 600, 1500, 0.3, 0.1, 0.05);
                break;
            case 'empty':
                this.tone('square', 160, 120, 0.08, 0.12);
                break;
            case 'boss':
                [110, 104, 98, 92].forEach((f, i) => this.tone('sawtooth', f, f * 0.95, 0.35, 0.28, i * 0.3));
                break;
            case 'win':
                [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f, 0.16, 0.14, i * 0.12));
                break;
            case 'lose':
                [392, 370, 349, 294].forEach((f, i) => this.tone('triangle', f, f * 0.97, 0.4, 0.25, i * 0.28));
                break;
        }
    }

    // --- music: a bouncy minor-key desert groove, scheduled slightly ahead of the audio clock ---
    private static BASS = [0, 0, 7, 0, 5, 5, 3, 7];
    private static LEAD = [12, 0, 15, 14, 12, 0, 10, 7, 8, 0, 12, 11, 8, 0, 7, 3];

    setMusic(on: boolean) {
        Save.set('music', on);
        this.applyMusic();
    }

    setSfx(on: boolean) {
        Save.set('sfx', on);
    }

    private applyMusic() {
        const want = !!this.ctx && Save.music;
        if (want && !this.musicOn) {
            this.musicOn = true;
            this.nextNote = this.ctx!.currentTime + 0.05;
            this.musicTimer = window.setInterval(() => this.scheduleMusic(), 90);
        } else if (!want && this.musicOn) {
            this.musicOn = false;
            window.clearInterval(this.musicTimer);
        }
    }

    private scheduleMusic() {
        const c = this.ctx!;
        const stepDur = 0.155;
        while (this.nextNote < c.currentTime + 0.3) {
            const s = this.musicStep;
            const root = 110; // A2
            const hz = (semi: number, oct = 1) => root * oct * Math.pow(2, semi / 12);
            const delay = this.nextNote - c.currentTime;
            if (s % 2 === 0) this.tone('triangle', hz(AudioSystem.BASS[(s >> 1) % 8]), hz(AudioSystem.BASS[(s >> 1) % 8]), stepDur * 1.8, 0.5, delay, this.musicBus);
            const l = AudioSystem.LEAD[s % 16];
            if (l) this.tone('square', hz(l, 2), hz(l, 2), stepDur * 0.9, 0.22, delay, this.musicBus);
            if (s % 4 === 2) this.noiseTick(delay);
            this.musicStep = (s + 1) % 64;
            this.nextNote += stepDur;
        }
    }

    private noiseTick(delay: number) {
        const c = this.ctx!;
        const t = c.currentTime + delay;
        const s = c.createBufferSource();
        s.buffer = this.noiseBuf;
        const hp = c.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6000;
        const g = c.createGain();
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        s.connect(hp).connect(g).connect(this.musicBus);
        s.start(t);
        s.stop(t + 0.06);
    }
}

export const Sound = new AudioSystem();
