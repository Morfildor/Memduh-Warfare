import * as Phaser from 'phaser';
import { W } from '../constants';
import { label } from './util';

/** All in-run readouts. Lives inside the shared UI container so screen shake never moves it. */
export class Hud {
    private glasses: Phaser.GameObjects.Image[] = [];
    private score: Phaser.GameObjects.Text;
    private combo: Phaser.GameObjects.Text;
    private comboBar: Phaser.GameObjects.Graphics;
    private pompaBar: Phaser.GameObjects.Graphics;
    private pompaText: Phaser.GameObjects.Text;
    private banner: Phaser.GameObjects.Text;
    private bannerSub: Phaser.GameObjects.Text;
    private bossBar: Phaser.GameObjects.Graphics;
    private bossName: Phaser.GameObjects.Text;
    private status: Phaser.GameObjects.Text;
    private slots: { root: Phaser.GameObjects.Container; icon: Phaser.GameObjects.Image; pie: Phaser.GameObjects.Graphics }[] = [];
    private shownScore = 0;
    private t = 0;
    private statusT = 0;
    pauseBtn: Phaser.GameObjects.Container;

    constructor(private scene: Phaser.Scene, ui: Phaser.GameObjects.Container, maxHp: number) {
        for (let i = 0; i < maxHp; i++) {
            const g = scene.add.image(12 + i * 25, 12, 'tea').setOrigin(0, 0).setScale(2);
            ui.add(g);
            this.glasses.push(g);
        }
        this.score = label(scene, W - 50, 6, '0', { size: 24, color: '#fff1cf', originX: 1, originY: 0, align: 'right' });
        ui.add(this.score);
        this.combo = label(scene, W - 50, 36, '', { size: 14, color: '#ffc23c', originX: 1, originY: 0, align: 'right' });
        ui.add(this.combo);
        this.comboBar = scene.add.graphics();
        ui.add(this.comboBar);
        this.pompaBar = scene.add.graphics();
        ui.add(this.pompaBar);
        this.pompaText = label(scene, 76, 59, 'POMPA GÜCÜ', { size: 9, color: '#fff1cf', strokeW: 3 });
        ui.add(this.pompaText);

        // below the dialogue + cameo strips at the top
        this.banner = label(scene, W / 2, 310, '', { size: 34, color: '#ffc23c', stroke: '#6a1d00', strokeW: 8 }).setAlpha(0);
        this.bannerSub = label(scene, W / 2, 348, '', { size: 16, color: '#fff1cf', strokeW: 5 }).setAlpha(0);
        ui.add([this.banner, this.bannerSub]);
        this.bossBar = scene.add.graphics();
        this.bossName = label(scene, W / 2, 101, '', { size: 11, color: '#ffb0a0', strokeW: 3 }).setVisible(false);
        ui.add([this.bossBar, this.bossName]);
        this.status = label(scene, W / 2, 392, '', { size: 18, color: '#ffffff', strokeW: 5 }).setAlpha(0);
        ui.add(this.status);

        // pause button
        const g = scene.add.graphics();
        g.fillStyle(0x1b0f12, 0.75).fillCircle(0, 0, 15).lineStyle(2, 0xffc23c, 1).strokeCircle(0, 0, 15);
        g.fillStyle(0xfff1cf, 1).fillRect(-6, -7, 4, 14).fillRect(2, -7, 4, 14);
        this.pauseBtn = scene.add.container(W - 22, 22, [g]);
        this.pauseBtn.setSize(40, 40);
        ui.add(this.pauseBtn);

        // active power-ups: small icons in the top-right corner, each with a cooldown pie that blinks near the end
        for (let i = 0; i < 4; i++) {
            const icon = scene.add.image(0, 0, 'pu_kalkan').setScale(0.72);
            const pie = scene.add.graphics();
            const root = scene.add.container(0, 0, [icon, pie]).setVisible(false);
            root.setPosition(W - 26 - i * 38, 86); // sits between the combo meter and the dialogue strip, clear of both
            ui.add(root);
            this.slots.push({ root, icon, pie });
        }
    }

    /** Timed power-ups that are running right now; `frac` is the share of their duration still left. */
    setEffects(list: { tex: string; frac: number; left: number }[]) {
        this.slots.forEach((s, i) => {
            const fx = list[i];
            s.root.setVisible(!!fx);
            if (!fx) return;
            s.icon.setTexture(fx.tex);
            s.pie.clear();
            // dark pie = time already used up, sweeping clockwise from the top
            const used = 1 - Phaser.Math.Clamp(fx.frac, 0, 1);
            if (used > 0.001) {
                s.pie.fillStyle(0x000000, 0.6);
                s.pie.slice(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + used * Math.PI * 2, false);
                s.pie.fillPath();
            }
            s.pie.lineStyle(2, 0xffe36b, 1).strokeRoundedRect(-18, -16, 36, 32, 6);
            s.root.setAlpha(fx.left > 3 ? 0.88 + Math.sin(this.t * 4) * 0.12 : Math.sin(this.t * 20) > 0 ? 1 : 0.3);
        });
    }

