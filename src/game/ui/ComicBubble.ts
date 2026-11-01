import * as Phaser from 'phaser';
import { COLORS, FONT, K, W } from '../constants';

const INK = COLORS.ink;
const PAPER = 0xfffdf2;
const TAIL = 24; // how far the tail reaches below the balloon
const EDGE = 8; // the balloon never gets closer than this to the screen sides
const WRAP = 214;

/**
 * The comic-book balloon cameo enemies speak in: ink outline, hard offset shadow, halftone corner, a name caption and a
 * tail that keeps pointing at the speaker. The line stays up after they die, so killing the joke does not cut it short.
 */
export class ComicBubble {
    private root: Phaser.GameObjects.Container;
    private tail: Phaser.GameObjects.Graphics;
    private body: Phaser.GameObjects.Graphics;
    private plate: Phaser.GameObjects.Graphics;
    private name: Phaser.GameObjects.Text;
    private line: Phaser.GameObjects.Text;
    private life = 0;
    private w = 0;
    private tipX = 0;
    private tipY = 0;

    constructor(private scene: Phaser.Scene) {
        this.body = scene.add.graphics();
        this.tail = scene.add.graphics();
        this.plate = scene.add.graphics();
        this.line = scene.add.text(0, 0, '', { fontFamily: FONT, fontSize: '15px', color: '#1b0f12', align: 'center', lineSpacing: 2, resolution: K, wordWrap: { width: WRAP } }).setOrigin(0.5, 0.5);
        this.name = scene.add.text(0, 0, '', { fontFamily: FONT, fontSize: '16px', color: '#1b0f12', resolution: K }).setOrigin(0, 0.5);
        this.root = scene.add.container(0, 0, [this.body, this.tail, this.line, this.plate, this.name]).setDepth(41).setVisible(false);
    }

    /** `x, y` is the spot on the speaker the tail points at; the longer the line, the longer it stays. */
    say(speaker: string, text: string, x: number, y: number) {
        const caps = text.toLocaleUpperCase('tr-TR');
        this.line.setText(caps);
        this.name.setText(speaker.toLocaleUpperCase('tr-TR'));
        const w = (this.w = Math.ceil(this.line.width) + 34);
        const h = Math.ceil(this.line.height) + 28;
        this.line.setPosition(0, -h / 2 + 3);

        const g = this.body.clear();
        g.fillStyle(COLORS.orange, 1).fillRoundedRect(-w / 2 + 5, -h + 5, w, h, 16);
        g.fillStyle(PAPER, 1).fillRoundedRect(-w / 2, -h, w, h, 16);
        // halftone dots fading out of the bottom-right corner
        g.fillStyle(0xffd98a, 1);
        for (let row = 0; row < 5; row++)
            for (let col = 0; col < 7 - row; col++)
                g.fillCircle(w / 2 - 14 - col * 8 - (row % 2) * 4, -9 - row * 7, Math.max(0.8, 2.6 - (row + col) * 0.32));
        g.lineStyle(3.5, INK, 1).strokeRoundedRect(-w / 2, -h, w, h, 16);

        // name caption overlapping the top-left corner, like a comic's narration box
        const pw = Math.ceil(this.name.width) + 16;
        const p = this.plate.clear();
        p.fillStyle(INK, 1).fillRoundedRect(-w / 2 + 12, -h - 17, pw, 28, 4);
        p.fillStyle(COLORS.gold, 1).fillRoundedRect(-w / 2 + 10, -h - 19, pw, 28, 4);
        p.lineStyle(2.5, INK, 1).strokeRoundedRect(-w / 2 + 10, -h - 19, pw, 28, 4);
        this.name.setPosition(-w / 2 + 18, -h - 5);

        this.life = Phaser.Math.Clamp(2 + caps.length * 0.07, 3.5, 6);
        this.place(x, y);
        this.scene.tweens.killTweensOf(this.root);
        this.root.setVisible(true).setAlpha(1).setScale(0.2).setAngle(-9);
        this.scene.tweens.add({ targets: this.root, scale: 1, angle: -1.5, duration: 300, ease: 'Back.out' });
    }

    private place(x: number, y: number) {
        const half = this.w / 2 + 6;
        const bx = Phaser.Math.Clamp(x, half + EDGE, W - half - EDGE);
        this.root.setPosition(bx, y - TAIL);
        this.tipX = x - bx;
        this.tipY = TAIL;
        this.drawTail();
    }

    private drawTail() {
        // the root stays above the speaker, so the tail only has to lean as far as the balloon's width allows
        const base = Phaser.Math.Clamp(this.tipX * 0.5, -this.w / 2 + 28, this.w / 2 - 28);
        const tip = Phaser.Math.Clamp(this.tipX, -this.w / 2 + 12, this.w / 2 - 12);
        const g = this.tail.clear();
        g.fillStyle(PAPER, 1).fillTriangle(base - 12, -3, base + 12, -3, tip, this.tipY);
        g.lineStyle(3.5, INK, 1).beginPath().moveTo(base - 12, -1).lineTo(tip, this.tipY).lineTo(base + 12, -1).strokePath();
    }

    /** Pass the speaker's current tail point while they are alive and nothing once they are gone: it then stays put. */
    update(dt: number, x?: number, y?: number) {
        if (this.life <= 0) return;
        this.life -= dt;
        if (this.life <= 0) {
            this.scene.tweens.killTweensOf(this.root);
            this.scene.tweens.add({ targets: this.root, alpha: 0, scale: 0.85, duration: 180, onComplete: () => this.root.setVisible(false) });
            return;
        }
        if (x !== undefined && y !== undefined) this.place(x, y);
    }

    get active() {
        return this.life > 0;
    }
}
