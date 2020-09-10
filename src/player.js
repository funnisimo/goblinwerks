

import { make, data as DATA, types } from './gw.js';

export var player = {};


export class Player extends types.Actor {
  constructor(kind) {
    super(kind);
  }

  startTurn() {
    this.turnTime = 0;
  }

  endTurn() {

  }

  visionRadius() {
  	return CONFIG.MAX_FOV_RADIUS || (DATA.map.width + DATA.map.height);
  }

}

types.Player = Player;


export function makePlayer(kind) {
  return new types.Player(kind);
}

make.player = makePlayer;
