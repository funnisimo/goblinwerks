

import { Flags as TileFlags } from './tile.js';
import { io as IO } from './io.js';
import { make, data as DATA, types, ui as UI, utils as UTILS } from './gw.js';

export var player = {};

player.debug = UTILS.NOOP;


export class Player extends types.Actor {
  constructor(kind) {
    super(kind);
  }

  startTurn() {
    player.startTurn(this);
  }

  visionRadius() {
  	return CONFIG.MAX_FOV_RADIUS || (DATA.map.width + DATA.map.height);
  }

  endTurn(turnTime) {
    player.endTurn(this, turnTime);
  }

}

types.Player = Player;


export function makePlayer(kind) {
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


function startTurn(PLAYER) {
	PLAYER.turnTime = 0;
}

player.startTurn = startTurn;


function act() {
	return true;
}

player.act = act;

function endTurn(PLAYER, turnTime) {
  PLAYER.turnTime = turnTime || Math.floor(PLAYER.kind.speed/2);  // doing nothing takes time
  UI.requestUpdate();
}

player.endTurn = endTurn;


function isValidStartLoc(cell, x, y) {
    if (cell.hasTileFlag(TileFlags.T_PATHING_BLOCKER | TileFlags.T_HAS_STAIRS)) {
      return false;
    }
    return true;
}

player.isValidStartLoc = isValidStartLoc;
