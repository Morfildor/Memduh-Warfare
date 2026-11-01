import { EnemyKind } from './enemies';

// ---------------------------------------------------------------------------------------------
// CAMEO ENEMIES: the in-joke characters who wander into the war now and then, in ANY stage (they are not in the stage
// tables). To add one: give them an entry in data/enemies.ts, their sheets in data/anims.ts (walk / shoot / death), a
// portrait if they have a dialogue line, and put their kind in the list below. Give them a comic balloon line in
// ENEMY_QUOTES (scenes/Game.ts) and a `head` height in enemies.ts so the balloon's tail reaches them. Their name rides
// above their head on a gold plate.
// ---------------------------------------------------------------------------------------------
export const CAMEO_ENEMIES: EnemyKind[] = ['teacher', 'heavy', 'chem', 'dinho'];

/** seconds between cameo enemies [min, max]; the first one arrives a little sooner */
export const CAMEO_ENEMY_EVERY: [number, number] = [34, 48];
export const CAMEO_ENEMY_FIRST = 20;
