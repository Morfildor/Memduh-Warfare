// 16-frame sheets built by tools/build_anims.py (8 columns x 2 rows). Humans are 96x96 cells with the feet on
// row 90; tank, helicopter and camel use 128x96 cells.
export const SHEETS: { key: string; w: number; h: number }[] = [
    ...['run', 'runshoot', 'crawl', 'jump', 'throw', 'hurt', 'death', 'victory', 'idle'].map((n) => ({ key: `memduh_${n}`, w: 96, h: 96 })),
    ...['flex', 'runshoot', 'crawl', 'jump', 'throw'].map((n) => ({ key: `pompa_${n}`, w: 96, h: 96 })),
    ...['rifle', 'jelibon', 'armor', 'heavy', 'chem'].flatMap((k) => ['walk', 'shoot', 'death'].map((n) => ({ key: `${k}_${n}`, w: 96, h: 96 }))),
    // Motor Ahmet on his Vespa: wider cells (walk = riding)
    ...['walk', 'shoot', 'death'].map((n) => ({ key: `teacher_${n}`, w: 128, h: 96 })),
    { key: 'tank_idle', w: 128, h: 96 },
    { key: 'tank_fire', w: 128, h: 96 },
    { key: 'heli_fly', w: 128, h: 96 },
    { key: 'drone_fly', w: 128, h: 96 },
    { key: 'camel_run', w: 160, h: 96 },
];

/** Origin that puts (x, y) at the soles of the feet (row 90 of 96). */
export const FOOT_Y = 91 / 96;

export type Humanoid = 'rifle' | 'jelibon' | 'armor' | 'heavy' | 'teacher' | 'chem';

/** When each shooter's animation actually fires (frame) and how long the whole animation lasts. */
export const SHOOT_TIMING: Record<Humanoid, { frame: number; dur: number }> = {
    rifle: { frame: 11, dur: 0.85 },
    jelibon: { frame: 5, dur: 0.85 },
    armor: { frame: 8, dur: 0.95 },
    heavy: { frame: 4, dur: 1.05 }, // Rehber Hoca's minigun flashes on frames 4 and 8
    teacher: { frame: 3, dur: 1.7 },
    chem: { frame: 10, dur: 1.05 }, // the flask's green splash leaves on frame 10
};

/** Memduh's grenade throw plays frames 4..15 and lets go of the grenade on frame 12. */
export const THROW = { from: 4, release: 12, last: 15, fps: 30 };
/** The bodybuilder's sheet opens with flexing frames; the wind-up starts at 7 and the arm is forward by 11. */
export const THROW_POMPA = { from: 7, release: 11, last: 15, fps: 30 };
