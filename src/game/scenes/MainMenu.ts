import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { GROUND_Y, H, W } from '../constants';
import { FOOT_Y } from '../data/anims';
import { Backdrop } from '../systems/Backdrop';
import { Sound } from '../systems/Audio';
import { Save } from '../systems/Save';
import { label, menuButton, setupCamera } from '../ui/util';

/** How fast the menu's world scrolls past: stage 1's speed, so the running feet match the ground. */
const MENU_SPEED = 92;

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
        const title = this.add.container(W / 2, 92).setDepth(100);
        const a = label(this, 0, -22, 'MEMDUH', { size: 54, color: '#ffc23c', stroke: '#6a1d00', strokeW: 9 });
        const b = label(this, 4, 28, 'WARFARE', { size: 46, color: '#e8233a', stroke: '#1b0f12', strokeW: 9 });
        b.setAngle(-3);
        const sub = label(this, 0, 68, 'Çay Soğumadan!', { size: 18, color: '#fff1cf', stroke: '#6a1d00', strokeW: 5 });
        title.add([a, b, sub]);
        this.tweens.add({ targets: title, scale: { from: 0.96, to: 1.03 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

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
        label(this, W / 2, H - 14, best > 0 ? `EN YÜKSEK SKOR: ${best}` : 'İlk rekoru sen kır!', { size: 11, color: '#ffe0a0' }).setDepth(200);

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
                c.add(label(this, -pw / 2 + 16, yy, h, { size: 13, color: '#ff9a3c', originX: 0, align: 'left' }));
                c.add(label(this, -pw / 2 + 16, yy + 18, d, { size: 11, originX: 0, align: 'left', wrap: pw - 30, strokeW: 3 }));
            });
        } else if (kind === 'records') {
            const recs = Save.records;
            if (!recs.length) c.add(label(this, 0, 0, 'Henüz rekor yok.\nÇayını al, oyuna başla!', { size: 14 }));
            recs.forEach((r, i) => {
                const yy = -ph / 2 + 64 + i * 42;
                c.add(label(this, -pw / 2 + 18, yy, `${i + 1}.`, { size: 18, color: '#ffc23c', originX: 0 }));
                c.add(label(this, -pw / 2 + 52, yy - 6, String(r.score), { size: 18, originX: 0 }));
                c.add(label(this, -pw / 2 + 52, yy + 12, `Bölüm ${r.stage} • ${r.date}`, { size: 10, color: '#d9b98a', originX: 0, strokeW: 2 }));
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
            c.add(label(this, 0, 100, 'Ayarlar bu cihazda saklanır.', { size: 10, color: '#d9b98a' }));
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

    update(_t: number, delta: number) {
        const dt = Math.min(0.05, delta / 1000);
        this.t += dt;
        this.backdrop.update(dt, MENU_SPEED * dt);
        this.hero.setFrame(Math.floor(this.t * (8 + MENU_SPEED * 0.04)) % 16); // same cadence as the run in Game.ts
        this.camel.setFrame(Math.floor(this.t * 14) % 16);
        this.camel.y = GROUND_Y + 4 - Math.abs(Math.sin(this.t * 7)) * 4;
    }
}
