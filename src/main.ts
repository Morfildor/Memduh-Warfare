import StartGame from './game/main';

// long-press on the buttons must not open the browser's context menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('DOMContentLoaded', () => {
    const game = StartGame('game-container');
    // Handy for browser automation and debugging.
    (window as unknown as { __game: unknown }).__game = game;
});
