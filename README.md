# MEMDUH WARFARE: Çay Soğumadan!

A portrait arcade run-and-gun for phones, made with Phaser 4, TypeScript and Vite. Memduh runs on his own; you aim nothing and steer nothing. You time **ATEŞ**, **BOMBA**, **ZIPLA** and **POMPA GÜCÜ**.

## Run it

```
npm install
npm run dev-nolog     # http://localhost:8080
npm run build-nolog   # static site in dist/
```

(`dev` and `build` are the template's scripts and send anonymous usage pings; the `-nolog` ones do not.)

## Controls

| Action | Touch | Keyboard |
|---|---|---|
| ATEŞ (hold, auto-aims) | right big button | J / Z / F |
| BOMBA (3 charges, recharge) | button left of ATEŞ | K / X / B |
| ZIPLA (hold for a higher jump) | left big button | Space / W / Up |
| POMPA GÜCÜ (appears when the meter is full) | gold button above ATEŞ | L / C / Q |
| Pause | top-right button | P / Esc |

## Deploy (Netlify)

Connect the repository, or drag the `dist/` folder onto Netlify. `netlify.toml` already sets the build command and publish directory.

## Adding the Pompa team

Open `src/game/data/friends.ts`. Each entry is a friend with a name, a list of catchphrases (one is picked at random each time) and a power (`strike`, `shield`, `rapid`, `bombs`, `heal`). Put their finished portrait (about 88x80 pixel art) in `public/assets/friends/` and set `art: 'name.png'`. A raw `photo: 'name.jpg'` also works; the game pixelates and posterises it. Friends with neither appear as a mystery silhouette. They arrive as a "P" medal pickup (also dropped by Hacı Deve), burst onto the screen, shout the catchphrase and help.

## Project map

- `src/game/scenes` Boot, Preloader, MainMenu, Game, GameOver
- `src/game/systems` Audio (WebAudio synth, no sound files), Backdrop (parallax), Controls (multitouch), Director (encounters), Fx, Save, Textures (procedural art)
- `src/game/data` enemies, stages, dialogue (about 130 Turkish lines), friends, animation tables
- `tools/` the asset pipeline (Python): `build_anims.py` turns Pixellab animation jobs into clean sheets, `prep_assets.py` cleans the supplied pack, `pixel_clean.py` is the shared palette-lock helper. `anim_jobs.json` records every sheet's source job.

## Art notes

All characters were generated with Pixellab from the poster and then cleaned: hard alpha, one palette per character, stray-pixel removal, one alignment offset per animation. The supplied sprite pack is not modified and only feeds props, pickups and portraits.

## Verified so far, and what is not

Verified in a desktop browser at 390x844: menu, full run, all stages 1-6 by bot, both bosses, Pompa Gücü, friend cameo, game over, local high scores, production build, no console errors.

Not verified: real iPhone Safari or Android Chrome, real multitouch (only mouse input was driven), and frame rate on a real phone. Difficulty tuning is based on a bot, not human players.
