

import { types, make, data as DATA } from './gw.js';

export var actor = {};

export class Actor {
	constructor(kind) {
		this.x = -1;
    this.y = -1;
    this.flags = 0;
    this.kind = kind;
    this.turnTime = 0;
    this.speed = 50;
  }

  act() {
		// Idle
  	return this.turnTime || this.speed;
  }

	// TODO - This is a command/task
	moveDir(dir) {
    const map = DATA.map;
    this.turnTime = this.speed;
    return map.moveActor(this.x + dir[0], this.y + dir[1], this);
  }

	isOrWasVisible() {
		return true;
	}

}

types.Actor = Actor;


export function makeActor(kind) {
  return new types.Actor(kind);
}

make.actor = makeActor;
