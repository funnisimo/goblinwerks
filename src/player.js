

import * as Flags from './flags.js';
import { io as IO } from './io.js';
import { visibility as VISIBILITY } from './visibility.js';
import { make, data as DATA, types, ui as UI, utils as UTILS } from './gw.js';

export var player = {};

player.debug = UTILS.NOOP;

//
// class PlayerKind extends types.ActorKind {
//   constructor(opts={}) {
//     super(opts);
//   }
// }
//
// types.PlayerKind = PlayerKind;


export class Player extends types.Actor {
  constructor(kind) {
    super(kind);
  }

  async startTurn() {
    await player.startTurn(this);
  }

  visionRadius() {
  	return CONFIG.MAX_FOV_RADIUS || (DATA.map.width + DATA.map.height);
  }

  endTurn(turnTime) {
    player.endTurn(this, turnTime);
  }

  hasActionFlag(flag) {
    if (flag & Flags.Action.A_PICKUP) return true;
    return false;
  }

}

types.Player = Player;


export function makePlayer(kind) {
  if (!(kind instanceof types.ActorKind)) {
    kind = new types.ActorKind(kind);
  }
  return new types.Player(kind);
}

make.player = makePlayer;



export async function takeTurn() {
  const PLAYER = DATA.player;
  player.debug('player turn...', DATA.time);
  await PLAYER.startTurn();

  while(!PLAYER.turnTime) {
    const ev = await IO.nextEvent(1000);
    await UI.dispatchEvent(ev);
    await UI.updateIfRequested();
    if (DATA.gameHasEnded) {
      return 0;
    }
  }

  player.debug('...end turn', PLAYER.turnTime);
  return PLAYER.turnTime;
}

player.takeTurn = takeTurn;


async function startTurn(PLAYER) {
  await UI.updateIfRequested();
	PLAYER.turnTime = 0;
  Object.assign(PLAYER.prior, PLAYER.current);
}

player.startTurn = startTurn;


function act() {
	return true;
}

player.act = act;

function endTurn(PLAYER, turnTime=1) {
  PLAYER.turnTime = Math.floor(PLAYER.kind.speed * turnTime);
  VISIBILITY.update(DATA.map, PLAYER.x, PLAYER.y);
  UI.requestUpdate(48);
}

player.endTurn = endTurn;


function isValidStartLoc(cell, x, y) {
  if (cell.hasTileFlag(Flags.Tile.T_PATHING_BLOCKER | Flags.Tile.T_HAS_STAIRS)) {
    return false;
  }
  return true;
}

player.isValidStartLoc = isValidStartLoc;
