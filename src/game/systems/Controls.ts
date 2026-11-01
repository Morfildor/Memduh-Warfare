import * as Phaser from 'phaser';
import { FONT, H, K, W } from '../constants';

const BTN_S = 1.12;
const BTN_RES = 8;
/** btn_bomb.png is 19x26 art px at 3 * BTN_S: its round body is centred 3 art px below the image centre and 32 units wide in radius */
const BOMB_BODY_DY = 3 * 3 * BTN_S;
const BOMB_RING_R = 36;

export type BtnId = 'fire' | 'bomb' | 'jump' | 'pompa' | 'duck';

interface Btn {
    id: BtnId;
    x: number;
    y: number;
    /** touch radius (the art is a little smaller than the touch target) */
    r: number;
    root: Phaser.GameObjects.Container;
    face: Phaser.GameObjects.Image;
    baseScale: number;
    pressed: boolean;
    pulse: number;
}

/**
 * Five on-screen action buttons with true multitouch, plus keyboard shortcuts for desktop.
 * The game polls `fire`/`jumpHeld`/`duckHeld` and consumes the edge flags `bombQ`/`jumpQ`/`pompaQ`.
 * Button faces are generated pixel art (public/assets/ui); captions sit underneath so thumbs never cover them.
 */
export class Controls {
    fire = false;
    jumpHeld = false;
    duckHeld = false;
    bombQ = false;
    jumpQ = false;
    pompaQ = false;
    private btns: Record<BtnId, Btn>;
    private owner = new Map<number, BtnId>();
    private keys = new Set<string>();
    private pips: Phaser.GameObjects.Image[] = [];
    private pompaRing: Phaser.GameObjects.Graphics;
    private bombCd: Phaser.GameObjects.Graphics;
    private pompaVisible = false;
    private offs: (() => void)[] = [];

    constructor(private scene: Phaser.Scene, ui: Phaser.GameObjects.Container) {
        const mk = (id: BtnId, x: number, y: number, r: number, tex: string, scale: number, caption: string): Btn => {
            scale /= BTN_RES; // the face art is drawn BTN_RES x larger than the old pixel art, so it shows at the same size
            const face = scene.add.image(0, 0, tex).setScale(scale);
            const shadow = scene.add.image(0, 5, tex).setScale(scale).setTint(0x000000).setAlpha(0.35);
            const cap = scene.add
                .text(0, r + 10, caption, { fontFamily: FONT, fontSize: '12px', color: '#fff8e0', stroke: '#1b0f12', strokeThickness: 3, resolution: K })
                .setOrigin(0.5);
            const root = scene.add.container(x, y, [shadow, face, cap]);
            ui.add(root);
            return { id, x, y, r, root, face, baseScale: scale, pressed: false, pulse: 0 };
        };
        this.btns = {
            // the game is zoomed out (W 360 -> 440), so the thumb targets are scaled up to stay as big on a phone as before
            fire: mk('fire', W - 68, H - 110, 56, 'btn_fire', 3.5 * BTN_S, 'ATEŞ'),
            bomb: mk('bomb', W - 172, H - 82, 40, 'btn_bomb', 3 * BTN_S, 'BOMBA'),
            jump: mk('jump', 68, H - 110, 54, 'btn_jump', 3.5 * BTN_S, 'ZIPLA'),
            pompa: mk('pompa', W - 78, H - 226, 47, 'btn_pompa', 3.5 * BTN_S, 'POMPA'),
            // bottom row between jump and bomb: anywhere higher would cover Memduh
            duck: mk('duck', 168, H - 84, 40, 'btn_duck', 3 * BTN_S, 'EĞİL'),
        };
        // the ring sits lower than the button's centre, so its caption steps down out of the way
        (this.btns.bomb.root.list[2] as Phaser.GameObjects.Text).y += 8;
        this.bombCd = scene.add.graphics();
        this.btns.bomb.root.add(this.bombCd);
        this.pompaRing = scene.add.graphics();
        this.btns.pompa.root.add(this.pompaRing);
        this.btns.pompa.root.setVisible(false).setScale(0);

        for (let i = 0; i < 3; i++) {
            const pip = scene.add.image(-15 + i * 15, -58, 'pr_el_bombasi').setScale(0.46);
            this.btns.bomb.root.add(pip);
            this.pips.push(pip);
        }

        scene.input.addPointer(3);
        const down = (p: Phaser.Input.Pointer) => this.onDown(p);
        const up = (p: Phaser.Input.Pointer) => this.onUp(p);
        scene.input.on('pointerdown', down);
        scene.input.on('pointerup', up);
        scene.input.on('pointerupoutside', up);
        scene.input.on('gameout', () => this.releaseAll());
        this.offs.push(() => {
            scene.input.off('pointerdown', down);
            scene.input.off('pointerup', up);
            scene.input.off('pointerupoutside', up);
        });
        this.bindKeys();
    }

    private look(b: Btn) {
        // pressed buttons shrink slightly, darken and sink, which reads clearly under a thumb
        b.face.setScale(b.baseScale * (b.pressed ? 0.93 : 1)).setY(b.pressed ? 4 : 0);
        b.face.setTint(b.pressed ? 0xc8c8c8 : 0xffffff);
    }

