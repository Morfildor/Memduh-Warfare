import * as Phaser from 'phaser';

/**
 * `pixelArt: true` makes Phaser upload every texture with NEAREST filtering, and Text re-uploads its canvas on every
 * setText / setStyle (resetting the filter again), so type came out with stair-stepped outlines whenever it was
 * scaled or rotated by a tween. Sprites must stay NEAREST, so only Text is touched: wrap updateText once and put
 * LINEAR back after each upload. One patch covers every Text, pooled or not.
 */
export function installSmoothText() {
    const proto = Phaser.GameObjects.Text.prototype as unknown as { updateText: () => unknown; __smooth?: boolean };
    if (proto.__smooth) return;
    proto.__smooth = true;
    const orig = proto.updateText;
    proto.updateText = function (this: Phaser.GameObjects.Text) {
        const r = orig.call(this);
        if (this.renderer && 'gl' in this.renderer) this.frame.source.setFilter(Phaser.Textures.FilterMode.LINEAR);
        return r;
    };
}