    setHp(hp: number) {
        this.glasses.forEach((g, i) => g.setTexture(i < hp ? 'tea' : 'tea_empty'));
    }

    pulseHp(i: number) {
        const g = this.glasses[Phaser.Math.Clamp(i, 0, this.glasses.length - 1)];
        this.scene.tweens.add({ targets: g, scale: { from: 3, to: 2 }, duration: 260, ease: 'Back.out' });
    }

    showBanner(title: string, sub = '') {
        this.banner.setText(title);
        this.bannerSub.setText(sub);
        this.scene.tweens.killTweensOf([this.banner, this.bannerSub]);
        this.banner.setScale(0.5).setAlpha(0);
        this.bannerSub.setAlpha(0);
        this.scene.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 260, ease: 'Back.out', yoyo: false });
        this.scene.tweens.add({ targets: this.bannerSub, alpha: 1, duration: 300, delay: 180 });
        this.scene.tweens.add({ targets: [this.banner, this.bannerSub], alpha: 0, duration: 400, delay: 1900 });
    }

    showStatus(text: string, color = '#ffffff') {
        this.status.setText(text).setColor(color).setAlpha(1).setScale(0.6);
        this.statusT = 1.1;
    }

    showBoss(name: string | null) {
        this.bossName.setText(name ?? '').setVisible(!!name);
        if (!name) this.bossBar.clear();
    }

    update(dt: number, score: number, combo: number, mult: number, comboT: number, pompa: number, pompaOn: boolean, boss: number | null) {
        this.t += dt;
        this.shownScore += (score - this.shownScore) * Math.min(1, dt * 10);
        if (Math.abs(score - this.shownScore) < 1) this.shownScore = score;
        this.score.setText(String(Math.round(this.shownScore)));
        this.combo.setText(combo >= 2 ? `x${mult}  KOMBO ${combo}` : '');
        this.comboBar.clear();
        if (combo >= 2) {
            this.comboBar.fillStyle(0x1b0f12, 0.8).fillRect(W - 50 - 90, 56, 90, 5);
            this.comboBar.fillStyle(0xffc23c, 1).fillRect(W - 50 - 90, 56, 90 * Phaser.Math.Clamp(comboT / 3, 0, 1), 5);
        }
        // pompa meter
        const px = 12;
        const py = 52;
        const pw = 128;
        this.pompaBar.clear();
        this.pompaBar.fillStyle(0x1b0f12, 0.9).fillRoundedRect(px - 2, py - 2, pw + 4, 18, 5);
        const full = pompa >= 1;
        const col = pompaOn ? 0xffffff : full ? (Math.sin(this.t * 14) > 0 ? 0xffe36b : 0xff9a2a) : 0xd9801b;
        this.pompaBar.fillStyle(0x4a2a14, 1).fillRoundedRect(px, py, pw, 14, 4);
        this.pompaBar.fillStyle(col, 1).fillRoundedRect(px, py, Math.max(0, pw * Phaser.Math.Clamp(pompa, 0, 1)), 14, 4);
        this.pompaBar.fillStyle(0xffffff, 0.25).fillRoundedRect(px + 2, py + 2, Math.max(0, pw * Phaser.Math.Clamp(pompa, 0, 1) - 4), 4, 2);
        this.pompaBar.lineStyle(2, full ? 0xffffff : 0xffc23c, 1).strokeRoundedRect(px, py, pw, 14, 4);
        this.pompaText.setText(pompaOn ? 'POMPA GÜCÜ AKTİF!' : full ? 'POMPA GÜCÜ HAZIR!' : 'POMPA GÜCÜ').setX(px + pw / 2);

        if (this.statusT > 0) {
            this.statusT -= dt;
            this.status.setScale(Math.min(1.1, this.status.scale + dt * 6)).setAlpha(Math.min(1, this.statusT * 3));
        }
        this.bossBar.clear();
        if (boss !== null) {
            const bw = 200;
            const bx = (W - bw) / 2;
            this.bossBar.fillStyle(0x1b0f12, 0.9).fillRoundedRect(bx - 2, 76, bw + 4, 16, 5);
            this.bossBar.fillStyle(0xd7263d, 1).fillRoundedRect(bx, 78, bw * Phaser.Math.Clamp(boss, 0, 1), 12, 3);
            this.bossBar.lineStyle(2, 0xffc23c, 1).strokeRoundedRect(bx, 78, bw, 12, 3);
        }
    }
}
