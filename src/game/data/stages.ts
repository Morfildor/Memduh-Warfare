export interface StageDef {
    name: string;
    /** seconds of encounters before the stage (or its boss) ends */
    duration: number;
    /** world scroll speed, design units per second */
    speed: number;
    /** simultaneous enemy cap */
    maxEnemies: number;
    /** seconds between encounters [min,max] */
    gap: [number, number];
    table: [string, number][];
    boss?: 'tank' | 'chief';
}

// Adding a stage is a data-only change: pick encounters from director.ts and tune the numbers.
export const STAGES: StageDef[] = [
    {
        // Every stage brings one new idea, so the difficulty climbs instead of hitting a wall.
        name: 'ÇÖL YOLU', duration: 36, speed: 92, maxEnemies: 4, gap: [1.5, 2.2],
        table: [['solo', 2], ['duo', 4], ['wave', 3], ['barrelTrap', 3], ['crateWall', 2], ['caravan', 1]],
    },
    {
        name: 'KUM TEPELERİ', duration: 40, speed: 102, maxEnemies: 4, gap: [1.9, 2.7],
        table: [['duo', 2], ['trio', 2], ['armor', 3], ['drone', 1], ['wave', 4], ['barrelTrap', 3], ['pit', 3], ['crateWall', 2], ['paraDrop', 1], ['caravan', 1]],
    },
    {
        name: 'PAZAR YERİ', duration: 30, speed: 108, maxEnemies: 4, gap: [1.9, 2.7],
        table: [['heli', 1], ['drone', 2], ['wave', 5], ['mixed', 3], ['armor', 3], ['pit', 2], ['barrelTrap', 3], ['trio', 2], ['paraDrop', 2], ['caravan', 1]],
        boss: 'tank',
    },
    {
        name: 'GÖZETLEME KULESİ', duration: 36, speed: 112, maxEnemies: 5, gap: [1.8, 2.6],
        table: [['shieldWall', 2], ['heli', 2], ['drone', 2], ['wave', 5], ['armor', 4], ['mixed', 3], ['pit', 2], ['barrelTrap', 2], ['trio', 1], ['paraDrop', 2], ['skyRaid', 1], ['caravan', 1]],
    },
    {
        name: 'ŞEHİR KAPISI', duration: 38, speed: 118, maxEnemies: 5, gap: [1.7, 2.5],
        table: [['shieldWall', 3], ['bombRun', 2], ['armor', 3], ['wave', 5], ['trio', 2], ['barrelTrap', 2], ['pit', 3], ['heli', 2], ['mixed', 2], ['crateWall', 1], ['paraDrop', 2], ['skyRaid', 2], ['caravan', 1]],
    },
    {
        name: 'KARARGÂH', duration: 28, speed: 122, maxEnemies: 6, gap: [1.4, 2.1],
        table: [['ambush', 3], ['shieldWall', 3], ['bombRun', 2], ['mixed', 3], ['armor', 2], ['heli', 2], ['wave', 5], ['pit', 2], ['barrelTrap', 2], ['paraDrop', 2], ['skyRaid', 2], ['caravan', 1]],
        boss: 'chief',
    },
];

/** After the last stage the desert simply never ends: harder tables, faster scroll, a boss every third lap, capped fairly. */
export function endlessStage(n: number): StageDef {
    const k = Math.min(n, 12);
    return {
        name: 'SONSUZ ÇÖL', duration: 44, speed: Math.min(150, 118 + k * 3), maxEnemies: Math.min(8, 6 + (k >> 2)),
        gap: [Math.max(1.0, 1.3 - k * 0.03), Math.max(1.5, 2.0 - k * 0.04)],
        table: [['ambush', 3], ['shieldWall', 3], ['bombRun', 2], ['mixed', 3], ['armor', 3], ['heli', 2], ['wave', 6], ['pit', 2], ['barrelTrap', 2], ['trio', 2], ['crateWall', 1], ['paraDrop', 2], ['skyRaid', 2], ['caravan', 1]],
        boss: n % 6 === 5 ? 'chief' : n % 3 === 2 ? 'tank' : undefined,
    };
}