    private hit(p: Phaser.Input.Pointer): BtnId | null {
        const x = p.x / K;
        const y = p.y / K;
        let best: BtnId | null = null;
        let bd = 1e9;
        for (const b of Object.values(this.btns)) {
            if (b.id === 'pompa' && !this.pompaVisible) continue;
            const d = Math.hypot(x - b.x, y - b.y);
            if (d < b.r + 14 && d < bd) {
                bd = d;
                best = b.id;
            }
        }
        return best;
    }

    private onDown(p: Phaser.Input.Pointer) {
        const id = this.hit(p);
        if (!id) return;
        this.owner.set(p.id, id);
        this.press(id, true);
    }

    private onUp(p: Phaser.Input.Pointer) {
        const id = this.owner.get(p.id);
        if (!id) return;
        this.owner.delete(p.id);
        this.press(id, false);
    }

    private press(id: BtnId, down: boolean) {
        const b = this.btns[id];
        b.pressed = down;
        this.look(b);
        if (id === 'fire') this.fire = down || this.keys.has('fire');
        if (id === 'jump') {
            if (down) this.jumpQ = true;
            this.jumpHeld = down || this.keys.has('jump');
        }
        if (id === 'duck') this.duckHeld = down || this.keys.has('duck');
        if (id === 'bomb' && down) this.bombQ = true;
        if (id === 'pompa' && down) this.pompaQ = true;
    }

    releaseAll() {
        this.owner.clear();
        (Object.keys(this.btns) as BtnId[]).forEach((id) => this.press(id, false));
        this.fire = false;
        this.jumpHeld = false;
        this.duckHeld = false;
    }

    private bindKeys() {
        const kb = this.scene.input.keyboard;
        if (!kb) return;
        const map: Record<string, BtnId> = {
            SPACE: 'jump', UP: 'jump', W: 'jump', J: 'fire', Z: 'fire', F: 'fire', K: 'bomb', X: 'bomb', B: 'bomb', L: 'pompa', C: 'pompa', Q: 'pompa', DOWN: 'duck', S: 'duck', V: 'duck',
        };
        const idOf = (e: KeyboardEvent) => map[e.code.replace('Key', '').replace('Arrow', '').toUpperCase()] ?? map[e.key.toUpperCase()];
        const onDown = (e: KeyboardEvent) => {
            const id = idOf(e);
            if (!id || e.repeat) return;
            this.keys.add(id);
            if (id === 'pompa' && !this.pompaVisible) return;
            this.press(id, true);
        };
        const onUp = (e: KeyboardEvent) => {
            const id = idOf(e);
            if (!id) return;
            this.keys.delete(id);
            this.press(id, false);
        };
        window.addEventListener('keydown', onDown);
        window.addEventListener('keyup', onUp);
        this.offs.push(() => {
            window.removeEventListener('keydown', onDown);
            window.removeEventListener('keyup', onUp);
        });
    }

    /** `bombs`/`maxBombs`: charges, `cd` 0..1 recharge progress; `pompa` 0..1 meter. */
    update(dt: number, bombs: number, maxBombs: number, cd: number, pompa: number, pompaActive: boolean) {
        this.pips.forEach((p, i) => p.setVisible(i < maxBombs).setAlpha(i < bombs ? 1 : 0.25));
        this.bombCd.clear();
        if (bombs < maxBombs) {
            // the bomb's round body sits ~10 units below the art's centre: ring a little outside it, on a dark track
            const cy = BOMB_BODY_DY;
            this.bombCd.lineStyle(6, 0x1b0f12, 0.55);
            this.bombCd.strokeCircle(0, cy, BOMB_RING_R);
            if (cd > 0.01) {
                this.bombCd.lineStyle(4, 0xffe36b, 1);
                this.bombCd.beginPath();
                this.bombCd.arc(0, cy, BOMB_RING_R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, cd), false);
                this.bombCd.strokePath();
            }
        }
        this.btns.bomb.face.setAlpha(bombs > 0 ? 1 : 0.5);
        const ready = pompa >= 1 && !pompaActive;
        const pb = this.btns.pompa;
        if (ready !== this.pompaVisible) {
            this.pompaVisible = ready;
            pb.root.setVisible(true);
            this.scene.tweens.killTweensOf(pb.root);
            this.scene.tweens.add({
                targets: pb.root, scale: ready ? 1 : 0, duration: 260, ease: ready ? 'Back.out' : 'Sine.in',
                onComplete: () => pb.root.setVisible(this.pompaVisible),
            });
        }
        if (ready) {
            pb.pulse += dt * 7;
            pb.root.setScale(1 + Math.sin(pb.pulse) * 0.05);
            this.pompaRing.clear();
            this.pompaRing.lineStyle(4, 0xffffff, 0.5 + 0.4 * Math.sin(pb.pulse * 1.4));
            this.pompaRing.strokeCircle(0, 0, 50 + Math.sin(pb.pulse) * 3);
        } else this.pompaRing.clear();
    }

    destroy() {
        this.offs.forEach((f) => f());
        this.offs = [];
    }
}
