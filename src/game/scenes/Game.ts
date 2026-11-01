import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { CAMEO_ENEMIES, CAMEO_ENEMY_EVERY, CAMEO_ENEMY_FIRST } from '../data/cameoEnemies';
import { COLORS, FONT, GROUND_Y, H, K, PLAYER_X, TYPE, W } from '../constants';
import { FOOT_Y, Humanoid, SHOOT_TIMING, THROW, THROW_POMPA } from '../data/anims';
import { EnemyDef, EnemyKind, ENEMIES } from '../data/enemies';
import { endlessStage, StageDef, STAGES } from '../data/stages';
import { Friend, FRIENDS } from '../data/friends';
import { Backdrop } from '../systems/Backdrop';
import { Sound } from '../systems/Audio';
import { Controls } from '../systems/Controls';
import { Director, Spawner } from '../systems/Director';
import { Fx } from '../systems/Fx';
import { Save } from '../systems/Save';
import { ComicBubble } from '../ui/ComicBubble';
import { DialogueBox } from '../ui/DialogueBox';
import { FriendCameo } from '../ui/FriendCameo';
import { Hud } from '../ui/Hud';
import { label, menuButton, rnd, setupCamera } from '../ui/util';

const STEP = 1 / 60;
const MAX_HP = 5;
const GRAV = 1450;
/** apex = v²/2g = 128 units (was 100): clears bomb markers and crates with room to spare and catches airdrops */
const JUMP_V = -610;
/** letting go of the button early cuts the jump to this speed (a short hop) */
const HOP_V = -330;
/** Rifle tip relative to the feet, measured from the run-and-shoot sheets (art px x scale): the bodybuilder holds it higher. */
const MUZZLE = { x: 56, y: -55 };
const MUZZLE_POMPA = { x: 58, y: -84 };
/**
 * Rifle tip in each of the 16 run-and-shoot frames, in art pixels: [right of the sprite centre, above the feet] (measured from the
 * sheets, the gun bobs with the stride and Pompa's first frames are still the flex), so every bullet leaves the barrel on screen.
 */
const TIP_RUN = [[16, 48], [16, 47], [17, 30], [21, 19], [28, 24], [31, 30], [30, 29], [30, 28], [31, 28], [28, 30], [30, 29], [31, 28], [30, 30], [30, 29], [30, 29], [31, 28]];
/** The crawl is drawn at this fraction of the player's scale, so the raised head tops out at 54 units: head-high shots (56) pass over. */
const CRAWL_SCALE = 0.8;
const TIP_CRAWL = [[40, 8], [40, 8], [40, 8], [39, 8], [37, 8], [36, 8], [35, 8], [34, 10], [33, 10], [33, 9], [33, 8], [35, 8], [36, 12], [38, 13], [40, 11], [41, 9]];
const TIP_POMPA =[[24, 42], [25, 43], [29, 36], [27, 28], [21, 28], [17, 22], [18, 16], [23, 22], [26, 29], [29, 34], [30, 41], [30, 40], [30, 41], [30, 42], [30, 44], [26, 43]];
const PLAYER_SCALE = 1.9;
const CAMEL_SCALE = 1.9; // same as Memduh: a camel towers over the man, hump above his head
const HURT_DUR = 0.5;
const FLEX_DUR = 0.9;
const SHOUTS = ['PAT!', 'ÇAT!', 'BAM!', 'HÖRR!', 'TAK!', 'PIÇ!', 'VAY ANAM!', 'FİŞ YOK!', 'SET BİTTİ!'];

/** where Motor Ahmet parks his Vespa to shoot */
const SCOOTER_STOP = W - 98;
/** Melike's anesthesia lasts this long; Tunç's hack takes this long to erase an enemy */
const STUN_TIME = 4;
/** what the sleepers dream of */
const DREAMS = ['DÜRÜM', 'ÇAY', 'ARMUT', 'TAKLA', 'PATSO', 'MAAŞ', 'İZİN', 'KEBAP'];
/** seconds between power-up drops, and between friend pickups */
const PICKUP_GAP = 18;
const FRIEND_GAP = 14;
/** seconds between the friends who show up on their own (the first one comes sooner) */
const CAMEO_EVERY: [number, number] = [14, 19];
/** a patso that is still this high above the ground when picked up was caught in mid-air */
const PATSO_AIR_Y = GROUND_Y - 80;
const HACK_TIME = 0.6;
/** how long Tunç's hack mode lasts */
const HACK_MODE = 3;
/** the icon that flies from the friend banner to Memduh when a buff lands, so it is clear who got what */
const BUFF_ICON: Partial<Record<string, string>> = { shield: 'pu_kalkan', rapid: 'pu_hizli_ates', bombs: 'pu_buyuk_bomba' };
/** where a cameo enemy plants himself to fight (the Vespa rider has his own SCOOTER_STOP) */
const CAMEO_STOP = W - 120;
/** after the final boss falls: Memduh starts his victory once the road has stopped; the result panel opens when the wreck has burnt down */
const WIN_CHEER_AT = 1.2;
const WIN_PANEL_AT = 4.6;
/** Memduh's rifle reaches this far: enemies are seen first, then walk into range (uncapped, they died at the screen edge). */
const BULLET_MAX_X = W - 70;
const isBoss =(e: { kind: EnemyKind }) => e.kind === 'tank' || e.kind === 'chief';
const HINTS = ["ATEŞ'E BASILI TUT!", 'BOMBA: KALABALIĞA AT!', 'ZIPLA: ÇUKURDAN KAÇ!', 'EĞİL: BAŞ HİZASI KURŞUNDAN KAÇ!'];

/** Lines an enemy says in a comic bubble the first time they appear on screen (the names and the lines are the jokes). */
const ENEMY_QUOTES: Partial<Record<EnemyKind, string[]>> = {
    teacher: ['Aa Jelibon mu? Geliyorum hemen.', 'Ensemi kimseye traşlatmam!'],
    heavy: ['Armutlara taklayla girmeyin. Bıktım'], // the user's joke: keep this wording exactly
    chem: ['Sarhoş mu geldiniz siz buraya?'], // the user's joke: keep this wording exactly
    dinho: ['Memduh kafa topu geliyor yakala'], // the user's joke: keep this wording exactly
    trucker: ['Sollama beni Memduh!', 'İzmarit bedava, yol parası ayrı.'],
    tank: ['Bu ayın taksidi nerde lan?', 'Ödemeler gecikti. Perişan edicem sizi.'], // the user's jokes: keep this wording exactly
};

/** Sheet used by a living enemy while it walks or hovers. */
const walkSheet = (k: EnemyKind) =>
    k === 'heli' || k === 'chief' ? 'heli_fly' : k === 'drone' ? 'drone_fly' : k === 'tank' ? 'tank_idle' : `${k}_walk`;

interface Enemy {
    kind: EnemyKind;
    def: EnemyDef;
    s: Phaser.GameObjects.Sprite;
    sh: Phaser.GameObjects.Image;
    bang: Phaser.GameObjects.Text;
    on: boolean;
    alive: boolean;
    dying: number;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    vx: number;
    vy: number;
    rot: number;
    t: number;
    fireT: number;
    burst: number;
    burstT: number;
    tele: number;
    flash: number;
    kb: number;
    touched: boolean;
    // tank + heli state
    st: string;
    stT: number;
    open: boolean;
    volley: number;
    life: number;
    /** time inside the current shoot animation, or -1 */
    shootT: number;
    /** has the name tag been shown yet */
    /** seconds left asleep after Melike's anesthesia (lying down, harmless) */
    stun: number;
    /** seconds left of Tunç's glitch-erase before the enemy is deleted */
    hack: number;
    /** parachute shown while a paratrooper (st === 'drop') is still coming down */
    chute: Phaser.GameObjects.Image;
    /** the enemy's name in small type above their head */
    tag: Phaser.GameObjects.Text;
    /** has already said their line on arrival (see ENEMY_QUOTES) */
    said: boolean;
}

interface Bullet {
    s: Phaser.GameObjects.Image;
    /** a fainter, longer copy of the bolt dragged behind it */
    trail: Phaser.GameObjects.Image;
    on: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    dmg: number;
    pierce: boolean;
    hit: Set<Enemy>;
    /** flight angle, for placing the trail */
    ang: number;
}

interface EBullet {
    s: Phaser.GameObjects.Image;
    on: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mortar: boolean;
    tx: number;
    t: number;
    T: number;
    x0: number;
    y0: number;
    marker: Phaser.GameObjects.Image;
    passed: boolean;
}

interface Bomb {
    s: Phaser.GameObjects.Image;
    on: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    big: boolean;
    marker: Phaser.GameObjects.Image;
    tx: number;
}

type PickupKind = 'can' | 'shield' | 'rapid' | 'bomb' | 'air' | 'nuke' | 'friend' | 'patso';
const PICKUP_TEX: Record<PickupKind, string> = {
    patso: 'pu_patso', friend: 'pu_friend', can: 'pu_can_paketi', shield: 'pu_kalkan', rapid: 'pu_hizli_ates', bomb: 'pu_buyuk_bomba', air: 'pu_hava_destegi', nuke: 'pu_kiyamet_bombasi',
};

interface Pickup {
    s: Phaser.GameObjects.Image;
    glow: Phaser.GameObjects.Image;
    on: boolean;
    kind: PickupKind;
    x: number;
    y: number;
    t: number;
    vy: number;
}

interface Hazard {
    kind: 'crate' | 'barrel' | 'pit';
    s: Phaser.GameObjects.Image;
    warn: Phaser.GameObjects.Image;
    on: boolean;
    x: number;
    w: number;
    hp: number;
    roll: number;
}

export class Game extends Scene {
    private backdrop!: Backdrop;
    private fx!: Fx;
    private ctl!: Controls;
    private hud!: Hud;
    private dlg!: DialogueBox;
    private director!: Director;
    private ui!: Phaser.GameObjects.Container;

    // pools
    private enemies: Enemy[] = [];
    private bullets: Bullet[] = [];
    private ebullets: EBullet[] = [];
    private bombs: Bomb[] = [];
    private pickups: Pickup[] = [];
    private hazards: Hazard[] = [];
    private flashes: { s: Phaser.GameObjects.Image; t: number }[] = [];

    // player
    private ply!: Phaser.GameObjects.Sprite;
    private shadow!: Phaser.GameObjects.Image;
    private aura!: Phaser.GameObjects.Image;
    private p = this.freshPlayer();
    /** seconds of Melike's anesthesia still running (drives the HUD icon) */
    private sleepT = 0;
    private pickupCd = 8;
    private friendCd = 25;
    private cameoCd = 9;
    private cameoEnemyCd = CAMEO_ENEMY_FIRST;
    private cameoEnemyIdx = Math.floor(Math.random() * 4);
    /** a cameo enemy is a mini-boss moment: first the road is cleared (cameoWait), then he makes a stand (cameoE) with no other enemies spawning */
    private cameoWait = false;
    private cameoWaitT = 0;
    private cameoE: Enemy | null = null;

    // run state
    private score = 0;
    private combo = 0;
    private comboT = 0;
    private bestCombo = 0;
    private kills = 0;
    private stageIdx = 0;
    private stage!: StageDef;
    private endless = false;
    private distance = 0;
    private acc = 0;
    private timeScale = 1;
    private slowT = 0;
    private paused = false;
    private pauseUi?: Phaser.GameObjects.Container;
    private over = false;
    /** seconds since the final boss fell (-1: not won). The world slows to a halt, Memduh celebrates, then the result panel opens. */
    private winT = -1;
    private winUi?: Phaser.GameObjects.Container;
    private boss: Enemy | null = null;
    private bossDone = false;
    private stageClearT = -1;
    private idleT = 6;
    private offs: (() => void)[] = [];
    private zoomKick = 0;
    private camel!: Phaser.GameObjects.Sprite;
    private camelShadow!: Phaser.GameObjects.Image;
    private camelOn = false;
    private camelX = 0;
    private camelT = 0;
    private camelCd = 16;
    private camelDropped = false;
    private cameo!: FriendCameo;
    private friendIdx = 0;
    private hintT = 0;
    private hintStep = 0;
    // the canteen man's cargo plane and the parachute under his patso
    private plane!: Phaser.GameObjects.Image;
    private patsoChute!: Phaser.GameObjects.Image;
    private planeOn = false;
    private planeX = 0;
    private planeDropped = false;
    // comic speech bubble for the enemies who announce themselves
    private bubble!: ComicBubble;
    private bubbleE: Enemy | null = null;
    private bubbleQ: { e: Enemy; kind: EnemyKind; name: string; text: string; x: number; y: number }[] = [];
    private shotCount = 0;
    /** Tunç's hack mode: while it runs, everything that comes into view is attacked (see updateHack) */
    private hackT = 0;
    private hackClock = 0;
    private hackFade = 0;
    private hackNext = new Map<Enemy, number>();
    private hackBeams: { e: Enemy; x: number; y: number; t: number }[] = [];
    private hackG!: Phaser.GameObjects.Graphics;
    private hackDim!: Phaser.GameObjects.Rectangle;
    private hackRain: Phaser.GameObjects.Text[] = [];
    private targetWait = 0;
    /** Melike's sleep: who has already been put to sleep this cast, how long each nap lasts, the dream words, the night wash and the thought clouds */
    private slept = new Set<Enemy>();
    private sleepLen = new Map<Enemy, number>();
    private dreamWord = new Map<Enemy, string>();
    private sleepFade = 0;
    private sleepWarned = false;
    private sleepDim!: Phaser.GameObjects.Rectangle;
    private dreams: { c: Phaser.GameObjects.Container; t: Phaser.GameObjects.Text }[] = [];
    private shieldG!: Phaser.GameObjects.Graphics;

    constructor() {
        super('Game');
    }

    private freshPlayer() {
        return {
            x: PLAYER_X, y: GROUND_Y, vy: 0, ground: true, hp: MAX_HP, inv: 0, shield: 0, rapid: 0, infBomb: 0, bigBomb: false,
            bombs: 3, bombProg: 0, pompa: 0, pompaT: 0, fireCd: 0, fireHold: 0, throwT: -1, throwDone: false, hurtT: 0,
            dead: false, deadT: 0, runPh: 0, jumpBuf: 0, coyote: 0, landT: 0, takeoffT: 0, recoil: 0, sx: 1, sy: 1, jumping: false, duck: false,
            lastHp: MAX_HP, nearMissCd: 0, missCheck: 0, pompaAnnounced: false, flexT: 0,
        };
    }

    // ---------------------------------------------------------------- lifecycle

    create() {
        setupCamera(this);
        this.p = this.freshPlayer();
        this.sleepT = 0;
        this.pickupCd = 8;
        this.friendCd = 25;
        this.cameoCd = 9;
        this.cameoEnemyCd = CAMEO_ENEMY_FIRST;
        this.enemies = []; this.bullets = []; this.ebullets = []; this.bombs = []; this.pickups = []; this.hazards = []; this.flashes = [];
        this.score = 0; this.combo = 0; this.comboT = 0; this.bestCombo = 0; this.kills = 0; this.stageIdx = 0;
        this.endless = false; this.distance = 0; this.acc = 0; this.timeScale = 1; this.slowT = 0; this.paused = false;
        this.over = false; this.boss = null; this.bossDone = false; this.stageClearT = -1; this.idleT = 7; this.offs = [];
        this.winT = -1; this.winUi = undefined; this.cameoWait = false; this.cameoE = null;

        this.backdrop = new Backdrop(this, true);
        this.ui = this.add.container((K - 1) * W / 2, (K - 1) * H / 2).setScrollFactor(0).setDepth(1000);
        this.fx = new Fx(this, this.ui);
        this.ui.add(this.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W + 4, H + 4));

        // player
        this.shadow = this.add.image(PLAYER_X, GROUND_Y + 1, 'shadow').setScale(3.4, 2).setDepth(10);
        this.aura = this.add.image(PLAYER_X, GROUND_Y - 50, 'glow').setScale(4.2).setTint(0xffd23c).setAlpha(0).setDepth(22)
            .setBlendMode(Phaser.BlendModes.ADD);
        this.ply = this.add.sprite(PLAYER_X, GROUND_Y, 'memduh_run', 0).setOrigin(0.5, FOOT_Y).setScale(PLAYER_SCALE).setDepth(25);

        this.buildPools();

        this.ctl = new Controls(this, this.ui);
        this.hud = new Hud(this, this.ui, MAX_HP);
        this.dlg = new DialogueBox(this, 112);
        this.ui.add(this.dlg.layer);
        this.cameo = new FriendCameo(this, this.ui, 112);
        this.friendIdx = Math.floor(Math.random() * Math.max(1, FRIENDS.length));
        this.hintT = 0;
        this.hintStep = Save.seenTutorial ? HINTS.length : 0;
        // Phaser hit-tests a container's children with the CHILD's scroll factor, so anything clickable inside a scrollFactor-0
        // container (this HUD, the pause screen, the win panel) needs its own scrollFactor 0 or its hit area sits a camera-scroll away
        this.hud.pauseBtn.setScrollFactor(0).setInteractive(new Phaser.Geom.Rectangle(0, 0, 40, 40), Phaser.Geom.Rectangle.Contains);
        this.hud.pauseBtn.on('pointerdown', () => this.setPaused(true));

        this.director = new Director(this.spawner());
        this.beginStage(0, true);
        this.dlg.say('start', { priority: 'high' });

