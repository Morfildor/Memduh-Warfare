import * as Phaser from 'phaser';
import { GROUND_Y, H } from '../constants';
import { MOODS } from '../data/moods';

type Ctx = CanvasRenderingContext2D;

function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, w, h)!;
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
    tex.refresh();
    return tex;
}

// small deterministic RNG so generated art is identical on every load
function lcg(seed: number) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const hex = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** Procedural pixel-art textures that need no files. All sizes are in art pixels (1 art px = 2 design units). */
export function makeTextures(scene: Phaser.Scene) {
    // --- tiny utility sprites ---
    canvasTex(scene, 'px', 4, 4, (c) => {
        c.fillStyle = '#fff';
        c.fillRect(0, 0, 4, 4);
    });
    canvasTex(scene, 'glow', 64, 64, (c) => {
        const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 64, 64);
    });
    // soft edge darkening that frames the playfield (stretched to the screen, so it needs smooth filtering)
    canvasTex(scene, 'vignette', 96, 192, (c) => {
        const g = c.createRadialGradient(48, 96, 40, 48, 96, 118);
        g.addColorStop(0, 'rgba(24,8,14,0)');
        g.addColorStop(0.55, 'rgba(24,8,14,0.10)');
        g.addColorStop(1, 'rgba(24,8,14,0.5)');
        c.fillStyle = g;
        c.fillRect(0, 0, 96, 192);
    }).setFilter(Phaser.Textures.FilterMode.LINEAR);
    canvasTex(scene, 'ring', 64, 64, (c) => {
        c.strokeStyle = '#fff';
        c.lineWidth = 4;
        c.beginPath();
        c.arc(32, 32, 28, 0, Math.PI * 2);
        c.stroke();
    });
    canvasTex(scene, 'shadow', 32, 8, (c) => {
        c.fillStyle = 'rgba(30,12,4,0.38)';
        c.beginPath();
        c.ellipse(16, 4, 15, 3.4, 0, 0, Math.PI * 2);
        c.fill();
    });
    canvasTex(scene, 'ebullet', 8, 8, (c) => {
        const px = (x: number, y: number, col: string) => {
            c.fillStyle = col;
            c.fillRect(x, y, 1, 1);
        };
        for (let y = 0; y < 8; y++)
            for (let x = 0; x < 8; x++) {
                const d = Math.hypot(x - 3.5, y - 3.5);
                if (d < 1.8) px(x, y, '#fff3b0');
                else if (d < 2.9) px(x, y, '#ffb21e');
                else if (d < 3.9) px(x, y, '#d7263d');
            }
    });
    // Kimyacı Ronaldinho's exploding football (drawn at 2x so its pixels match the sprites)
    canvasTex(scene, 'football', 12, 12, (c) => {
        const rows = [
            '....kkkk....',
            '..kkwwwwkk..',
            '.kwwkkwwwwk.',
            '.kwkkkkwwwk.',
            'kwwwkkwwkkwk',
            'kkwwwwwkkkwk',
            'kkwwwwwwkkwk',
            'kwwkwwwwwwwk',
            '.kkkkwwkkwk.',
            '.kkkwwwkkkk.',
            '..kkwwwkkk..',
            '....kkkk....',
        ];
        rows.forEach((row, y) => [...row].forEach((ch, x) => {
            if (ch === '.') return;
            c.fillStyle = ch === 'k' ? '#1b0f12' : '#f7f3ea';
            c.fillRect(x, y, 1, 1);
        }));
    });
    // Memduh's tracer: a hot white head, a yellow body and a fading orange tail (drawn pointing right, rotated to fly)
    canvasTex(scene, 'bolt', 16, 6, (c) => {
        const rows: [number, number][] = [[0, 0.18], [1, 0.55], [2, 1], [3, 1], [4, 0.55], [5, 0.18]];
        for (let x = 0; x < 16; x++) {
            const col = x < 4 ? '255,150,40' : x < 10 ? '255,214,70' : x < 14 ? '255,244,170' : '255,255,255';
            const tail = x < 4 ? 0.3 + x * 0.15 : 1;
            for (const [y, a] of rows) {
                // the head tapers to a point
                if (x >= 14 && (y === 0 || y === 5)) continue;
                if (x === 15 && (y === 1 || y === 4)) continue;
                c.fillStyle = `rgba(${col},${Math.min(1, a * tail)})`;
                c.fillRect(x, y, 1, 1);
            }
        }
    }).setFilter(Phaser.Textures.FilterMode.NEAREST);
    canvasTex(scene, 'smoke', 12, 12, (c) => {
        const r = lcg(7);
        for (let y = 0; y < 12; y++)
            for (let x = 0; x < 12; x++) {
                const d = Math.hypot(x - 5.5, y - 5.5);
                if (d + r() * 1.6 < 5.6) {
                    const v = 70 + Math.round((y < 6 ? 40 : 0) + r() * 25);
                    c.fillStyle = `rgb(${v},${v - 6},${v - 12})`;
                    c.fillRect(x, y, 1, 1);
                }
            }
    });
    // tea glass (tulip shape), full and empty
    for (const full of [true, false]) {
        canvasTex(scene, full ? 'tea' : 'tea_empty', 12, 15, (c) => {
            const rows = [
                '..oooooooo..', '.oLLLLLLLLo.', '.oLTTTTTTLo.', '.oLTHTTTTLo.', '.oLTTTTTTLo.', '..oLTTTTLo..',
                '...oLTTLo...', '...oLTTLo...', '....oooo....', '....oLLo....', '.ooooooooo..',
            ];
            const pal: Record<string, string> = full
                ? { o: '#1b0f12', L: '#ffe9c0', T: '#c4521b', H: '#ff9a3c' }
                : { o: '#1b0f12', L: '#6a5a50', T: '#2c1d1a', H: '#2c1d1a' };
            rows.forEach((row, y) =>
                [...row].forEach((ch, x) => {
                    if (pal[ch]) {
                        c.fillStyle = pal[ch];
                        c.fillRect(x, y + 2, 1, 1);
                    }
                }),
            );
        });
    }

    // --- sky: vertical bands ---
    const skyH = Math.ceil(H / 2);
    MOODS.forEach(({ sky: stops }, n) => canvasTex(scene, `sky${n}`, 1, skyH, (c) => {
        const horizon = (GROUND_Y - 30) / 2;
        for (let y = 0; y < skyH; y++) {
            const band = Math.floor(y / 3) * 3;
            const t = Math.min(1, band / horizon);
            let col = stops[stops.length - 1][1];
            for (let i = 0; i < stops.length - 1; i++) {
                if (t >= stops[i][0] && t <= stops[i + 1][0]) {
                    col = mix(stops[i][1], stops[i + 1][1], (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]));
                    break;
                }
            }
            c.fillStyle = hex(col);
            c.fillRect(0, y, 1, 1);
        }
    }));

    // --- searchlight beam: narrow at the lamp (bottom), wide and faint at the far end ---
    canvasTex(scene, 'beam', 48, 180, (c) => {
        for (let y = 0; y < 180; y++) {
            const half = 2 + (1 - y / 180) * 21;
            c.fillStyle = `rgba(255,246,214,${(0.04 + (y / 180) * 0.3).toFixed(3)})`;
            c.fillRect(24 - half, y, half * 2, 1);
        }
    });

    // --- clouds ---
    for (let n = 0; n < 3; n++) {
        const w = 52 + n * 12;
        const h = 26 + n * 3;
        canvasTex(scene, `cloud${n}`, w, h, (c) => {
            const r = lcg(31 + n);
            const blobs: [number, number, number][] = [];
            for (let i = 0; i < 6 + n; i++) blobs.push([10 + (i / (5 + n)) * (w - 20), h - 11 - r() * 4, 5 + r() * 4]); // kept clear of the canvas edge, or the puffs get cut flat
            for (let y = 0; y < h; y++)
                for (let x = 0; x < w; x++) {
                    let inside = false;
                    for (const [bx, by, br] of blobs) if (Math.hypot(x - bx, (y - by) * 1.15) < br) inside = true;
                    if (inside && y > h - 5 ? true : inside) {
                        const shade = y > h - 8 ? '#cfe3f5' : y > h - 11 ? '#eaf4fc' : '#ffffff';
                        c.fillStyle = shade;
                        c.fillRect(x, y, 1, 1);
                    }
                }
        });
    }

    // --- dunes: seamless wavy silhouettes ---
    const dune = (key: string, w: number, hgt: number, base: number, a1: number, a2: number, ph: number, top: string, body: string, shade: string) =>
        canvasTex(scene, key, w, hgt, (c) => {
            for (let x = 0; x < w; x++) {
                const y = Math.round(base + a1 * Math.sin((2 * Math.PI * x) / w + ph) + a2 * Math.sin((6 * Math.PI * x) / w + ph * 2));
                c.fillStyle = top;
                c.fillRect(x, y, 1, 1);
                c.fillStyle = body;
                c.fillRect(x, y + 1, 1, hgt - y);
                // lee-side shading stripe
                const slope = Math.cos((2 * Math.PI * x) / w + ph);
                if (slope < -0.25) {
                    c.fillStyle = shade;
                    c.fillRect(x, y + 1, 1, Math.min(hgt - y, 5 + Math.round(-slope * 6)));
                }
            }
        });
    dune('dune_far', 180, 60, 26, 9, 3, 0.3, '#f3c98d', '#e4ac6e', '#d79a5e');
    dune('dune_mid', 160, 56, 22, 8, 3, 1.7, '#e8b374', '#d79a5e', '#c8864f');

    // --- distant desert town: flat-colour houses, domes and minarets, drawn in clean art pixels (200x56) ---
    canvasTex(scene, 'city', 200, 56, (c) => {
        const r = lcg(21);
        const col = { body: '#e6b072', shade: '#cf9358', top: '#f6cf98', win: '#94653b', dome: '#f0c68a', domeShade: '#d8a468', dark: '#7a4d2b' };
        const rect = (x: number, y: number, w: number, h: number, fill: string) => {
            c.fillStyle = fill;
            c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
        };
        let x = 0;
        while (x < 190) {
            const kind = r();
            if (kind < 0.2 && x + 40 < 190) {
                // mosque: block, dome and a tall minaret
                const w = 30;
                const h = 20;
                rect(x, 56 - h, w, h, col.body);
                rect(x + w - 5, 56 - h, 5, h, col.shade);
                rect(x, 56 - h, w, 2, col.top);
                const cx = x + 14;
                for (let dy = 0; dy < 9; dy++) {
                    const half = Math.floor(Math.sqrt(81 - (8 - dy) * (8 - dy)));
                    rect(cx - half, 56 - h - dy - 1, half * 2, 1, dy < 4 ? col.dome : col.domeShade);
                }
                rect(cx, 56 - h - 13, 1, 4, col.dark);
                rect(cx - 1, 56 - h - 10, 3, 1, col.dark);
                rect(x + 4, 56 - h + 6, 3, 8, col.win);
                rect(x + 12, 56 - h + 6, 3, 8, col.win);
                rect(x + 20, 56 - h + 6, 3, 8, col.win);
                const mx = x + w + 2;
                rect(mx, 56 - 42, 4, 42, col.body);
                rect(mx + 3, 56 - 42, 1, 42, col.shade);
                rect(mx - 1, 56 - 30, 6, 2, col.top);
                rect(mx, 56 - 46, 4, 4, col.dome);
                rect(mx + 1, 56 - 49, 2, 3, col.domeShade);
                rect(mx + 1, 56 - 52, 1, 3, col.dark);
                x += w + 9;
            } else {
                const w = 12 + Math.floor(r() * 16);
                const h = 12 + Math.floor(r() * 20);
                if (x + w > 192) break;
                rect(x, 56 - h, w, h, col.body);
                rect(x + w - 3, 56 - h, 3, h, col.shade);
                rect(x, 56 - h, w, 2, col.top);
                if (r() < 0.5) rect(x + 1, 56 - h - 2, 3, 2, col.body); // parapet bump
                for (let wx = x + 3; wx < x + w - 5; wx += 6)
                    for (let wy = 56 - h + 5; wy < 52; wy += 8) rect(wx, wy, 2, 3, col.win);
                x += w + 1 + Math.floor(r() * 3);
            }
        }
        // low wall that closes the loop seamlessly at the tile edge
        rect(0, 52, 200, 4, col.shade);
        rect(0, 52, 200, 1, col.top);
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = 'rgba(255,205,150,0.32)'; // distance haze
        c.fillRect(0, 0, 200, 56);
    });

    // --- ground: sand surface plus layered earth under the control area ---
    const gh = Math.ceil((H - GROUND_Y) / 2) + 6;
    canvasTex(scene, 'ground', 64, gh, (c) => {
        const r = lcg(99);
        const layers: [number, string][] = [[0, '#7a4a22'], [1, '#f4d28f'], [2, '#e8b878'], [10, '#d99f5f'], [34, '#b9783f'], [60, '#9a5f33']];
        for (let y = 0; y < gh; y++) {
            let col = layers[0][1];
            for (const [from, colr] of layers) if (y >= from) col = colr;
            c.fillStyle = col;
            c.fillRect(0, y, 64, 1);
        }
        for (let i = 0; i < 150; i++) {
            const x = Math.floor(r() * 64);
            const y = 3 + Math.floor(r() * (gh - 3));
            c.fillStyle = r() > 0.5 ? 'rgba(255,240,200,0.28)' : 'rgba(60,30,10,0.22)';
            c.fillRect(x, y, 1 + Math.floor(r() * 2), 1);
        }
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(r() * 60);
            const y = 14 + Math.floor(r() * (gh - 20));
            c.fillStyle = '#6e4120';
            c.fillRect(x, y, 4, 2);
            c.fillStyle = '#c99a62';
            c.fillRect(x, y, 3, 1);
        }
    });
    // 32x16 on purpose: power-of-two textures are the safe size on every phone GPU
    canvasTex(scene, 'pit', 32, 16, (c) => {
        const r = lcg(5);
        // sunlit sand lip, then walls that fall away into the dark
        c.fillStyle = '#e6c487';
        c.fillRect(0, 0, 32, 1);
        c.fillStyle = '#b07a3e';
        c.fillRect(0, 1, 32, 1);
        for (let y = 2; y < 16; y++) {
            c.fillStyle = y < 5 ? '#4a2a14' : y < 9 ? '#2c170c' : y < 13 ? '#180d07' : '#0a0604';
            c.fillRect(0, y, 32, 1);
        }
        // crumbly side walls catch the light, so the hole reads as a hole
        for (let y = 2; y < 12; y++) {
            c.fillStyle = y < 6 ? '#7a4a24' : '#4a2a14';
            const lw = 1 + (y % 3 === 0 ? 1 : 0);
            c.fillRect(0, y, lw, 1);
            c.fillRect(32 - lw, y, lw, 1);
        }
        for (let i = 0; i < 22; i++) {
            c.fillStyle = r() > 0.5 ? 'rgba(150,95,45,0.45)' : 'rgba(0,0,0,0.35)';
            c.fillRect(2 + Math.floor(r() * 27), 2 + Math.floor(r() * 11), 2, 1);
        }
        // a few pebbles on the lip
        c.fillStyle = '#8a5a2c';
        for (const x of [3, 11, 20, 27]) c.fillRect(x, 0, 2, 1);
    }).setFilter(Phaser.Textures.FilterMode.NEAREST);
    // red-and-white parachute canopy with its lines converging below (paratroopers and the patso airdrop)
    // (taller than the canopy so the long suspension lines read as a parachute, not a hat; the lines' end is the bottom of the image)
    canvasTex(scene, 'chute', 32, 52, (c) => {
        const OUT = '#3a1d12';
        for (let x = 0; x < 32; x++) {
            const k = (x - 15.5) / 16;
            const h = Math.round(Math.sqrt(Math.max(0, 1 - k * k)) * 13);
            if (!h) continue;
            const top = 15 - h;
            c.fillStyle = OUT;
            c.fillRect(x, top - 1, 1, 1);
            // scalloped hem: every other panel hangs one pixel lower
            const hem = 15 + (Math.floor(x / 8) % 2 ? 0 : 1);
            c.fillStyle = Math.floor(x / 4) % 2 ? '#f4efe0' : '#d63a2a';
            c.fillRect(x, top, 1, hem - top);
            c.fillStyle = OUT;
            c.fillRect(x, hem, 1, 1);
        }
        c.fillStyle = 'rgba(255,255,255,0.28)';
        c.fillRect(8, 5, 6, 1);
        c.fillStyle = OUT;
        // four suspension lines from the hem to one point at the harness, drawn step by step down the long axis
        for (const sx of [2, 9, 22, 29]) {
            for (let y = 17; y <= 50; y++) {
                const t = (y - 17) / 33;
                c.fillRect(Math.round(sx + (15.5 - sx) * t), y, 1, 1);
            }
        }
        c.fillRect(14, 49, 3, 3);
    });
    // small olive cargo plane, nose to the left (it flies right to left over the lane)
    // (three-quarter view: round fuselage with light/shade bands, a far wing behind it, a swept near wing, landing gear)
    canvasTex(scene, 'plane', 72, 32, (c) => {
        const OUT = '#26301a';
        const px = (x: number, y: number, w: number, h: number, col: string) => {
            c.fillStyle = col;
            c.fillRect(x, y, w, h);
        };
        const CY = 14;
        const NOSE = [2, 3, 4, 5, 5, 6, 6];
        const half = (x: number) => (x < 13 ? NOSE[x - 6] : x <= 48 ? 6 : Math.max(1, 6 - Math.ceil(((x - 48) * 5) / 18)));
        const top = (x: number) => CY - half(x) - (x > 48 ? Math.floor((x - 48) / 4) : 0);
        const bot = (x: number) => CY + half(x);
        // far wing, seen above the fuselage
        for (let y = 4; y <= 9; y++) {
            const a = 28 + (9 - y) * 2;
            px(a, y, 15, 1, y === 4 ? OUT : '#46542a');
            px(a, y, 1, 1, OUT);
            px(a + 14, y, 1, 1, OUT);
        }
        // landing gear under the wing
        px(30, 24, 2, 5, OUT);
        px(28, 27, 6, 4, OUT);
        px(29, 28, 4, 2, '#3b3f3d');
        px(29, 28, 2, 1, '#7d8486');
        // tail fin (swept) and far tailplane
        for (let y = 0; y <= 10; y++) {
            const a = 55 + Math.floor((10 - y) / 2.5);
            px(a, y, 63 - a, 1, y === 0 ? OUT : '#d63a2a');
            px(a, y, 1, 1, OUT);
            px(62, y, 1, 1, OUT);
        }
        px(58, 3, 4, 2, '#f4efe0');
        px(59, 11, 9, 2, '#46542a');
        px(59, 10, 10, 1, OUT);
        // fuselage: outline, then light / base / shade / belly bands
        for (let x = 6; x <= 67; x++) {
            const t = top(x), b = bot(x);
            px(x, t - 1, 1, 1, OUT);
            px(x, b + 1, 1, 1, OUT);
            for (let y = t; y <= b; y++) {
                const k = y - t, r = b - y;
                px(x, y, 1, 1, k < 2 ? '#a3b66a' : r === 0 ? '#46542a' : r < 3 ? '#5f6f38' : '#7d8f4c');
            }
        }
        px(5, CY - 2, 1, 5, OUT);
        px(6, CY - 3, 1, 1, OUT);
        px(6, CY + 3, 1, 1, OUT);
        // engine cowling + propeller blur
        px(6, CY - 3, 3, 7, OUT);
        px(6, CY - 2, 2, 5, '#4a4f52');
        px(6, CY - 2, 1, 1, '#9aa2a6');
        px(3, 4, 2, 21, 'rgba(255,255,255,0.5)');
        px(4, 5, 1, 19, 'rgba(60,60,60,0.45)');
        // cockpit bump with a windscreen
        px(12, 5, 10, 5, OUT);
        px(13, 6, 8, 4, '#8fc7e8');
        px(14, 6, 3, 1, '#ffffff');
        px(17, 6, 1, 4, OUT);
        // cabin windows, cargo door, roundel, belt line
        px(23, 11, 2, 2, '#bfe6ff');
        px(27, 11, 2, 2, '#bfe6ff');
        px(34, 10, 8, 7, OUT);
        px(35, 11, 6, 5, '#3f4b26');
        px(44, 11, 4, 4, '#f4efe0');
        px(45, 12, 2, 2, '#d63a2a');
        px(10, 17, 36, 1, '#46542a');
        // near tailplane
        px(54, 16, 15, 4, OUT);
        px(55, 17, 13, 2, '#5f6f38');
        px(55, 17, 13, 1, '#8ea05a');
        // swept near wing in front of the body
        for (let y = 18; y <= 27; y++) {
            const a = 24 + Math.round((y - 18) * 1.2);
            const b = 46 + Math.round((y - 18) * 0.7);
            px(a, y, b - a + 1, 1, '#5f6f38');
            px(a, y, 1, 1, OUT);
            px(b, y, 1, 1, OUT);
            px(a + 1, y, 2, 1, '#8ea05a');
            px(b - 3, y, 3, 1, '#46542a');
        }
        px(24, 17, 23, 1, OUT);
        px(26, 28, 21, 1, OUT);
    });
    canvasTex(scene, 'warn', 12, 12, (c) => {
        const rows = [
            '....oooo....', '...oYYYYo...', '...oYooYo...', '..oYYooYYo..', '..oYYooYYo..', '.oYYYooYYYo.',
            '.oYYYooYYYo.', 'oYYYYYYYYYYo', 'oYYYYooYYYYo', 'oYYYYooYYYYo', '.oYYYYYYYYo.', '..oooooooo..',
        ];
        rows.forEach((row, y) => [...row].forEach((ch, x) => {
            if (ch === '.') return;
            c.fillStyle = ch === 'o' ? '#1b0f12' : '#ffc23c';
            c.fillRect(x, y, 1, 1);
        }));
    });
}

