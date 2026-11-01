import * as Phaser from 'phaser';
import { GROUND_Y, H, W } from '../constants';
import { Mood, MOODS } from '../data/moods';

interface Cloud {
    s: Phaser.GameObjects.Image;
    speed: number;
}

interface Prop {
    s: Phaser.GameObjects.Image;
    active: boolean;
    parallax: number;
}

const PROP_KEYS = ['prop_palmiye', 'prop_kule', 'prop_bayrak', 'prop_projektor', 'prop_duvar'];
/** Seconds one hour of the day takes to melt into the next. */
const MOOD_FADE = 2.5;

const mixColor = (a: number, b: number, k: number) => {
    const ch = (s: number) => {
        const x = (a >> s) & 255;
        return Math.round(x + (((b >> s) & 255) - x) * k) << s;
    };
    return ch(16) | ch(8) | ch(0);
};

/** Layered desert parallax: sky, sun, clouds, far dunes, city, near dunes, props, ground. */
export class Backdrop {
    private far: Phaser.GameObjects.TileSprite;
    private mid: Phaser.GameObjects.TileSprite;
    private city: Phaser.GameObjects.TileSprite;
    private ground: Phaser.GameObjects.TileSprite;
    private clouds: Cloud[] = [];
    private props: Prop[] = [];
    private dust: Phaser.GameObjects.Image[] = [];
    private propTimer = 0;
    private sun: Phaser.GameObjects.Image;
    private sunCore: Phaser.GameObjects.Image;
    private sky: Phaser.GameObjects.Image;
    private nextSky: Phaser.GameObjects.Image;
    private stars: Phaser.GameObjects.Image[] = [];
    private beams: Phaser.GameObjects.Image[] = [];
    private mood = MOODS[0];
    private from = MOODS[0];
    private fade = 1;
    private t = 0;

    constructor(scene: Phaser.Scene, withProps: boolean) {
        this.sky = scene.add.image(-20, 0, 'sky0').setOrigin(0, 0).setScale(W + 40, 2).setDepth(-100);
        this.nextSky = scene.add.image(-20, 0, 'sky0').setOrigin(0, 0).setScale(W + 40, 2).setDepth(-100).setAlpha(0);
        for (let i = 0; i < 28; i++) {
            this.stars.push(scene.add.image(Math.random() * W, 12 + Math.random() * (GROUND_Y * 0.42), 'px').setScale(0.5 + Math.random() * 0.5).setAlpha(0).setDepth(-99));
        }
        this.sun = scene.add.image(W * 0.75, GROUND_Y - 330, 'glow').setScale(5).setTint(0xfff0b0).setAlpha(0.8).setDepth(-99);
        this.sunCore = scene.add.image(W * 0.75, GROUND_Y - 330, 'glow').setScale(1.6).setTint(mixColor(0xffffff, MOODS[0].sun, 0.5)).setDepth(-99);

        for (let i = 0; i < 6; i++) {
            const key = `cloud${i % 3}`;
            const s = scene.add.image(Math.random() * W, 50 + Math.random() * (GROUND_Y * 0.42), key).setScale(2 + (i % 2)).setAlpha(0.95).setDepth(-98);
            this.clouds.push({ s, speed: 3 + Math.random() * 6 });
        }

        // tile sprites are authored in art pixels and drawn at 2x
        this.far = scene.add.tileSprite(0, GROUND_Y - 138, W / 2 + 4, 60, 'dune_far').setOrigin(0, 0).setScale(2).setDepth(-90);
        for (const x of [W * 0.2, W * 0.68]) {
            this.beams.push(scene.add.image(x, GROUND_Y - 112, 'beam').setOrigin(0.5, 1).setScale(2, 2.4).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(-87));
        }
        this.city = scene.add.tileSprite(0, GROUND_Y - 182, W / 2 + 2, 56, 'city').setOrigin(0, 0).setScale(2).setDepth(-85);
        this.mid = scene.add.tileSprite(0, GROUND_Y - 100, W / 2 + 4, 56, 'dune_mid').setOrigin(0, 0).setScale(2).setDepth(-80);

        if (withProps) {
            for (let i = 0; i < 7; i++) {
                const s = scene.add.image(-200, GROUND_Y, 'prop_palmiye').setOrigin(0.5, 1).setDepth(-60).setVisible(false);
                this.props.push({ s, active: false, parallax: 1 });
            }
        }

        this.ground = scene.add.tileSprite(0, GROUND_Y - 4, W / 2 + 40, Math.ceil((H - GROUND_Y) / 2) + 6, 'ground').setOrigin(0, 0).setScale(2).setDepth(-50);

        // drifting dust motes for atmosphere
        for (let i = 0; i < 14; i++) {
            const s = scene.add.image(Math.random() * W, GROUND_Y - 220 + Math.random() * 215, 'px')
                .setScale(0.6 + Math.random() * 0.6).setAlpha(0.2 + Math.random() * 0.25).setTint(0xfff0cf).setDepth(40);
            this.dust.push(s);
        }
    }