        const onBlur = () => !this.over && this.setPaused(true);
        const onVis = () => document.hidden && onBlur();
        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVis);
        this.offs.push(() => {
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVis);
        });
        const esc = () => this.setPaused(!this.paused);
        this.input.keyboard?.on('keydown-P', esc);
        this.input.keyboard?.on('keydown-ESC', esc);

        this.events.once('shutdown', () => this.teardown());
        this.cameras.main.fadeIn(250, 27, 15, 18);
        (window as unknown as { __memduh: unknown }).__memduh = this;
        Sound.unlock();
    }

    private teardown() {
        this.offs.forEach((f) => f());
        this.offs = [];
        this.ctl.destroy();
        this.input.keyboard?.removeAllListeners();
        this.input.removeAllListeners();
        this.tweens.killAll();
        this.time.removeAllEvents();
    }

    private buildPools() {
        this.camelOn = false;
        this.camelCd = 16;
        this.planeOn = false;
        this.bubble = new ComicBubble(this);
        this.bubbleE = null;
        this.bubbleQ = [];
        this.buildHack();
        this.buildFriendFx();
        this.plane = this.add.image(0, 0, 'plane').setScale(1.8).setVisible(false).setDepth(26);
        this.patsoChute = this.add.image(0, 0, 'chute').setOrigin(0.5, 1).setScale(2).setVisible(false).setDepth(29);
        this.camelShadow = this.add.image(0, 0, 'shadow').setScale(9, 2.4).setVisible(false).setDepth(9);
        this.camel = this.add.sprite(0, 0, 'camel_run', 0).setOrigin(0.5, 83 / 96).setScale(CAMEL_SCALE).setVisible(false).setDepth(24);
        for (let i = 0; i < 14; i++) {
            const s = this.add.sprite(0, 0, 'rifle_walk', 0).setOrigin(0.5, FOOT_Y).setVisible(false).setDepth(20).setFlipX(true);
            const sh = this.add.image(0, 0, 'shadow').setVisible(false).setDepth(10);
            const bang = this.add.text(0, 0, '!', { fontFamily: 'Arial Black', fontSize: '22px', color: '#ff3b30', stroke: '#fff', strokeThickness: 4, resolution: K })
                .setOrigin(0.5).setVisible(false).setDepth(40);
            this.enemies.push({
                kind: 'rifle', def: ENEMIES.rifle, s, sh, bang, on: false, alive: false, dying: 0, x: 0, y: 0, hp: 1, maxHp: 1, vx: 0, vy: 0, rot: 0,
                t: 0, fireT: 0, burst: 0, burstT: 0, tele: 0, flash: 0, kb: 0, touched: false, st: '', stT: 0, open: false, volley: 0, life: 0,
                shootT: -1, stun: 0, hack: 0,
                chute: this.add.image(0, 0, 'chute').setOrigin(0.5, 1).setScale(1.7).setVisible(false).setDepth(21),
                said: false,
                tag: this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '11px', color: '#fff1a8', stroke: '#1b0f12', strokeThickness: 3, resolution: K })
                    .setOrigin(0.5, 1).setAlpha(0.92).setVisible(false).setDepth(39),
            });
        }
        for (let i = 0; i < 48; i++) {
            this.bullets.push({
                s: this.add.image(0, 0, 'bolt').setVisible(false).setDepth(35).setBlendMode(Phaser.BlendModes.ADD),
                trail: this.add.image(0, 0, 'bolt').setVisible(false).setDepth(34).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35),
                on: false, x: 0, y: 0, vx: 0, vy: 0, dmg: 1, pierce: false, hit: new Set(), ang: 0,
            });
        }
        for (let i = 0; i < 36; i++) {
            this.ebullets.push({
                s: this.add.image(0, 0, 'ebullet').setScale(2).setVisible(false).setDepth(36), on: false, x: 0, y: 0, vx: 0, vy: 0, mortar: false, tx: 0, t: 0, T: 1,
                x0: 0, y0: 0, marker: this.add.image(0, 0, 'ring').setVisible(false).setDepth(9).setTint(0xff3b30), passed: false,
            });
        }
        for (let i = 0; i < 4; i++) {
            this.bombs.push({
                s: this.add.image(0, 0, 'pr_el_bombasi').setVisible(false).setDepth(37), on: false, x: 0, y: 0, vx: 0, vy: 0, big: false,
                marker: this.add.image(0, 0, 'ring').setVisible(false).setDepth(9).setTint(0xffc23c), tx: 0,
            });
        }
        for (let i = 0; i < 6; i++) {
            const glow = this.add.image(0, 0, 'glow').setVisible(false).setDepth(27).setScale(1.6).setTint(0xffe08a).setBlendMode(Phaser.BlendModes.ADD);
            this.pickups.push({ s: this.add.image(0, 0, 'pu_can_paketi').setVisible(false).setDepth(28), glow, on: false, kind: 'can', x: 0, y: 0, t: 0, vy: 0 });
        }
        for (let i = 0; i < 10; i++) {
            this.hazards.push({
                kind: 'crate', s: this.add.image(0, 0, 'crate_big').setOrigin(0.5, 1).setVisible(false).setDepth(19), on: false, x: 0, w: 40, hp: 3, roll: 0,
                warn: this.add.image(0, 0, 'warn').setVisible(false).setDepth(30).setScale(2),
            });
        }
        for (let i = 0; i < 6; i++) {
            const s = this.add.image(0, 0, 'pr_alev_kucuk').setVisible(false).setDepth(50).setBlendMode(Phaser.BlendModes.ADD);
            this.flashes.push({ s, t: 0 });
        }
    }

    // ---------------------------------------------------------------- spawner / stages

    private spawner(): Spawner {
        return {
            enemy: (kind, x, drop) => this.spawnEnemy(kind, x, drop),
            hazard: (kind, x, w) => this.spawnHazard(kind, x, w),
            pickup: (x, y, force) => this.spawnPickup(this.randomPickup(), x, y ?? GROUND_Y - 34, force),
            aliveEnemies: () => this.enemies.filter((e) => e.on && e.alive && !isBoss(e)).length,
        };
    }

    private beginStage(i: number, opening = false) {
        this.stageIdx = i;
        this.endless = i >= STAGES.length;
        this.stage = this.endless ? endlessStage(i - STAGES.length) : STAGES[i];
        this.director.start(this.stage, opening);
        this.backdrop.setMood(i);
        this.hud.showBanner(this.endless ? 'SONSUZ ÇÖL' : `BÖLÜM ${i + 1}`, this.endless ? 'Çöl bitmiyor, Memduh de bitmiyor!' : this.stage.name);
        if (!opening) this.dlg.say(this.endless ? 'endless' : 'stage', { priority: 'normal' });
    }

    /** Surviving a stage earns a glass of tea, so a rough stage can be recovered from without waiting on a lucky drop. */
    private stageReward() {
        const p = this.p;
        if (p.dead || p.hp >= MAX_HP) return;
        p.hp++;
        this.hud.setHp(p.hp);
        this.hud.pulseHp(p.hp - 1);
        this.fx.text(p.x, p.y - 100, 'ÇAY MOLASI +1', '#ffb066', 15);
    }

    private get speed() {
        return this.stage.speed * (this.boss && this.boss.alive ? 0.8 : 1);
    }

    /** `drop`: the soldier comes down on a parachute from the top of the screen instead of walking in from the right. */
    private spawnEnemy(kind: EnemyKind, x: number, drop = false): Enemy | undefined {
        const e = this.enemies.find((q) => !q.on);
        if (!e) return undefined;
        e.chute.setVisible(false);
        const def = ENEMIES[kind];
        if (!def.flies && kind !== 'teacher') x = this.clearX(def, x); // never spawn on top of a soldier: slide further out to the right
        e.kind = kind; e.def = def; e.on = true; e.alive = true; e.dying = 0; e.hp = e.maxHp = def.hp * (this.endless ? 1 + (this.stageIdx - STAGES.length) * 0.06 : 1);
        e.x = x; e.y = def.flies ? GROUND_Y - 150 : GROUND_Y; e.vx = 0; e.vy = 0; e.rot = 0; e.t = Math.random() * 3;
        // a rifleman dies fast, so he has to get his shot in early; the tougher ones can afford to take their time
        e.fireT = kind === 'rifle' || kind === 'jelibon' ? rnd(0.1, 0.7) : rnd(def.fire[0] * 0.5, def.fire[1] * 0.8); e.burst = 0; e.burstT = 0; e.tele = 0; e.flash = 0; e.kb = 0; e.touched = false;
        e.st = 'enter'; e.stT = 0; e.open = false; e.volley = 0; e.life = 0;
        e.shootT = -1; e.stun = 0; e.hack = 0;
        this.slept.delete(e); this.sleepLen.delete(e); this.dreamWord.delete(e); this.hackNext.delete(e);
        this.styleTag(e.tag, CAMEO_ENEMIES.includes(kind));
        e.tag.setText(def.name).setVisible(false);
        e.said = false;
        e.s.setTexture(walkSheet(kind), 0).setVisible(true).setScale(def.scale).setAlpha(1).setRotation(0).clearTint().setFlipX(true);
        e.s.setTintMode(Phaser.TintModes.MULTIPLY).setDepth(CAMEO_ENEMIES.includes(kind) ? 23 : 20); // a cameo stands in front of any soldiers around him
        e.sh.setVisible(!def.flies).setScale(def.w / 12, 2);
        e.s.setPosition(x, e.y);
        if (kind === 'heli') {
            e.x = W + 80;
            e.life = 15;
        }
        if (kind === 'drone') {
            e.x = Math.max(W + 80, x);
            e.y = GROUND_Y - rnd(165, 215);
            e.fireT = 0.7;
            e.s.setPosition(e.x, e.y);
        }
        if (drop && !def.flies && kind !== 'teacher') {
            e.st = 'drop';
            e.x = x;
            e.y = GROUND_Y - rnd(280, 330);
            e.s.setPosition(e.x, e.y);
            e.sh.setVisible(false);
            e.chute.setVisible(true);
            if (!this.enemies.some((o) => o !== e && o.on && o.st === 'drop')) this.dlg.say('paraDrop', { priority: 'low' });
        }
        if (kind === 'teacher') {
            // Motor Ahmet arrives from the left edge, riding right (the sheet is drawn facing right); the long run-up
            // keeps his "!" warning on screen long enough to react to a hit from behind
            e.x = -270 - Math.max(0, x - W - 50);
            e.s.setFlipX(false).setPosition(e.x, e.y);
            this.fx.text(70, GROUND_Y - 120, 'DIT DIT!', '#ff5a3c', 14);
        }
        if (kind === 'trucker') this.fx.text(W - 70, GROUND_Y - 150, 'DÜÜÜT!', '#ffc23c', 16);
        return e;
    }

    /** Soldiers that can bump into each other: on the ground, alive, not a boss, a Vespa rider or the cameo planted at his post. */
    private crowds(o: Enemy) {
        return o.on && o.alive && !o.def.flies && o.kind !== 'teacher' && !isBoss(o) && o !== this.cameoE;
    }

    /** Centre-to-centre distance two soldiers need: their drawn bodies and the guns they hold out (about 58% of the sprite cell, never less than the hit box) plus air. */
    private gapBetween(a: EnemyDef, b: EnemyDef) {
        return (Math.max(a.w, 56 * a.scale) + Math.max(b.w, 56 * b.scale)) / 2 + 8;
    }

    /** `x` moved out to the right until it clears every soldier already out there. */
    private clearX(def: EnemyDef, x: number) {
        for (let pass = 0; pass < 6; pass++) {
            let moved = false;
            for (const o of this.enemies) {
                if (!this.crowds(o)) continue;
                const g = this.gapBetween(def, o.def);
                if (Math.abs(x - o.x) < g) {
                    x = o.x + g;
                    moved = true;
                }
            }
            if (!moved) break;
        }
        return x;
    }

    /** Keeps a walking soldier from climbing onto the one ahead of him: a faster one slows to the pace of the soldier in front. */
    private holdGap(e: Enemy) {
        for (const o of this.enemies) {
            if (o === e || !this.crowds(o) || o.st === 'drop' || o.x >= e.x) continue; // a canopy overhead is no obstacle
            const lim = o.x + this.gapBetween(e.def, o.def);
            if (e.x < lim) e.x = lim;
        }
    }

    /**
     * The director has stopped; soldiers still queued off-screen are dropped quietly (no kill, no score), the ones already on screen
     * fight or walk on as usual, and once the road is clear (or after 8 seconds of waiting) the cameo makes his entrance.
     */
    private updateCameoWait(dt: number, quiet: boolean) {
        if (!quiet) {
            this.cameoWait = false; // a boss, a stage end or a death took over: try again later
            return;
        }
        this.cameoWaitT += dt;
        let n = 0;
        for (const e of this.enemies) {
            if (!e.on || !e.alive || isBoss(e)) continue;
            if (e.x >= W + 4) this.removeEnemy(e);
            else n++;
            if (e.kind === 'heli') e.life = Math.min(e.life, 0); // a parked helicopter would hover right beside the balloon: send it home
        }
        if (n > 0 && this.cameoWaitT < 8) return;
        this.cameoWait = false;
        this.cameoEnemyCd = rnd(CAMEO_ENEMY_EVERY[0], CAMEO_ENEMY_EVERY[1]);
        const kind = CAMEO_ENEMIES[this.cameoEnemyIdx++ % CAMEO_ENEMIES.length];
        this.cameoE = this.spawnEnemy(kind, W + 50) ?? null;
        this.hud.showBanner('SÜRPRİZ MİSAFİR!', ENEMIES[kind].name.toUpperCase());
        Sound.play('boss', 0.8);
    }

    /** A cameo makes a stand instead of walking past: he strolls in, plants himself ahead of Memduh, and only leaves after a long fight. */
    private moveCameo(e: Enemy, dt: number, scroll: number) {
        e.stT += dt;
        if (e.st === 'enter') {
            e.x -= 90 * dt;
            if (e.x <= CAMEO_STOP) {
                e.st = 'hold';
                e.stT = 0;
            }
        } else if (e.st === 'hold') {
            e.x += (CAMEO_STOP + Math.sin(e.stT * 1.6) * 8 - e.x) * Math.min(1, dt * 6); // eases back if the scroll or a knock moved him
            if (e.stT > 12 && e.tele <= 0 && e.burst <= 0 && e.shootT < 0) {
                e.st = 'leave';
                e.stT = 0;
            }
        } else e.x -= scroll + e.def.walk * dt;
    }

    /** Motor Ahmet's Vespa: rides in from the left past Memduh's lane, brakes, turns around, shoots, then rides off. */
    private moveScooter(e: Enemy, dt: number) {
        e.stT += dt;
        if (e.st === 'enter') {
            // warning "!" sits on the left edge while he is still off-screen; the pass itself can be jumped
            e.x += 170 * Math.max(0.2, Math.min(1, (SCOOTER_STOP - e.x) / 110)) * dt;
            if (e.x >= SCOOTER_STOP - 2) {
                e.st = 'hold';
                e.stT = 0;
                e.s.setFlipX(true);
            }
        } else if (e.st === 'hold') {
            e.x = SCOOTER_STOP + Math.sin(e.stT * 2.4) * 5;
            if (e.stT > 7 && e.tele <= 0 && e.burst <= 0 && e.shootT < 0) {
                e.st = 'leave';
                e.stT = 0;
                e.s.setFlipX(false);
            }
        } else {
            e.x += Math.min(190, 40 + e.stT * 150) * dt;
        }
    }

    private spawnHazard(kind: 'crate' | 'barrel' | 'pit', x: number, w = 56) {
        const h = this.hazards.find((q) => !q.on);
        if (!h) return;
        h.kind = kind; h.on = true; h.x = x; h.roll = 0; h.hp = kind === 'crate' ? 3 : 1;
        h.s.clearTint().setRotation(0);
        h.w = kind === 'pit' ? w : kind === 'crate' ? 58 : 46;
        if (kind === 'pit') {
            h.s.setTexture('pit').setOrigin(0.5, 0).setScale(w / 32, 3).setDepth(-49).setPosition(x, GROUND_Y - 1).setVisible(true).setAlpha(1);
            h.warn.setVisible(true).setPosition(x, GROUND_Y - 78);
        } else {
            // the 'crate' obstacle is a pear bean bag (armut koltuk) now; the kind name stays so stages and encounters are untouched
            h.s.setTexture(kind === 'crate' ? 'beanbag' : 'barrel').setOrigin(0.5, 1).setScale(kind === 'crate' ? 1.7 : 1.8).setDepth(19).setRotation(0)
                .setPosition(x, GROUND_Y + 2).setVisible(true).setAlpha(1);
            h.warn.setVisible(false);
        }
    }

    private randomPickup(): PickupKind {
        // random drops are rare now; when one does drop, a friend is the most likely thing in it
        if (FRIENDS.length && this.friendCd <= 0 && Math.random() < 0.7) return 'friend';
        const r = Math.random();
        if (this.p.hp <= 2 && r < 0.7) return 'can';
        if (r < 0.2) return 'can';
        if (r < 0.4) return 'shield';
        if (r < 0.62) return 'rapid';
        if (r < 0.84) return 'bomb';
        return Math.random() < 0.8 ? 'air' : 'nuke';
    }

    /**
     * Power-ups are rationed: after one appears, ordinary drops are refused for a while (`force` is for deliveries the
     * player is promised, like Hacı Deve's cargo and caravans), and friends are spaced even further apart.
     */
    private spawnPickup(kind: PickupKind, x: number, y: number, force = false) {
        // a player down to their last teas waits a third less for the next drop
        if (!force && this.pickupCd > (this.p.hp <= 2 ? PICKUP_GAP / 3 : 0)) return;
        const pk = this.pickups.find((q) => !q.on);
        if (!pk) return;
        this.pickupCd = PICKUP_GAP;
        if (kind === 'friend') this.friendCd = FRIEND_GAP;
        pk.on = true; pk.kind = kind; pk.x = x; pk.y = y; pk.t = 0; pk.vy = 0;
        pk.s.setTexture(PICKUP_TEX[kind]).setVisible(true).setScale(1).setPosition(x, y);
        pk.glow.setVisible(true).setPosition(x, y);
    }

    // ---------------------------------------------------------------- main loop

    update(_t: number, delta: number) {
        const real = Math.min(0.05, delta / 1000);
        if (this.paused) return;
        this.pickupCd = Math.max(0, this.pickupCd - real);
        this.friendCd = Math.max(0, this.friendCd - real);
        // real-time effects
        if (this.slowT > 0) {
            this.slowT -= real;
            this.timeScale = 0.3 + 0.7 * (1 - Math.max(0, this.slowT) / 0.5);
            if (this.slowT <= 0) this.timeScale = 1;
        }
        if (this.fx.hitstop > 0) {
            this.fx.hitstop -= real;
            this.fx.update(real * 0.2);
            this.syncPlayer(0);
            return;
        }
        this.acc += real * this.timeScale;
        let n = 0;
        while (this.acc >= STEP && n < 4) {
            this.step(STEP);
            this.acc -= STEP;
            n++;
        }
        if (n === 4) this.acc = 0;
        this.fx.update(real);
        this.zoomKick = Math.max(0, this.zoomKick - real * 2);
        this.cameras.main.setZoom(K * (1 + this.zoomKick * 0.05));
        const bossFrac = this.boss && this.boss.alive ? this.boss.hp / this.boss.maxHp : null;
        const mult = this.mult();
        this.hud.update(real, this.score, this.combo, mult, this.comboT, this.p.pompa / 100, this.p.pompaT > 0, bossFrac);
        this.ctl.update(real, this.p.bombs, 3, this.p.bombProg, this.p.pompa / 100, this.p.pompaT > 0);
        const fxList: { tex: string; frac: number; left: number }[] = [];
        const add = (tex: string, left: number, total: number) => {
            if (left > 0) fxList.push({ tex, frac: left / total, left });
        };
        add('pu_kalkan', this.p.shield, 10);
        add('pu_hizli_ates', this.p.rapid, 10);
        add('pu_slap', this.p.infBomb, 10);
        add('pu_anesthesia', this.sleepT, STUN_TIME);
        add('pu_hack', this.hackT, HACK_MODE);
        this.hud.setEffects(fxList);
        this.dlg.update(real);
    }

    private mult() {
        return Math.min(8, 1 + Math.floor(this.combo / 4));
    }

    private step(dt: number) {
        const p = this.p;
        if (this.over) {
            this.updateDead(dt);
            this.updateObjects(dt, 0);
            return;
        }
        if (this.winT >= 0) {
            this.updateWin(dt);
            return;
        }
        const scroll = this.speed * dt;
        this.distance += scroll;
        this.backdrop.update(dt, scroll);

        this.updateInput(dt);
        this.updatePlayer(dt);
        this.updateObjects(dt, scroll);
        this.updateCamel(dt);
        this.updatePlane(dt);
        this.updateBubble(dt);
        this.updateHack(dt);
        this.updateFriendFx(dt);

        // The Pompa team does not wait to be found: a friend crashes in by themselves every half minute or so
        // (the friend pickups in drops are still there on top of this).
        // One spotlight at a time: it waits while a title, a balloon, a cameo entrance or a boss entrance is on screen.
        const spotlight = this.hud.bannerUp || this.bubble.active || this.bubbleQ.length > 0 || this.cameoWait || (!!this.cameoE && this.cameoE.stT < 4) || (!!this.boss && this.boss.alive && this.boss.stT < 4);
        this.cameoCd -= dt;
        if (this.cameoCd <= 0 && !p.dead && this.stageClearT < 0 && !spotlight) {
            // a friend comes when their power would help (pickFriend); if nobody's would, wait up to 3 s, then the rotation goes on
            this.targetWait += dt;
            if (this.pickFriend() >= 0 || this.targetWait > 3) {
                this.targetWait = 0;
                this.cameoCd = rnd(CAMEO_EVERY[0], CAMEO_EVERY[1]);
                this.friendCameo();
            }
        }
        // Chatter yields the same way: the top strip never shows a line while a balloon or a title owns the scene
        if (this.bubble.active || this.bubbleQ.length > 0 || this.hud.bannerUp) this.dlg.hold(0.25);

        // Cameo enemies (Motor Ahmet, Rehber Hoca, whoever the user adds) wander in on their own clock, in any stage, as a mini-boss
        // moment: the director stops sending soldiers, the road empties, and only then does the cameo make his entrance
        if (this.cameoE && !(this.cameoE.on && this.cameoE.alive)) this.cameoE = null;
        const st = this.director.stageTime;
        this.cameoEnemyCd -= dt;
        const quiet = !p.dead && this.stageClearT < 0 && !(this.boss && this.boss.alive) && st < this.stage.duration - 1;
        if (!this.cameoWait && !this.cameoE && this.cameoEnemyCd <= 0 && quiet && st > 4 && st < this.stage.duration - 5) {
            this.cameoWait = true;
            this.cameoWaitT = 0;
        }
        if (this.cameoWait) this.updateCameoWait(dt, quiet);

        // stage flow (the cameo's pause still lets the stage clock run, so stage length and the boss's arrival are unchanged)
        this.director.update(dt, !!(this.boss && this.boss.alive) || this.stageClearT >= 0 || this.cameoWait || !!this.cameoE);
        if (!this.stage.boss && st >= this.stage.duration && !this.endless && this.stageClearT < 0) this.stageClearT = 0;
        if (this.endless && !this.stage.boss && st >= this.stage.duration && this.stageClearT < 0) this.stageClearT = 0;
        if (this.stage.boss && !this.boss && !this.bossDone && !this.cameoE && st >= this.stage.duration) this.spawnBoss(this.stage.boss!);
        if (this.stageClearT >= 0) {
            const clear = !this.enemies.some((e) => e.on && e.alive) || this.stageClearT > 6;
            if (clear) this.stageClearT += dt;
            if (this.stageClearT > 1.0 && clear) {
                this.stageClearT = -1;
                this.bossDone = false;
                this.stageReward();
                this.beginStage(this.stageIdx + 1);
            }
        }
        // first-run hints
        if (this.hintStep < HINTS.length) {
            this.hintT += dt;
            if (this.hintT > [1.2, 6, 11.5, 17][this.hintStep]) {
                this.hud.showStatus(HINTS[this.hintStep], '#ffe36b');
                if (++this.hintStep === HINTS.length) Save.set('seenTutorial', true);
            }
        }
        // idle banter
        this.idleT -= dt;
        if (this.idleT <= 0) {
            this.idleT = rnd(10, 15);
            this.dlg.say('idle', { priority: 'low' });
        }
        // combo decay
        if (this.combo > 0) {
            this.comboT -= dt;
            if (this.comboT <= 0) this.combo = 0;
        }
        void p;
    }

    // ---------------------------------------------------------------- input + player

    /** Hacı Deve gallops through now and then, drops a pickup in front of Memduh and sasses him. */
    private updateCamel(dt: number) {
        const p = this.p;
        if (!this.camelOn) {
            this.camelCd -= dt;
            if (this.camelCd <= 0 && !p.dead) {
                this.camelOn = true;
                this.camelX = -150;
                this.camelDropped = false;
                this.camelT = 0;
                this.camel.setVisible(true);
                this.camelShadow.setVisible(true);
            }
            return;
        }
        this.camelT += dt;
        this.camelX += 270 * dt;
        this.camel.setTexture('camel_run', Math.floor(this.camelT * 22) % 16);
        this.camel.setPosition(this.camelX, GROUND_Y + 2 - Math.abs(Math.sin(this.camelT * 11)) * 3);
        this.camelShadow.setPosition(this.camelX, GROUND_Y + 1);
        if (!this.camelDropped && this.camelX > p.x + 60) {
            this.camelDropped = true;
            this.spawnPickup(this.randomPickup(), this.camelX + 100, GROUND_Y - 80, true);
            this.dlg.say('camelDrop', { priority: 'high' });
            this.fx.dust(this.camelX, GROUND_Y, 6, -1);
        }
        if (Math.random() < 0.4) this.fx.dust(this.camelX - 75, GROUND_Y, 1, -1);
        if (this.camelX > W + 190) {
            this.camelOn = false;
            this.camelCd = rnd(30, 42);
            this.camel.setVisible(false);
            this.camelShadow.setVisible(false);
        }
    }

    /** The canteen man's cargo plane: crosses the sky right to left and lets a patso go on a parachute above the lane. */
    private updatePlane(dt: number) {
        if (!this.planeOn) return;
        const p = this.p;
        this.planeX -= 230 * dt;
        const y = GROUND_Y - 395 + Math.sin(this.time.now / 260) * 4;
        this.plane.setPosition(this.planeX, y).setRotation(Math.sin(this.time.now / 300) * 0.02);
        if (Math.random() < 0.5) this.fx.dust(this.planeX + 70, y + 4, 1, 1);
        // released a little ahead of Memduh, so the crate floats down where a jump can reach it
        if (!this.planeDropped && this.planeX < p.x + 190) {
            this.planeDropped = true;
            this.spawnPickup('patso', this.planeX, y + 30, true);
            Sound.play('ui');
        }
        if (this.planeX < -90) {
            this.planeOn = false;
            this.plane.setVisible(false);
        }
    }

    private callPlane() {
        if (this.planeOn) return;
        this.planeOn = true;
        this.planeDropped = false;
        this.planeX = W + 90;
        this.plane.setVisible(true);
        Sound.play('boss', 0.5);
    }

    private updateInput(dt: number) {
        const p = this.p;
        if (this.ctl.jumpQ) {
            p.jumpBuf = 0.12;
            this.ctl.jumpQ = false;
        }
        p.jumpBuf = Math.max(0, p.jumpBuf - dt);
        p.coyote = p.ground ? 0.1 : Math.max(0, p.coyote - dt);
        if (p.jumpBuf > 0 && p.coyote > 0 && !p.dead) {
            p.vy = JUMP_V;
            p.ground = false;
            p.jumping = true;
            p.jumpBuf = 0;
            p.coyote = 0;
            p.takeoffT = 0.1;
            p.sx = 0.8;
            p.sy = 1.25;
            this.fx.dust(p.x - 6, GROUND_Y, 6, -1);
            Sound.play('jump');
            this.dlg.say('jump', { priority: 'low' });
        }
        if (!this.ctl.jumpHeld && p.vy < HOP_V && p.jumping) p.vy = HOP_V;
        // ducking only works on the ground, and a jump cancels it; it slips under head-high shots
        p.duck = this.ctl.duckHeld && p.ground && !p.dead && p.hurtT <= 0 && p.flexT <= 0;

        if (this.ctl.bombQ) {
            this.ctl.bombQ = false;
            this.tryBomb();
        }
        if (this.ctl.pompaQ) {
            this.ctl.pompaQ = false;
            if (p.pompa >= 100 && p.pompaT <= 0) this.activatePompa();
        }
        p.fireCd -= dt;
        p.fireHold = Math.max(0, p.fireHold - dt);
        if (this.ctl.fire && !p.dead && p.throwT < 0) this.tryFire();
        if (p.pompa >= 100 && p.pompaT <= 0 && !p.pompaAnnounced) {
            p.pompaAnnounced = true;
            Sound.play('pompaReady');
            this.hud.showStatus('POMPA GÜCÜ HAZIR!', '#ffe36b');
            this.dlg.say('pompaReady');
        }
    }

    private updatePlayer(dt: number) {
        const p = this.p;
        p.inv = Math.max(0, p.inv - dt);
        p.shield = Math.max(0, p.shield - dt);
        p.rapid = Math.max(0, p.rapid - dt);
        p.infBomb = Math.max(0, p.infBomb - dt);
        this.sleepT = Math.max(0, this.sleepT - dt);
        if (p.infBomb > 0) p.bombs = 3; // Deniz's slap: the bomb bag never empties
        p.hurtT = Math.max(0, p.hurtT - dt);
        p.landT = Math.max(0, p.landT - dt);
        p.takeoffT = Math.max(0, p.takeoffT - dt);
        p.recoil *= 0.82;
        p.nearMissCd = Math.max(0, p.nearMissCd - dt);
        if (p.pompaT > 0) {
            p.pompaT -= dt;
            p.pompa = Math.max(0, (p.pompaT / 6) * 100);
            this.fx.trailPuff(p.x - 14 + rnd(-6, 6), p.y - rnd(10, 70), 0xffd23c);
            if (p.pompaT <= 0) {
                p.pompa = 0;
                p.pompaAnnounced = false;
                this.dlg.say('pompaEnd');
                this.hud.showStatus('GÜÇ BİTTİ!', '#ffc23c');
            }
        }
        // bomb recharge
        if (p.bombs < 3) {
            p.bombProg += dt / 5.5;
            if (p.bombProg >= 1) {
                p.bombs++;
                p.bombProg = 0;
                Sound.play('ui');
            }
        }
        // throw timeline
        if (p.throwT >= 0) {
            const T = p.pompaT > 0 ? THROW_POMPA : THROW;
            p.throwT += dt;
            if (!p.throwDone && p.throwT > (T.release - T.from) / T.fps) {
                p.throwDone = true;
                this.launchBomb();
            }
            if (p.throwT > (T.last - T.from + 1) / T.fps) p.throwT = -1;
        }
        if (p.flexT > 0) p.flexT -= dt;
        // physics
        if (!p.ground) {
            p.vy += GRAV * dt;
            p.y += p.vy * dt;
            if (p.y >= GROUND_Y) {
                p.y = GROUND_Y;
                p.vy = 0;
                p.ground = true;
                p.jumping = false;
                p.landT = 0.12;
                p.sx = 1.25;
                p.sy = 0.75;
                this.fx.dust(p.x, GROUND_Y, 8, -1);
                this.fx.dust(p.x, GROUND_Y, 4, 1);
                Sound.play('land');
            }
        }
        // pits
        if (p.ground && !p.dead) {
            for (const h of this.hazards) {
                if (!h.on || h.kind !== 'pit') continue;
                if (Math.abs(h.x - p.x) < h.w / 2 - 8) {
                    this.fallInPit(h);
                    break;
                }
            }
        }
        p.sx += (1 - p.sx) * Math.min(1, dt * 14);
        p.sy += (1 - p.sy) * Math.min(1, dt * 14);
        // run animation phase advances with scroll speed (~12 fps at stage 1: a full 16-frame stride every 1.3s,
        // close to how fast the ground really slides under the feet)
        if (p.ground) {
            const step = Math.floor(p.runPh / 8);
            p.runPh += dt * (8 + this.speed * 0.04);
            // a small puff each time a foot lands (twice per stride)
            if (!p.dead && p.landT <= 0 && Math.floor(p.runPh / 8) !== step) this.fx.dust(p.x - 14, GROUND_Y, 1, -1);
        }
        this.syncPlayer(dt);
    }

    /**
     * Frame of the run cycle on screen. The bodybuilder's run-and-shoot sheet opens with 8 flex frames (fist forward, no
     * rifle), so while Pompa is on he only loops the 8 rifle-up frames, a little slower to keep the stride readable.
     * Memduh's own sheet has the gun low for its first frames too, so a held trigger stays on the same rifle-up half.
     */
    private runFrame() {
        const p = this.p;
        if (p.pompaT > 0) return 8 + (Math.floor(p.runPh * 0.75) % 8);
        return p.fireHold > 0 ? 8 + (Math.floor(p.runPh) % 8) : Math.floor(p.runPh) % 16;
    }

    private crawlFrame() {
        return Math.floor(this.p.runPh * (this.p.pompaT > 0 ? 0.55 : 0.8)) % 16;
    }

    private syncPlayer(dt: number) {
        const p = this.p;
        const sp = this.ply;
        let key: string;
        let frame: number;
        const firing = p.fireHold > 0;
        const pompa = p.pompaT > 0;
        const last = 15;
        if (p.dead) {
            key = 'memduh_death';
            frame = Math.min(last, Math.floor(p.deadT * 11));
        } else if (this.winT >= WIN_CHEER_AT && p.ground) {
            // the sheet plays through once, then its second half loops
            key = 'memduh_victory';
            const f = Math.floor((this.winT - WIN_CHEER_AT) * 10);
            frame = f < 16 ? f : 8 + (f % 8);
        } else if (p.hurtT > 0) {
            key = 'memduh_hurt';
            frame = Math.min(last, Math.floor(((HURT_DUR - p.hurtT) / HURT_DUR) * 16));
        } else if (p.flexT > 0) {
            key = 'pompa_flex';
            frame = Math.min(last, Math.floor(((FLEX_DUR - p.flexT) / FLEX_DUR) * 16));
        } else if (p.throwT >= 0) {
            key = pompa ? 'pompa_throw' : 'memduh_throw';
            const T = pompa ? THROW_POMPA : THROW;
            frame = Math.min(last, T.from + Math.floor(p.throwT * T.fps));
        } else if (!p.ground) {
            key = pompa ? 'pompa_jump' : 'memduh_jump';
            const prog = Phaser.Math.Clamp((p.vy - JUMP_V) / (-2 * JUMP_V), 0, 1);
            frame = p.takeoffT > 0 ? 2 : 4 + Math.min(7, Math.floor(prog * 8));
        } else if (p.duck) {
            // flat on his belly: the military crawl (the bodybuilder's is a heaving, clumsy scramble, slower on purpose)
            key = pompa ? 'pompa_crawl' : 'memduh_crawl';
            frame = this.crawlFrame();
        } else if (p.landT > 0) {
            key = pompa ? 'pompa_jump' : 'memduh_jump';
            frame = 12 + Math.min(3, Math.floor(((0.12 - p.landT) / 0.12) * 4));
        } else {
            key = pompa ? 'pompa_runshoot' : firing ? 'memduh_runshoot' : 'memduh_run';
            frame = this.runFrame();
        }
        sp.setTexture(key, frame);
        const big = PLAYER_SCALE * (pompa ? 1.15 : 1) * (pompa ? 1 + Math.sin(this.time.now / 90) * 0.015 : 1);
        const crawl = p.duck ? CRAWL_SCALE : 1; // big already includes the bodybuilder's 1.15
        sp.setScale(big * p.sx * crawl, big * p.sy * crawl);
        sp.setPosition(p.x - p.recoil, p.y);
        sp.setRotation(0);
        sp.setAlpha(p.inv > 0 && !pompa && !p.dead ? (Math.floor(p.inv * 18) % 2 ? 0.35 : 1) : 1);
        if (pompa) sp.setTint(Math.floor(this.time.now / 70) % 2 ? 0xffe9a0 : 0xffffff).setTintMode(Phaser.TintModes.MULTIPLY);
        else sp.clearTint();
        this.shadow.setPosition(p.x, GROUND_Y + 1).setScale(Math.max(1.4, 3.4 - (GROUND_Y - p.y) / 60), 2).setAlpha(Math.max(0.3, 1 - (GROUND_Y - p.y) / 160));
        this.aura.setPosition(p.x - 6, p.y - 52).setAlpha(p.pompaT > 0 ? 0.55 + Math.sin(this.time.now / 60) * 0.15 : 0);
        void dt;
    }

    private tryFire() {
        const p = this.p;
        if (p.fireCd > 0) return;
        const rate = p.pompaT > 0 ? 0.075 : p.rapid > 0 ? 0.085 : 0.14;
        p.fireCd = rate;
        p.fireHold = 0.22;
        let mx: number;
        let my: number;
        if (p.duck) {
            // low shooting: from the barrel of the crawl frame on screen
            // (the bodybuilder's rifle wanders around the frame while he heaves, so his muzzle stays at one spot low in front of him)
            const t = p.pompaT > 0 ? [36, 9] : TIP_CRAWL[this.crawlFrame()];
            const k = PLAYER_SCALE * CRAWL_SCALE * (p.pompaT > 0 ? 1.15 : 1);
            mx = p.x - p.recoil + t[0] * k;
            my = p.y - t[1] * k;
        } else if (p.ground && p.landT <= 0 && p.hurtT <= 0 && p.flexT <= 0) {
            // running: the barrel of whichever run-and-shoot frame is on screen right now
            const t = (p.pompaT > 0 ? TIP_POMPA : TIP_RUN)[this.runFrame()];
            const k = PLAYER_SCALE * (p.pompaT > 0 ? 1.15 : 1);
            mx = p.x - p.recoil + t[0] * k;
            my = p.y - t[1] * k;
        } else {
            const mz = p.pompaT > 0 ? MUZZLE_POMPA : MUZZLE;
            mx = p.x + mz.x;
            my = p.y + mz.y;
        }
        const tgt = this.nearestTarget();
        let ang = 0;
        if (tgt) ang = Phaser.Math.Clamp(Math.atan2(tgt.y - my, tgt.x - mx), -0.95, 0.45);
        ang += rnd(-0.025, 0.025);
        const b = this.bullets.find((q) => !q.on);
        if (!b) return;
        const spd = 600;
        b.on = true; b.x = mx; b.y = my; b.vx = Math.cos(ang) * spd; b.vy = Math.sin(ang) * spd;
        b.dmg = p.pompaT > 0 ? 2 : 1; b.pierce = p.pompaT > 0; b.hit.clear();
        const big = p.pompaT > 0;
        b.ang = ang;
        b.s.setVisible(true).setRotation(ang).setPosition(mx, my).setTint(big ? 0xffe36b : 0xffffff).setScale(big ? 3.2 : 2.4, big ? 2.6 : 2);
        b.trail.setVisible(true).setRotation(ang).setPosition(mx, my).setTint(big ? 0xffc23c : 0xff9a28).setScale(big ? 5.2 : 4, big ? 2.2 : 1.6);
        if (++this.shotCount % 3 === 0) this.fx.casing(mx - 22, my + 2);
        p.recoil = 3;
        // muzzle flash
        const f = this.flashes.find((q) => q.t <= 0);
        if (f) {
            f.t = 0.05;
            f.s.setVisible(true).setPosition(mx + Math.cos(ang) * 12, my + Math.sin(ang) * 12).setRotation(ang).setScale(0.85 + Math.random() * 0.3);
        }
        Sound.play('shoot', 1 + rnd(-0.1, 0.1));
    }

    /** Nearest thing worth shooting ahead of Memduh: enemies first, then destructible hazards. */
    private nearestTarget(): { x: number; y: number } | null {
        const p = this.p;
        let best: { x: number; y: number } | null = null;
        let bx = 1e9;
        for (const e of this.enemies) {
            if (!e.on || !e.alive || e.x < p.x + 20 || e.x - e.def.w / 2 > BULLET_MAX_X) continue;
            if (e.x < bx) {
                bx = e.x;
                best = { x: e.x, y: e.y - (e.def.flies ? e.def.h * 0.5 : e.def.h * 0.55) };
            }
        }
        for (const h of this.hazards) {
            if (!h.on || h.kind === 'pit' || h.x < p.x + 20 || h.x > BULLET_MAX_X) continue;
            if (h.x < bx) {
                bx = h.x;
                best = { x: h.x, y: GROUND_Y - 22 };
            }
        }
        return best;
    }

    private tryBomb() {
        const p = this.p;
        if (p.dead || p.throwT >= 0) return;
        if (p.bombs <= 0) {
            Sound.play('empty');
            this.hud.showStatus('BOMBA YOK!', '#ff9a7a');
            return;
        }
        if (p.infBomb <= 0) p.bombs--;
        p.throwT = 0;
        p.throwDone = false;
        Sound.play('bomb');
    }

    private launchBomb() {
        const p = this.p;
        const b = this.bombs.find((q) => !q.on);
        if (!b) return;
        const t = this.nearestTarget();
        const tx = Phaser.Math.Clamp(t ? t.x : p.x + 190, p.x + 120, p.x + 250);
        const T = 0.8;
        const x0 = p.x + 20;
        const y0 = p.y - 70;
        const G = 900;
        b.on = true; b.x = x0; b.y = y0; b.big = p.bigBomb || p.infBomb > 0; p.bigBomb = false; b.tx = tx; // Deniz's slap makes every bomb a big one
        b.vx = (tx - x0) / T;
        b.vy = (GROUND_Y - y0 - 0.5 * G * T * T) / T;
        b.s.setVisible(true).setTexture(b.big ? 'pr_buyuk_bomba' : 'pr_el_bombasi').setPosition(x0, y0).setScale(b.big ? 1.2 : 1);
        b.marker.setVisible(true).setPosition(tx, GROUND_Y + 2).setScale(0.6, 0.18).setAlpha(0.9);
        p.missCheck = 0;
    }

    // ---------------------------------------------------------------- objects

    private updateObjects(dt: number, scroll: number) {
        const p = this.p;
        // player bullets
        for (const b of this.bullets) {
            if (!b.on) {
                if (b.trail.visible) b.trail.setVisible(false); // bullets are switched off in many places; the trail follows here
                continue;
            }
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.s.setPosition(b.x, b.y);
            b.trail.setPosition(b.x - Math.cos(b.ang) * 30 * (b.trail.scaleX / 4), b.y - Math.sin(b.ang) * 30 * (b.trail.scaleX / 4));
            if (b.x > BULLET_MAX_X || b.y < -30 || b.x < -30) {
                this.fx.sparks(b.x, b.y, 1, 0xffe08a, 60);
                b.on = false; b.s.setVisible(false);
                continue;
            }
            if (b.y >= GROUND_Y - 2) {
                this.fx.dust(b.x, GROUND_Y, 2, -1);
                this.fx.sparks(b.x, GROUND_Y - 2, 3, 0xe8c38c, 90);
                b.on = false; b.s.setVisible(false);
                continue;
            }
            for (const e of this.enemies) {
                if (!e.on || !e.alive || b.hit.has(e)) continue;
                if (this.enemyHit(e, b.x, b.y)) {
                    b.hit.add(e);
                    this.damageEnemy(e, b.dmg, 'bullet', b.x, b.y);
                    if (!b.pierce) {
                        b.on = false; b.s.setVisible(false);
                        break;
                    }
                }
            }
            if (!b.on) continue;
            for (const h of this.hazards) {
                if (!h.on || h.kind === 'pit') continue;
                if (Math.abs(b.x - h.x) < h.w / 2 && b.y > GROUND_Y - 62 && b.y < GROUND_Y) {
                    this.damageHazard(h, 1, b.x, b.y);
                    if (!b.pierce) {
                        b.on = false; b.s.setVisible(false);
                    }
                    break;
                }
            }
        }
        for (const f of this.flashes) {
            if (f.t > 0) {
                f.t -= dt;
                if (f.t <= 0) f.s.setVisible(false);
            }
        }
        // bombs
        for (const b of this.bombs) {
            if (!b.on) continue;
            b.vy += 900 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.s.setPosition(b.x, b.y).setRotation(b.s.rotation + 11 * dt);
            b.marker.setScale(0.6 + Math.sin(this.time.now / 70) * 0.05, 0.18);
            if (Math.random() < 0.5) this.fx.trailPuff(b.x, b.y, 0xffc23c);
            let boom = b.y >= GROUND_Y;
            if (!boom) {
                for (const e of this.enemies) {
                    if (e.on && e.alive && b.vy > 0 && this.enemyHit(e, b.x, b.y)) boom = true;
                }
            }
            if (boom) this.bombExplode(b);
        }
        // enemy bullets
        for (const b of this.ebullets) {
            if (!b.on) continue;
            if (b.mortar) {
                b.t += dt;
                const k = Math.min(1, b.t / b.T);
                b.x = b.x0 + (b.tx - b.x0) * k;
                b.y = b.y0 + (GROUND_Y - b.y0) * k - Math.sin(k * Math.PI) * 190;
                b.s.setPosition(b.x, b.y).setRotation(b.s.rotation + 8 * dt);
                b.marker.setScale(0.9 + Math.sin(this.time.now / 60) * 0.06 + k * 0.4, 0.22).setAlpha(0.45 + k * 0.5);
                if (k >= 1) {
                    this.mortarBlast(b);
                    b.on = false; b.s.setVisible(false); b.marker.setVisible(false);
                }
                continue;
            }
            b.x += b.vx * dt - scroll * 0.0;
            b.y += b.vy * dt;
            b.s.setPosition(b.x, b.y);
            const butt = b.s.texture.key === 'cigbutt';
            if (butt) {
                b.s.setRotation(b.s.rotation - 14 * dt); // tumbles end over end, shedding ash
                if (Math.random() < dt * 22) this.fx.sparks(b.x, b.y, 1, 0xff7a21, 30);
            }
            if (b.x < -20 || b.x > W + 40 || b.y > GROUND_Y + 4 || b.y < -40) {
                b.on = false; b.s.setVisible(false);
                continue;
            }
            // a crawling Memduh is only 48 tall: head-high shots pass over him, chest-high ones still find him
            const hurtY0 = p.y - (p.duck ? 48 : 66);
            const hit = Math.abs(b.x - p.x) < 15 && b.y > hurtY0 && b.y < p.y;
            if (hit && !p.dead) {
                this.hurtPlayer(1);
                b.on = false; b.s.setVisible(false);
                this.fx.sparks(b.x, b.y, 6, 0xff7a21, 140);
                if (butt) this.fx.text(p.x, p.y - 96, 'CIZZZ!', '#ffb21e', 14);
                continue;
            }
            if (!b.passed && b.x < p.x - 4) {
                b.passed = true;
                if (Math.abs(b.y - (p.y - 34)) < 44 && p.nearMissCd <= 0 && !p.dead) {
                    p.nearMissCd = 3;
                    this.fx.text(p.x, p.y - 100, 'ÇOK YAKINDI!', '#9fe3ff', 12);
                    this.addPompa(2);
                    this.dlg.say('nearMiss', { priority: 'low' });
                }
            }
        }
        // enemies
        for (const e of this.enemies) if (e.on) this.updateEnemy(e, dt, scroll);
        this.declutterTags();
        // hazards
        for (const h of this.hazards) if (h.on) this.updateHazard(h, dt, scroll);
        // pickups
        for (const k of this.pickups) if (k.on) this.updatePickup(k, dt, scroll);
        void p;
    }

    private enemyHit(e: Enemy, x: number, y: number) {
        const d = e.def;
        const top = e.def.flies ? e.y - d.h : e.y - d.h;
        return Math.abs(x - e.x) < d.w / 2 && y > top && y < e.y + 4;
    }

    private updateEnemy(e: Enemy, dt: number, scroll: number) {
        const p = this.p;
        const d = e.def;
        e.t += dt;
        if (!e.alive) {
            e.dying -= dt;
            e.bang.setVisible(false);
            e.tag.setVisible(false);
            e.chute.setVisible(false);
            // a soldier shot out of the sky falls the rest of the way before his death animation can play out
            if (!d.flies && !isBoss(e) && e.y < GROUND_Y) e.y = Math.min(GROUND_Y, e.y + 320 * dt);
            if (d.flies || isBoss(e)) {
                // wrecks tumble out of the sky / smoulder in place
                const airborne = e.y < GROUND_Y;
                e.vy += isBoss(e) ? (airborne ? 420 * dt : 0) : 1100 * dt;
                e.x += e.vx * dt - scroll;
                e.y += e.vy * dt;
                e.rot += isBoss(e) ? (airborne ? dt * 0.5 : 0) : dt * 9;
                if (isBoss(e) && airborne && e.y >= GROUND_Y) {
                    // the helicopter hits the sand
                    e.y = GROUND_Y;
                    e.vy = 0;
                    this.fx.explosion(e.x, GROUND_Y - 40, 2, true);
                    this.fx.dust(e.x, GROUND_Y, 12, 0);
                    Sound.play('explode', 0.7);
                }
                if (isBoss(e) && Math.random() < 0.6) this.fx.smoke(e.x + rnd(-50, 50), e.y - rnd(20, 90), 1, 70);
                e.s.setPosition(e.x, e.y).setRotation(e.rot).setAlpha(Math.max(0, Math.min(1, e.dying / 0.7)));
                e.sh.setVisible(false);
            } else {
                // soldiers play their comic death, then fade
                const elapsed = 1.6 - e.dying;
                e.vx *= Math.pow(0.05, dt);
                e.x += e.vx * dt - scroll;
                e.s.setTexture(`${e.kind}_death`, Math.min(15, Math.floor(elapsed * 14)));
                e.s.setPosition(e.x, e.y).setAlpha(Math.max(0, Math.min(1, e.dying / 0.4)));
                e.sh.setPosition(e.x, GROUND_Y + 1).setAlpha(Math.max(0, Math.min(1, e.dying / 0.4)));
            }
            if (e.dying <= 0) this.removeEnemy(e);
            return;
        }
        e.flash = Math.max(0, e.flash - dt);
        e.kb *= Math.pow(0.02, dt);
        e.x += e.kb * dt;

        if ((e.stun > 0 || e.hack > 0) && this.enemyStatus(e, dt, scroll)) return;
        if (e.kind === 'tank') this.updateTank(e, dt);
        else if (e.kind === 'chief') this.updateChief(e, dt);
        else if (e.kind === 'heli') this.updateHeli(e, dt);
        else if (e.kind === 'drone') this.updateDrone(e, dt);
        else if (e.st === 'drop') {
            // under the canopy: a slow descent, drifting left on the wind at a third of the ground speed; harmless until he lands
            e.y += 105 * dt;
            e.x -= scroll * 0.35;
            e.chute.setPosition(e.x, e.y - d.h * 1.02).setScale(d.scale * 0.95 + Math.sin(e.t * 3) * 0.03, d.scale * 0.95);
            if (e.y >= GROUND_Y) {
                e.y = GROUND_Y;
                e.st = 'enter';
                e.fireT = rnd(1.4, 2.2); // a moment to find his feet before the first shot
                e.chute.setVisible(false);
                e.sh.setVisible(true);
                this.fx.dust(e.x, GROUND_Y, 5, 0);
            }
        } else {
            if (e.kind === 'teacher') this.moveScooter(e, dt);
            else if (e === this.cameoE) this.moveCameo(e, dt, scroll);
            else {
                e.x -= scroll + d.walk * dt;
                if (e.st !== 'drop' && !d.flies && !isBoss(e)) this.holdGap(e);
            }
            // shooting (only while ahead of Memduh and on screen)
            if (e.x < W - 12 && e.x > p.x + 70 && !p.dead && (e.kind !== 'teacher' || e.st === 'hold')) {
                if (e.tele > 0) {
                    e.tele -= dt;
                    if (e.tele <= 0) {
                        e.burst = d.burst;
                        e.burstT = 0;
                    }
                } else if (e.burst > 0) {
                    e.burstT -= dt;
                    if (e.burstT <= 0) {
                        this.enemyShoot(e);
                        e.burst--;
                        e.burstT = 0.2;
                        if (e.burst === 0) e.fireT = rnd(d.fire[0], d.fire[1]);
                    }
                } else {
                    e.fireT -= dt;
                    if (e.fireT <= 0) {
                        const tm = SHOOT_TIMING[e.kind as Humanoid];
                        e.shootT = 0;
                        e.tele = (tm.frame / 16) * tm.dur; // the shot lands exactly on the animation's firing frame
                    }
                }
            }
            // melee contact (the body, not the whole sprite box, so a well-timed jump clears anyone)
            if (!e.touched && Math.abs(e.x - p.x) < d.w * 0.32 + 6 && p.y > e.y - d.h * 0.5) {
                e.touched = true;
                this.hurtPlayer(1);
                e.kb = 160;
            }
            if (e.x < -140 && e.kind !== 'teacher') this.removeEnemy(e);
            if (e.kind === 'teacher' && e.st === 'leave' && e.x > W + 150) this.removeEnemy(e);
        }
        if (!e.on) return;
        // visuals: every state is a real 16-frame animation
        if (e.kind === 'heli' || e.kind === 'chief') {
            e.s.setTexture('heli_fly', Math.floor(e.t * 24) % 16);
        } else if (e.kind === 'drone') {
            e.s.setTexture('drone_fly', Math.floor(e.t * 30) % 16);
        } else if (e.kind === 'tank') {
            if (e.st === 'fire' && e.shootT >= 0) {
                e.shootT += dt;
                e.s.setTexture('tank_fire', Math.min(15, Math.floor(e.shootT * 14)));
                if (e.shootT > 1.2) e.shootT = -1;
            } else e.s.setTexture('tank_idle', Math.floor(e.t * 12) % 16);
        } else if (e.shootT >= 0) {
            const tm = SHOOT_TIMING[e.kind as Humanoid];
            e.shootT += dt;
            if (e.shootT >= tm.dur) e.shootT = -1;
            e.s.setTexture(`${e.kind}_shoot`, Math.max(0, Math.min(15, Math.floor((e.shootT / tm.dur) * 16))));
        } else if (e.kind === 'teacher') {
            e.s.setTexture('teacher_walk', Math.floor(e.t * (e.st === 'hold' ? 7 : 24)) % 16);
        } else {
            e.s.setTexture(`${e.kind}_walk`, Math.floor(e.t * (10 + (scroll / dt + d.walk) * 0.06)) % 16);
        }
        e.s.setPosition(e.x, e.y);
        this.updateTag(e);
        e.sh.setPosition(e.x, GROUND_Y + 1).setVisible(!d.flies);
        const incoming = e.kind === 'teacher' && e.st === 'enter' && e.x < 0;
        e.bang.setVisible(e.tele > 0 || incoming).setPosition(incoming ? 26 : e.x - 4, e.y - d.h - 32 - Math.sin(e.t * 30) * 2);
        if (e.flash > 0) e.s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        else if (this.hackT > 0 && this.hackNext.has(e) && Math.random() < 0.3) e.s.setTint(0x39ff6a).setTintMode(Phaser.TintModes.FILL); // a boss under attack flickers green
        else if (e.open) e.s.setTint(Math.floor(this.time.now / 90) % 2 ? 0xffee99 : 0xffffff).setTintMode(Phaser.TintModes.MULTIPLY);
        else e.s.clearTint();
    }

    /** Where an enemy's balloon tail points: the top of their head, not the top of their (shorter) hit box. */
    private bubbleY(e: Enemy) {
        return e.y - (e.def.head ?? e.def.h + 24);
    }

    /** Falling code and a dark green wash behind the characters: the screen visibly belongs to Tunç while his hack runs. */
    private buildHack() {
        this.hackT = 0; this.hackClock = 0; this.hackFade = 0; this.targetWait = 0;
        this.hackNext.clear();
        this.hackBeams = [];
        this.hackRain = [];
        this.hackDim = this.add.rectangle(W / 2, H / 2, W + 8, H + 8, 0x04210c, 0).setDepth(11).setVisible(false);
        const glyphs = '01<>/{}$#';
        for (let i = 0; i < 14; i++) {
            const lines: string[] = [];
            for (let n = 0; n < 32; n++) lines.push(glyphs[Math.floor(Math.random() * glyphs.length)] + (Math.random() < 0.5 ? glyphs[Math.floor(Math.random() * glyphs.length)] : ''));
            const t = this.add
                .text((i + 0.5) * (W / 14), 0, lines.join('\n'), { fontFamily: 'monospace', fontSize: '14px', color: '#39ff6a', resolution: K, align: 'center', lineSpacing: 0 })
                .setOrigin(0.5, 0).setDepth(12).setAlpha(0).setVisible(false);
            this.hackRain.push(t);
        }
        this.hackG = this.add.graphics().setDepth(60);
    }

    private buildFriendFx() {
        this.slept.clear(); this.sleepLen.clear(); this.dreamWord.clear();
        this.sleepFade = 0; this.sleepWarned = false;
        this.sleepDim = this.add.rectangle(W / 2, H / 2, W + 8, H + 8, 0x0a1a5c, 0).setDepth(11).setVisible(false);
        this.shieldG = this.add.graphics().setDepth(26);
        this.dreams = [];
        for (let i = 0; i < 8; i++) {
            const cloud = this.add.graphics();
            cloud.fillStyle(COLORS.ink, 1).fillEllipse(0, 0, 70, 32).fillCircle(-16, -11, 11).fillCircle(5, -15, 13).fillCircle(20, -10, 10).fillCircle(-26, 22, 5).fillCircle(-32, 30, 3.5);
            cloud.fillStyle(0xffffff, 0.95).fillEllipse(0, 0, 64, 26).fillCircle(-16, -11, 8.5).fillCircle(5, -15, 10.5).fillCircle(20, -10, 7.5).fillCircle(-26, 22, 3).fillCircle(-32, 30, 2);
            const t = this.add.text(0, -2, '', { fontFamily: FONT, fontSize: '11px', color: '#1b0f12', resolution: K }).setOrigin(0.5);
            const c = this.add.container(0, 0, [cloud, t]).setDepth(44).setVisible(false);
            this.dreams.push({ c, t });
        }
    }

    /**
     * While hack mode runs (HACK_MODE seconds) every ordinary soldier that steps into view is glitched and erased, a beam from
     * the friend banner marks each one. Bigger things (bosses, cameo enemies, fliers) cannot be deleted outright: they flicker green and
     * take a hit every second instead.
     */
    private updateHack(dt: number) {
        const on = this.hackT > 0;
        this.hackT = Math.max(0, this.hackT - dt);
        this.hackClock += dt;
        this.hackFade += ((on ? 1 : 0) - this.hackFade) * Math.min(1, dt * 5);
        if (this.hackFade < 0.01) this.hackFade = 0;
        this.hackDim.setVisible(this.hackFade > 0).setFillStyle(0x04210c, 0.42 * this.hackFade);
        const rainH = 32 * 17;
        this.hackRain.forEach((t, i) => {
            t.setVisible(this.hackFade > 0).setAlpha(0.5 * this.hackFade);
            t.y = ((this.hackClock * (70 + (i % 5) * 22) + i * 97) % (H + rainH)) - rainH;
        });
        if (on) {
            for (const e of this.enemies) {
                if (!e.on || !e.alive || e.x > W - 8 || e.x < -20) continue;
                const big = isBoss(e) || e.def.flies || CAMEO_ENEMIES.includes(e.kind);
                if (!big) {
                    if (e.hack > 0 || e.st === 'drop') continue;
                    e.hack = HACK_TIME;
                    e.stun = 0;
                    this.hackMark(e);
                    continue;
                }
                if ((this.hackNext.get(e) ?? 0) > this.hackClock) continue;
                this.hackNext.set(e, this.hackClock + 1);
                this.hackMark(e);
                this.damageEnemy(e, isBoss(e) ? 8 : e.def.flies ? 60 : Math.max(10, e.maxHp * 0.12), 'bomb', e.x, e.y - e.def.h * 0.5);
            }
        } else if (this.hackNext.size) this.hackNext.clear();
        // beams
        const g = this.hackG.clear();
        for (let i = this.hackBeams.length - 1; i >= 0; i--) {
            const b = this.hackBeams[i];
            b.t -= dt;
            if (b.t <= 0) { this.hackBeams.splice(i, 1); continue; }
            if (b.e.on) { b.x = b.e.x; b.y = b.e.y - b.e.def.h * 0.5; }
            const a = b.t / 0.35;
            let px = W / 2 + rnd(-30, 30), py = 250;
            for (const c of [0x39ff6a, 0xeaffea]) {
                g.lineStyle(c === 0x39ff6a ? 4 : 1.5, c, a).beginPath().moveTo(px, py);
                let qx = px, qy = py;
                for (let s = 1; s <= 4; s++) {
                    qx = px + (b.x - px) * (s / 4) + (s < 4 ? rnd(-12, 12) : 0);
                    qy = py + (b.y - py) * (s / 4);
                    g.lineTo(qx, qy);
                }
                g.strokePath();
            }
            g.lineStyle(2, 0x39ff6a, a).strokeRect(b.x - 16, b.y - 16, 32, 32); // target brackets
        }
    }

    private hackMark(e: Enemy) {
        this.hackBeams.push({ e, x: e.x, y: e.y - e.def.h * 0.5, t: 0.35 });
        this.fx.text(e.x, e.y - e.def.h - 14, 'HACKED!', '#39ff6a', 12);
        this.fx.sparks(e.x, e.y - e.def.h * 0.5, 4, 0x39ff6a, 160);
    }

    /** Queued, not shown: one speaker at a time, so a second enemy arriving can never cut the first one's joke short. */
    private sayBubble(e: Enemy, text: string) {
        if (this.bubbleQ.length < 2) this.bubbleQ.push({ e, kind: e.kind, name: e.def.name, text, x: e.x, y: this.bubbleY(e) });
    }

    private updateBubble(dt: number) {
        const e = this.bubbleE;
        if (e && (!e.on || !e.alive)) this.bubbleE = null; // the line finishes even if the speaker does not
        if (this.bubbleE) this.bubble.update(dt, e!.x, this.bubbleY(e!));
        else this.bubble.update(dt);
        if (this.bubble.active) return;
        this.bubbleE = null;
        if (!this.bubbleQ.length || this.hud.bannerUp) return;
        // a speaker killed while waiting still gets their line, where they fell (the pooled slot may already be someone else)
        const q = this.bubbleQ.shift()!;
        const alive = q.e.on && q.e.alive && q.e.kind === q.kind;
        if (alive) this.bubbleE = q.e;
        this.bubble.say(q.name, q.text, alive ? q.e.x : q.x, alive ? this.bubbleY(q.e) : q.y);
        Sound.play('ui');
    }

    /** Soldiers get small, quiet type. A cameo character's name is the joke, so it goes on a gold plate. */
    private styleTag(tag: Phaser.GameObjects.Text, cameo: boolean) {
        if (cameo) tag.setFontSize(TYPE.plate).setColor('#1b0f12').setStroke('#1b0f12', 0).setBackgroundColor('#ffc23c').setPadding(8, 3, 8, 3).setAlpha(1);
        else tag.setFontSize(13).setColor('#fff6c8').setStroke('#1b0f12', 4).setBackgroundColor(null as unknown as string).setPadding(2, 2, 2, 1).setAlpha(1);
    }

    /** The enemy's name rides above their head: the names are half the joke, so they are always readable. */
    private updateTag(e: Enemy) {
        const show = e.alive && e.x > 14 && e.x < W - 14;
        e.tag.setVisible(show && e !== this.bubbleE); // the balloon carries the name while they talk
        if (!show) return;
        if (!e.said) {
            e.said = true;
            const q = ENEMY_QUOTES[e.kind];
            if (q) this.sayBubble(e, q[Math.floor(Math.random() * q.length)]);
            // the name pops in a little bigger, then settles
            this.tweens.killTweensOf(e.tag);
            e.tag.setScale(1.7);
            this.tweens.add({ targets: e.tag, scale: 1, duration: 420, ease: 'Back.out' });
        }
        // the name sits just above the topmost drawn pixel (def.head); a paratrooper's canopy (32x52 texture, see the drop update) is above that
        const d = e.def;
        const top = e.st === 'drop' ? Math.max(d.head ?? 0, d.h * 1.02 + 52 * d.scale * 0.95) : d.head ?? d.h + 24;
        e.tag.setPosition(e.x, e.y - top - 6);
    }

    /**
     * A soldier name that would sit on top of another visible name this frame is hidden, so a group of soldiers does not make a
     * smear of text. Cameo plates and boss names are never hidden (and are what the soldiers give way to). While someone is
     * talking every soldier name goes quiet, so the balloon is the only thing to read.
     */
    private declutterTags() {
        const list = this.enemies;
        for (const a of list) {
            if (!a.on || !a.tag.visible || isBoss(a) || CAMEO_ENEMIES.includes(a.kind)) continue;
            const ta = a.tag;
            if (this.bubble.active) {
                ta.setVisible(false);
                continue;
            }
            for (const b of list) {
                if (b === a || !b.on || !b.tag.visible) continue;
                const tb = b.tag;
                if (Math.abs(ta.x - tb.x) < (ta.width * ta.scaleX + tb.width * tb.scaleX) / 2 + 2 && Math.abs(ta.y - tb.y) < (ta.height + tb.height) / 2 + 1) {
                    ta.setVisible(false);
                    break;
                }
            }
        }
    }

    /**
     * Melike's anesthesia (asleep and lying down, harmless) and Tunç's hack (glitches out, shrinks in steps, then is erased)
     * take over a ground enemy's whole update. Returns true while one of them is running.
     */
    private enemyStatus(e: Enemy, dt: number, scroll: number): boolean {
        const d = e.def;
        e.bang.setVisible(false);
        this.updateTag(e);
        e.tele = 0; e.burst = 0; e.shootT = -1;
        if (e.kind !== 'teacher') e.x -= scroll; // it stays where it is on the ground (the Vespa rider's post is on screen)
        if (e.hack > 0) {
            e.hack -= dt;
            const prog = 1 - Math.max(0, e.hack) / HACK_TIME;
            const step = Math.floor(prog * 5) / 5;
            const k = 1 - 0.6 * step;
            e.s.setScale(d.scale * k * (Math.random() < 0.3 ? 1.12 : 1), d.scale * k);
            e.s.setPosition(e.x + (Math.random() - 0.5) * 6, e.y);
            e.s.setTint(Math.random() < 0.5 ? 0x39ff6a : 0xeaffea).setTintMode(Phaser.TintModes.FILL);
            e.s.setAlpha(Math.random() < 0.25 ? 0.4 : 1);
            if (Math.random() < 0.5) this.fx.sparks(e.x, e.y - d.h * 0.5, 1, 0x39ff6a, 140);
            if (e.hack <= 0) {
                e.s.setScale(d.scale).setAlpha(1).clearTint();
                this.damageEnemy(e, 999, 'bomb', e.x, e.y - d.h * 0.5);
            }
            return true;
        }
        e.stun -= dt;
        const elapsed = (this.sleepLen.get(e) ?? STUN_TIME) - e.stun;
        const frame = e.stun < 0.6 ? Math.floor(15 * (Math.max(0, e.stun) / 0.6)) : Math.min(15, Math.floor(elapsed * 18));
        e.s.setTexture(`${e.kind}_death`, frame).setPosition(e.x, e.y).setTint(0xb8e8ff).setTintMode(Phaser.TintModes.MULTIPLY);
        e.sh.setPosition(e.x, GROUND_Y + 1).setVisible(true);
        // a steady trickle of z / Z / Z drifting up from the head, growing as it rises
        const zn = Math.floor(e.t / 0.3);
        if (zn !== Math.floor((e.t - dt) / 0.3)) {
            const k = zn % 3;
            this.fx.text(e.x + 8 + k * 7, e.y - d.h * 0.8, k === 0 ? 'z' : 'Z', '#cfeeff', [11, 14, 18][k]);
        }
        if (e.stun <= 0) e.s.clearTint();
        return true;
    }

    private enemyShoot(e: Enemy) {
        const p = this.p;
        if (e.kind === 'dinho') {
            // her raised hand on the throw frame; like every mortar it gives a ring to read and a jump clears the blast
            this.mortar(e.x - 34, e.y - 113, Phaser.Math.Clamp(p.x + rnd(-10, 30), 16, W - 60), 1.2, 'football');
            return;
        }
        const b = this.ebullets.find((q) => !q.on);
        if (!b) return;
        // the Vespa rider holds his pistol out at arm's length, higher and further forward than a standing soldier
        const chem = e.kind === 'chem';
        const butt = e.kind === 'trucker';
        const mx = e.kind === 'teacher' ? e.x - 70 : chem ? e.x - 42 : butt ? e.x - 40 : e.x - 30;
        const my = e.kind === 'teacher' ? e.y - 88 : chem ? e.y - 66 : butt ? e.y - 59 : e.y - 46;
        // Hired guns are bad shots. Each bullet is aimed to arrive at one of three heights above the ground: 76 whizzes over
        // a standing Memduh (that is what makes "ÇOK YAKINDI!" happen), 56 is head height (duck it), 28 is chest height
        // (jump it). The bullet keeps 0.6 of its aim offset (vy * 0.6 below), hence the maths for the aim point.
        const r = Math.random();
        const arrive = r < 0.52 ? 76 : r < 0.76 ? 56 : 28;
        const aimH = (arrive - (GROUND_Y - my) * 0.4) / 0.6;
        const ang = Math.atan2(p.y - aimH - my, p.x - mx);
        b.on = true; b.mortar = false; b.passed = false; b.x = mx; b.y = my;
        b.vx = Math.cos(ang) * e.def.bulletSpeed; b.vy = Math.sin(ang) * e.def.bulletSpeed * 0.6;
        b.s.setVisible(true).setTexture(butt ? 'cigbutt' : 'ebullet').setPosition(mx, my).setScale(2).setRotation(0).setTint(chem ? 0x6bff5a : 0xffffff);
        b.marker.setVisible(false);
        if (chem) this.fx.sparks(mx, my, 5, 0x6bff5a, 110, -1);
        if (butt) {
            this.fx.sparks(mx, my, 4, 0xffb21e, 70, -1);
            Sound.play('ui'); // a flick, not a gunshot
            return;
        }
        const f = this.flashes.find((q) => q.t <= 0);
        if (f) {
            f.t = 0.06;
            f.s.setVisible(true).setPosition(mx - 10, my).setRotation(Math.PI).setScale(0.8);
        }
        Sound.play('enemyShot');
    }

    private mortar(fromX: number, fromY: number, tx: number, T: number, tex = 'ebullet') {
        const b = this.ebullets.find((q) => !q.on);
        b?.s.clearTint();
        if (!b) return;
        b.on = true; b.mortar = true; b.passed = true; b.t = 0; b.T = T; b.x0 = fromX; b.y0 = fromY; b.tx = tx; b.x = fromX; b.y = fromY;
        b.s.setVisible(true).setTexture(tex).setScale(tex === 'ebullet' ? 3 : 2).setPosition(fromX, fromY);
        b.marker.setVisible(true).setPosition(tx, GROUND_Y + 2).setScale(0.9, 0.22).setAlpha(0.5);
        Sound.play('bomb');
    }

    private mortarBlast(b: EBullet) {
        this.fx.explosion(b.tx, GROUND_Y - 10, 1.5);
        Sound.play('explode', 1.2);
        if (b.s.texture.key === 'football') this.fx.text(b.tx, GROUND_Y - 70, 'GOL!', '#ffe36b', 18);
        const p = this.p;
        if (Math.abs(p.x - b.tx) < 46 && GROUND_Y - p.y < 26 && !p.dead) this.hurtPlayer(1);
    }

    private updateHeli(e: Enemy, dt: number) {
        const p = this.p;
        e.life -= dt;
        const tx = e.life > 0 ? W - 84 + Math.sin(e.t * 0.9) * 46 : W + 160;
        e.x += (tx - e.x) * Math.min(1, dt * 1.6);
        const ty = e.life > 0 ? GROUND_Y - 155 + Math.sin(e.t * 2) * 10 : -80;
        e.y += (ty - e.y) * Math.min(1, dt * 1.6);
        e.s.setRotation(Math.sin(e.t * 2.5) * 0.04 + (tx - e.x) * 0.0006);
        if (e.life <= -3) {
            this.removeEnemy(e);
            return;
        }
        if (e.life > 0 && e.x < W - 20 && !p.dead) {
            if (e.tele > 0) {
                e.tele -= dt;
                if (e.tele <= 0) {
                    this.mortar(e.x - 20, e.y - 10, p.x + rnd(-10, 40), 1.05);
                    e.fireT = rnd(e.def.fire[0], e.def.fire[1]);
                }
            } else {
                e.fireT -= dt;
                if (e.fireT <= 0) e.tele = 0.55;
            }
        }
        // rotor wash
        if (Math.random() < 0.5) this.fx.dust(e.x - 10, e.y + 8, 1, -1);
    }

    /** Bombing run: sweeps right to left above the lane, dropping a bomb straight down every second or so (each shows a ground marker). */
    private updateDrone(e: Enemy, dt: number) {
        const p = this.p;
        e.x -= 95 * dt;
        e.y += Math.sin(e.t * 3) * 0.35;
        e.s.setRotation(Math.sin(e.t * 2.2) * 0.05);
        if (e.x < -110) {
            this.removeEnemy(e);
            return;
        }
        if (!p.dead && e.x < W - 20 && e.x > 30) {
            e.fireT -= dt;
            if (e.fireT <= 0) {
                this.mortar(e.x, e.y + 16, e.x - 12, 0.95);
                e.fireT = rnd(e.def.fire[0], e.def.fire[1]);
            }
        }
    }

    private updateTank(e: Enemy, dt: number) {
        const p = this.p;
        e.stT += dt;
        const frac = e.hp / e.maxHp;
        const phase = frac > 0.6 ? 1 : frac > 0.3 ? 2 : 3;
        if (e.st !== 'enter') e.x += (W - 92 - e.x) * Math.min(1, dt * 3); // always settle back to its post
        switch (e.st) {
            case 'enter': {
                const tx = W - 92;
                e.x += (tx - e.x) * Math.min(1, dt * 2.2);
                if (Math.abs(e.x - tx) < 3) {
                    e.st = 'idle';
                    e.stT = 0;
                }
                if (Math.random() < 0.5) this.fx.dust(e.x + 60, GROUND_Y, 1, 1);
                break;
            }
            case 'idle':
                e.open = false;
                e.x += Math.sin(e.t * 1.5) * 0.15;
                if (e.stT > (phase === 3 ? 0.7 : 1.3)) {
                    e.st = 'aim';
                    e.stT = 0;
                    e.tele = 0.9;
                    Sound.play('boss');
                    this.fx.ring(e.x - 60, e.y - 80, 0xffe36b, 3, 0.5);
                }
                break;
            case 'aim':
                e.tele = Math.max(0.01, e.tele);
                e.x += (Math.random() - 0.5) * 0.5;
                if (e.stT > 0.9) {
                    e.tele = 0;
                    e.st = 'fire';
                    e.stT = 0;
                    e.shootT = 0;
                    e.volley = phase === 1 ? 1 : phase === 2 ? 3 : 4;
                }
                break;
            case 'fire':
                if (e.stT >= 0.0 && e.volley > 0 && e.stT > (4 - e.volley) * 0 + 0.0) {
                    e.stT = -0.3;
                    const n = e.volley;
                    e.volley--;
                    // spaced so exactly one shell of a volley lands on Memduh: one well-timed jump always answers it
                    const off = phase === 1 ? 0 : (n - 2) * 96;
                    this.mortar(e.x - 66, e.y - 84, Phaser.Math.Clamp(p.x + off + (phase === 1 ? 0 : 20), 16, W - 60), 1.15);
                    this.fx.explosion(e.x - 70, e.y - 88, 0.7);
                    e.kb += 0;
                }
                if (e.volley <= 0 && e.stT > 0) {
                    e.st = 'open';
                    e.stT = 0;
                    e.open = true;
                    this.fx.text(e.x, e.y - 130, 'AÇIK! VUR!', '#ffee66', 14);
                }
                break;
            case 'open':
                e.open = true;
                if (e.stT > (phase === 3 ? 1.5 : 2.0)) {
                    e.st = 'idle';
                    e.stT = 0;
                    e.open = false;
                    // once wounded it calls for backup, so the fight changes as it goes on
                    if (phase >= 2 && this.spawner().aliveEnemies() < 2) this.spawnEnemy(phase === 3 ? 'armor' : 'rifle', W + 30);
                }
                break;
        }
        e.s.setPosition(e.x, e.y).setRotation(0).setScale(e.def.scale, e.def.scale * (1 +Math.sin(e.t * 12) * 0.006));
    }

    /** Başmüfettiş: a hovering inspector with three attacks and a "tired" window where he can really be hurt. */
    private updateChief(e: Enemy, dt: number) {
        const p = this.p;
        e.stT += dt;
        const frac = e.hp / e.maxHp;
        const phase = frac > 0.6 ? 1 : frac > 0.3 ? 2 : 3;
        const post = W - 104;
        const top = GROUND_Y - 170;
        const ease = (tx: number, ty: number, k: number) => {
            e.x += (tx - e.x) * Math.min(1, dt * k);
            e.y += (ty - e.y) * Math.min(1, dt * k);
        };
        switch (e.st) {
            case 'enter':
                ease(post, top, 1.6);
                if (Math.abs(e.x - post) < 8) {
                    e.st = e.volley === -1 ? 'tired' : 'hover';
                    e.volley = 0;
                    e.stT = 0;
                    e.open = e.st === 'tired';
                }
                break;
            case 'hover':
                e.open = false;
                ease(post + Math.sin(e.t * 0.9) * 40, top + Math.sin(e.t * 2) * 8, 3);
                if (e.stT > (phase === 3 ? 0.8 : 1.3)) {
                    e.burst++;
                    e.stT = 0;
                    if (e.burst % 3 === 1 || phase === 1 && e.burst % 2 === 0) {
                        e.st = 'aim';
                        e.tele = 0.8;
                        e.shootT = 0;
                        if (phase >= 2 && this.spawner().aliveEnemies() < 2) this.spawnEnemy('rifle', W + 30);
                    } else {
                        e.st = 'cpre';
                        e.tele = 0.9;
                    }
                    Sound.play('boss');
                }
                break;
            case 'aim':
                ease(post, top, 4);
                e.tele = 0.8; // keeps the "!" marker up while he aims
                if (e.stT > 0.8) {
                    e.tele = 0;
                    e.st = 'volley';
                    e.stT = 0;
                    e.volley = phase === 1 ? 2 : phase === 2 ? 3 : 4;
                    e.burstT = 0;
                }
                break;
            case 'volley':
                e.burstT -= dt;
                if (e.volley > 0 && e.burstT <= 0) {
                    const offs = [0, 75, -55, 140];
                    const i = (phase === 1 ? 2 : phase === 2 ? 3 : 4) - e.volley;
                    this.mortar(e.x - 30, e.y - 30, Phaser.Math.Clamp(p.x + offs[i % 4], 70, W - 60), 1.15);
                    e.volley--;
                    e.burstT = 0.4;
                }
                if (e.volley <= 0 && e.burstT <= 0) {
                    e.st = 'tired';
                    e.stT = 0;
                    e.open = true;
                    this.fx.text(e.x, e.y - 100, 'YORGUN! VUR!', '#ffee66', 14);
                }
                break;
            case 'cpre':
                ease(W + 80, top - 20, 2.5);
                if (e.stT > 0.9) {
                    e.tele = 0;
                    e.st = 'carpet';
                    e.stT = 0;
                    e.burstT = 0;
                }
                break;
            case 'carpet':
                e.x -= (phase === 3 ? 300 : 240) * dt;
                e.y += (top - 20 - e.y) * Math.min(1, dt * 4);
                e.burstT -= dt;
                if (e.burstT <= 0 && e.x < W - 10) {
                    this.mortar(e.x, e.y - 20, e.x - 28, 0.62);
                    e.burstT = 0.2;
                }
                if (e.x < -90) {
                    e.x = W + 140;
                    e.volley = -1; // arrive tired
                    e.st = 'enter';
                }
                break;
            case 'tired':
                e.open = true;
                ease(post, top + 22, 2);
                if (Math.random() < 0.3) this.fx.smoke(e.x - 20, e.y - 20, 1, 30);
                if (e.stT > (phase === 3 ? 1.8 : 2.4)) {
                    e.st = 'hover';
                    e.stT = 0;
                    e.open = false;
                }
                break;
        }
        if (Math.random() < 0.4) this.fx.dust(e.x - 10, e.y + 10, 1, -1);
        e.s.setRotation(Math.sin(e.t * 2.5) * 0.04 + (e.st === 'carpet' ? -0.12 : 0));
    }

    private spawnBoss(kind: 'tank' | 'chief') {
        const e = this.enemies.find((q) => !q.on);
        if (!e) return;
        this.spawnEnemy(kind, W + 140);
        e.hp = e.maxHp = ENEMIES[kind].hp * (this.endless ? 1.4 : 1);
        if (kind === 'chief') e.y = GROUND_Y - 260;
        this.boss = e;
        this.hud.showBoss(ENEMIES[kind].name);
        this.hud.showBanner(this.endless ? 'BOSS GERİ DÖNDÜ!' : kind === 'tank' ? 'MİNİ BOSS!' : 'FİNAL BOSS!', ENEMIES[kind].name.toUpperCase());
        this.dlg.say(kind === 'tank' ? 'tankIntro' : 'heliIntro', { priority: 'high' });
        Sound.play('boss');
        this.fx.shake(0.4);
    }

    private updateHazard(h: Hazard, dt: number, scroll: number) {
        const p = this.p;
        let dx = scroll;
        if (h.kind === 'barrel') {
            dx += 70 * dt;
            h.roll += dx / 12;
            h.s.setRotation(-h.roll);
        }
        h.x -= dx;
        h.s.x = h.x;
        if (h.kind === 'pit') {
            h.warn.setPosition(h.x, GROUND_Y - 80 + Math.sin(this.time.now / 120) * 3).setVisible(h.x > p.x + 70);
        }
        if (h.x < -90) {
            h.on = false; h.s.setVisible(false); h.warn.setVisible(false);
            return;
        }
        if (h.kind !== 'pit' && !p.dead && Math.abs(h.x - p.x) < h.w / 2 + 10 && p.y > GROUND_Y - 62) {
            if (h.kind === 'barrel') this.barrelBlast(h);
            else {
                this.fx.debris(h.x, GROUND_Y - 20, 18, 0xf2e8d5); // bean-bag beans
                h.on = false; h.s.setVisible(false);
                this.hurtPlayer(1);
            }
        }
    }

    private damageHazard(h: Hazard, dmg: number, x: number, y: number) {
        h.hp -= dmg;
        this.fx.sparks(x, y, 4, 0xffd86b, 110);
        Sound.play('hit');
        h.s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        // not gated on `h.on`: a crate that dies from this hit goes back to the pool, and a leftover white fill would
        // turn the next hazard drawn with that sprite (a pit, say) into a solid white box
        this.time.delayedCall(50, () => h.s.clearTint());
        if (h.hp > 0) return;
        if (h.kind === 'barrel') {
            this.barrelBlast(h);
        } else {
            this.fx.debris(h.x, GROUND_Y - 24, 22, 0xf2e8d5); // the beans spill out
            this.fx.text(h.x, GROUND_Y - 60, 'POF!', '#ffd9a0', 15);
            this.fx.dust(h.x, GROUND_Y, 6, 0);
            this.addScore(40, h.x, GROUND_Y - 50);
            h.on = false; h.s.setVisible(false);
            Sound.play('kill');
            if (Math.random() < 0.09) this.spawnPickup(this.randomPickup(), h.x, GROUND_Y - 40);
        }
    }

    private barrelBlast(h: Hazard) {
        h.on = false; h.s.setVisible(false);
        this.fx.explosion(h.x, GROUND_Y - 30, 1.5);
        this.fx.stop(50);
        Sound.play('explode');
        const p = this.p;
        for (const e of this.enemies) {
            if (e.on && e.alive && Math.abs(e.x - h.x) < 96) this.damageEnemy(e, 10, 'bomb', e.x, e.y - 40);
        }
        for (const o of this.hazards) {
            if (o.on && o !== h && o.kind !== 'pit' && Math.abs(o.x - h.x) < 70) this.damageHazard(o, 3, o.x, GROUND_Y - 20);
        }
        if (!p.dead && Math.abs(p.x - h.x) < 60 && GROUND_Y - p.y < 36) this.hurtPlayer(1);
    }

    private updatePickup(k: Pickup, dt: number, scroll: number) {
        const p = this.p;
        k.t += dt;
        k.x -= scroll;
        const falling = k.kind === 'patso' && k.y < GROUND_Y - 40;
        if (falling) {
            // a slow parachute descent that sways, and drifts with the wind a little slower than the ground
            k.y = Math.min(GROUND_Y - 40, k.y + 52 * dt);
            k.x += scroll * 0.55 + Math.sin(k.t * 2) * 0.5;
            this.patsoChute.setVisible(true).setPosition(k.x, k.y - 8).setRotation(Math.sin(k.t * 2) * 0.06);
        } else if (k.kind === 'patso') this.patsoChute.setVisible(false);
        const dx = p.x - k.x;
        const dy = p.y - 40 - k.y;
        const dist = Math.hypot(dx, dy);
        if (dist < (falling ? 52 : 90) && !p.dead) {
            k.x += (dx / dist) * 120 * dt;
            k.y += (dy / dist) * 120 * dt;
        }
        // pixel art stays at scale 1 (x K = exact 2x) and sits on the device-pixel grid; a fractional scale or
        // sub-pixel bob made the nearest-neighbour edges crawl. The pulse lives on the glow instead.
        k.s.setPosition(Math.round(k.x * K) / K, Math.round((k.y + Math.sin(k.t * 4) * 4) * K) / K).setScale(1);
        k.glow.setPosition(k.x, k.y).setAlpha(0.45 + Math.sin(k.t * 5) * 0.15).setScale(1.6 + Math.sin(k.t * 6) * 0.08);
        if (dist < 34 && !p.dead) {
            this.collect(k);
            return;
        }
        if (k.x < -40) {
            k.on = false; k.s.setVisible(false); k.glow.setVisible(false);
            if (k.kind === 'patso') this.patsoChute.setVisible(false);
        }
    }

    private collect(k: Pickup) {
        const p = this.p;
        k.on = false; k.s.setVisible(false); k.glow.setVisible(false);
        Sound.play('pickup');
        this.fx.ring(k.x, k.y, 0xffe36b, 2.4, 0.4);
        this.fx.sparks(k.x, k.y, 10, 0xffe36b, 160);
        this.addScore(50, k.x, k.y - 16);
        if (k.kind === 'patso') this.patsoChute.setVisible(false);
        switch (k.kind) {
            case 'patso': {
                // caught in mid-air it is worth double: that is what a big jump is for
                const air = k.y < PATSO_AIR_Y;
                const tea = air ? 2 : 1;
                p.hp = Math.min(MAX_HP, p.hp + tea);
                this.hud.setHp(p.hp);
                this.hud.pulseHp(Math.max(0, p.hp - tea));
                p.rapid = Math.max(p.rapid, air ? 9 : 6);
                this.hud.showStatus(air ? 'HAVADA YAKALADI! +2 ÇAY' : 'PATSO! +1 ÇAY', '#ffd23c');
                this.addScore(air ? 300 : 100, k.x, k.y - 30);
                this.dlg.say(air ? 'patsoCatch' : 'patsoLand', { priority: 'normal' });
                break;
            }
            case 'can':
                p.hp = Math.min(MAX_HP, p.hp + 1);
                this.hud.setHp(p.hp);
                this.hud.pulseHp(p.hp - 1);
                this.hud.showStatus('ÇAY +1', '#ffb066');
                this.dlg.say('pickupHealth');
                break;
            case 'shield':
                p.shield = 9;
                this.hud.showStatus('KALKAN!', '#9fe3ff');
                this.dlg.say('pickupShield');
                break;
            case 'rapid':
                p.rapid = 9;
                this.hud.showStatus('HIZLI ATEŞ!', '#ffe36b');
                this.dlg.say('pickupRapid');
                break;
            case 'bomb':
                p.bombs = 3;
                p.bombProg = 0;
                p.bigBomb = true;
                this.hud.showStatus('BÜYÜK BOMBA!', '#ff9a3c');
                this.dlg.say('pickupBomb');
                break;
            case 'air':
                this.hud.showStatus('HAVA DESTEĞİ!', '#9fe3ff');
                this.dlg.say('pickupAir');
                for (let i = 0; i < 6; i++) {
                    this.time.delayedCall(i * 170, () => {
                        if (this.over) return;
                        const x = rnd(p.x + 90, W - 20);
                        this.fx.explosion(x, GROUND_Y - 20, 1.3);
                        Sound.play('explode', 1.3);
                        for (const e of this.enemies) if (e.on && e.alive && Math.abs(e.x - x) < 70) this.damageEnemy(e, 9, 'bomb', e.x, e.y - 40);
                        for (const h of this.hazards) if (h.on && h.kind !== 'pit' && Math.abs(h.x - x) < 60) this.damageHazard(h, 3, h.x, GROUND_Y - 20);
                    });
                }
                break;
            case 'friend':
                this.friendCameo();
                break;
            case 'nuke':
                this.hud.showStatus('KIYAMET BOMBASI!', '#ff5a3c');
                this.dlg.say('pickupNuke', { priority: 'high' });
                this.fx.flash(0xffffff, 0.9, 500);
                this.fx.shake(1);
                this.fx.stop(120);
                Sound.play('explode', 0.7);
                for (const e of this.enemies) if (e.on && e.alive) this.damageEnemy(e, isBoss(e) ? 40 : 60, 'bomb', e.x, e.y - 40);
                this.clearEnemyShots();
                break;
        }
    }

    /** Would this friend's power be worth anything right now? An empty road wastes a strike, full tea wastes a heal. */
    private friendReady(f: Friend) {
        switch (f.power) {
            case 'heal': case 'airdrop':
                return this.p.hp < MAX_HP;
            default: // everything else needs somebody to act on
                return this.enemies.some((e) => e.on && e.alive && e.x > 20 && e.x < W - 20);
        }
    }

    /** The next friend in the rotation whose power helps right now, or -1 when none does. */
    private pickFriend() {
        const n = FRIENDS.length;
        for (let i = 0; i < n; i++) {
            const k = (this.friendIdx + i) % n;
            if (this.friendReady(FRIENDS[k])) return k;
        }
        return -1;
    }

    /** A Pompa-team friend crashes into the game, shouts their catchphrase and helps out. `id` forces a particular friend. */
    private friendCameo(id?: string) {
        if (!FRIENDS.length) return;
        let k = id ? FRIENDS.findIndex((x) => x.id === id) : this.pickFriend();
        if (k < 0) k = this.friendIdx % FRIENDS.length; // nobody is useful right now: the rotation goes on
        this.friendIdx = k + 1;
        const f = FRIENDS[k];
        const p = this.p;
        // whichever way a friend arrived, the next automatic one waits a while
        this.cameoCd = Math.max(this.cameoCd, 10);
        this.dlg.hold(this.cameo.show(f, '')); // the strip is the friend's for as long as the banner is up
        Sound.play('pompaReady', 0.6);
        this.fx.flash(0xffe36b, 0.25, 260);
        this.fx.shake(0.25);
        this.fx.ring(p.x, p.y - 50, 0xffe36b, 5, 0.5);
        const buff = BUFF_ICON[f.power];
        if (buff) {
            // the power's icon leaves the banner and lands on Memduh, so it is clear who got it
            const icon = this.add.image(76, 172, buff).setDepth(95);
            this.tweens.add({
                targets: icon, x: p.x, y: p.y - 60, duration: 550, ease: 'Cubic.in',
                onComplete: () => { this.fx.ring(p.x, p.y - 60, 0xffe36b, 3, 0.45); this.fx.sparks(p.x, p.y - 60, 10, 0xffe36b, 170); icon.destroy(); },
            });
        }
        switch (f.power) {
            case 'strike':
                for (const e of this.enemies) {
                    if (!e.on || !e.alive || e.x > W + 30) continue;
                    this.fx.explosion(e.x, e.y - e.def.h * 0.5, 1.2);
                    this.damageEnemy(e, isBoss(e) ? 12 : 40, 'bomb', e.x, e.y - 40);
                }
                this.clearEnemyShots();
                Sound.play('explode');
                break;
            case 'shield':
                p.shield = 10;
                Sound.play('shield');
                break;
            case 'rapid':
                p.rapid = 10;
                break;
            case 'bombs':
                p.bombs = 3;
                p.bombProg = 0;
                p.bigBomb = true;
                break;
            case 'heal': {
                // Tuğçe corrects Memduh's spelling; he learns a little and feels better: the glasses of tea fly up into the counter
                const old = p.hp;
                p.hp = Math.min(MAX_HP, p.hp + 2);
                this.healFly(old, p.hp - old);
                this.dlg.say('friendLesson', { priority: 'normal' });
                break;
            }
            case 'anesthesia':
                // Melike puts the screen to sleep for a few seconds: everything on the ground that is in view, or walks into view, nods off
                // (see updateFriendFx); bosses and flyers shrug it off
                this.sleepT = STUN_TIME;
                this.sleepWarned = false;
                this.slept.clear();
                this.fx.flash(0x6aa8ff, 0.3, 360);
                this.hud.showStatus('UYKU ZAMANI!', '#9fe3ff');
                Sound.play('sleep');
                this.clearEnemyShots();
                this.dlg.say('friendAnesthesia', { priority: 'normal' });
                break;
            case 'hack':
                // Tunç takes over the screen for HACK_MODE seconds (see updateHack): whatever is in view, or walks into view, is attacked
                this.hackT = HACK_MODE;
                this.hackClock = 0;
                this.fx.flash(0x39ff6a, 0.35, 320);
                this.hud.showStatus('HACK MODU: GÖRDÜĞÜ SİLİNİR!', '#39ff6a');
                Sound.play('hack');
                this.clearEnemyShots();
                this.dlg.say('friendHack', { priority: 'normal' });
                break;
            case 'airdrop':
                // the canteen man phones in a cargo plane; the patso itself is the pickup
                // after the cameo banner has had its moment
                this.time.delayedCall(2200, () => !this.over && this.callPlane());
                this.dlg.say('friendPatso', { priority: 'normal' });
                break;
            case 'slap':
                // Deniz slaps Memduh on the back: rapid fire and bottomless bombs
                p.rapid = 10;
                p.infBomb = 10;
                p.bombs = 3;
                this.slapHand(0.45);
                this.slapHand(0.95);
                this.dlg.say('friendSlap', { priority: 'normal' });
                break;
        }
    }

    /** Tuğçe's gift: one glass of tea per life, flying from Memduh up to the counter and filling its slot when it lands. */
    private healFly(old: number, gain: number) {
        const p = this.p;
        Sound.play('heal');
        this.fx.ring(p.x, p.y - 50, 0x7dff9a, 4, 0.6);
        this.fx.flash(0x7dff9a, 0.16, 300);
        if (gain <= 0) {
            this.fx.text(p.x, p.y - 100, 'ÇAYLAR ZATEN DOLU!', '#9fe3ff', 14);
            return;
        }
        for (let i = 0; i < 3; i++) this.fx.text(p.x + rnd(-30, 30), p.y - 60 - i * 14, '+', '#7dff9a', 20);
        for (let k = 0; k < gain; k++) {
            this.time.delayedCall(180 + k * 320, () => {
                if (this.over) return;
                const slot = old + k;
                const gx = 23 + slot * 25;
                const glass = this.add.image(p.x, p.y - 70, 'tea').setScale(2.6).setDepth(96);
                this.tweens.add({
                    targets: glass, x: gx, y: 24, scale: 2, duration: 560, ease: 'Cubic.in',
                    onUpdate: () => this.fx.sparks(glass.x, glass.y, 1, 0x7dff9a, 60),
                    onComplete: () => {
                        glass.destroy();
                        this.hud.setHp(Math.min(this.p.hp, slot + 1));
                        this.hud.pulseHp(slot);
                        this.fx.ring(gx, 24, 0x7dff9a, 2.6, 0.45);
                        this.fx.sparks(gx, 24, 12, 0xffe36b, 150);
                        this.fx.text(gx, 56, '+1 ÇAY', '#7dff9a', 14);
                        Sound.play('pickup');
                    },
                });
            });
        }
    }

    /** Deniz's motivation slap: a big hand swings in from behind and smacks Memduh between the shoulder blades. */
    private slapHand(delaySec: number) {
        const p = this.p;
        const hand = this.add.graphics().setDepth(96).setVisible(false);
        const SKIN = 0xf4b98a;
        hand.fillStyle(COLORS.ink, 1).fillRoundedRect(-17, -13, 34, 30, 8);
        for (let i = 0; i < 4; i++) hand.fillRoundedRect(-17 + i * 9, -38 - (i === 1 || i === 2 ? 4 : 0), 9, 30, 4.5);
        hand.fillRoundedRect(12, -4, 20, 12, 6);
        hand.fillStyle(SKIN, 1).fillRoundedRect(-14, -10, 28, 24, 6);
        for (let i = 0; i < 4; i++) hand.fillRoundedRect(-14 + i * 9, -35 - (i === 1 || i === 2 ? 4 : 0), 7, 28, 3.5);
        hand.fillRoundedRect(14, -1, 15, 7, 3.5);
        hand.fillStyle(0xd88f5f, 1).fillRect(-12, 6, 24, 3);
        this.time.delayedCall(delaySec * 1000, () => {
            if (this.over) return;
            const hx = p.x - 20, hy = p.y - 58;
            hand.setVisible(true).setPosition(hx - 120, hy + 28).setRotation(-1.2).setScale(1.2);
            this.tweens.add({
                targets: hand, x: hx, y: hy, rotation: 0.15, duration: 170, ease: 'Cubic.in',
                onComplete: () => {
                    // the smack: impact star, comic word, shake, a freeze-frame and Memduh lurches forward with his ouch pose
                    Sound.play('slap', 1 + rnd(-0.08, 0.08));
                    this.fx.shake(0.55);
                    this.fx.stop(80);
                    p.hurtT = HURT_DUR; // he plays the ouch animation, without losing any tea
                    p.recoil = -9;
                    const star = this.add.graphics().setDepth(97).setPosition(hx + 14, hy);
                    star.fillStyle(0xffe36b, 1).lineStyle(3, COLORS.ink, 1).beginPath();
                    for (let i = 0; i < 16; i++) {
                        const r = i % 2 ? 16 : 34;
                        const a = (i / 16) * Math.PI * 2;
                        star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                    }
                    star.closePath().fillPath().strokePath().setScale(0.4);
                    this.tweens.add({ targets: star, scale: 1.3, alpha: 0, duration: 380, ease: 'Cubic.out', onComplete: () => star.destroy() });
                    this.fx.text(hx - 4, hy - 36, 'ŞAP!', '#ffd23c', 22);
                    this.fx.sparks(hx + 10, hy, 12, 0xff7a21, 230);
                    this.fx.ring(hx + 10, hy, 0xffffff, 3, 0.25);
                    this.tweens.add({ targets: hand, x: hx - 70, y: hy + 16, rotation: -0.8, alpha: 0, delay: 140, duration: 240, ease: 'Quad.out', onComplete: () => hand.destroy() });
                },
            });
        });
    }

    /** Melike's sleep and the shield bubble: a blue night over the screen, sleepers dream, latecomers nod off too. */
    private updateFriendFx(dt: number) {
        const p = this.p;
        // incoming soldiers fall asleep too, for a shorter nap
        const sleeping = this.sleepT > 0;
        if (sleeping) {
            for (const e of this.enemies) {
                if (!e.on || !e.alive || e.x > W - 8 || e.x < -20 || e.stun > 0 || e.hack > 0 || this.slept.has(e)) continue;
                if (isBoss(e) || e.def.flies) {
                    if (!this.sleepWarned) { this.sleepWarned = true; this.hud.showStatus('BOSS VE UÇANLAR UYUMADI!', '#ff9a7a'); }
                    continue;
                }
                if (e.st === 'drop') continue; // still under the canopy: nothing on the ground to put to sleep
                this.slept.add(e);
                const len = Math.max(2.4, this.sleepT + 1);
                this.sleepLen.set(e, len);
                this.dreamWord.set(e, DREAMS[Math.floor(Math.random() * DREAMS.length)]);
                e.stun = len;
                this.fx.ring(e.x, e.y - 40, 0x9fe3ff, 2.4, 0.45);
                this.fx.sparks(e.x, e.y - 50, 5, 0x9fe3ff, 90);
            }
        } else if (this.slept.size) this.slept.clear();
        this.sleepFade += ((sleeping ? 1 : 0) - this.sleepFade) * Math.min(1, dt * 5);
        if (this.sleepFade < 0.01) this.sleepFade = 0;
        this.sleepDim.setVisible(this.sleepFade > 0).setFillStyle(0x0a1a5c, 0.34 * this.sleepFade);
        // a thought cloud over each sleeper with what they are dreaming of
        let n = 0;
        for (const e of this.enemies) {
            if (n >= this.dreams.length) break;
            if (!e.on || !e.alive || e.stun <= 0 || e.hack > 0 || e.x < 10 || e.x > W - 10) continue;
            const d = this.dreams[n++];
            const top = e.def.head ?? e.def.h + 24;
            d.t.setText(this.dreamWord.get(e) ?? 'ZZZ');
            d.c.setPosition(e.x + 6, e.y - top - 40 + Math.sin(this.time.now / 380 + e.t) * 3).setVisible(true).setAlpha(Math.min(1, e.stun * 2));
        }
        for (; n < this.dreams.length; n++) this.dreams[n].c.setVisible(false);

        // the shield: a soft bubble around Memduh that starts to blink when it is about to run out
        const g = this.shieldG.clear();
        if (p.shield > 0 && !p.dead) {
            const blink = p.shield < 2 && Math.floor(this.time.now / 100) % 2 === 0;
            if (!blink) {
                const cx = p.x - 4, cy = p.y - 50, r = 44 + Math.sin(this.time.now / 220) * 1.5;
                g.fillStyle(0x9fe3ff, 0.16).fillCircle(cx, cy, r);
                g.lineStyle(3, 0xcff3ff, 0.9).strokeCircle(cx, cy, r);
                g.lineStyle(3, 0xffffff, 0.7).beginPath().arc(cx, cy, r - 6, -2.6, -1.8).strokePath();
            }
        }
    }

    private clearEnemyShots() {
        for (const b of this.ebullets) {
            if (!b.on) continue;
            if (!b.mortar) this.fx.sparks(b.x, b.y, 3, 0xffe08a, 100);
            b.on = false; b.s.setVisible(false); b.marker.setVisible(false);
        }
    }

    // ---------------------------------------------------------------- combat results

    private bombExplode(b: Bomb) {
        b.on = false; b.s.setVisible(false); b.marker.setVisible(false);
        const R = b.big ? 118 : 82;
        const x = b.x;
        this.fx.explosion(x, GROUND_Y - 26, b.big ? 2.4 : 1.8, true);
        this.fx.stop(70);
        this.zoomKick = 0.5;
        Sound.play('explode');
        let hits = 0;
        for (const e of this.enemies) {
            if (!e.on || !e.alive) continue;
            if (Math.abs(e.x - x) < R + e.def.w / 2 && e.y - e.def.h < GROUND_Y && (e.def.flies ? e.y > GROUND_Y - 190 : true)) {
                if (e.def.flies && Math.abs(e.x - x) > R * 0.7) continue;
                e.kb = isBoss(e) ? 0 : 260; // the tank never gets shoved off its post
                this.damageEnemy(e, b.big ? 24 : 14, 'bomb', e.x, e.y - 40);
                hits++;
            }
        }
        for (const h of this.hazards) {
            if (h.on && h.kind !== 'pit' && Math.abs(h.x - x) < R) {
                this.damageHazard(h, 3, h.x, GROUND_Y - 20);
                hits++;
            }
        }
        if (hits === 0) {
            this.fx.text(x, GROUND_Y - 60, 'ISKA!', '#ff9a7a', 14);
            this.dlg.say('missBomb');
        } else if (hits >= 2) {
            this.addPompa(4 * hits);
            this.dlg.say('bombKill');
        }
    }

    private damageEnemy(e: Enemy, dmg: number, src: 'bullet' | 'bomb', x: number, y: number) {
        let d = dmg;
        if (src === 'bullet') d *= e.def.armor;
        if (isBoss(e) && src === 'bomb') d *= e.open ? 1 : 0.5;
        if (isBoss(e) && src === 'bullet') d *= e.open ? (e.kind === 'tank' ? 5 : 3.5) : 1;
        e.hp -= d;
        e.flash = 0.07;
        if (src === 'bullet') {
            if (!isBoss(e)) e.kb += 14; // bosses hold their ground
            this.fx.sparks(x, y, 2, e.def.armor < 1 ? 0xcfd8e0 : 0xffd86b, 140, 1);
            this.fx.ring(x, y, 0xffe08a, 0.9, 0.14);
            Sound.play('hit', e.def.armor < 1 ? 0.7 : 1);
        }
        this.addPompa(src === 'bullet' ? 0.3 : 1.5);
        if (e.kind === 'tank') {
            this.fx.paper(x, y, src === 'bomb' ? 8 : 2);
            if (Math.random() < 0.08) this.fx.text(x, y - 30, ['KAYIT DIŞI!', 'FİŞ YOK!', 'KDV!', 'EVRAK!'][Math.floor(Math.random() * 4)], '#ffee99', 13);
        }
        if (e.kind === 'tank' && e.hp > 0 && src === 'bomb') this.dlg.say('tankHurt', { priority: 'low' });
        if (e.kind === 'chief' && e.hp > 0) {
            this.fx.paper(x, y, src === 'bomb' ? 8 : 2);
            if (src === 'bomb') this.dlg.say('heliHurt', { priority: 'low' });
        }
        if (e.hp <= 0 && e.alive) this.killEnemy(e);
    }

    private killEnemy(e: Enemy) {
        e.alive = false;
        e.dying = isBoss(e) ? 3.5 : e.def.flies ? 0.7 : 1.6;
        e.s.clearTint();
        this.kills++;
        this.combo++;
        this.comboT = 4;
        this.bestCombo = Math.max(this.bestCombo, this.combo);
        // killed before they got to say their line (a friend's power, a bomb): the joke is still told
        const q = ENEMY_QUOTES[e.kind];
        if (q && !e.said && e.x > 14 && e.x < W - 14) {
            e.said = true;
            this.sayBubble(e, q[Math.floor(Math.random() * q.length)]);
        }
        const pts = e.def.score * this.mult();
        this.addScore(pts, e.x, e.y - e.def.h - 6, true);
        this.addPompa(e.def.pompa);
        this.fx.stop(isBoss(e) ? 200 : 45);
        Sound.play('kill');
        if (this.combo > 1 && this.combo % 4 === 0) Sound.play('combo', 1 + Math.min(0.6, this.combo * 0.03));
        if (isBoss(e)) {
            this.boss = null;
            this.bossDone = true;
            this.hud.showBoss(null);
            this.dlg.say(e.kind === 'tank' ? 'tankDown' : 'heliDown', { priority: 'high' });
            this.slowT = 0.5;
            this.timeScale = 0.3;
            for (let i = 0; i < 7; i++) {
                this.time.delayedCall(i * 150, () => {
                    this.fx.explosion(e.x + rnd(-70, 70), GROUND_Y - rnd(10, 90), 1.6, true);
                    Sound.play('explode', 0.8 + Math.random() * 0.4);
                });
            }
            // guaranteed spoils (a nuke used to be here, but it was always refused by the drop gap and has nothing left to hit)
            this.spawnPickup('can', e.x - 20, GROUND_Y - 60, true);
            this.spawnPickup('bomb', e.x - 70, GROUND_Y - 50, true);
            this.fx.flash(0xffffff, 0.6, 400);
            // the last boss of the campaign (not an endless-mode comeback, not if Memduh is already going down) ends the run in a win
            const finale = e.kind === 'chief' && !this.endless && !this.over;
            this.hud.showBanner(finale ? 'ZAFER!' : 'BÖLÜM TAMAM!', e.kind === 'tank' ? 'Muhasebe kapandı. Makbuz yok.' : 'Denetim bitti. Rapor: patlama.');
            this.dlg.say('victory', { priority: 'normal' });
            if (finale) this.startWin(e);
            else this.stageClearT = 0;
            // the wreck stays where it fell, burnt black and smoking, and rolls away with the road
            e.s.setTint(0x4a3c38).setTintMode(Phaser.TintModes.MULTIPLY);
            e.vx = 0;
            e.vy = 0;
            this.time.delayedCall(350, () => this.fx.confetti());
        } else {
            if (e.def.flies) {
                this.fx.explosion(e.x, e.y - e.def.h * 0.5, 1.4, true);
                e.vx = 90;
                e.vy = -120;
            } else {
                // soldiers do their own comic death animation; just add the poof and a funny shout
                this.fx.dust(e.x, GROUND_Y, 4, 0);
                this.fx.explosion(e.x + 8, e.y - e.def.h * 0.55, 0.9);
                e.vx = 70 + e.kb * 0.3;
                if (Math.random() < 0.2) this.fx.text(e.x, e.y - e.def.h - 22, SHOUTS[Math.floor(Math.random() * SHOUTS.length)], '#ffd23c', 16);
            }
            if (Math.random() < 0.05 + (e.kind === 'armor' || e.kind === 'heavy' || e.kind === 'teacher' || e.kind === 'chem' || e.kind === 'dinho' || e.kind === 'trucker' ? 0.09 : 0)) this.spawnPickup(this.randomPickup(), e.x, GROUND_Y - 40);
        }
        if (this.kills === 1) this.dlg.say('firstKill', { priority: 'high' });
        else if (this.combo === 8) this.dlg.say('combo');
        else if (this.combo === 16) this.dlg.say('bigCombo');
        if (this.combo > 0 && this.combo % 10 === 0) {
            // every ten kills in a row: a "streak" burst with a Pompa boost and bonus points
            this.fx.text(this.p.x + 20, this.p.y - 130, `${this.combo} SERİ!`, '#ffe36b', 22);
            this.fx.ring(this.p.x, this.p.y - 50, 0xffe36b, 4, 0.5);
            this.fx.flash(0xffe36b, 0.18, 200);
            this.addPompa(12);
            this.addScore(250 * (this.combo / 10), this.p.x + 20, this.p.y - 110, true);
            Sound.play('combo', 1.5);
        }
    }

    /** The final boss is down: nothing can hurt Memduh any more, and whatever is left of the convoy goes down with it. */
    private startWin(boss: Enemy) {
        const p = this.p;
        this.winT = 0;
        this.ctl.releaseAll();
        this.clearEnemyShots();
        for (const o of this.enemies) if (o !== boss && o.on && o.alive) this.killEnemy(o);
        // Pompa has no victory sheet: the tea wears off as he turns to the camera
        p.pompaT = 0; p.pompa = 0; p.pompaAnnounced = false; p.flexT = 0; p.throwT = -1; p.fireHold = 0; p.duck = false;
    }

    /** The world coasts to a stop while Memduh plays his victory; after the wreck has burnt a while the result panel opens. */
    private updateWin(dt: number) {
        this.winT += dt;
        const scroll = this.speed * dt * Math.max(0, 1 - this.winT / 1.5);
        this.distance += scroll;
        this.backdrop.update(dt, scroll);
        this.updatePlayer(dt);
        this.updateObjects(dt, scroll);
        this.updateCamel(dt);
        this.updatePlane(dt);
        this.updateBubble(dt);
        if (this.winT > WIN_PANEL_AT && !this.winUi) this.showWin();
    }

    private showWin() {
        Sound.play('win');
        const newBest = this.score > Save.best;
        const c = this.add.container((K - 1) * W / 2, (K - 1) * H / 2).setScrollFactor(0).setDepth(2000).setAlpha(0);
        c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x1b0f12, 0.6).setScrollFactor(0).setInteractive());
        const panel = this.add.graphics();
        panel.fillStyle(0x2a1710, 0.95).fillRoundedRect(30, H / 2 - 150, W - 60, 190, 12);
        panel.lineStyle(3, 0xffc23c, 1).strokeRoundedRect(30, H / 2 - 150, W - 60, 190, 12);
        c.add(panel);
        c.add(label(this, W / 2, H / 2 - 232, 'ÇÖL BİZİM!', { size: 44, color: '#ffc23c', stroke: '#6a1d00', strokeW: 9 }));
        c.add(label(this, W / 2, H / 2 - 190, 'Başmüfettiş uçtu, rapor yandı. Çay bedava!', { size: 12, color: '#fff1cf' }));
        c.add(label(this, W / 2, H / 2 - 126, 'SKOR', { size: 12, color: '#d9b98a' }));
        const sc = label(this, W / 2, H / 2 - 92, '0', { size: 40, color: '#fff1cf' });
        c.add(sc);
        const counter = { v: 0 };
        this.tweens.add({ targets: counter, v: this.score, duration: 900, ease: 'Cubic.out', onUpdate: () => sc.setText(String(Math.round(counter.v))) });
        c.add(label(this, W / 2, H / 2 - 56, newBest ? 'YENİ REKOR!' : `Rekor: ${Save.best}`, { size: newBest ? 18 : 13, color: newBest ? '#ff7a21' : '#ffe0a0' }));
        c.add(label(this, W / 2, H / 2 - 20, `${this.kills} düşman   •   en iyi kombo ${this.bestCombo}`, { size: 10, color: '#d9b98a', strokeW: 2 }));
        c.add(label(this, W / 2, H / 2 + 8, 'Çay hâlâ sıcak. Çöl hâlâ orada.', { size: 10, color: '#d9b98a', strokeW: 2 }));
        c.add(menuButton(this, W / 2, H / 2 + 86, 230, 52, 'SONSUZ ÇÖL', () => this.continueEndless(), 0xff7a21).root.setScrollFactor(0));
        c.add(menuButton(this, W / 2, H / 2 + 148, 230, 40, 'ANA MENÜ', () => {
            Save.addRecord(this.score, this.stageIdx + 1);
            this.scene.start('MainMenu');
        }, 0x9a5f33).root.setScrollFactor(0));
        this.tweens.add({ targets: c, alpha: 1, duration: 300 });
        this.winUi = c;
    }

    /** The player chose to go on: back to the road, straight into the endless desert (the run's score is only recorded when it ends). */
    private continueEndless() {
        this.winUi?.destroy();
        this.winUi = undefined;
        this.winT = -1;
        this.bossDone = false;
        this.stageReward();
        this.beginStage(this.stageIdx + 1);
    }

    /** Fills the Pompa meter; with the tea nearly gone it charges twice as fast, so a bad moment can turn into a comeback. */
    private addPompa(n: number) {
        const p = this.p;
        if (p.pompaT <= 0) p.pompa = Math.min(100, p.pompa + n * (p.hp <= 2 ? 2 : 1));
    }

    private removeEnemy(e: Enemy) {
        e.on = false;
        e.chute.setVisible(false);
        e.tag.setVisible(false);
        e.s.setVisible(false);
        e.sh.setVisible(false);
        e.bang.setVisible(false);
        if (this.boss === e) this.boss = null;
    }

    private addScore(n: number, x: number, y: number, big = false) {
        this.score += n;
        this.fx.text(x, y, `+${n}`, big ? '#ffe36b' : '#ffffff', big ? 15 : 12);
    }

    private hurtPlayer(dmg: number) {
        const p = this.p;
        if (p.dead || p.inv > 0 || p.pompaT > 0 || this.winT >= 0) return; // after the final boss nothing can hurt him, so no soft-locked win
        if (p.shield > 0) {
            p.shield = 0;
            p.inv = 0.7;
            this.fx.ring(p.x, p.y - 40, 0x9fe3ff, 3.4, 0.4);
            this.fx.text(p.x, p.y - 100, 'KALKAN!', '#9fe3ff', 14);
            Sound.play('hit', 0.6);
            return;
        }
        p.hp -= dmg;
        p.inv = 1.9;
        p.hurtT = HURT_DUR;
        this.combo = 0;
        this.hud.setHp(Math.max(0, p.hp));
        this.hud.pulseHp(p.hp);
        this.fx.shake(0.6);
        this.fx.stop(90);
        this.fx.flash(0xff2a2a, 0.35, 260);
        this.fx.sparks(p.x, p.y - 40, 10, 0xff5a3c, 200);
        Sound.play('hurt');
        navigator.vibrate?.(p.hp <= 0 ? [60, 40, 120] : 45);
        if (p.hp <= 0) {
            this.die();
            return;
        }
        if (p.hp <= 2) this.dlg.say('lowHp', { priority: 'high' });
        else this.dlg.say('hurt', { priority: 'high' });
    }

    private fallInPit(h: Hazard) {
        const p = this.p;
        this.fx.text(p.x, p.y - 100, 'ÇUKUR!', '#ff9a7a', 16);
        this.dlg.say('pit', { priority: 'high' });
        void h;
        if (p.inv > 0 || p.pompaT > 0) {
            p.vy = JUMP_V * 0.8;
            p.ground = false;
            p.jumping = true;
            return;
        }
        p.vy = JUMP_V * 0.85;
        p.ground = false;
        p.jumping = true;
        this.fx.dust(p.x, GROUND_Y, 10, 0);
        this.hurtPlayer(1);
    }

    private activatePompa() {
        const p = this.p;
        p.pompaT = 6;
        p.flexT = FLEX_DUR;
        p.pompaAnnounced = false;
        p.inv = 0;
        Sound.play('pompa');
        this.slowT = 0.5;
        this.timeScale = 0.3;
        this.zoomKick = 1;
        this.fx.flash(0xffe36b, 0.8, 500);
        this.fx.shake(1);
        this.fx.stop(160);
        this.fx.ring(p.x, p.y - 50, 0xffe36b, 9, 0.7);
        this.fx.ring(p.x, p.y - 50, 0xffffff, 6, 0.5);
        // giant tea glass pops over the screen for the "gulp"
        const tea = this.add.image(W / 2, H / 2 - 60, 'tea').setScale(2).setDepth(500).setScrollFactor(0);
        tea.setPosition(W / 2 + (K - 1) * W / 2, H / 2 - 60 + (K - 1) * H / 2);
        this.tweens.add({ targets: tea, scale: 14, alpha: 0, angle: 18, duration: 650, ease: 'Cubic.out', onComplete: () => tea.destroy() });
        this.hud.showStatus('', '#ffffff');
        this.hud.showBanner('POMPA GÜCÜ!', 'ÇAYLAR BENDEN!');
        this.dlg.say('pompa', { priority: 'high' });
        // shockwave: hurts everything on screen and wipes enemy fire
        for (const e of this.enemies) {
            if (e.on && e.alive && e.x < W + 30) this.damageEnemy(e, isBoss(e) ? 22 : 30, 'bomb', e.x, e.y - 40);
        }
        for (const h of this.hazards) if (h.on && h.kind !== 'pit' && h.x < W + 20) this.damageHazard(h, 5, h.x, GROUND_Y - 20);
        this.clearEnemyShots();
        this.hud.setHp(p.hp);
    }

    private die() {
        const p = this.p;
        p.dead = true;
        p.deadT = 0;
        this.over = true;
        this.ctl.releaseAll();
        this.hud.setHp(0);
        this.fx.shake(0.9);
        this.slowT = 0.7;
        this.timeScale = 0.35;
        this.dlg.say('defeat', { priority: 'high' });
        Sound.play('lose');
        const rank = Save.addRecord(this.score, this.stageIdx + 1);
        this.time.delayedCall(1900, () => {
            this.cameras.main.fadeOut(300, 27, 15, 18);
            this.cameras.main.once('camerafadeoutcomplete', () =>
                this.scene.start('GameOver', { score: this.score, stage: this.stageIdx + 1, rank, kills: this.kills, combo: this.bestCombo }),
            );
        });
    }

    private updateDead(dt: number) {
        this.p.deadT += dt;
        this.syncPlayer(dt);
    }

    // ---------------------------------------------------------------- pause

    private setPaused(on: boolean) {
        if (on === this.paused || this.over) return;
        this.paused = on;
        Sound.suspend();
        if (on) {
            this.ctl.releaseAll();
            const c = this.add.container((K - 1) * W / 2, (K - 1) * H / 2).setScrollFactor(0).setDepth(2000);
            const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setScrollFactor(0).setInteractive();
            c.add(bg);
            c.add(label(this, W / 2, H / 2 - 90, 'DURAKLATILDI', { size: 28, color: '#ffc23c' }));
            c.add(label(this, W / 2, H / 2 - 56, 'Çay molası!', { size: 13 }));
            c.add(menuButton(this, W / 2, H / 2, 200, 46, 'DEVAM ET', () => this.setPaused(false)).root.setScrollFactor(0));
            c.add(menuButton(this, W / 2, H / 2 + 64, 200, 40, 'ANA MENÜ', () => {
                this.setPaused(false);
                Save.addRecord(this.score, this.stageIdx + 1);
                this.scene.start('MainMenu');
            }, 0x9a5f33).root.setScrollFactor(0));
            this.pauseUi = c;
        } else {
            this.pauseUi?.destroy();
            this.pauseUi = undefined;
            Sound.resume();
            this.acc = 0;
        }
    }
}
