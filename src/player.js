

import { make, data as DATA, types } from './gw.js';

export var player = {};


export class Player {
  constructor(kind) {
    this.x = -1;
    this.y = -1;
    this.flags = 0;
    this.kind = kind;
    this.acted = false;
    this.speed = 50;
    this.elapsed = 0;
  }

  startTurn() {
    this.acted = false;
  }

  moveDir(dir) {
    const map = DATA.map;
    this.acted = true;
    return map.moveActor(this.x + dir[0], this.y + dir[1], this);
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
