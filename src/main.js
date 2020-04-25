/*
 * WIP Name: Shelving Crisis
 * 
 * Single player infinite-climber
 * by Camellia Shea, Sean Noelle,  and Josepheng Xiong
 * 
 * */


let config = {
	type: Phaser.CANVAS, /*Loads 2d web renderer*/
	width: 960, /*game width (adjustable)*/
	height: 540, /*game height (adjustable)*/
	scene: [ Menu, Tutorial, Play ],
	physics: {
		default: "arcade",
		arcade: {
			gravity: {
				y: 200
			}
		}
    },
};

let game = new Phaser.Game(config);

game.settings = {

}

let keyLEFT, keyRIGHT, keySPACE; //keys used
