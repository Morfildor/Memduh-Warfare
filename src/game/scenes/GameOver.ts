import { Scene } from 'phaser';
import { GROUND_Y, H, TYPE, W } from '../constants';
import { FOOT_Y } from '../data/anims';
import { Backdrop } from '../systems/Backdrop';
import { Sound } from '../systems/Audio';
import { Save } from '../systems/Save';
import { label, menuButton, setupCamera } from '../ui/util';

interface Result {
    score: number;
    stage: number;
    rank: number;
    kills: number;
    combo: number;
}

export class GameOver extends Scene {
    private backdrop!: Backdrop;
    private hero!: Phaser.GameObjects.Sprite;
    private t = 0;

    constructor() {
        super('GameOver');
    }

    create(data: Result) {
        setupCamera(this);
        this.t = 0;
        this.backdrop = new Backdrop(this, false);
        this.add.rectangle(W / 2, H / 2, W, H, 0x1b0f12, 0.55).setDepth(5);
        this.cameras.main.fadeIn(300, 27, 15, 18);

        const newBest = data.rank === 0 && data.score > 0;
        const title = label(this, W / 2, 92, 'ÇAY BİTTİ', { size: 48, color: '#ffc23c', stroke: '#6a1d00', strokeW: 9 }).setDepth(10);
        this.tweens.add({ targets: title, scale: { from: 0.2, to: 1 }, duration: 420, ease: 'Back.out' });
        label(this, W / 2, 138, 'Bir çay molası daha alalım mı?', { size: TYPE.body, color: '#fff1cf' }).setDepth(10);

        const panel = this.add.graphics().setDepth(9);
        panel.fillStyle(0x2a1710, 0.92).fillRoundedRect(30, 168, W - 60, 168, 12);
        panel.lineStyle(3, 0xffc23c, 1).strokeRoundedRect(30, 168, W - 60, 168, 12);
        label(this, W / 2, 190, 'SKOR', { size: TYPE.small, color: '#e6c79a' }).setDepth(10);
        const sc = label(this, W / 2, 224, '0', { size: 40, color: '#fff1cf' }).setDepth(10);
        const counter = { v: 0 };
        this.tweens.add({ targets: counter, v: data.score, duration: 900, ease: 'Cubic.out', onUpdate: () => sc.setText(String(Math.round(counter.v))) });
        if (newBest) {
            const nb = label(this, W / 2, 258, 'YENİ REKOR!', { size: 18, color: '#ff7a21' }).setDepth(10);
            this.tweens.add({ targets: nb, scale: { from: 0.9, to: 1.15 }, duration: 350, yoyo: true, repeat: -1 });
        } else {
            label(this, W / 2, 258, `Rekor: ${Save.best}`, { size: TYPE.body, color: '#ffe0a0' }).setDepth(10);
        }
        label(this, W / 2, 292, `Bölüm ${data.stage}   •   ${data.kills} düşman   •   en iyi kombo ${data.combo}`, { size: TYPE.micro, color: '#e6c79a' }).setDepth(10);
        label(this, W / 2, 314, `Rekor sırası: ${data.rank >= 0 ? data.rank + 1 : '—'}`, { size: TYPE.micro, color: '#e6c79a' }).setDepth(10);

        this.add.image(86, GROUND_Y + 2, 'shadow').setScale(5, 3).setDepth(8);
        this.hero = this.add.sprite(96, GROUND_Y + 6, 'memduh_death', 0).setOrigin(0.5, FOOT_Y).setScale(3).setDepth(10);

        menuButton(this, W / 2, GROUND_Y + 50, 230, 52, 'TEKRAR DENE', () => this.retry(), 0xff7a21).root.setDepth(20);
        menuButton(this, W / 2, GROUND_Y + 112, 230, 40, 'ANA MENÜ', () => this.scene.start('MainMenu'), 0x9a5f33).root.setDepth(20);

        this.input.keyboard?.on('keydown-SPACE', () => this.retry());
        this.input.keyboard?.on('keydown-ENTER', () => this.retry());
        this.events.once('shutdown', () => this.input.keyboard?.removeAllListeners());
    }

    private retry() {
        Sound.play('ui');
        this.input.keyboard?.removeAllListeners();
        this.scene.start('Game');
    }

    update(_t: number, delta: number) {
        const dt = Math.min(0.05, delta / 1000);
        this.t += dt;
        this.backdrop.update(dt, 8 * dt);
        this.hero.setFrame(Math.min(15, Math.floor(this.t * 11))); // the dramatic fall plays once, then he stays down
    }
}
