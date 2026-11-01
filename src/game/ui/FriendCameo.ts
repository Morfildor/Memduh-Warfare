import * as Phaser from 'phaser';
import { Friend, FriendPower, POWER_LABEL } from '../data/friends';
import { FONT, K, W } from '../constants';

const POWER_ICON: Record<FriendPower, string> = {
    strike: 'pu_kiyamet_bombasi', shield: 'pu_kalkan', rapid: 'pu_hizli_ates', bombs: 'pu_buyuk_bomba', heal: 'pu_can_paketi',
    anesthesia: 'pu_anesthesia', hack: 'pu_hack', slap: 'pu_slap', airdrop: 'pu_patso',
};

const PAD = 10;
const PORTRAIT_W = 112;
const BOX_W = W - 20;
const TEXT_X = PAD + PORTRAIT_W + 12;
const TEXT_W = BOX_W - TEXT_X - 14;

/**
 * A friend's cameo: the joke of the game, so it gets room. A banner that takes over the dialogue strip's spot: purple with a gold
 * double outline, a slowly turning starburst behind a big portrait, the name in gold, the catchphrase in large cream type with a
 * dark outline, and a ribbon naming what the friend does.
 */
export class FriendCameo {
    private root: Phaser.GameObjects.Container;
    private bg: Phaser.GameObjects.Graphics;
    private burst: Phaser.GameObjects.Graphics;
    private frame: Phaser.GameObjects.Graphics;
    private portrait: Phaser.GameObjects.Image;
    private name: Phaser.GameObjects.Text;
    private phrase: Phaser.GameObjects.Text;
    private power: Phaser.GameObjects.Text;
    private icon: Phaser.GameObjects.Image;

