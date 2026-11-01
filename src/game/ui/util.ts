import * as Phaser from 'phaser';
import { FONT, H, K, W } from '../constants';

/** Every scene renders its 360xH design space at K times resolution. */
export function setupCamera(scene: Phaser.Scene) {
    const cam = scene.cameras.main;
    cam.setZoom(K);
    cam.centerOn(W / 2, H / 2);
    cam.roundPixels = false;
    return cam;
}

export interface TextOpts {
    size?: number;
    color?: string;
    stroke?: string;
    strokeW?: number;
    align?: 'left' | 'center' | 'right';
    originX?: number;
    originY?: number;
    wrap?: number;
    shadow?: boolean;
}

export function label(scene: Phaser.Scene, x: number, y: number, text: string, o: TextOpts = {}) {
    const size = o.size ?? 14;
    const t = scene.add.text(x, y, text, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        color: o.color ?? '#fff1cf',
        stroke: o.stroke ?? '#1b0f12',
        strokeThickness: o.strokeW ?? Math.max(2, Math.round(size / 5)),
        align: o.align ?? 'center',
        resolution: K,
        wordWrap: o.wrap ? { width: o.wrap } : undefined,
    });
    t.setOrigin(o.originX ?? 0.5, o.originY ?? 0.5);
    if (o.shadow !== false) t.setShadow(0, 2, '#000000', 0, true, true);
    return t;
}

export interface PixelButton {
    root: Phaser.GameObjects.Container;
    setText(s: string): void;
}

/** A chunky arcade menu button: sand-coloured plate, dark outline, press feedback. */
export function menuButton(
    scene: Phaser.Scene, x: number, y: number, w: number, h: number, text: string,
    onClick: () => void, fill = 0xff7a21,
): PixelButton {
    // generated pixel-art plate, 9-sliced so the corners stay crisp at any width, tinted per button
    const PX = 2.5;
    const plate = scene.add.nineslice(0, 0, 'plate_big', undefined, w / PX, h / PX, 6, 6, 5, 7).setScale(PX);
    const dark = Phaser.Display.Color.IntegerToColor(fill).darken(28).color;
    const draw = (pressed: boolean) => {
        plate.setTint(pressed ? dark : fill).setY(pressed ? 3 : 0);
    };
    draw(false);
    const t = label(scene, 0, -1, text, { size: Math.min(20, h * 0.4), color: '#fff8e0', strokeW: 4 });
    const root = scene.add.container(x, y, [plate, t]);
    root.setSize(w, h);
    // a container's hit area is measured from its top-left corner, not its centre
    root.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    root.on('pointerdown', () => {
        draw(true);
        t.y = 2;
    });
    const up = () => {
        draw(false);
        t.y = -1;
    };
    root.on('pointerout', up);
    root.on('pointerup', () => {
        up();
        onClick();
    });
    return { root, setText: (s: string) => t.setText(s) };
}

export function rnd(a: number, b: number) {
    return a + Math.random() * (b - a);
}