/** Dialogue portraits for the bosses, built from their sprites. */
export function makeBossPortraits(scene: Phaser.Scene) {
    // portraits are cut from the first frame of each boss sheet (128x96 cells)
    const make = (key: string, src: string, bg: string) =>
        canvasTex(scene, key, 86, 78, (c) => {
            c.fillStyle = bg;
            c.fillRect(0, 0, 86, 78);
            const img = scene.textures.get(src).getSourceImage() as HTMLImageElement;
            c.imageSmoothingEnabled = false;
            c.drawImage(img, 0, 0, 128, 96, 0, 8, 86, 64.5);
            c.strokeStyle = '#1b0f12';
            c.lineWidth = 2;
            c.strokeRect(1, 1, 84, 76);
        });
    make('p_tank', 'tank_idle', '#5a3322');
    make('p_heli', 'heli_fly', '#2c4d7a');
}

/** Pickup badge that summons a friend: a gold "P" medal. */
export function makeFriendBadge(scene: Phaser.Scene) {
    canvasTex(scene, 'pu_friend', 48, 41, (c) => {
        c.fillStyle = '#1b0f12';
        c.fillRect(0, 0, 48, 41);
        c.fillStyle = '#ffc23c';
        c.fillRect(2, 2, 44, 37);
        c.fillStyle = '#d27d12';
        c.fillRect(2, 30, 44, 9);
        c.fillStyle = '#fff1a8';
        c.fillRect(4, 4, 40, 4);
        c.fillStyle = '#1b0f12';
        c.font = '900 26px "Arial Black", Impact, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('P', 24, 22);
        c.fillStyle = '#e8233a';
        for (const [x, y] of [[8, 10], [40, 10], [8, 33], [40, 33]]) c.fillRect(x - 2, y - 2, 4, 4);
    });
}

