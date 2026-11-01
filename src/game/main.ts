import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { H, K, W } from './constants';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    backgroundColor: '#1b0f12',
    pixelArt: true,
    roundPixels: false,
    render: { powerPreference: 'high-performance' },
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: W * K,
        height: H * K,
    },
    input: { activePointers: 4 },
    // ~85 small files: fewer simultaneous requests are kinder to phone connections and hosted pages that rate-limit
    loader: { maxParallelDownloads: 8 },
    fps: { target: 60, smoothStep: true },
    audio: { noAudio: true }, // audio is synthesised with WebAudio (see systems/Audio.ts)
    scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

const StartGame = (parent: string) => new Game({ ...config, parent, scale: { ...config.scale, parent } });

export default StartGame;
