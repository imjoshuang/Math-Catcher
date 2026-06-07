export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/oceanbgd.jpg');

        // FIXED: Tamang frameWidth at frameHeight base sa actual spritesheet size
        // Spritesheet: 4416 x 3264 px, 6 columns x 6 rows = 36 frames
        // frameWidth = 4416 / 6 = 736
        // frameHeight = 3264 / 6 = 544
        this.load.spritesheet('logo', 'assets/submarine.png', {
            frameWidth: 736,
            frameHeight: 544
        });

        this.load.image('infobutton', 'assets/infobutton.png');
        this.load.image('settingsbutton', 'assets/settings button.png');
        this.load.image('startbutton', 'assets/startbutton.png');
        this.load.image('soundbutton', 'assets/soundbutton.png');
        this.load.image('muted', 'assets/muted.png');
        this.load.image('setclose', 'assets/setclose.png');
        this.load.image('exitgame', 'assets/exitgame.png');
        this.load.image('exitconfirm', 'assets/EXITCOM.png');
        this.load.image('exitcheck', 'assets/exitcheck.png');
        this.load.image('exitcancel', 'assets/exitcancel.png');
        this.load.image('title', 'text/MATH CATCHER OCEAN DIVE.png');
        this.load.image('settingspanel', 'assets/settingspanel.png');
        this.load.audio('bgm', 'sounds/audiocoffee-kid-131153.mp3');
        // Click sound for buttons
        this.load.audio('click', 'sounds/buttonclick.wav');
    }

    create() {
        // If returning from selection, jump straight to game
        if (sessionStorage.getItem('operation')) { this.scene.start('Game'); return; }

        // Scrolling background gamit ang dalawang image side-by-side
        this.bgWidth = this.scale.width;
        this.bgHeight = this.scale.height;
        this.bg1 = this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(this.bgWidth, this.bgHeight);

        const addHoverEffect = (button, normalScale, hoverScale) => {
            button.setData('hoverNormalScale', normalScale);
            button.on('pointerover', () => {
                this.tweens.killTweensOf(button);
                this.tweens.add({
                    targets: button,
                    scale: hoverScale,
                    duration: 120,
                    ease: 'Sine.out'
                });
            });
            button.on('pointerout', () => {
                this.tweens.killTweensOf(button);
                this.tweens.add({
                    targets: button,
                    scale: button.getData('hoverNormalScale') ?? normalScale,
                    duration: 120,
                    ease: 'Sine.out'
                });
            });
        };

        // Info button - upper left
        const infoButton = this.add.image(120, 100, 'infobutton')
            .setOrigin(0.5, 0.5)
            .setScale(0.14)
            .setInteractive({ useHandCursor: true });

        infoButton.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            console.log('Info button clicked');
            // TODO: dagdag ng info scene/modal dito
        });
        addHoverEffect(infoButton, 0.14, 0.16);

        // Settings button - upper right
        const settingsButton = this.add.image(this.scale.width - 120, 100, 'settingsbutton')
            .setOrigin(0.5, 0.5)
            .setScale(0.14)
            .setInteractive({ useHandCursor: true });

        // Overlay to block interaction with other elements while settings is open
        const settingsOverlay = this.add.rectangle(0, 0, this.bgWidth, this.bgHeight, 0x000000, 0.45)
            .setOrigin(0, 0)
            .setDepth(999)
            .setVisible(false)
            .setInteractive();
        settingsOverlay.on('pointerdown', () => {
            // block clicks behind the overlay
        });

        const blurOverlay = this.add.rectangle(0, 0, this.bgWidth, this.bgHeight, 0x000000, 0.55)
            .setOrigin(0, 0)
            .setDepth(998)
            .setVisible(false);

        // Settings panel container (hidden by default)
        const settingsPanel = this.add.container(this.scale.width / 2, this.scale.height / 2)
            .setVisible(false)
            .setDepth(1000);
        const panelBg = this.add.image(0, 0, 'settingspanel').setOrigin(0.5).setScale(0.65);
        const soundToggle = this.add.image(-180, 15, 'soundbutton')
            .setOrigin(0.5)
            .setScale(0.30)
            .setInteractive({ useHandCursor: true });

        const exitButton = this.add.image(170, 20, 'exitgame')
            .setOrigin(0.5)
            .setScale(0.30)
            .setInteractive({ useHandCursor: true });

        const closeButton = this.add.image(0, 290, 'setclose')
            .setOrigin(0.5)
            .setScale(0.20)
            .setInteractive({ useHandCursor: true });

        soundToggle.on('pointerdown', () => {
            const nextOn = !this.soundOn;
            this.soundOn = nextOn;
            sessionStorage.setItem('soundMuted', (!this.soundOn).toString());
            if (this.soundOn) {
                this.sound.mute = false;
                soundToggle.setTexture('soundbutton');
                if (this.clickSound) this.clickSound.play();
            } else {
                this.sound.mute = true;
                soundToggle.setTexture('muted');
            }
        });
        addHoverEffect(soundToggle, 0.30, 0.34);

        addHoverEffect(exitButton, 0.30, 0.34);

        closeButton.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            settingsOverlay.setVisible(false);
            blurOverlay.setVisible(false);
            exitConfirm.setVisible(false);
            settingsPanel.setVisible(false);
        });
        closeButton.on('pointerover', () => {
            this.tweens.killTweensOf(closeButton);
            this.tweens.add({ targets: closeButton, scale: 0.22, duration: 100, ease: 'Sine.out' });
        });
        closeButton.on('pointerout', () => {
            this.tweens.killTweensOf(closeButton);
            this.tweens.add({ targets: closeButton, scale: 0.20, duration: 100, ease: 'Sine.out' });
        });

        const exitConfirm = this.add.container(this.scale.width / 2, this.scale.height / 2)
            .setVisible(false)
            .setDepth(1001);
        const confirmBg = this.add.image(0, 0, 'exitconfirm').setOrigin(0.5).setScale(0.65);
        const confirmYes = this.add.image(-100, 50, 'exitcheck')
            .setOrigin(0.5)
            .setScale(0.14)
            .setInteractive({ useHandCursor: true });
        const confirmNo = this.add.image(100, 50, 'exitcancel')
            .setOrigin(0.5)
            .setScale(0.14)
            .setInteractive({ useHandCursor: true });

        const confirmHoverScale = 0.18;
        const confirmNormalScale = 0.14;

        confirmYes.on('pointerover', () => {
            this.tweens.killTweensOf(confirmYes);
            this.tweens.add({ targets: confirmYes, scale: confirmHoverScale, duration: 120, ease: 'Sine.out' });
        });
        confirmYes.on('pointerout', () => {
            this.tweens.killTweensOf(confirmYes);
            this.tweens.add({ targets: confirmYes, scale: confirmNormalScale, duration: 120, ease: 'Sine.out' });
        });

        confirmNo.on('pointerover', () => {
            this.tweens.killTweensOf(confirmNo);
            this.tweens.add({ targets: confirmNo, scale: confirmHoverScale, duration: 120, ease: 'Sine.out' });
        });
        confirmNo.on('pointerout', () => {
            this.tweens.killTweensOf(confirmNo);
            this.tweens.add({ targets: confirmNo, scale: confirmNormalScale, duration: 120, ease: 'Sine.out' });
        });

        confirmYes.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            if (typeof window !== 'undefined' && window.close) {
                window.close();
            }
            if (typeof window !== 'undefined') {
                window.location.href = 'about:blank';
            }
        });
        confirmNo.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            exitConfirm.setVisible(false);
            blurOverlay.setVisible(false);
            settingsOverlay.setVisible(true);
            settingsPanel.setVisible(true);
        });

        exitConfirm.add([confirmBg, confirmYes, confirmNo]);
        settingsPanel.add([panelBg, soundToggle, exitButton, closeButton]);

        exitButton.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            settingsPanel.setVisible(false);
            exitConfirm.setVisible(true);
            blurOverlay.setVisible(true);
            settingsOverlay.setVisible(true);
        });

        settingsButton.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            console.log('Settings button clicked');
            const isOpen = !settingsPanel.visible;
            settingsOverlay.setVisible(isOpen);
            blurOverlay.setVisible(false);
            settingsPanel.setVisible(isOpen);
            if (!isOpen) {
                exitConfirm.setVisible(false);
            }
        });
        addHoverEffect(settingsButton, 0.14, 0.16);

        // Title image for the landing page
        const title = this.add.image(this.scale.width / 2, 355, 'title')
            .setOrigin(0.5, 0.5)
            .setScale(0.6);

        // FIXED: Bawasan ang scale dahil malaki ang bawat frame (736x468)
        // Place the submarine below the start button
        const logo = this.add.sprite(this.scale.width / 2, 620, 'logo')
            .setOrigin(0.5, 0.5)
            .setScale(0.30);

        // FIXED: Tama na ang end: 35 (36 frames total, 0-indexed)
        this.anims.create({
            key: 'sub_move',
            frames: this.anims.generateFrameNumbers('logo', { start: 0, end: 35 }),
            frameRate: 12,
            repeat: -1
        });

        // I-play ang animation
        logo.play('sub_move');

        // Background music for landing page
        const savedMuted = sessionStorage.getItem('soundMuted') === 'true';
        this.soundOn = !savedMuted;
        this.bgm = this.sound.add('bgm', {
            loop: true,
            volume: 0.25
        });
        
        // Restore mute and UI state
        this.sound.mute = savedMuted;
        soundToggle.setTexture(savedMuted ? 'muted' : 'soundbutton');
        
        // Check if there's a saved playback time from selection page
        const savedTime = sessionStorage.getItem('musicTime');
        if (savedTime) {
            this.bgm.seek = parseFloat(savedTime);
            sessionStorage.removeItem('musicTime');
        }
        
        this.bgm.play();
        // Create click sound
        this.clickSound = this.sound.add('click', { volume: 0.6 });

        // Start button - middle center
        const startButton = this.add.image(this.scale.width / 2, 480, 'startbutton')
            .setOrigin(0.5, 0.5)
            .setScale(0.3)
            .setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            // Save current music playback time before navigating
            if (this.bgm) {
                sessionStorage.setItem('musicTime', this.bgm.seek.toString());
            }
            window.location.href = 'selection.html';
        });
        addHoverEffect(startButton, 0.3, 0.32);

        // Bob/float tween para sa logo below the start button
        this.tweens.add({
            targets: logo,
            y: 660,
            duration: 1500,
            ease: 'Sine.inOut',
            yoyo: true,
            loop: -1
        });
    }

    update() {
    }

}