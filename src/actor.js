
import { Flags as TileFlags } from './tile.js';

import { types, make, data as DATA, config as CONFIG, ui as UI } from './gw.js';

export var actor = {};

export class Actor {
	constructor(kind) {
		this.x = -1;
    this.y = -1;
    this.flags = 0;
    this.kind = kind || {};
    this.turnTime = 0;
		this.status = {};

		this.kind.speed = this.kind.speed || CONFIG.defaultSpeed || 120;
  }

	startTurn() {
		actor.startTurn(this);
	}

	act() {
		actor.act(this);
	}

	// TODO - This is a command/task
	async moveDir(dir) {
    const map = DATA.map;
    await map.moveActor(this.x + dir[0], this.y + dir[1], this);
		this.endTurn();
  }

	endTurn(turnTime) {
		actor.endTurn(this, turnTime);
	}

	isOrWasVisible() {
		return true;
	}

	forbiddenTileFlags() {
		return TileFlags.T_PATHING_BLOCKER;
	}

	kill() {
		const map = DATA.map;
		map.removeActor(this);
		// in the future do something here (HP = 0?  Flag?)
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
	theActor.startTurn();
	await theActor.act();
  return theActor.turnTime;	// actual or idle time
}

actor.takeTurn = takeTurn;


function startTurn(theActor) {
}

actor.startTurn = startTurn;


function act(theActor) {
	theActor.endTurn()
	return true;
}

actor.act = act;

function endTurn(theActor, turnTime) {
	theActor.turnTime = turnTime || Math.floor(theActor.kind.speed/2);	// doing nothing takes time
	if (theActor.isOrWasVisible() && theActor.turnTime) {
		UI.requestUpdate();
	}
}

actor.endTurn = endTurn;
