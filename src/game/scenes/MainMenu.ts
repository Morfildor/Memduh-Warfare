import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { GROUND_Y, H, TYPE, W } from '../constants';
import { FOOT_Y } from '../data/anims';
import { Backdrop } from '../systems/Backdrop';
import { Sound } from '../systems/Audio';
import { Save } from '../systems/Save';
import { label, menuButton, setupCamera } from '../ui/util';

/** How fast the menu's world scrolls past: stage 1's speed, so the running feet match the ground. */
const MENU_SPEED = 92;
/** design units per art pixel of the logo atlas (3 canvas px at K=2) */
const LOGO_PX = 1.5;
/** title_logo.png atlas frames [x, y, w, h] and the two rows of the logo: [frame, x offset in art px]; a tea glass with a face ends the first word */
const LOGO_FRAMES: Record<string, number[]> = {
    M0: [0, 0, 38, 43], E0: [38, 0, 28, 43], D0: [66, 0, 32, 43], U0: [98, 0, 32, 43], H0: [130, 0, 32, 43], G0: [162, 0, 30, 43],
    W1: [192, 0, 42, 43], A1: [234, 0, 34, 43], R1: [268, 0, 32, 43], F1: [300, 0, 28, 43], E1: [328, 0, 28, 43],
    plate0: [0, 43, 228, 47], plate1: [228, 43, 228, 47], steam: [0, 90, 10, 16],
};
const LOGO_ROWS: [string, number][][] = [
    [['M0', 0], ['E0', 37], ['M0', 64], ['D0', 101], ['U0', 132], ['H0', 163], ['G0', 194]],
    [['W1', 0], ['A1', 41], ['R1', 74], ['F1', 105], ['A1', 132], ['R1', 165], ['E1', 196]],
];
const LOGO_TOPS = [40.5, 109.5];

export class MainMenu extends Scene {
    private backdrop!: Backdrop;
    private hero!: Phaser.GameObjects.Sprite;
    private camel!: Phaser.GameObjects.Sprite;
    private t = 0;
    private panel?: Phaser.GameObjects.Container;
    private buttons: Phaser.GameObjects.Container[] = [];

    constructor() {
        super('MainMenu');
    }

    create() {
        setupCamera(this);
        this.t = 0;
        this.panel = undefined;
        this.buttons = [];
        this.backdrop = new Backdrop(this, true);

        // title
        // a pixel-art logo: chunky hand-drawn letters (one atlas, 1.5 design units per art px like the buttons), a tea glass
        // with steam; everything moves in whole art pixels so nothing ever smears
        this.buildLogo();
        label(this, W / 2, 190, 'Çay Soğumadan!', { size: 18, color: '#fff1cf', stroke: '#6a1d00', strokeW: 5 }).setDepth(100);

        // Memduh and the camel run together; the world scrolls under them at the game's own pace
        this.add.image(104, GROUND_Y + 2, 'shadow').setScale(4.4, 2.6).setDepth(8);
        this.hero = this.add.sprite(104, GROUND_Y + 6, 'memduh_run', 0).setOrigin(0.5, FOOT_Y).setScale(2.6).setDepth(10);
        this.add.image(296, GROUND_Y + 2, 'shadow').setScale(11, 2.8).setDepth(8);
        this.camel = this.add.sprite(296, GROUND_Y + 4, 'camel_run', 0).setOrigin(0.5, 83 / 96).setScale(2.6).setDepth(9);

        // buttons
        const bx = W / 2;
        let y = GROUND_Y + 56;
        const add = (text: string, fn: () => void, fill?: number, w = 220, h = 40) => {
            const btn = menuButton(this, bx, y, w, h, text, () => {
                Sound.unlock();
                Sound.play('ui');
                fn();
            }, fill);
            btn.root.setDepth(200);
            this.buttons.push(btn.root);
            y += h + 10;
        };
        add('OYNA', () => this.startGame(), 0xff7a21, 220, 48);
        y -= 4;
        add('NASIL OYNANIR?', () => this.showPanel('how'), 0xd99a3a, 220, 34);
        add('REKORLAR', () => this.showPanel('records'), 0xd99a3a, 106, 34);
        add('AYARLAR', () => this.showPanel('settings'), 0xd99a3a, 106, 34);
        // put REKORLAR / AYARLAR side by side
        const [, , rec, set] = this.buttons;
        rec.setPosition(bx - 57, rec.y);
        set.setPosition(bx + 57, rec.y);

        const best = Save.best;
        label(this, W / 2, H - 14, best > 0 ? `EN YÜKSEK SKOR: ${best}` : 'İlk rekoru sen kır!', { size: TYPE.small, color: '#ffe0a0' }).setDepth(200);

        // first touch unlocks audio on iOS/Android
        this.input.once('pointerdown', () => Sound.unlock());
        this.input.keyboard?.once('keydown', () => Sound.unlock());
        this.input.keyboard?.on('keydown-ENTER', () => !this.panel && this.startGame());
        this.input.keyboard?.on('keydown-SPACE', () => !this.panel && this.startGame());
        this.events.once('shutdown', () => this.input.keyboard?.removeAllListeners());
    }