/**
 * Turns every friend's photo into a 32x32 posterised arcade portrait (`friend_<id>`); friends without a photo, or
 * whose photo failed to load, get the mystery silhouette so the cameo feature always works.
 */
export function makeFriendPortraits(scene: Phaser.Scene, friends: { id: string; photo?: string }[]) {
    canvasTex(scene, 'friend_unknown', 32, 32, (c) => {
        c.fillStyle = '#3b2a5c';
        c.fillRect(0, 0, 32, 32);
        c.fillStyle = '#2a1d44';
        c.fillRect(0, 22, 32, 10);
        c.fillStyle = '#9a86c9';
        c.beginPath();
        c.arc(16, 13, 7, 0, Math.PI * 2);
        c.fill();
        c.fillRect(6, 22, 20, 10);
        c.fillStyle = '#ffc23c';
        c.font = '900 14px "Arial Black", sans-serif';
        c.textAlign = 'center';
        c.fillText('?', 16, 18);
    });
    for (const f of friends) {
        const raw = `friend_raw_${f.id}`;
        if (!f.photo || !scene.textures.exists(raw)) continue;
        const img = scene.textures.get(raw).getSourceImage() as HTMLImageElement;
        const side = Math.min(img.width, img.height);
        canvasTex(scene, `friend_${f.id}`, 32, 32, (c) => {
            c.imageSmoothingEnabled = true;
            c.drawImage(img, (img.width - side) / 2, (img.height - side) * 0.25, side, side, 0, 0, 32, 32);
            const d = c.getImageData(0, 0, 32, 32);
            const q = (v: number) => Math.max(0, Math.min(255, Math.round(((v - 128) * 1.25 + 128) / 51) * 51)); // 6 levels + contrast
            for (let i = 0; i < d.data.length; i += 4) {
                d.data[i] = q(d.data[i]);
                d.data[i + 1] = q(d.data[i + 1]);
                d.data[i + 2] = q(d.data[i + 2]);
            }
            c.putImageData(d, 0, 0);
        });
    }
}
