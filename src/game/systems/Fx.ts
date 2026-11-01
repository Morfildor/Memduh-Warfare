import * as Phaser from 'phaser';
import { FONT, H, K, TYPE, W, strokeFor } from '../constants';

interface Particle {
    s: Phaser.GameObjects.Image;
    vx: number;
    vy: number;
    g: number;
    drag: number;
    life: number;
    max: number;
    s0: number;
    s1: number;
    a0: number;
    spin: number;
    on: boolean;
}

interface Boom {
    s: Phaser.GameObjects.Sprite;
    t: number;
    fps: number;
    on: boolean;
    sheet: string;
}

interface Floater {
    t: Phaser.GameObjects.Text;
    life: number;
    vy: number;
    on: boolean;
}

interface Ring {
    s: Phaser.GameObjects.Image;
    life: number;
    max: number;
    s1: number;
    on: boolean;
}

/** Pooled particles, explosion sprites, floating texts, screen shake, flash and hit-stop. */
export class Fx {
    private parts: Particle[] = [];
    private booms: Boom[] = [];
    private floaters: Floater[] = [];
    private rings: Ring[] = [];
    private trauma = 0;
    private baseX: number;
    private baseY: number;
    hitstop = 0;
    private flashRect: Phaser.GameObjects.Rectangle;

    constructor(private scene: Phaser.Scene, uiRoot: Phaser.GameObjects.Container) {
        const cam = scene.cameras.main;
        this.baseX = cam.scrollX;
        this.baseY = cam.scrollY;
        for (let i = 0; i < 260; i++) {
            const s = scene.add.image(0, 0, 'px').setVisible(false).setDepth(60);
            this.parts.push({ s, vx: 0, vy: 0, g: 0, drag: 0, life: 0, max: 1, s0: 1, s1: 0, a0: 1, spin: 0, on: false });
        }
        for (let i = 0; i < 8; i++) {
            const s = scene.add.sprite(0, 0, 'fx_boom', 0).setVisible(false).setDepth(70);
            this.booms.push({ s, t: 0, fps: 26, on: false, sheet: 'fx_boom' });
        }
        for (let i = 0; i < 14; i++) {
            const t = scene.add
                .text(0, 0, '', { fontFamily: FONT, fontSize: '14px', color: '#fff', stroke: '#1b0f12', strokeThickness: 4, resolution: K })
                .setOrigin(0.5).setVisible(false).setDepth(80);
            this.floaters.push({ t, life: 0, vy: 0, on: false });
        }
        for (let i = 0; i < 8; i++) {
            const s = scene.add.image(0, 0, 'ring').setVisible(false).setDepth(65).setBlendMode(Phaser.BlendModes.ADD);
            this.rings.push({ s, life: 0, max: 1, s1: 3, on: false });
        }
        this.flashRect = scene.add.rectangle(W / 2, H / 2, W + 8, H + 8, 0xffffff, 0).setDepth(1).setVisible(false);
        uiRoot.add(this.flashRect);
    }