    private startGame() {
        Sound.unlock();
        this.cameras.main.fadeOut(220, 27, 15, 18);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
    }

    private showPanel(kind: 'how' | 'records' | 'settings') {
        if (this.panel) return;
        const pw = W - 40;
        const ph = 380;
        const c = this.add.container(W / 2, H / 2 - 10).setDepth(500);
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.55).fillRect(-W, -H, W * 2, H * 2);
        bg.fillStyle(0x2a1710, 0.98).fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 14);
        bg.lineStyle(3, 0xffc23c, 1).strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 14);
        c.add(bg);
        const titles = { how: 'NASIL OYNANIR?', records: 'REKORLAR', settings: 'AYARLAR' };
        c.add(label(this, 0, -ph / 2 + 24, titles[kind], { size: 20, color: '#ffc23c' }));

        if (kind === 'how') {
            const rows: [string, string][] = [
                ['Memduh kendiliğinden koşar.', 'Sen sadece savaşırsın!'],
                ['ATEŞ', 'Basılı tut. Düşmanları otomatik hedefler.'],
                ['BOMBA', 'Dokun: alan hasarı verir. Sayısı sınırlı!'],
                ['ZIPLA', 'Çukurlardan, fıçılardan ve kurşunlardan kaç.'],
                ['EĞİL', 'Yere yat: baş hizasındaki kurşunlar üstünden geçer.'],
                ['POMPA GÜCÜ', 'Kombo yap, bar dolsun, çaydanlığı patlat!'],
            ];
            rows.forEach(([h, d], i) => {
                const yy = -ph / 2 + 62 + i * 46;
                c.add(label(this, -pw / 2 + 16, yy, h, { size: TYPE.body, color: '#ffa94a', originX: 0, align: 'left' }));
                c.add(label(this, -pw / 2 + 16, yy + 18, d, { size: TYPE.small, originX: 0, align: 'left', wrap: pw - 30 }));
            });
        } else if (kind === 'records') {
            const recs = Save.records;
            if (!recs.length) c.add(label(this, 0, 0, 'Henüz rekor yok.\nÇayını al, oyuna başla!', { size: 14 }));
            recs.forEach((r, i) => {
                const yy = -ph / 2 + 64 + i * 42;
                c.add(label(this, -pw / 2 + 18, yy, `${i + 1}.`, { size: 18, color: '#ffc23c', originX: 0 }));
                c.add(label(this, -pw / 2 + 52, yy - 6, String(r.score), { size: 18, originX: 0 }));
                c.add(label(this, -pw / 2 + 52, yy + 12, `Bölüm ${r.stage} • ${r.date}`, { size: TYPE.micro, color: '#e6c79a', originX: 0 }));
            });
        } else {
            const mk = (yy: number, name: string, get: () => boolean, set: (v: boolean) => void) => {
                const b = menuButton(this, 0, yy, pw - 60, 40, '', () => {
                    set(!get());
                    refresh();
                    Sound.play('ui');
                }, 0x9a5f33);
                const refresh = () => b.setText(`${name}: ${get() ? 'AÇIK' : 'KAPALI'}`);
                refresh();
                c.add(b.root);
            };
            mk(-30, 'MÜZİK', () => Save.music, (v) => Sound.setMusic(v));
            mk(30, 'SES EFEKTLERİ', () => Save.sfx, (v) => Sound.setSfx(v));
            c.add(label(this, 0, 100, 'Ayarlar bu cihazda saklanır.', { size: TYPE.micro, color: '#e6c79a' }));
        }
        const close = menuButton(this, 0, ph / 2 - 30, 140, 34, 'KAPAT', () => {
            c.destroy();
            this.panel = undefined;
        }, 0xff7a21);
        c.add(close.root);
        // swallow clicks behind the panel
        const blocker = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setDepth(499).setInteractive();
        c.once('destroy', () => blocker.destroy());
        this.panel = c;
    }

    private logo: { img: Phaser.GameObjects.Image; x: number; y: number; delay: number; wave: number }[] = [];
    private steam: Phaser.GameObjects.Image[] = [];
    private plates: Phaser.GameObjects.Image[] = [];

    private buildLogo() {
        const U = LOGO_PX;
        const tex = this.textures.get('title_logo');
        for (const [n, f] of Object.entries(LOGO_FRAMES)) if (!tex.has(n)) tex.add(n, 0, f[0], f[1], f[2], f[3]);
        // objects of a previous visit are destroyed with the scene: forget them
        this.logo = [];
        this.steam = [];
        this.plates = [];
        const rowW = 220;
        const left = W / 2 - (rowW * U) / 2;
        let glassX = 0;
        LOGO_ROWS.forEach((row, r) => {
            const top = LOGO_TOPS[r];
            // one solid ink silhouette behind each word: letters read as one mass and the sky never shows through the gaps
            this.plates.push(this.add.image(left - 4 * U, top - 4 * U, 'title_logo', 'plate' + r).setOrigin(0, 0).setScale(U).setDepth(99).setAlpha(0));
            row.forEach(([key, off], i) => {
                const img = this.add.image(0, 0, 'title_logo', key).setOrigin(0, 0).setScale(U).setDepth(100).setAlpha(0);
                this.logo.push({ img, x: left + (off - 2) * U, y: top - 2 * U, delay: 0.1 + (r * 7 + i) * 0.07, wave: i + r * 3 });
                if (key === 'G0') glassX = left + off * U;
            });
        });
        for (let i = 0; i < 2; i++) this.steam.push(this.add.image(glassX + (i ? 12 : 6) * U, 0, 'title_logo', 'steam').setOrigin(0, 0).setScale(U).setDepth(100).setAlpha(0));
    }

    private updateLogo() {
        const U = LOGO_PX;
        const snap = (v: number) => Math.round(v * 2) / 2; // whole canvas pixels at K=2
        const bounce = (p: number) => {
            const n1 = 7.5625, d1 = 2.75;
            if (p < 1 / d1) return n1 * p * p;
            if (p < 2 / d1) return n1 * (p -= 1.5 / d1) * p + 0.75;
            if (p < 2.5 / d1) return n1 * (p -= 2.25 / d1) * p + 0.9375;
            return n1 * (p -= 2.625 / d1) * p + 0.984375;
        };
        let done = true;
        for (const l of this.logo) {
            const p = Phaser.Math.Clamp((this.t - l.delay) / 0.55, 0, 1);
            if (p < 1) done = false;
            const drop = (1 - bounce(p)) * -190;
            // after landing, a quick wave of 0 to 3 art px hops through the letters now and then
            const hop = p < 1 ? 0 : Math.round(Math.pow(Math.max(0, Math.sin(this.t * 2.6 - l.wave * 0.5)), 6) * 3) * U;
            l.img.setAlpha(p > 0 ? 1 : 0).setPosition(snap(l.x), snap(l.y + drop - hop));
        }
        this.plates.forEach((p) => p.setAlpha(Phaser.Math.Clamp(this.t / 0.25, 0, 1)));
        this.steam.forEach((s, i) => {
            const ph = Math.floor((this.t * 5 + i * 4) % 9);
            s.setAlpha(done ? 1 - ph / 9 : 0).setPosition(s.x, snap(LOGO_TOPS[0] - 17 * U - ph * U));
        });
    }

    update(_t: number, delta: number) {
        const dt = Math.min(0.05, delta / 1000);
        this.t += dt;
        this.updateLogo();
        this.backdrop.update(dt, MENU_SPEED * dt);
        this.hero.setFrame(Math.floor(this.t * (8 + MENU_SPEED * 0.04)) % 16); // same cadence as the run in Game.ts
        this.camel.setFrame(Math.floor(this.t * 14) % 16);
        this.camel.y = GROUND_Y + 4 - Math.abs(Math.sin(this.t * 7)) * 4;
    }
}
