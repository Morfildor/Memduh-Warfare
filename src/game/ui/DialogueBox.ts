import * as Phaser from 'phaser';
import { DIALOGUE, Line, SPEAKERS, Topic } from '../data/dialogue';
import { FONT, K, W } from '../constants';

interface Options {
    /** `high` interrupts whatever is playing; `normal` waits its turn; `low` is dropped when busy. */
    priority?: 'low' | 'normal' | 'high';
}

const TOPIC_COOLDOWN: Partial<Record<Topic, number>> = {
    idle: 11, combo: 14, bigCombo: 18, hurt: 7, missBomb: 12, jump: 40, nearMiss: 25, pit: 20, lowHp: 18,
    bombKill: 22, firstKill: 9999, pompaReady: 20,
};

/** Speech bubble with portrait and typewriter text. Event-driven: gameplay calls `say(topic)`. */
export class DialogueBox {
    private root: Phaser.GameObjects.Container;
    private bg: Phaser.GameObjects.Graphics;
    private portrait: Phaser.GameObjects.Image;
    private nameText: Phaser.GameObjects.Text;
    private body: Phaser.GameObjects.Text;
    private queue: Line[][] = [];
    private current: Line[] | null = null;
    private lineIdx = 0;
    private lineAge = 0;
    private lineLen = 0;
    private gap = 0;
    private clock = 0;
    private lastSaid = new Map<Topic, number>();
    private recent: string[] = [];
    private shownY: number;
    private visible = false;

    constructor(scene: Phaser.Scene, y: number) {
        this.shownY = y;
        this.bg = scene.add.graphics();
        this.bg.fillStyle(0x1b0f12, 0.82).fillRoundedRect(0, 0, W - 20, 62, 10);
        this.bg.lineStyle(2, 0xffc23c, 1).strokeRoundedRect(0, 0, W - 20, 62, 10);
        this.portrait = scene.add.image(8, 8, 'p_memduh_normal').setOrigin(0, 0).setScale(0.66);
        this.nameText = scene.add
            .text(66, 5, '', { fontFamily: FONT, fontSize: '11px', color: '#ffc23c', resolution: K })
            .setOrigin(0, 0);
        this.body = scene.add
            .text(66, 18, '', {
                fontFamily: FONT, fontSize: '13px', color: '#fff1cf', resolution: K,
                wordWrap: { width: W - 20 - 76 }, lineSpacing: 1,
            })
            .setOrigin(0, 0);
        this.root = scene.add.container(10, y - 80, [this.bg, this.portrait, this.nameText, this.body]);
        this.root.setScrollFactor(0).setDepth(900).setAlpha(0);
    }

    get layer() {
        return this.root;
    }

    /** Request a line from `topic`; respects cooldowns and avoids repeating recent exchanges. */
    say(topic: Topic, opts: Options = {}) {
        const pool = DIALOGUE[topic];
        if (!pool || !pool.length) return false;
        const cd = TOPIC_COOLDOWN[topic] ?? 4;
        const last = this.lastSaid.get(topic);
        if (last !== undefined && this.clock - last < cd) return false;
        const pri = opts.priority ?? 'normal';
        const busy = !!this.current;
        if (busy && pri === 'low') return false;
        if (this.queue.length >= 2 && pri !== 'high') return false;

        const fresh = pool.filter((e) => !this.recent.includes(this.key(topic, e)));
        const options = fresh.length ? fresh : pool;
        const pick = options[Math.floor(Math.random() * options.length)];
        this.recent.push(this.key(topic, pick));
        if (this.recent.length > 14) this.recent.shift();
        this.lastSaid.set(topic, this.clock);

        if (pri === 'high') {
            this.queue = [pick];
            this.current = null;
            this.gap = 0;
        } else {
            this.queue.push(pick);
        }
        return true;
    }

    private key(topic: Topic, e: Line[]) {
        return topic + ':' + e[0].text;
    }

    /** Clear everything (new run). */
    reset() {
        this.queue = [];
        this.current = null;
        this.recent = [];
        this.lastSaid.clear();
        this.clock = 0;
        this.root.setAlpha(0);
        this.visible = false;
    }

    update(dt: number) {
        this.clock += dt;
        if (this.current) {
            this.lineAge += dt;
            const chars = Math.min(this.lineLen, Math.floor(this.lineAge * 48));
            const line = this.current[this.lineIdx];
            this.body.setText(line.text.slice(0, chars));
            const hold = 1.15 + this.lineLen * 0.045;
            if (this.lineAge > hold) {
                this.lineIdx++;
                this.lineAge = 0;
                if (this.lineIdx >= this.current.length) {
                    this.current = null;
                    this.gap = 0.5;
                } else {
                    this.showLine();
                }
            }
        } else if (this.queue.length) {
            this.gap -= dt;
            if (this.gap <= 0) {
                this.current = this.queue.shift()!;
                this.lineIdx = 0;
                this.lineAge = 0;
                this.showLine();
            }
        }
        const target = this.current ? 1 : 0;
        if (target === 1 && !this.visible) this.visible = true;
        const a = this.root.alpha + (target - this.root.alpha) * Math.min(1, dt * 12);
        this.root.setAlpha(a < 0.01 ? 0 : a);
        const ty = this.shownY - (1 - a) * 14;
        this.root.y += (ty - this.root.y) * Math.min(1, dt * 14);
    }

    private showLine() {
        const line = this.current![this.lineIdx];
        const sp = SPEAKERS[line.who];
        this.portrait.setTexture(sp.portrait);
        const s = Math.min(56 / this.portrait.width, 46 / this.portrait.height);
        this.portrait.setScale(s);
        this.nameText.setText(sp.name).setColor(sp.color);
        this.lineLen = line.text.length;
        this.body.setText('');
    }
}