    /** `y` is where the banner rests (design units from the top). */
    constructor(private scene: Phaser.Scene, ui: Phaser.GameObjects.Container, private y: number) {
        this.bg = scene.add.graphics();
        this.burst = scene.add.graphics();
        this.frame = scene.add.graphics();
        this.portrait = scene.add.image(PAD + PORTRAIT_W / 2, 0, 'friend_unknown');
        this.name = scene.add
            .text(TEXT_X, 8, '', { fontFamily: FONT, fontSize: '20px', color: '#ffe36b', stroke: '#2a1230', strokeThickness: 4, resolution: K })
            .setOrigin(0, 0);
        this.phrase = scene.add
            .text(TEXT_X, 36, '', {
                fontFamily: FONT, fontSize: '18px', color: '#fff6dc', stroke: '#241838', strokeThickness: 4, resolution: K, lineSpacing: 3,
                wordWrap: { width: TEXT_W },
            })
            .setOrigin(0, 0);
        this.icon = scene.add.image(0, 0, 'pu_kalkan').setScale(0.7);
        this.power = scene.add
            .text(0, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#2a1230', resolution: K })
            .setOrigin(0, 0.5);
        this.root = scene.add.container(10, y - 90, [this.bg, this.burst, this.frame, this.portrait, this.name, this.phrase, this.icon, this.power]);
        this.root.setVisible(false).setAlpha(0);
        ui.add(this.root);
    }

    private draw(bh: number) {
        const bg = this.bg;
        bg.clear();
        // soft drop shadow, the body, a lighter top band and a gold double outline
        bg.fillStyle(0x000000, 0.35).fillRoundedRect(2, 5, BOX_W, bh, 14);
        bg.fillStyle(0x241838, 0.96).fillRoundedRect(0, 0, BOX_W, bh, 14);
        bg.fillStyle(0x3a2660, 0.9).fillRoundedRect(4, 4, BOX_W - 8, Math.min(30, bh / 3), { tl: 11, tr: 11, bl: 4, br: 4 });
        // tiny sparkles in the corner, because it is a celebration
        bg.fillStyle(0xffe36b, 0.9);
        for (const [sx, sy, r] of [[BOX_W - 16, 12, 3], [BOX_W - 30, 20, 2], [BOX_W - 10, 28, 2]]) {
            bg.fillTriangle(sx, sy - r * 2, sx + r, sy, sx - r, sy);
            bg.fillTriangle(sx, sy + r * 2, sx + r, sy, sx - r, sy);
        }

        const f = this.frame;
        f.clear();
        f.lineStyle(3, 0xffe36b, 1).strokeRoundedRect(0, 0, BOX_W, bh, 14);
        f.lineStyle(1, 0xffffff, 0.45).strokeRoundedRect(4, 4, BOX_W - 8, bh - 8, 11);

        // starburst behind the portrait; drawn around its own origin so it can spin
        const cx = PAD + PORTRAIT_W / 2;
        const cy = bh / 2;
        const b = this.burst;
        b.clear();
        b.setPosition(cx, cy);
        b.fillStyle(0xffc23c, 1);
        b.beginPath();
        const spikes = 12;
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 ? 54 : 70;
            const a = (i / (spikes * 2)) * Math.PI * 2;
            b.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        b.closePath();
        b.fillPath();
        b.lineStyle(2, 0x1b0f12, 1).strokePath();
        // portrait plate (88x80 art at 1.15) with a dark rounded backing
        this.portrait.setPosition(cx, cy).setDepth(2);
        this.frame.fillStyle(0x1b0f12, 1).fillRoundedRect(cx - 53, cy - 48, 106, 96, 8);
        this.frame.lineStyle(2, 0xffe36b, 1).strokeRoundedRect(cx - 53, cy - 48, 106, 96, 8);

        // ribbon under the name row: what the friend does
        const label = this.power.text;
        const rw = this.power.width + 46;
        const rx = BOX_W - rw - 12;
        const ry = bh - 22;
        f.fillStyle(0xffc23c, 1).fillRoundedRect(rx, ry - 10, rw, 20, 10);
        f.lineStyle(2, 0x1b0f12, 1).strokeRoundedRect(rx, ry - 10, rw, 20, 10);
        this.icon.setPosition(rx + 14, ry).setVisible(!!label);
        this.power.setPosition(rx + 34, ry);
    }

    /** Returns how many seconds the banner stays up. */
    show(friend: Friend, power: string) {
        const key = this.scene.textures.exists(`friend_${friend.id}`) ? `friend_${friend.id}` : 'friend_unknown';
        this.portrait.setTexture(key);
        // finished portraits (88x80) fill the plate; photo portraits (32px) and the silhouette scale up
        this.portrait.setScale(this.portrait.width >= 64 ? 1.15 : 2.75);
        // a long name shrinks to stop short of the sparkles in the corner
        this.name.setFontSize(20).setText(friend.name);
        const room = BOX_W - 48 - TEXT_X;
        if (this.name.width > room) this.name.setFontSize(Math.floor((20 * room) / this.name.width));
        const line = friend.catchphrases[Math.floor(Math.random() * friend.catchphrases.length)] ?? '';
        this.phrase.setText(`"${line}"`);
        this.power.setText(POWER_LABEL[friend.power] ?? power);
        const tex = POWER_ICON[friend.power];
        this.icon.setTexture(this.scene.textures.exists(tex) ? tex : 'pu_kalkan');
        // room for the ribbon under the text
        const bh = Math.max(120, Math.ceil(this.phrase.height) + 36 + 38);
        this.draw(bh);

        const hold = Math.min(8000, 4400 + line.length * 55);
        this.scene.tweens.killTweensOf([this.root, this.portrait, this.burst]);
        // slams in oversized and settles, so it catches an eye that is busy down on the road
        this.root.setVisible(true).setAlpha(0).setPosition(10 - BOX_W * 0.11, this.y - 36).setScale(1.22);
        this.scene.tweens.add({ targets: this.root, x: 10, y: this.y, scale: 1, alpha: 1, duration: 340, ease: 'Back.out' });
        // the portrait pops in a beat later, and the starburst turns for as long as the banner is up
        const base = this.portrait.scale;
        this.portrait.setScale(base * 0.6);
        this.scene.tweens.add({ targets: this.portrait, scale: base, duration: 380, delay: 140, ease: 'Back.out' });
        this.burst.setRotation(0);
        this.scene.tweens.add({ targets: this.burst, rotation: 0.9, duration: 320 + hold, ease: 'Linear' });
        this.scene.tweens.add({
            targets: this.root, y: this.y - 30, alpha: 0, duration: 300, delay: 320 + hold, ease: 'Cubic.in',
            onComplete: () => this.root.setVisible(false),
        });
        return (320 + hold + 300) / 1000;
    }
}
