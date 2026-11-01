import { W } from '../constants';
import { EnemyKind } from '../data/enemies';
import { StageDef } from '../data/stages';

/** What the director may ask the game to create. Positions are in design units, off-screen to the right. */
export interface Spawner {
    /** `drop`: arrives by parachute from the top of the screen (x is then an on-screen position) */
    enemy(kind: EnemyKind, x: number, drop?: boolean): void;
    hazard(kind: 'crate' | 'barrel' | 'pit', x: number, w?: number): void;
    pickup(x: number, y?: number, force?: boolean): void;
    aliveEnemies(): number;
}

type Encounter = (s: Spawner, x: number) => number;

/** Every encounter returns how much distance it occupies, so the next one can never overlap it. */
const ENCOUNTERS: Record<string, Encounter> = {
    solo: (s, x) => (s.enemy('rifle', x), 120),
    duo: (s, x) => (s.enemy('rifle', x), s.enemy('rifle', x + 90), 210),
    trio: (s, x) => (s.enemy('rifle', x), s.enemy('rifle', x + 80), s.enemy('rifle', x + 160), 290),
    crateWall: (s, x) => (s.hazard('crate', x), s.enemy('rifle', x + 120), 250),
    barrel: (s, x) => (s.hazard('barrel', x), s.enemy('rifle', x + 190), 330),
    // a pit used to always hold a pickup; powerups are rationed now, so only some do
    pit: (s, x) => (s.hazard('pit', x, 56), Math.random() < 0.3 && s.pickup(x, undefined), 250),
    armor: (s, x) => (s.enemy('armor', x), s.enemy('rifle', x + 110), 230),
    heavy: (s, x) => (s.enemy('heavy', x), s.enemy('rifle', x + 120), 250),
    drone: (s, x) => (s.enemy('drone', x), s.enemy('rifle', x + 60), 140),
    teacher: (s, x) => (s.enemy('teacher', x), s.enemy('rifle', x + 110), 240),
    mixed: (s, x) => (s.enemy('armor', x), s.enemy('rifle', x + 100), s.enemy('rifle', x + 180), 300),
    heli: (s, x) => (s.enemy('heli', x), 60),
    // a barrel rolling just ahead of a squad: shoot it at the right moment and they all go up with it
    barrelTrap: (s, x) => (s.hazard('barrel', x), s.enemy('rifle', x + 30), s.enemy('rifle', x + 75), 240),
    // two armoured soldiers with a rifleman behind them: a bomb is the clean answer
    shieldWall: (s, x) => (s.enemy('armor', x), s.enemy('armor', x + 55), s.enemy('rifle', x + 115), 280),
    // two staggered drones, so the bomb markers overlap and the jump has to be picked
    bombRun: (s, x) => (s.enemy('drone', x), s.enemy('drone', x + 130), 200),
    // a drone overhead, an armoured soldier below and a rifleman behind him
    ambush: (s, x) => (s.enemy('armor', x), s.enemy('drone', x), s.enemy('rifle', x + 70), 240),
    // paratroopers: they come down in the top right of the screen, so they can be shot out of the sky (or met on landing)
    // two, well apart and up in the right corner: enough to react to, not enough to blot out the lane
    paraDrop: (s) => (s.enemy('jelibon', W - 40, true), s.enemy('jelibon', W - 150, true), 120),
    // the sky gets crowded: two bombers and a helicopter, with a soldier to keep the ground busy
    skyRaid: (s, x) => (s.enemy('drone', x), s.enemy('drone', x + 150), s.enemy('heli', x), s.enemy('rifle', x + 80), 230),
    caravan: (s, x) => (s.pickup(x, undefined, true), 80),
};

/** The enemies a random wave may draw from, with weights; a stage only offers the ones in its own encounter table. */
const WAVE_POOL: { kind: EnemyKind; needs: string | null; w: number }[] = [
    { kind: 'rifle', needs: null, w: 4 },
    { kind: 'armor', needs: 'armor', w: 1.6 },
    { kind: 'heavy', needs: 'heavy', w: 1.2 },
    { kind: 'teacher', needs: 'teacher', w: 1.2 },
    { kind: 'drone', needs: 'drone', w: 1.6 },
    { kind: 'heli', needs: 'heli', w: 0.7 },
];

/** Scripts the opening, then chooses weighted encounters per stage with fairness limits. */
export class Director {
    private stage!: StageDef;
    private cooldown = 0;
    private last = '';
    private beforeLast = '';
    private scripted: string[] = [];
    stageTime = 0;

    constructor(private spawn: Spawner) {}

    start(stage: StageDef, opening: boolean) {
        this.stage = stage;
        this.stageTime = 0;
        this.cooldown = opening ? 0.6 : 1.4;
        this.scripted = opening ? ['solo', 'duo', 'barrelTrap', 'crateWall', 'caravan'] : [];
        this.last = this.beforeLast = '';
    }

    /** `blocked` pauses spawning (boss fights, stage transitions). */
    update(dt: number, blocked: boolean) {
        this.stageTime += dt;
        if (blocked) return;
        this.cooldown -= dt;
        if (this.cooldown > 0) return;
        if (this.spawn.aliveEnemies() >= this.stage.maxEnemies) {
            this.cooldown = 0.4;
            return;
        }
        const id = this.scripted.length ? this.scripted.shift()! : this.pick();
        const len = id === 'wave' ? this.wave(W + 50) : ENCOUNTERS[id](this.spawn, W + 50);
        this.beforeLast = this.last;
        this.last = id;
        const [a, b] = this.stage.gap;
        // gap is time-based, but never shorter than the time the encounter itself takes to scroll past
        this.cooldown = Math.max(a + Math.random() * (b - a), len / Math.max(1, this.stage.speed) * 0.85);
    }

    /** A random handful (2-4) of enemies drawn from what this stage allows, at random spacing: no two waves alike. */
    private wave(x: number): number {
        const offered = new Set(this.stage.table.map(([id]) => id));
        const pool = WAVE_POOL.filter((p) => p.needs === null || offered.has(p.needs));
        const count = 2 + Math.floor(Math.random() * 3);
        let offset = 0;
        let flyers = 0;
        for (let i = 0; i < count; i++) {
            const total = pool.reduce((n, p) => n + p.w, 0);
            let r = Math.random() * total;
            let kind: EnemyKind = 'rifle';
            for (const p of pool) {
                r -= p.w;
                if (r <= 0) {
                    kind = p.kind;
                    break;
                }
            }
            if ((kind === 'heli' || kind === 'drone') && flyers >= 1) kind = 'rifle'; // one flyer per wave keeps the sky readable
            if (kind === 'heli' || kind === 'drone') flyers++;
            this.spawn.enemy(kind, x + offset);
            offset += 70 + Math.random() * 60;
        }
        return offset + 40;
    }

    private pick(): string {
        const opts = this.stage.table.filter(([id]) => !(id === this.last && id === this.beforeLast));
        const total = opts.reduce((n, [, w]) => n + w, 0);
        let r = Math.random() * total;
        for (const [id, w] of opts) {
            r -= w;
            if (r <= 0) return id;
        }
        return opts[0][0];
    }
}
