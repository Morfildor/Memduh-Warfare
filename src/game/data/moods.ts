export interface Mood {
    /** sky gradient, top to horizon: [position 0-1, rgb] */
    sky: [number, number[]][];
    /** multiply tints */
    land: number;
    ground: number;
    sun: number;
    cloud: number;
    mote: number;
    /** 0-1 strength of the night extras */
    stars: number;
    beams: number;
    /** the dust motes rise like embers instead of drifting past */
    embers?: boolean;
    /** scenery for this stretch of the road; the default mix when left out */
    props?: string[];
}

// One long day: every stage is a later hour on the road to the headquarters, so progress shows on the screen.
// Only the world is tinted, the actors keep their full colours and stay readable against it.
export const MOODS: Mood[] = [
    {
        // morning
        sky: [[0, [21, 80, 200]], [0.38, [47, 134, 232]], [0.62, [108, 192, 245]], [0.78, [190, 226, 240]], [0.9, [255, 226, 168]], [1, [255, 190, 120]]],
        land: 0xffffff, ground: 0xffffff, sun: 0xfff0b0, cloud: 0xffffff, mote: 0xfff0cf, stars: 0, beams: 0,
    },
    {
        // late morning, the sand starts to glow
        sky: [[0, [32, 96, 196]], [0.38, [70, 150, 226]], [0.62, [150, 206, 236]], [0.78, [232, 226, 192]], [0.9, [255, 208, 134]], [1, [255, 172, 92]]],
        land: 0xffeed6, ground: 0xfff4e4, sun: 0xffe08a, cloud: 0xfff4e0, mote: 0xffe4b0, stars: 0, beams: 0,
    },
    {
        // high noon in the market
        sky: [[0, [28, 118, 206]], [0.38, [82, 176, 236]], [0.62, [152, 216, 240]], [0.78, [226, 236, 216]], [0.9, [255, 232, 172]], [1, [255, 204, 134]]],
        land: 0xfff6e2, ground: 0xfffaee, sun: 0xfff8d0, cloud: 0xffffff, mote: 0xfff0cf, stars: 0, beams: 0,
        props: ['prop_pazar', 'prop_pazar', 'prop_pazar', 'prop_palmiye', 'prop_duvar', 'prop_bayrak'],
    },
    {
        // sunset behind the watchtower
        sky: [[0, [58, 62, 146]], [0.38, [128, 88, 164]], [0.62, [218, 108, 122]], [0.78, [250, 152, 92]], [0.9, [255, 192, 102]], [1, [255, 152, 72]]],
        land: 0xffc8a0, ground: 0xffe0c4, sun: 0xffa050, cloud: 0xffb890, mote: 0xffc890, stars: 0, beams: 0,
    },
    {
        // dusk at the city gate: the first stars, the first searchlights
        sky: [[0, [28, 28, 82]], [0.38, [70, 44, 118]], [0.62, [142, 58, 122]], [0.78, [216, 86, 88]], [0.9, [246, 132, 72]], [1, [255, 122, 62]]],
        land: 0xc898b4, ground: 0xe4c0c4, sun: 0xff7a48, cloud: 0xb080a8, mote: 0xffb890, stars: 0.6, beams: 0.5,
    },
    {
        // night, and the headquarters is burning
        sky: [[0, [10, 10, 36]], [0.38, [24, 20, 58]], [0.62, [58, 28, 72]], [0.78, [118, 38, 60]], [0.9, [188, 64, 44]], [1, [236, 100, 40]]],
        land: 0x8870a4, ground: 0xc8a8ac, sun: 0xd8dcf0, cloud: 0x584a78, mote: 0xffa040, stars: 1, beams: 1, embers: true,
        props: ['prop_kule', 'prop_projektor', 'prop_projektor', 'prop_bayrak', 'prop_duvar'],
    },
];