    // --- particles ---
    private emit(x: number, y: number, o: Partial<Particle> & { color: number; add?: boolean }) {
        const p = this.parts.find((q) => !q.on);
        if (!p) return;
        p.on = true;
        p.vx = o.vx ?? 0;
        p.vy = o.vy ?? 0;
        p.g = o.g ?? 0;
        p.drag = o.drag ?? 0;
        p.life = p.max = o.max ?? 0.5;
        p.s0 = o.s0 ?? 1;
        p.s1 = o.s1 ?? 0;
        p.a0 = o.a0 ?? 1;
        p.spin = o.spin ?? 0;
        p.s.setTexture('px').setPosition(x, y).setTint(o.color).setScale(p.s0).setAlpha(p.a0).setVisible(true).setRotation(0);
        p.s.setBlendMode(o.add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
    }

    /** An empty brass casing flips out of the rifle and drops to the sand. */
    casing(x: number, y: number) {
        this.emit(x, y, { vx: -40 + Math.random() * 50, vy: -120 - Math.random() * 60, g: 720, max: 0.5, s0: 0.8, s1: 0.8, color: 0xd9a84a, spin: 12 });
    }

    sparks(x: number, y: number, n: number, color = 0xffd86b, speed = 180, dirX = 0) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const v = speed * (0.35 + Math.random() * 0.8);
            this.emit(x, y, {
                vx: Math.cos(a) * v + dirX * 60, vy: Math.sin(a) * v - 20, g: 380, drag: 1.5, max: 0.25 + Math.random() * 0.3,
                s0: 0.7 + Math.random() * 0.7, s1: 0.1, color, add: true,
            });
        }
    }

    debris(x: number, y: number, n: number, color = 0x7a4a22) {
        for (let i = 0; i < n; i++) {
            const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
            const v = 120 + Math.random() * 220;
            this.emit(x, y, {
                vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 700, drag: 0.4, max: 0.7 + Math.random() * 0.5,
                s0: 1 + Math.random() * 1.4, s1: 0.8, color, a0: 1,
            });
        }
    }

    smoke(x: number, y: number, n: number, rise = 40) {
        for (let i = 0; i < n; i++) {
            const g = 70 + Math.floor(Math.random() * 60);
            this.emit(x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 14, {
                vx: (Math.random() - 0.5) * 50, vy: -rise * (0.5 + Math.random()), g: -10, drag: 1.2,
                max: 0.7 + Math.random() * 0.6, s0: 1.4, s1: 4 + Math.random() * 3, a0: 0.55, color: (g << 16) | ((g - 6) << 8) | (g - 12),
            });
        }
    }

    dust(x: number, y: number, n = 4, dir = -1) {
        for (let i = 0; i < n; i++) {
            this.emit(x, y, {
                vx: dir * (20 + Math.random() * 60), vy: -10 - Math.random() * 40, g: 20, drag: 2, max: 0.35 + Math.random() * 0.3,
                s0: 1.2, s1: 3 + Math.random() * 2, a0: 0.5, color: 0xe8c38c,
            });
        }
    }

    /** Fluttering sheets of paper: the bureaucrats' signature debris. */
    paper(x: number, y: number, n = 4) {
        for (let i = 0; i < n; i++) {
            this.emit(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 20, {
                vx: (Math.random() - 0.5) * 160, vy: -40 - Math.random() * 130, g: 150, drag: 1.4, max: 1.1 + Math.random() * 0.8,
                s0: 2.4, s1: 1.8, color: 0xfff6e0, a0: 1,
            });
        }
    }

    /** A boss is down: confetti rains over the whole screen. */
    confetti(n = 44) {
        const colors = [0xffc23c, 0xe8233a, 0xff7a21, 0x9fe3ff, 0x39ff6a, 0xfff6e0];
        for (let i = 0; i < n; i++) {
            this.emit(Math.random() * W, -8 - Math.random() * 90, {
                vx: (Math.random() - 0.5) * 70, vy: 90 + Math.random() * 90, g: 26, max: 2 + Math.random() * 1.4,
                s0: 2.6, s1: 1.8, color: colors[i % colors.length],
            });
        }
    }

    trailPuff(x: number, y: number, color = 0xffc23c) {
        this.emit(x, y, { vx: -40, vy: 0, max: 0.2, s0: 1.6, s1: 0, color, add: true, a0: 0.8 });
    }

    ring(x: number, y: number, color: number, scale: number, dur = 0.4) {
        const r = this.rings.find((q) => !q.on);
        if (!r) return;
        r.on = true;
        r.life = r.max = dur;
        r.s1 = scale;
        r.s.setPosition(x, y).setTint(color).setScale(0.2).setAlpha(1).setVisible(true);
    }

    explosion(x: number, y: number, scale = 1.6, big = false) {
        const b = this.booms.find((q) => !q.on);
        if (b) {
            b.on = true;
            b.t = 0;
            b.s.setPosition(x, y).setScale(scale).setVisible(true).setFrame(0).setFlipX(Math.random() < 0.5);
        }
        this.sparks(x, y, big ? 26 : 14, 0xffe08a, big ? 340 : 240);
        this.sparks(x, y, big ? 14 : 7, 0xff7a21, big ? 260 : 180);
        this.debris(x, y + 6, big ? 16 : 9);
        this.smoke(x, y - 6, big ? 8 : 4);
        this.ring(x, y, 0xffd86b, big ? 6 : 3.2, big ? 0.55 : 0.35);
        this.shake(big ? 0.8 : 0.45);
    }

    text(x: number, y: number, str: string, color = '#ffffff', size = 14) {
        const f = this.floaters.find((q) => !q.on);
        if (!f) return;
        f.on = true;
        f.life = 0.8;
        f.vy = -46;
        // one style call (each setter would re-render and re-upload the texture); small callouts never drop below the type scale's floor
        size = Math.max(TYPE.small, size);
        f.t.setStyle({ fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#1b0f12', strokeThickness: strokeFor(size), resolution: K });
        f.t.setText(str).setPosition(x, y).setScale(0.4).setAlpha(1).setVisible(true);
    }

    // --- screen effects ---
    shake(amount: number) {
        this.trauma = Math.min(1, this.trauma + amount);
    }

    flash(color: number, alpha: number, ms: number) {
        this.flashRect.setFillStyle(color, alpha).setVisible(true);
        this.scene.tweens.killTweensOf(this.flashRect);
        this.scene.tweens.add({
            targets: this.flashRect, fillAlpha: 0, duration: ms, onComplete: () => this.flashRect.setVisible(false),
        });
    }

    stop(ms: number) {
        this.hitstop = Math.max(this.hitstop, ms / 1000);
    }

    reset() {
        for (const p of this.parts) {
            p.on = false;
            p.s.setVisible(false);
        }
        for (const b of this.booms) {
            b.on = false;
            b.s.setVisible(false);
        }
        for (const f of this.floaters) {
            f.on = false;
            f.t.setVisible(false);
        }
        for (const r of this.rings) {
            r.on = false;
            r.s.setVisible(false);
        }
        this.trauma = 0;
        this.hitstop = 0;
    }

    update(dt: number) {
        for (const p of this.parts) {
            if (!p.on) continue;
            p.life -= dt;
            if (p.life <= 0) {
                p.on = false;
                p.s.setVisible(false);
                continue;
            }
            const k = 1 - p.life / p.max;
            p.vy += p.g * dt;
            const d = Math.max(0, 1 - p.drag * dt);
            p.vx *= d;
            p.vy *= p.g > 0 ? 1 : d;
            p.s.x += p.vx * dt;
            p.s.y += p.vy * dt;
            p.s.setScale(p.s0 + (p.s1 - p.s0) * k).setAlpha(p.a0 * (1 - k * k));
        }
        for (const b of this.booms) {
            if (!b.on) continue;
            b.t += dt;
            const f = Math.floor(b.t * b.fps);
            if (f >= 16) {
                b.on = false;
                b.s.setVisible(false);
            } else b.s.setFrame(f);
        }
        for (const f of this.floaters) {
            if (!f.on) continue;
            f.life -= dt;
            if (f.life <= 0) {
                f.on = false;
                f.t.setVisible(false);
                continue;
            }
            f.t.y += f.vy * dt;
            f.vy *= 0.94;
            const pop = Math.min(1, (0.8 - f.life) * 9);
            f.t.setScale(0.4 + 0.7 * pop - (pop >= 1 ? (1 - f.life / 0.8) * 0.1 : 0)).setAlpha(Math.min(1, f.life * 3));
        }
        for (const r of this.rings) {
            if (!r.on) continue;
            r.life -= dt;
            if (r.life <= 0) {
                r.on = false;
                r.s.setVisible(false);
                continue;
            }
            const k = 1 - r.life / r.max;
            const e = 1 - (1 - k) * (1 - k);
            r.s.setScale(0.2 + (r.s1 - 0.2) * e).setAlpha(1 - k);
        }
        this.trauma = Math.max(0, this.trauma - dt * 1.9);
        const cam = this.scene.cameras.main;
        const t2 = this.trauma * this.trauma;
        const m = 11;
        cam.scrollX = this.baseX + (Math.random() * 2 - 1) * t2 * m;
        cam.scrollY = this.baseY + (Math.random() * 2 - 1) * t2 * m;
    }
}
