import { Start } from './scenes/Start.js';
import { Game }  from './scenes/Game.js';

const config = {
    type: Phaser.AUTO,
    title: 'Math Catcher',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: false,
    scene: [
        Start,
        Game
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        orientation: Phaser.Scale.LANDSCAPE
    },
}

new Phaser.Game(config);
            