import { Scene, Textures } from 'phaser';
import { COLORS, H, W } from '../constants';
import { SHEETS } from '../data/anims';
import { FRIENDS } from '../data/friends';
import { makeBossPortraits, makeFriendBadge, makeFriendPortraits, makeTextures } from '../systems/Textures';
import { label, setupCamera } from '../ui/util';

const A = 'assets/';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        setupCamera(this);
        const barW = 220;
        this.add.rectangle(W / 2, H / 2, W, H, COLORS.ink);
        label(this, W / 2, H / 2 - 60, 'MEMDUH WARFARE', { size: 26, color: '#ffc23c' });
        label(this, W / 2, H / 2 - 28, 'Çaylar demleniyor…', { size: 12 });
        this.add.rectangle(W / 2, H / 2 + 10, barW + 8, 18, 0x000000).setStrokeStyle(2, COLORS.gold);
        const bar = this.add.rectangle(W / 2 - barW / 2, H / 2 + 10, 1, 10, COLORS.orange).setOrigin(0, 0.5);
        this.load.on('progress', (p: number) => (bar.width = Math.max(1, barW * p)));

        // Every asset goes through `queue` so create() can see which ones failed and ask for them again
        // (on a flaky phone connection or a hosted page a few requests can drop).
        this.loadErrors = 0;
        this.load.on('loaderror', (file: { key: string; url: string }) => {
            this.loadErrors++;
            console.warn('[assets] failed to load', file.key, file.url);
        });
        const sheet = (key: string, path: string, w: number, h: number) =>
            this.queue(key, () => this.load.spritesheet(key, A + path, { frameWidth: w, frameHeight: h }));

        // 16-frame character sheets (see data/anims.ts)
        for (const s of SHEETS) sheet(s.key, `anim/${s.key}.png`, s.w, s.h);

        const img = (key: string, path: string) => this.queue(key, () => this.load.image(key, A + path));

        for (const n of ['mermi', 'alev_kucuk', 'alev_buyuk', 'el_bombasi', 'buyuk_bomba', 'roket']) img('pr_' + n, `projectiles/${n}.png`);
        for (const n of ['hizli_ates', 'buyuk_bomba', 'kalkan', 'can_paketi', 'hava_destegi', 'kiyamet_bombasi', 'anesthesia', 'hack', 'slap', 'patso']) img('pu_' + n, `powerups/${n}.png`);

        img('p_memduh_normal', 'portraits/memduh/normal.png');
        img('p_memduh_kahkaha', 'portraits/memduh/kahkaha.png');
        img('p_memduh_kizgin', 'portraits/memduh/kizgin.png');
        img('p_memduh_saskin', 'portraits/memduh/saskin.png');
        img('p_deve', 'portraits/npcs/haci_deved.png');
        img('p_riza', 'portraits/npcs/seyh_riza.png');
        img('p_ali', 'portraits/npcs/telsizci_ali.png');
        img('p_cemil', 'portraits/npcs/muhendis_cemil.png');
        img('p_hoca', 'portraits/npcs/rehber_hoca.png');

        img('prop_palmiye', 'scenery/props/palmiye.png');
        img('prop_pazar', 'scenery/props/pazar_cadiri.png');
        img('prop_kule', 'scenery/props/gozetleme_kulesi.png');
        img('prop_bayrak', 'scenery/props/kirmizi_bayrak.png');
        img('prop_projektor', 'scenery/props/projektor.png');
        img('prop_duvar', 'scenery/tiles/duvar_tas.png');
        img('crate_big', 'scenery/props/kutu_buyuk.png');
        img('crate_small', 'scenery/props/kutu_kucuk.png');
        img('barrel', 'scenery/props/varil.png');
        img('beanbag', 'scenery/props/armut_koltuk.png');

        for (const n of ['btn_fire', 'btn_bomb', 'btn_jump', 'btn_duck', 'btn_pompa', 'plate_big']) img(n, `ui/${n}.png`);
        for (const f of FRIENDS) if (f.art) img(`friend_${f.id}`, `friends/${f.art}`);
        for (const f of FRIENDS) if (f.photo && !f.art) img(`friend_raw_${f.id}`, `friends/${f.photo}`);
        sheet('fx_boom', 'effects/patlama.png', 96, 96);
        sheet('fx_dust', 'effects/toz.png', 96, 96);
    }

    private pending: { key: string; add: () => void }[] = [];
    private loadErrors = 0;
    private attempts = 0;

    private queue(key: string, add: () => void) {
        this.pending.push({ key, add });
        add();
    }

    create() {
        // a finished loader can be asked again: re-queue whatever is still missing (up to 3 more tries, then carry on)
        const missing = this.pending.filter((p) => !this.textures.exists(p.key));
        if (missing.length && this.attempts < 3) {
            this.attempts++;
            console.warn(`[assets] retry ${this.attempts}:`, missing.map((m) => m.key).join(', '));
            for (const m of missing) m.add();
            this.load.once('complete', () => this.create());
            this.load.start();
            return;
        }
        // the control buttons and menu plate are smooth 8x / 5x art drawn 1:1 at K, so they want LINEAR (pixelArt makes everything NEAREST)
        for (const n of ['btn_fire', 'btn_bomb', 'btn_jump', 'btn_duck', 'btn_pompa', 'plate_big']) this.textures.get(n)?.setFilter(Textures.FilterMode.LINEAR);
        makeTextures(this);
        makeBossPortraits(this);
        makeFriendBadge(this);
        makeFriendPortraits(this, FRIENDS);
        this.scene.start('MainMenu');
    }
}