    /** The road moves on to the hour of stage `i`; endless laps go round the clock again. */
    setMood(i: number) {
        const next = MOODS[i % MOODS.length];
        if (next === this.mood) return;
        this.from = this.mood;
        this.mood = next;
        this.fade = 0;
        this.nextSky.setTexture(`sky${MOODS.indexOf(next)}`).setAlpha(0);
        for (const d of this.dust) d.setTint(next.mote);
    }

    private applyMood(k: number) {
        const a: Mood = this.from;
        const b: Mood = this.mood;
        this.nextSky.setAlpha(k);
        const land = mixColor(a.land, b.land, k);
        this.far.setTint(land);
        this.city.setTint(land);
        this.mid.setTint(land);
        this.ground.setTint(mixColor(a.ground, b.ground, k));
        this.sun.setTint(mixColor(a.sun, b.sun, k));
        this.sunCore.setTint(mixColor(mixColor(0xffffff, a.sun, 0.5), mixColor(0xffffff, b.sun, 0.5), k));
        const cloud = mixColor(a.cloud, b.cloud, k);
        for (const c of this.clouds) c.s.setTint(cloud);
        if (k >= 1) {
            // settle on the new sky, so the overlay is free for the next hour
            this.sky.setTexture(this.nextSky.texture.key);
            this.nextSky.setAlpha(0);
            this.from = b;
        }
    }

    /** `scroll` is world distance moved this frame in design units. */
    update(dt: number, scroll: number) {
        this.t += dt;
        if (this.fade < 1) {
            this.fade = Math.min(1, this.fade + dt / MOOD_FADE);
            this.applyMood(this.fade);
        }
        const stars = this.from.stars + (this.mood.stars - this.from.stars) * this.fade;
        if (stars > 0) {
            this.stars.forEach((s, i) => s.setAlpha(stars * (0.55 + Math.sin(this.t * 2 + i * 1.7) * 0.35)));
        }
        const beams = this.from.beams + (this.mood.beams - this.from.beams) * this.fade;
        this.beams.forEach((b, i) => b.setAlpha(beams * 0.7).setRotation(Math.sin(this.t * (0.42 + i * 0.13) + i * 2) * 0.62));
        // tile sprites are scaled 2x, so tile positions move at half the design-unit distance
        this.far.tilePositionX += scroll * 0.05;
        this.city.tilePositionX += scroll * 0.06;
        this.mid.tilePositionX += scroll * 0.15;
        this.ground.tilePositionX += scroll / 2;
        for (const c of this.clouds) {
            c.s.x -= c.speed * dt + scroll * 0.03;
            if (c.s.x < -90) c.s.x = W + 90;
        }
        for (const d of this.dust) {
            d.x -= scroll * 1.3 + 18 * dt;
            d.y += this.mood.embers ? -34 * dt : Math.sin(this.t * 2 + d.x * 0.05) * 0.1;
            if (d.x < -5 || d.y < GROUND_Y - 260) {
                d.x = d.x < -5 ? W + 5 : d.x;
                d.y = this.mood.embers ? GROUND_Y - 6 : GROUND_Y - 220 + Math.random() * 215;
            }
        }
        this.sun.setAlpha(0.75 + Math.sin(this.t * 0.8) * 0.06);
        if (this.props.length) {
            this.propTimer -= scroll;
            if (this.propTimer <= 0) {
                this.spawnProp();
                this.propTimer = 150 + Math.random() * 230;
            }
            for (const p of this.props) {
                if (!p.active) continue;
                p.s.x -= scroll * p.parallax;
                if (p.s.x < -120) {
                    p.active = false;
                    p.s.setVisible(false);
                }
            }
        }
    }

    private spawnProp() {
        const p = this.props.find((q) => !q.active);
        if (!p) return;
        const keys = this.mood.props ?? PROP_KEYS;
        const key = keys[Math.floor(Math.random() * keys.length)];
        const near = Math.random() < 0.35;
        p.s.setTexture(key).setVisible(true).setFlipX(Math.random() < 0.5).setTint(this.mood.ground);
        // Memduh is drawn at 1.9x, so scenery at 1x looked tiny next to him; 2x matches his pixel size
        p.s.setScale(near ? 2.6 : 2);
        // props are planted on the ground, so they scroll at exactly ground speed (anything else makes them slide)
        p.s.setPosition(W + 90, GROUND_Y - 1 + (near ? 6 : 0));
        // scenery must never hide Memduh or his enemies, so even "near" props stay behind the actors
        p.s.setDepth(near ? 6 : -45);
        p.s.setAlpha(1);
        p.parallax = 1;
        p.active = true;
    }
}
