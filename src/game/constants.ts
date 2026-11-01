// Design space is 440 wide and `H` tall; the canvas renders at K times that so text and sprites stay crisp.
// (It was 360; widening it zooms the whole game out, so enemies are visible earlier. UI sizes scale with UI_S.)
export const W = 440;
export const K = 2;
export const UI_S = W / 360;

const aspect = window.innerHeight / Math.max(1, window.innerWidth);
export const H = Math.max(760, Math.min(930, Math.round(W * aspect)));

export const GROUND_Y = H - 210;
export const PLAYER_X = 96;
export const ART = 2; // one art pixel is two design units

export const FONT = '"Arial Black", "Trebuchet MS", Impact, sans-serif';

/**
 * The type scale, in design units (the canvas is 440 wide, so one unit is about 0.9 CSS px on a phone: nothing under 11).
 * Strokes follow `strokeFor`: about a fifth of the size, never under 3 on small type so the outline holds the letters
 * off the background instead of eating their counters.
 */
export const TYPE = {
    micro: 11, // fine print: how-to descriptions, record dates, footers
    small: 12, // soldier name tags, button captions, role lines
    body: 14, // dialogue, balloon text, hints, combo
    plate: 15, // cameo name plates
    lead: 18, // sub-banners, floating callouts, record numbers
    head: 22, // score, panel titles, big callouts
    title: 34, // stage banner
    hero: 48, // menu and game-over titles
} as const;

export function strokeFor(size: number) {
    return Math.max(3, Math.round(size / 5));
}

export const COLORS = {
    gold: 0xffc23c,
    orange: 0xff7a21,
    red: 0xd7263d,
    ink: 0x1b0f12,
    sand: 0xe8b878,
    cream: 0xfff1cf,
    tea: 0xc4521b,
};

export const SAVE_KEY = 'memduh-warfare-v1';
