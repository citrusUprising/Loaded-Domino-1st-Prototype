class Play extends Phaser.Scene {

    constructor() {
        super("playScene");
    }
    
    preload() {

		// load temp images
		//this.load.image("player", "assets/char.png");
        //this.load.image("platform", "assets/rampsmall.png");
        this.load.image("backDrop", "assets/ware.png");
        this.load.image("void", "assets/void.png");

        // load sprite atlas
        this.load.atlas("sprites", "assets/spritesheet.png", "assets/sprites.json");

        // load void spritesheet
        this.load.spritesheet("void1", "assets/void1.png", {
            frameWidth: 960, frameHeight :1050,
            startFrame: 0, endFrame: 29
        });
    }

    create(){

        // create warehouse backdrop
        this.background = this.add.tileSprite(0, 0, 960, 540, "backDrop").setOrigin(0,0);
        this.background.setDepth(-999);

        this.anims.create({
            key: 'voider',
            repeat: -1,
            frames: this.anims.generateFrameNumbers('void1', { start: 0, end: 29, first: 0}),
            frameRate: 25
        });
        
		// create animations
		this.anims.create({
			key: "playerRun",
			frames: this.anims.generateFrameNames("sprites", {
				prefix: "run",
				start: 1,
				end: 24,
                zeroPad: 0
			}),
            frameRate: 60,
            repeat: -1
        });

        this.anims.create({
			key: "playerIdle",
			frames: this.anims.generateFrameNames("sprites", {
				prefix: "run",
				start: 1,
				end: 1,
                zeroPad: 0
			}),
        });
        
        this.anims.create({
			key: "playerAir",
			frames: [{ key: "sprites", frame: "jump" }]
		});

        //sets up music
        let musicPlayConfig = {
            mute: false,
            volume: .6*game.settings.musicVolume,
            loop: true
        }

        musicPlayConfig.volume = .6*game.settings.musicVolume;

        if (!game.settings.playing) {
            this.bgm = this.sound.add('gameMusic', musicPlayConfig);
            this.bgm.play();
        }
        game.settings.playing = true;
        
        //speed of scrolling
        this.scroll = 1;

        // cam note: what is platMod? the scale of scrolling speed? a little confused
        this.platMod = -60;   

        this.score = 0;   

        // boolean that determines whether a box or shelf comes next
        this.madeBox = false;

        //platform generation
        this.xL = 0;
        this.xR = game.config.width;
        
        this.speedTimer = this.time.addEvent ({
            delay: 1000,
            callback: this.scoreUp/*(this.score, this.speed)*/,
            callbackScope: this,
            loop: true
        });

		// group for platform collisions
        this.platforms = this.physics.add.group(); //shift to platform class??

        //group for box collisions
        this.boxes = this.physics.add.group();

        //group for shelf collisions
        this.shelves = this.physics.add.group();

        //group for mess collisions

        //group for customer collisions
        
        // starting platform
		this.platforms.create(game.config.width/2, game.config.height+50, "sprites", "rampsmall").setScale(1);
		
		// iterate through platforms group, set variables
		this.platforms.children.each(function(platform) {
			platform.body.allowGravity = false;
            platform.body.immovable = true;
            platform.body.velocity.y = this.platMod*this.scroll;
            platform.body.checkCollision.left = false;
            platform.body.checkCollision.right = false;
            platform.body.checkCollision.down = false;
            platform.setFrictionX(1);
        }, this);
        
        // iterate through boxes group, set variables
		this.boxes.children.each(function(box) {
			box.body.allowGravity = false;
            box.body.immovable = true;
            box.body.velocity.y = this.platMod*this.scroll;
            box.setFrictionX(1);
        }, this);
        
        // iterate through shelves group, set variables
		this.shelves.children.each(function(shelf) {
			shelf.body.allowGravity = false;
            shelf.body.immovable = true;
            shelf.body.velocity.y = this.platMod*this.scroll;
            shelf.setFrictionX(1);
        }, this);
        
        //iterate throuhg full shelf, set variable

        // add timer for spawning platforms (possibly temporary method?)
        this.platformTimer = this.time.addEvent ({
            delay: 3000, 
            callback: this.makePlatform,
            callbackScope: this,
            loop: true
        });

        //sets world bounds with vertical pockets for game over
        this.physics.world.setBounds(0, -100, game.config.width, game.config.height+200);

		// add player with physics
		this.player = new Player(this, game.config.width/2, 150, "sprites", "run1").setOrigin(0.5,0.5);
        this.physics.add.existing(this.player);

        // set player body size, 10 pixel gap on left + right
        this.player.body.setSize(60, 60, 10, 0);

		this.player.body.bounce.x = 0.0;
        this.player.body.bounce.y = 0.0;
        this.player.body.collideWorldBounds = true; 

		// add collisions
        this.physics.add.collider(this.player, this.platforms, this.playerHitPlatform, null, this);
        this.physics.add.collider(this.player, this.boxes, this.playerGrabBox, null, this);
        this.physics.add.collider(this.player, this.shelves, this.playerShelving, null, this);

        //separate gameover variables depending on death
        this.gameoverTop = false;
        this.gameoverBot = false;

        // OOZE or VOID creation
        this.void = new Ooze(this, 0, 0, 'void', 0).setOrigin(0, 1);

        let menuConfig = {
            fontFamily: 'Helvetica',
            fontSize: '30px',
            backgroundColor: '#000000',
            color: '#facade',
            align: 'center',
            padding: {
                top: 10,
                bottom: 10,
            },
            fixedWidth: 100
        }

        let centerX = game.config.width/2;
        let centerY = game.config.height/2;
        let textSpacer = 80;


        this.scoreBoard = this.add.text (0, 0, this.score, menuConfig);

        // assign keys
        keySPACE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        keyLEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        keyRIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        keyUP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        keyDOWN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

    }

    update() {

        this.platforms.children.each(function(platform) {
            platform.setDepth(-998);
        }, this);

        this.boxes.children.each(function(box) {
            box.setDepth(-996);
        }, this);

        this.shelves.children.each(function(shelf) {
            shelf.setDepth(-997);
        }, this);
        
        // if player hasn't died yet
        if (!this.gameoverTop && !this.gameoverBot) {
 
            // update scrolling background
            this.background.tilePositionY += this.scroll;
 
            // update player
            this.player.update();
            this.player.isJump = true;

            // destroy off-screen platforms 
            this.platforms.children.each(function(platform) {
                if (platform.y < -platform.height) {
                    platform.destroy();
                }
            }, this);

            //destroy boxes and shelves
            this.boxes.children.each(function(box) {
                if (box.y < this.void.y-box.height) {
                    box.destroy();
                }
            }, this);

            this.shelves.children.each(function(shelf) {
                if (shelf.y < this.void.y-shelf.height) {
                    shelf.destroy();
                }
            }, this);

            //flip sprite when player turns
            if (this.player.isTurn) { 
                //console.log('turning');
                this.player.toggleFlipX();
                this.player.isTurn = false;
            }

            // check if player died
            if (this.player.y < this.void.y) {

                //console.log("game over, eaten by void");
                this.finScore = this.score;
                this.gameoverTop = true;
                this.sound.play("sfxConsume", {volume: 0.4*game.settings.effectVolume});

            } else if (this.player.y > game.config.height+50) {

                //console.log("game over, fell off screen");
                this.finScore = this.score;
                this.gameoverBot = true;
                this.sound.play("sfxFall", {volume: 0.4*game.settings.effectVolume});

            }

            this.scoreBoard.setText(this.score);
    
        // else, if player's dead
        } else {

            this.bgm.volume =.2*game.settings.musicVolume;

            // game over!
            //this.menuConfig.fixedWidth = 0;

            let GOConfig = {
                fontFamily: 'Helvetica',
                fontSize: '50px',
                color: '#e81e40',
                align: 'center',
                padding: {
                    top: 10,
                    bottom: 10,
                },
                fixedWidth: 0
            }
            let textSpacer = 60;

            this.scoreBoard.setVisible(false);

            //Game Over stats
            this.add.rectangle(game.config.width/2, game.config.height/2, 500, 360, 0x000000).setOrigin(.5);
            this.add.text (game.config.width/2, game.config.height/2-2*textSpacer, 'Game Over', GOConfig).setOrigin(0.5);
            GOConfig.fontSize = '30px';
            GOConfig.color = '#facade';
            if(this.gameoverTop)this.add.text (game.config.width/2, game.config.height/2-textSpacer, 'You succumbed to anxiety', GOConfig).setOrigin(0.5);
            else if (this.gameoverBot)this.add.text (game.config.width/2, game.config.height/2-textSpacer, 'You fell to your death', GOConfig).setOrigin(0.5);
            this.add.text (game.config.width/2, game.config.height/2, 'You worked for a total of '+this.finScore+' seconds', GOConfig).setOrigin(0.5);
            GOConfig.color = '#de7183';
            this.add.text (game.config.width/2, game.config.height/2+textSpacer, 'Press ↑ to try again', GOConfig).setOrigin(0.5);
            this.add.text (game.config.width/2, game.config.height/2+2*textSpacer, 'Press ↓ to return to menu', GOConfig).setOrigin(0.5);

            if (this.gameoverTop)game.settings.oozeSpeed = 10;

            // turn off player movement
            this.player.body.velocity.x = 0;
		    this.player.body.velocity.y = 0;
		    this.player.body.bounce.x = 0;
            this.player.body.bounce.y = 0;
            this.player.body.allowGravity = false;

            // stop platforms
            this.platformTimer.paused = true;

            // stop ooze/void
            //game.settings.oozeSpeed = 0;

            this.platforms.children.each(function(platform) {
                platform.body.velocity.y = 0;
            }, this);

            //flag add boxes

            //flag add shelves

            // reset scene
            if (Phaser.Input.Keyboard.JustDown(keyUP)) {
                game.settings.oozeSpeed = 0;
                this.bgm.volume =.6*game.settings.musicVolume;
                this.scene.restart();           
            }
            if (Phaser.Input.Keyboard.JustDown(keyDOWN)) {
                game.settings.playing = false;
                this.bgm.stop();
                game.settings.oozeSpeed = 0;
                this.scene.start("menuScene");
            }
        } 

        //moves void, but not past screen
        if(this.void.y < game.config.height+100&&!this.gameoverBot)this.void.update();
        else  game.settings.oozeSpeed = 0;

    }

    // callback if player lands on platform
    playerHitPlatform(player, platform) {

        // make sure player is on top of platform
        if ((player.y + player.height) < platform.y) {
            player.isJump = false;
        }

    }

    playerGrabBox(player, box) {
        if(!player.hasBox){
            player.hasBox = true;
            box.destroy();
        }
    }

    playerShelving(player, shelf) {

    }

    // spawn platform randomly at bottom of screen
    makePlatform() {

        let sx = Phaser.Math.RND.between(this.xL, this.xR);
        this.xL = sx-(game.config.width*2/3);
        if (this.xL < -25)this.xL = 0;
        this.xR = sx+(game.config.width*2/3);
        if (this.xR > game.config.width+25)this.xR = game.config.width;
        //console.log(sx);

        let platform = this.platforms.create(sx, game.config.height+50, "sprites", "rampsmall");

        platform.setScale(1);
        platform.body.allowGravity = false;
        platform.body.immovable = true;
        platform.body.velocity.y = this.platMod*this.scroll;
        platform.body.checkCollision.left = false;
        platform.body.checkCollision.right = false;
        platform.body.checkCollision.down = false;
        platform.setFrictionX(1);

        // 30% chance of spawning box / shelf
        let objectChance = 30;

        let spawnRoll = Phaser.Math.RND.between(0, 100);

        // runs code to determine what object is spawned
        if (spawnRoll <= objectChance) {
            let xRandom = Phaser.Math.RND.between(sx-50, sx+50);
            this.spawnObject(xRandom, game.config.height+50);
        }
    }

    scoreUp() {
        
        if (!this.gameOverBot && !this.gameOverTop) {
        
            this.score++;
        
            if ((this.scroll < 2) && (this.score%20 == 0) && (this.score > 0)) {
                
                this.scroll += 0.2;
                this.platformTimer.timeScale = 1 + (0.2*this.scroll);
                
                //update speed of existing platforms
                //code provided by Ben Rosien in the discord channel
                this.platforms.getChildren().forEach(function (platform) {
                    platform.body.velocity.y = this.scroll*this.platMod;
                }, this);

                game.settings.oozeSpeed = 0;

            } else if ((this.score%20 == 10) && (this.void.y < (game.config.height/4))) {
        
                game.settings.oozeSpeed = 0.05;
        
            }
    
        }
    
    }
    spawnObject(x, y){

        //needs an order
        let boxShelfChance = 1;
        let messChance = 0;
        let customerChance = 0;

        let typeRoll = Phaser.Math.RND.between(1, 3);

        if(boxShelfChance <= typeRoll){//change to == once other methods implemented
            if (this.madeBox) {
                // spawnBox(x, y);
                console.log("A wild SHELF appears!");
                this.madeBox = false;
            } else {
                // spawnShelf(x, y);
                console.log("A wild BOX appears!");
                this.madeBox = true;
            }
        } else if(messChance === typeRoll){
            //spawnMess(x, y);
            console.log("A wild MESS appears!");
        }else if(customerChance === typeRoll){
            //spawnCustomer(x, y);
            console.log("A wild CUSTOMER appears!");
        }
        
    }

    spawnBox(x, y){
        let box = this.boxes.create(x, y, "sprites", "BoxTemp");

        box.setScale(1);
        box.body.allowGravity = false;
        box.body.immovable = true;
        box.body.velocity.y = this.platMod*this.scroll;
        box.body.checkCollision.left = false;
        box.body.checkCollision.right = false;
        box.body.checkCollision.down = false;
        box.setFrictionX(1);
    }

    spawnShelf(x, y){
        let shelf = this.shelves.create(x, y, "sprites", "ShelfEmptyTemp");

        shelf.setScale(1);
        shelf.body.allowGravity = false;
        shelf.body.immovable = true;
        shelf.body.velocity.y = this.platMod*this.scroll;
        shelf.body.checkCollision.left = false;
        shelf.body.checkCollision.right = false;
        shelf.body.checkCollision.down = false;
        shelf.setFrictionX(1);
    }

}