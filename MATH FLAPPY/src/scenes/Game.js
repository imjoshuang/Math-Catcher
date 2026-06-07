export class Game extends Phaser.Scene {
    constructor() { super('Game'); }

    init() {
        this.operation        = sessionStorage.getItem('operation') || 'addition';
        this.score            = 0;
        this.lives            = 3;
        this.currentLevel     = 1;
        this.questionsAnswered = 0;
        this.timeLeft         = 50;
        this.fishGroup        = [];
        this.fishVals         = [];
        this.ans              = 0;
        this.isTransitioning  = false;
    }

    preload() {
        const img = (key, path) => { if (!this.textures.exists(key)) this.load.image(key, path); };
        img('background',    'assets/background.jpg');
        img('basket',        'assets/basket.png');
        img('clock_icon',    'assets/clock.png');
        img('star_icon',     'assets/star.png');
        img('fishlives_icon','assets/fishlives.png');
        img('pause_btn',     'assets/pause.png');
        img('pause_panel',   'assets/pause panel.png');
        img('restart_btn',   'assets/restart.png');
        img('exitpause_btn', 'assets/exitpause.png');
        img('exitcancel',     'assets/exitcancel.png');
        img('c1',             'assets/c1.png');
        img('c2',             'assets/c2.png');
        img('c3',             'assets/c3.png');
        img('level1_img',     'assets/level1.png');
        img('level2_img',     'assets/level2.png');
        img('finallevel_img', 'assets/final level.png');
        img('completepanel',  'assets/completepanel.png');
        img('donecom',        'assets/donecom.png');
        img('levelfailed',    'assets/levelfailed.png');
        img('restartfailed',  'assets/restartfailed.png');
        img('exitfailed',     'assets/exitfailed.png');
        img('failedstar',     'assets/failedstar.png');

        const aud = (key, path) => { if (!this.cache.audio.exists(key)) this.load.audio(key, path); };
        aud('bgm',         'assets/bgm.mp3');
        aud('click',       'assets/click.wav');
        aud('wronganswer', 'sounds/wrongasnwer.mp3');
        aud('youlose',     'sounds/youlose.mp3');
        aud('ingame',      'sounds/ingamrsound.mp3');
        aud('pausebgm',    'sounds/pausebgm.mp3');
        aud('correct',      'sounds/correct.mp3');
        aud('levelpassed',  'sounds/levelpassed.mp3');
        aud('clocktick',    'sounds/clocktick.mp3');

        if (!this.textures.exists('fish1'))
            this.load.spritesheet('fish1', 'assets/fish1.png', { frameWidth: 341, frameHeight: 246 });
        if (!this.textures.exists('fish2'))
            this.load.spritesheet('fish2', 'assets/fish2.png', { frameWidth: 341, frameHeight: 260 });
        if (!this.textures.exists('fish3'))
            this.load.spritesheet('fish3', 'assets/fish3.png', { frameWidth: 341, frameHeight: 276 });
        if (!this.textures.exists('basketanime'))
            this.load.spritesheet('basketanime', 'assets/basketanime.png', { frameWidth: 640, frameHeight: 608 });
        if (!this.textures.exists('basketwrong'))
            this.load.spritesheet('basketwrong', 'assets/basketwrong.png', { frameWidth: 504, frameHeight: 444 });
    }

    create() {
        const W = this.scale.width, H = this.scale.height;

        this.cameras.main.fadeIn(600, 0, 0, 0);
        this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(W, H);

        const muted = sessionStorage.getItem('soundMuted') === 'true';
        this.sound.mute = muted;

        this.sound.stopAll();
        this.bgm = this.cache.audio.exists('ingame')
            ? this.sound.add('ingame', { loop: true, volume: 1.0 }) : null;
        this.bgm?.play();

        this.sfx         = this.cache.audio.exists('click')       ? this.sound.add('click',       { volume: 1.0 }) : null;
        this.wrongSfx    = this.cache.audio.exists('wronganswer') ? this.sound.add('wronganswer', { volume: 1.0 }) : null;
        this.youlosesSfx = this.cache.audio.exists('youlose')     ? this.sound.add('youlose',     { volume: 1.0 }) : null;
        this.pauseBgm    = this.cache.audio.exists('pausebgm')    ? this.sound.add('pausebgm',    { loop: true, volume: 1.0 }) : null;
        this.correctSfx     = this.cache.audio.exists('correct')     ? this.sound.add('correct',     { volume: 1.0 }) : null;
        this.levelPassedSfx = this.cache.audio.exists('levelpassed') ? this.sound.add('levelpassed', { volume: 1.0 }) : null;
        this.clockTickSfx   = this.cache.audio.exists('clocktick')   ? this.sound.add('clocktick',   { volume: 1.0 }) : null;
        this.isPaused       = false;

        [
            { key: 'fish1_swim', texture: 'fish1' },
            { key: 'fish2_swim', texture: 'fish2' },
            { key: 'fish3_swim', texture: 'fish3' },
        ].forEach(({ key, texture }) => {
            if (!this.anims.exists(key)) {
                this.anims.create({
                    key,
                    frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 35 }),
                    frameRate: 12,
                    repeat: -1
                });
            }
        });

        this._buildUI(W, H);

        this.basket = this.add.image(W / 2, H - 130, 'basket')
            .setDisplaySize(320, 320).setDepth(5);

        if (!this.anims.exists('basket_pop')) {
            this.anims.create({
                key: 'basket_pop',
                frames: this.anims.generateFrameNumbers('basketanime', { start: 0, end: 35 }),
                frameRate: 24, repeat: 0
            });
        }
        this.basketSprite = this.add.sprite(W / 2, H - 130, 'basketanime')
            .setDisplaySize(410, 390).setDepth(5).setVisible(false);
        this.basketSprite.on('animationcomplete', () => {
            this.basketSprite.setVisible(false);
            this.basket.setVisible(true);
        });

        if (!this.anims.exists('basket_wrong')) {
            this.anims.create({
                key: 'basket_wrong',
                frames: this.anims.generateFrameNumbers('basketwrong', { start: 0, end: 35 }),
                frameRate: 24, repeat: 0
            });
        }
        this.basketWrongSprite = this.add.sprite(W / 2, H - 130, 'basketwrong')
            .setDisplaySize(270, 238).setDepth(6)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setVisible(false);
        this.basketWrongSprite.on('animationcomplete', () => {
            this.basketWrongSprite.setVisible(false);
        });

        this._setupDrag();
        this._startCountdown(() => this._showLevelAnnouncement('level1_img', () => this._startGameplay()));
    }

    _buildUI(W, H) {
        this.add.image(76, 55, 'clock_icon').setDisplaySize(142, 80).setDepth(10);
        this.timerTxt = this.add.text(158, 55, '50', {
            fontSize: '38px', fontStyle: 'bold',
            color: '#fff', stroke: '#000', strokeThickness: 5
        }).setOrigin(0, 0.5).setDepth(10);

        const pauseBtn = this.add.image(290, 55, 'pause_btn')
            .setDisplaySize(80, 80).setInteractive({ useHandCursor: true }).setDepth(10);
        pauseBtn.on('pointerover',  () => pauseBtn.setDisplaySize(88, 88));
        pauseBtn.on('pointerout',   () => pauseBtn.setDisplaySize(80, 80));
        pauseBtn.on('pointerdown',  () => { this.sfx?.play(); this._pause(); });

        this.add.image(45, 148, 'star_icon').setDisplaySize(142, 80).setDepth(10);
        this.scoreTxt = this.add.text(125, 148, '000', {
            fontSize: '38px', fontStyle: 'bold',
            color: '#fff', stroke: '#000', strokeThickness: 5
        }).setOrigin(0, 0.5).setDepth(10);

        this.lifes = [];
        for (let i = 0; i < 3; i++) {
            this.lifes.push(
                this.add.image(W - 50 - i * 90, 55, 'fishlives_icon')
                    .setDisplaySize(80, 80).setDepth(10)
            );
        }

        const pW = 440, pH = 82, pX = W / 2 - pW / 2, pY = 14;
        const g = this.add.graphics().setDepth(9);
        g.fillStyle(0x0c2840, 0.9);
        g.fillRoundedRect(pX, pY, pW, pH, 32);
        g.lineStyle(4, 0x3ad8ff, 1);
        g.strokeRoundedRect(pX, pY, pW, pH, 32);
        this.qLabel = this.add.text(W / 2, pY + pH / 2, '', {
            fontSize: '46px', fontStyle: 'bold',
            color: '#fff', stroke: '#111', strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        this.lvlLabel = this.add.text(W / 2, 122, 'LEVEL 1', {
            fontSize: '26px', fontStyle: 'bold',
            color: '#ffd700', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(10);
    }

    _generateQ() {
        const ansRanges = { 1: [1, 10], 2: [10, 20], 3: [20, 50] };
        const [minAns, maxAns] = ansRanges[this.currentLevel] || [1, 10];
        let a, b;

        switch (this.operation) {
            case 'addition': {
                this.ans = Phaser.Math.Between(Math.max(2, minAns), maxAns);
                a = Phaser.Math.Between(1, this.ans - 1);
                b = this.ans - a;
                this.qStr = `${a} + ${b} = ?`;
                break;
            }
            case 'subtraction': {
                this.ans = Phaser.Math.Between(minAns, maxAns);
                b = Phaser.Math.Between(1, Math.max(1, Math.floor(maxAns / 2)));
                a = this.ans + b;
                this.qStr = `${a} − ${b} = ?`;
                break;
            }
            default: {
                this.ans = Phaser.Math.Between(Math.max(1, minAns), maxAns);
                const factors = [];
                for (let i = 1; i <= Math.sqrt(this.ans); i++) {
                    if (this.ans % i === 0) factors.push([i, this.ans / i]);
                }
                const pair = factors[Phaser.Math.Between(0, factors.length - 1)];
                [a, b] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
                this.qStr = `${a} × ${b} = ?`;
                break;
            }
        }

        const wrongs = new Set();
        let safety = 0;
        while (wrongs.size < 2 && safety++ < 40) {
            const d = Phaser.Math.Between(1, Math.max(3, Math.ceil(this.ans * 0.4)));
            const w = this.ans + (Math.random() < 0.5 ? d : -d);
            if (w !== this.ans && w > 0) wrongs.add(w);
        }
        this.fishVals = Phaser.Utils.Array.Shuffle([this.ans, ...[...wrongs]]);
    }

    _spawnFish(W, H) {
        const keys     = ['fish1',      'fish2',      'fish3'     ];
        const animKeys = ['fish1_swim', 'fish2_swim', 'fish3_swim'];
        const spots    = [
            { x: W * 0.20, y: H * 0.53 },
            { x: W * 0.50, y: H * 0.41 },
            { x: W * 0.80, y: H * 0.53 },
        ];

        keys.forEach((key, i) => {
            const { x, y } = spots[i];
            const val = this.fishVals[i];
            const c = this.add.container(x, y).setDepth(6);

            const img = this.add.sprite(0, 0, key)
                .setDisplaySize(220, 155).play(animKeys[i]);

            const numTxt = this.add.text(0, 8, String(val), {
                fontSize: '48px', fontStyle: 'bold',
                color: '#ffffff', stroke: '#000000', strokeThickness: 8
            }).setOrigin(0.5);

            c.add([img, numTxt]);
            c.setData({ value: val, origX: x, origY: y });

            const bob = this.tweens.add({
                targets: c, y: y + Phaser.Math.Between(22, 36),
                duration: Phaser.Math.Between(1100, 1800),
                ease: 'Sine.inOut', yoyo: true, loop: -1, delay: i * 320
            });
            this.tweens.add({
                targets: img, angle: Phaser.Math.Between(-9, 9),
                duration: Phaser.Math.Between(700, 1100),
                ease: 'Sine.inOut', yoyo: true, loop: -1, delay: i * 180
            });

            c.setData('bobTween', bob);
            c.setInteractive(new Phaser.Geom.Circle(0, 0, 82), Phaser.Geom.Circle.Contains);
            this.input.setDraggable(c);
            this.fishGroup.push(c);
        });
    }

    _setupDrag() {
        this.input.on('dragstart', (_, obj) => {
            obj.getData('bobTween')?.pause();
            this.tweens.killTweensOf(obj);
            obj.setDepth(20);
        });
        this.input.on('drag', (_, obj, x, y) => { obj.x = x; obj.y = y; });
        this.input.on('dragend', (_, obj) => {
            obj.setDepth(6);
            const dist = Phaser.Math.Distance.Between(obj.x, obj.y, this.basket.x, this.basket.y);
            if (dist < 130) {
                obj.getData('value') === this.ans ? this._onCorrect(obj) : this._onWrong(obj);
            } else {
                this._returnFish(obj);
            }
        });
    }

    _returnFish(f) {
        this.tweens.add({
            targets: f, x: f.getData('origX'), y: f.getData('origY'),
            duration: 380, ease: 'Back.Out',
            onComplete: () => f.getData('bobTween')?.resume()
        });
    }

    _onCorrect(f) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.sfx?.play();

        this.tweens.add({
            targets: f,
            x: this.basket.x, y: this.basket.y,
            scaleX: 0, scaleY: 0,
            duration: 280, ease: 'Quad.In',
            onComplete: () => {
                if (f.active) f.destroy();
                this.basket.setVisible(false);
                this.basketSprite.setVisible(true);
                this.basketSprite.play('basket_pop');
            }
        });

        this.correctSfx?.play();
        this.score += 10 * this.currentLevel;
        this.scoreTxt.setText(String(this.score).padStart(3, '0'));

        this.time.delayedCall(560, () => {
            this.fishGroup.forEach(fish => {
                fish.getData('bobTween')?.stop();
                if (fish.active) fish.destroy();
            });
            this.fishGroup = [];
            this.questionsAnswered++;
            const needed = [3, 4, 5][this.currentLevel - 1];

            if (this.questionsAnswered >= needed) {
                if (this.currentLevel >= 3) {
                    this._gameComplete();
                } else {
                    this._levelUp();
                }
            } else {
                this._generateQ();
                this.qLabel.setText(this.qStr);
                this._spawnFish(this.scale.width, this.scale.height);
                this.isTransitioning = false;
            }
        });
    }

    _onWrong(f) {
        if (this.isTransitioning) return;
        this.wrongSfx?.play();
        this.cameras.main.shake(350, 0.013);
        this.lives = Math.max(0, this.lives - 1);
        this.lifes.forEach((ic, i) => ic.setAlpha(i < this.lives ? 1 : 0.25));
        this.basketWrongSprite.setVisible(true);
        this.basketWrongSprite.play('basket_wrong');
        this._returnFish(f);
        if (this.lives <= 0) this.time.delayedCall(620, () => this._gameOver());
    }

    _tick() {
        this.timeLeft = Math.max(0, this.timeLeft - 1);
        this.timerTxt.setText(String(this.timeLeft));
        if (this.timeLeft <= 10) {
            this.timerTxt.setColor('#ff3333');
            if (this.timeLeft > 0) this.clockTickSfx?.play();
        }
        if (this.timeLeft <= 0) { this.timerEvent.remove(); this._gameOver(); }
    }

    _gameOver() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.timerEvent?.remove();
        this.bgm?.stop();
        this.clockTickSfx?.stop();
        this.youlosesSfx?.play();
        this._showFailedPanel();
    }

    _showFailedPanel() {
        const W = this.scale.width, H = this.scale.height;

        const overlay = this.add.graphics().setDepth(60);
        overlay.fillStyle(0x000000, 0.6);
        overlay.fillRect(0, 0, W, H);

        // Panel — taller for breathing room
        const panel = this.add.image(W / 2, H / 2, 'levelfailed')
            .setDisplaySize(520, 460).setDepth(61);
        const tx = panel.scaleX, ty = panel.scaleY;
        panel.setScale(0);

        // Broken star — pushed down from the 3-star row in the panel art
        // Center it between panel top content and buttons
        const starImg = this.add.image(W / 2 - 50, H / 2 + 15, 'failedstar')
            .setDisplaySize(100, 100).setDepth(62).setAlpha(0);

        // Score — same vertical center as broken star
        const scoreTxt = this.add.text(W / 2 + 25, H / 2 + 15, String(this.score), {
            fontSize: '58px', fontStyle: 'bold',
            color: '#ffd700', stroke: '#000', strokeThickness: 7
        }).setOrigin(0, 0.5).setDepth(62).setAlpha(0);

        // EXIT button — square, equal size as restart, evenly spaced
        const btnY   = H / 2 + 130;
        const btnSize = 115;
        const btnGap  = 105;

        const exitBtn = this.add.image(W / 2 - btnGap, btnY, 'exitfailed')
            .setDisplaySize(btnSize, btnSize).setDepth(62).setAlpha(0)
            .setInteractive({ useHandCursor: true });
        exitBtn.on('pointerover', () => exitBtn.setDisplaySize(btnSize + 12, btnSize + 12));
        exitBtn.on('pointerout',  () => exitBtn.setDisplaySize(btnSize, btnSize));
        exitBtn.on('pointerdown', () => {
            this.sfx?.play();
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                sessionStorage.removeItem('operation');
                window.location.href = 'selection.html';
            });
        });

        // RESTART button — slightly wider than exit
        const rW = btnSize + 18;
        const restartBtn = this.add.image(W / 2 + btnGap, btnY, 'restartfailed')
            .setDisplaySize(rW, btnSize).setDepth(62).setAlpha(0)
            .setInteractive({ useHandCursor: true });
        restartBtn.on('pointerover', () => restartBtn.setDisplaySize(rW + 12, btnSize + 12));
        restartBtn.on('pointerout',  () => restartBtn.setDisplaySize(rW, btnSize));
        restartBtn.on('pointerdown', () => {
            this.sfx?.play();
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.restart();
            });
        });

        this.tweens.add({
            targets: panel, scaleX: tx, scaleY: ty,
            duration: 800, ease: 'Bounce.Out',
            onComplete: () => {
                this.tweens.add({
                    targets: [starImg, scoreTxt, exitBtn, restartBtn],
                    alpha: 1, duration: 380
                });
            }
        });
    }

    _pause() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.time.paused = true;
        this.tweens.pauseAll();
        this.fishGroup.forEach(f => {
            this.input.setDraggable(f, false);
            const sprite = f.getAt(0);
            if (sprite?.anims) sprite.anims.pause();
        });
        this.bgm?.pause();
        this.pauseBgm?.play();
        this._showPausePanel();
    }

    _resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this._panelObjs?.forEach(o => o.destroy());
        this._panelObjs = null;
        this.pauseBgm?.stop();
        this.bgm?.resume();
        this.tweens.resumeAll();
        this.time.paused = false;
        this.fishGroup.forEach(f => {
            this.input.setDraggable(f, true);
            const sprite = f.getAt(0);
            if (sprite?.anims) sprite.anims.resume();
        });
    }

    _showPausePanel() {
        const W = this.scale.width, H = this.scale.height;
        this._panelObjs = [];

        const overlay = this.add.graphics().setDepth(50);
        overlay.fillStyle(0x000000, 0.55);
        overlay.fillRect(0, 0, W, H);
        overlay.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, W, H),
            Phaser.Geom.Rectangle.Contains
        );
        this._panelObjs.push(overlay);

        const pW = 620, pH = 480;
        const panel = this.add.image(W / 2, H / 2, 'pause_panel')
            .setDisplaySize(pW, pH).setDepth(51);
        this._panelObjs.push(panel);

        const closeBtn = this.add.image(W / 2 + 255, H / 2 - 190, 'exitcancel')
            .setDisplaySize(125, 82).setDepth(53)
            .setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => closeBtn.setDisplaySize(137, 90));
        closeBtn.on('pointerout',  () => closeBtn.setDisplaySize(125, 82));
        closeBtn.on('pointerdown', () => { this.sfx?.play(); this._resume(); });
        this._panelObjs.push(closeBtn);

        const exitBtn = this.add.image(W / 2 - 115, H / 2 + 45, 'exitpause_btn')
            .setDisplaySize(155, 155).setDepth(52)
            .setInteractive({ useHandCursor: true });
        exitBtn.on('pointerover', () => exitBtn.setDisplaySize(165, 165));
        exitBtn.on('pointerout',  () => exitBtn.setDisplaySize(155, 155));
        exitBtn.on('pointerdown', () => {
            this.sfx?.play();
            this.pauseBgm?.stop();
            this.bgm?.stop();
            this.isPaused = false;
            this.time.paused = false;
            this.tweens.resumeAll();
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                sessionStorage.removeItem('operation');
                window.location.href = 'selection.html';
            });
        });
        this._panelObjs.push(exitBtn);

        const restartBtn = this.add.image(W / 2 + 115, H / 2 + 45, 'restart_btn')
            .setDisplaySize(155, 155).setDepth(52)
            .setInteractive({ useHandCursor: true });
        restartBtn.on('pointerover', () => restartBtn.setDisplaySize(165, 165));
        restartBtn.on('pointerout',  () => restartBtn.setDisplaySize(155, 155));
        restartBtn.on('pointerdown', () => { this.sfx?.play(); this._restartGame(); });
        this._panelObjs.push(restartBtn);
    }

    _restartGame() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.isPaused = false;
        this.time.paused = false;
        this.tweens.resumeAll();
        this.pauseBgm?.stop();
        this.bgm?.stop();
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.restart();
        });
    }

    _startCountdown(callback) {
        const W = this.scale.width, H = this.scale.height;
        const keys = ['c3', 'c2', 'c1'];
        let step = 0;

        const showNext = () => {
            if (step >= keys.length) { callback(); return; }
            const img = this.add.image(W / 2, H / 2, keys[step])
                .setDisplaySize(200, 200).setDepth(20).setAlpha(0).setScale(1.4);

            this.tweens.add({
                targets: img, alpha: 1, scale: 1,
                duration: 180, ease: 'Quad.Out',
                onComplete: () => {
                    this.time.delayedCall(650, () => {
                        this.tweens.add({
                            targets: img, alpha: 0, scale: 0.7,
                            duration: 180,
                            onComplete: () => { img.destroy(); step++; showNext(); }
                        });
                    });
                }
            });
        };
        showNext();
    }

    _showLevelAnnouncement(key, callback) {
        const W = this.scale.width, H = this.scale.height;
        const img = this.add.image(W / 2, H / 2, key)
            .setDisplaySize(540, 180).setDepth(20).setAlpha(0);

        this.tweens.add({
            targets: img, alpha: 1, duration: 300,
            onComplete: () => {
                this.time.delayedCall(1300, () => {
                    this.tweens.add({
                        targets: img, alpha: 0, duration: 350,
                        onComplete: () => { img.destroy(); callback(); }
                    });
                });
            }
        });
    }

    _startGameplay() {
        this._generateQ();
        this.qLabel.setText(this.qStr);
        this._spawnFish(this.scale.width, this.scale.height);
        this.timerEvent = this.time.addEvent({
            delay: 1000, callback: this._tick, callbackScope: this, loop: true
        });
        this.isTransitioning = false;
    }

    _levelUp() {
        this.currentLevel++;
        this.questionsAnswered = 0;
        if (this.timerEvent) this.timerEvent.paused = true;

        const timers  = { 2: 40, 3: 30 };
        const lblKeys = { 2: 'level2_img', 3: 'finallevel_img' };
        const lblText = { 2: 'LEVEL 2', 3: 'FINAL' };

        const newTime = timers[this.currentLevel];
        if (newTime !== undefined) {
            this.timeLeft = newTime;
            this.timerTxt.setText(String(newTime)).setColor('#fff');
        }

        this._showLevelAnnouncement(lblKeys[this.currentLevel], () => {
            this.lvlLabel.setText(lblText[this.currentLevel]);
            this._startCountdown(() => {
                if (this.timerEvent) this.timerEvent.paused = false;
                this._generateQ();
                this.qLabel.setText(this.qStr);
                this._spawnFish(this.scale.width, this.scale.height);
                this.isTransitioning = false;
            });
        });
    }

    _gameComplete() {
        this.timerEvent?.remove();
        this.bgm?.stop();
        this.levelPassedSfx?.play();
        
        // Save operation completion immediately and verify
        try {
            const completedOps = JSON.parse(localStorage.getItem('completedOperations') || '{}');
            completedOps[this.operation] = true;
            localStorage.setItem('completedOperations', JSON.stringify(completedOps));
            console.log('✓ Progress saved to localStorage:', completedOps);
        } catch (e) {
            console.error('✗ Failed to save progress:', e);
        }
        
        this._showCompletePanel();
    }

    _showCompletePanel() {
        const W = this.scale.width, H = this.scale.height;

        const overlay = this.add.graphics().setDepth(60);
        overlay.fillStyle(0x000000, 0.6);
        overlay.fillRect(0, 0, W, H);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);

        const panel = this.add.image(W / 2, H / 2, 'completepanel')
            .setDisplaySize(420, 330).setDepth(61);
        const tx = panel.scaleX, ty = panel.scaleY;
        panel.setScale(0);

        const starImg = this.add.image(W / 2 - 85, H / 2 + 18, 'star_icon')
            .setDisplaySize(142, 80).setDepth(62).setAlpha(0);

        const scoreTxt = this.add.text(W / 2 + 5, H / 2 + 18, String(this.score), {
            fontSize: '60px', fontStyle: 'bold',
            color: '#ffd700', stroke: '#000', strokeThickness: 7
        }).setOrigin(0, 0.5).setDepth(62).setAlpha(0);

        const doneBtn = this.add.image(W / 2, H / 2 + 125, 'donecom')
            .setDisplaySize(180, 68).setDepth(62).setAlpha(0)
            .setInteractive({ useHandCursor: true });
        doneBtn.on('pointerover', () => doneBtn.setDisplaySize(192, 73));
        doneBtn.on('pointerout',  () => doneBtn.setDisplaySize(180, 68));
        doneBtn.on('pointerdown', () => {
            this.sfx?.play();
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                sessionStorage.removeItem('operation');
                window.location.href = 'selection.html';
            });
        });

        this.tweens.add({
            targets: panel, scaleX: tx, scaleY: ty,
            duration: 950, ease: 'Sine.Out',
            onComplete: () => {
                this.tweens.add({
                    targets: [starImg, scoreTxt, doneBtn],
                    alpha: 1, duration: 500, ease: 'Sine.Out'
                });
            }
        });
    }

    update() {}
}