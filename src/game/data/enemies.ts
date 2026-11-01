export type EnemyKind = 'rifle' | 'jelibon' | 'armor' | 'heavy' | 'teacher' | 'chem' | 'dinho' | 'trucker' | 'drone' | 'heli' | 'tank' | 'chief';

export interface EnemyDef {
    name: string;
    hp: number;
    /** hit box in design units, centred horizontally on x, standing on the foot line */
    w: number;
    h: number;
    /** height of the topmost drawn pixel (helmet, tray, rotor) above the foot line, measured from the sheets; name tags and balloons sit on it (the hit box is shorter than the sprite) */
    head?: number;
    scale: number;
    /** walking speed toward Memduh, on top of the world scroll */
    walk: number;
    score: number;
    pompa: number;
    /** seconds between shots [min,max] and shots per burst */
    fire: [number, number];
    burst: number;
    bulletSpeed: number;
    /** multiplier for normal bullets (armour soaks them; bombs ignore it) */
    armor: number;
    flies: boolean;
}

// Animation sheets for each kind are named in data/anims.ts (rifle_walk, armor_shoot, tank_fire ...).
// Scales are tuned so a soldier is about as tall as Memduh and everything fits a 360-wide screen with room to react.
export const ENEMIES: Record<EnemyKind, EnemyDef> = {
    rifle: { name: 'Kiralık Asker', hp: 3, w: 38, h: 78, head: 114, scale: 1.45, walk: 16, score: 100, pompa: 3, fire: [2.0, 3.0], burst: 1, bulletSpeed: 170, armor: 1, flies: false },
    // gummy-bear paratroopers (the Director only ever drops them in by parachute)
    jelibon: { name: 'Jelibon Avcısı', hp: 3, w: 32, h: 62, head: 98, scale: 1.45, walk: 14, score: 150, pompa: 3, fire: [2.0, 3.0], burst: 1, bulletSpeed: 170, armor: 1, flies: false },
    armor: { name: 'Salata Dönerci', hp: 12, w: 48, h: 82, head: 117, scale: 1.7, walk: 10, score: 250, pompa: 6, fire: [2.6, 3.4], burst: 1, bulletSpeed: 180, armor: 0.6, flies: false },
    heavy: { name: 'Rehber Hoca', hp: 30, w: 58, h: 88, head: 130, scale: 1.7, walk: 6, score: 400, pompa: 8, fire: [2.8, 3.6], burst: 2, bulletSpeed: 190, armor: 0.85, flies: false },
    // rides a red Vespa in from the LEFT (see updateScooter in Game.ts), so he never walks with the scroll
    teacher: { name: 'Motor Ahmet', hp: 22, w: 74, h: 100, head: 130, scale: 1.7, walk: 0, score: 350, pompa: 7, fire: [2.2, 3.0], burst: 2, bulletSpeed: 185, armor: 0.8, flies: false },
    // the glamorous chemistry teacher: struts in and flings green acid from her flask
    chem: { name: 'Barbie', hp: 20, w: 42, h: 84, head: 128, scale: 1.55, walk: 8, score: 350, pompa: 7, fire: [2.4, 3.2], burst: 1, bulletSpeed: 180, armor: 1, flies: false },
    // the other chemistry teacher: lobs a football that explodes where it lands, on a telegraphed ring (see enemyShoot in Game.ts)
    dinho: { name: 'Kimyacı Ronaldinho', hp: 20, w: 42, h: 84, head: 129, scale: 1.55, walk: 8, score: 350, pompa: 7, fire: [2.6, 3.4], burst: 1, bulletSpeed: 0, armor: 1, flies: false },
    // much too big for his tiny truck: rolls in, parks and flicks lit cigarette butts at Memduh (see enemyShoot in Game.ts)
    trucker: { name: 'Kamyoncu Türkay', hp: 24, w: 74, h: 90, head: 115, scale: 1.6, walk: 6, score: 350, pompa: 7, fire: [2.2, 3.0], burst: 2, bulletSpeed: 175, armor: 0.8, flies: false },
    // flies a bombing run across the screen and drops telegraphed bombs straight down (see updateDrone in Game.ts)
    drone: { name: 'Bombacı Drone', hp: 3, w: 70, h: 56, head: 105, scale: 1.3, walk: 0, score: 300, pompa: 5, fire: [0.9, 1.2], burst: 1, bulletSpeed: 0, armor: 1, flies: true },
    chief: { name: 'Başmüfettiş', hp: 420, w: 138, h: 78, head: 146, scale: 1.75, walk: 0, score: 6000, pompa: 40, fire: [0, 0], burst: 1, bulletSpeed: 0, armor: 0.6, flies: true },
    heli: { name: 'Stajyer Müfettiş', hp: 16, w: 90, h: 58, head: 109, scale: 1.3, walk: 0, score: 500, pompa: 9, fire: [3.0, 4.0], burst: 1, bulletSpeed: 0, armor: 1, flies: true },
    tank: { name: 'Muhasebeci Tankı', hp: 67, w: 132, h: 92, head: 138, scale: 1.85, walk: 0, score: 3000, pompa: 40, fire: [0, 0], burst: 1, bulletSpeed: 0, armor: 0.2, flies: false },
};
