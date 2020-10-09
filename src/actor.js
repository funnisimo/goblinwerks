
import { Flags as TileFlags } from './tile.js';

import { types, make, data as DATA, config as CONFIG, ui as UI, utils as UTILS, flags, flag } from './gw.js';

export var actor = {};
actor.debug = UTILS.NOOP;

const Fl = flag.fl;

export const Flags = flag.install('actor', {
  AF_CHANGED      : Fl(0),
  AF_DYING        : Fl(1),
});

export const KindFlags = flag.install('actorKind', {
  AK_IMMOBILE     : Fl(0),
  AK_INANIMATE    : Fl(1),
});


function actorDebug(actor, ...args) {
	// if actor.flags & DEBUG
	actor.debug(...args);
}

export class Actor {
	constructor(kind) {
		this.x = -1;
    this.y = -1;
    this.flags = 0;
    this.kind = kind || {};
    this.turnTime = 0;
		this.status = {};

    // stats
    this.current = { health: 1 };
    this.max = { health: 1 };
    this.prior = { health: 1 };

		this.kind.speed = this.kind.speed || CONFIG.defaultSpeed || 120;
    if (this.kind.stats) {
      Object.assign(this.current, this.kind.stats);
      Object.assign(this.max, this.kind.stats);
      Object.assign(this.prior, this.kind.stats);
    }
  }

	startTurn() {
		actor.startTurn(this);
	}

	act() {
		actor.act(this);
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
    this.current.health = 0;
    this.flags |= Flags.AF_DYING;
		map.removeActor(this);
		// in the future do something here (HP = 0?  Flag?)
	}

  isDead() {
    return (this.flags & Flags.AF_DYING);
  }

  alwaysVisible() {
    return this.kind.flags & (KindFlags.AF_IMMOBILE | KindFlags.AF_INANIMATE);
  }

  changed() {
    return (this.flags & Flags.AF_CHANGED);
  }

  statChangePercent(name) {
    const current = this.current[name] || 0;
    const prior = this.prior[name] || 0;

    if (prior && current) {
      return Math.floor(100 * (current - prior)/prior);
    }
    else if (prior) {
      return -100;
    }

    return 100;
  }

  getName(opts={}) {
    return this.kind.name;
  }

}

types.Actor = Actor;


export function makeActor(kind) {
  return new types.Actor(kind);
}

make.actor = makeActor;


// TODO - move back to game??
export async function takeTurn(theActor) {
  actorDebug(theActor, 'actor turn...', DATA.time);
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
