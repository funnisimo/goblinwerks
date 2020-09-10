
import { ui as UI } from './ui.js';

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


// TODO - move back to game??
export async function takeTurn(theActor) {
  console.log('actor turn...', DATA.time);
  await actor.startTurn(theActor);
  await actor.act(theActor);
  await actor.endTurn(theActor);
  return theActor.turnTime;	// actual or idle time
}

actor.takeTurn = takeTurn;


function startTurn(theActor) {
	theActor.turnTime = Math.foor(theActor.speed/2);
}

actor.startTurn = startTurn;


function act(theActor) {
	return true;
}

actor.act = act;

function endTurn(theActor) {
	if (theActor.isOrWasVisible() && theActor.turnTime) {
		UI.requestUpdate();
	}
}

actor.endTurn = endTurn;
